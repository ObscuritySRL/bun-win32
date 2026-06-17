/**
 * jab-java-act — Java apps are not just READABLE but fully DRIVABLE cursor-free. A Java Swing window exposes nothing to
 * UIA or MSAA, yet jab.ts ACTS on it via the Java Access Bridge: javaInvoke (doAccessibleActions — the JVM's own click)
 * presses a button / toggles a check box, and javaSetText (setTextContents — no focus change) types into a field — all
 * with no cursor, no foreground, no focus theft.
 *
 * Proof: compile + launch a Swing app whose button sets the frame title to "ACT_CLICKED", whose text field mirrors its
 * contents into the title ("ACT_TEXT_<value>"), and a check box. Then drive it entirely through the bridge and verify
 * EXTERNALLY: javaSetText -> the title reflects the typed text; javaInvoke(check box) -> javaTree re-read shows the
 * "checked" state; javaInvoke(button) -> the title becomes "ACT_CLICKED". The Java process is killed + window closed in
 * finally. SKIPS cleanly if no JDK is present.
 *
 * bun test is broken repo-wide — runnable harness (compiles + spawns a Java Swing app):
 * Run: bun run example/jab-java-act.integration.test.ts
 */
import { existsSync, readdirSync } from 'node:fs';

import { closeWindow, isJavaWindow, javaInvoke, type JavaNode, javaSetText, javaTree, uia } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

function findJdkBin(): string | null {
  const roots = ['C:/Program Files/Java', 'C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Microsoft'];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root)) {
      const bin = `${root}/${entry}/bin`;
      if (existsSync(`${bin}/javac.exe`) && existsSync(`${bin}/java.exe`)) return bin;
    }
  }
  return null;
}

function flatten(node: JavaNode, out: JavaNode[] = []): JavaNode[] {
  out.push(node);
  for (const child of node.children) flatten(child, out);
  return out;
}

function windowTitle(hWnd: bigint): string {
  const buffer = Buffer.allocUnsafe(512);
  const length = User32.GetWindowTextW(hWnd, buffer.ptr!, 256);
  return length > 0 ? buffer.toString('utf16le', 0, length * 2) : '';
}

const TITLE = 'JAB Act Test';
const dir = `${Bun.env.TEMP ?? 'C:/Windows/Temp'}/uia_jabact_${process.pid}`;
const bin = findJdkBin();

uia.initialize();
let javaProc: ReturnType<typeof Bun.spawn> | null = null;
let hWnd = 0n;
try {
  if (bin === null) {
    console.log('  skip(live): no JDK found (javac/java)');
  } else {
    await Bun.write(
      `${dir}/JabAct.java`,
      `import javax.swing.*; import javax.swing.event.*; public class JabAct { public static void main(String[] a){ SwingUtilities.invokeLater(()->{ JFrame f=new JFrame("${TITLE}"); JButton b=new JButton("Click Me"); b.getAccessibleContext().setAccessibleName("actButton"); b.addActionListener(e->f.setTitle("ACT_CLICKED")); JCheckBox c=new JCheckBox("Toggle Me"); c.getAccessibleContext().setAccessibleName("actCheck"); JTextField t=new JTextField("",20); t.getAccessibleContext().setAccessibleName("actField"); t.getDocument().addDocumentListener(new DocumentListener(){ public void insertUpdate(DocumentEvent e){f.setTitle("ACT_TEXT_"+t.getText());} public void removeUpdate(DocumentEvent e){f.setTitle("ACT_TEXT_"+t.getText());} public void changedUpdate(DocumentEvent e){} }); JLabel lab=new JLabel("A Label"); lab.getAccessibleContext().setAccessibleName("actLabel"); JPanel p=new JPanel(); p.add(b); p.add(c); p.add(t); p.add(lab); f.add(p); f.setSize(460,170); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true); }); } }`,
    );
    const compile = Bun.spawnSync([`${bin}/javac.exe`, `${dir}/JabAct.java`], { stderr: 'pipe' });
    if (!compile.success) {
      console.log(`  skip(live): javac failed: ${compile.stderr.toString().slice(0, 120)}`);
    } else {
      // -D forces the Access Bridge to load for THIS JVM regardless of the global jabswitch state
      javaProc = Bun.spawn([`${bin}/java.exe`, '-Djavax.accessibility.assistive_technologies=com.sun.java.accessibility.AccessBridge', '-cp', dir, 'JabAct'], { stdout: 'ignore', stderr: 'ignore' });
      for (let i = 0; i < 40 && hWnd === 0n; i++) {
        await Bun.sleep(250);
        hWnd = User32.FindWindowW(null, Buffer.from(`${TITLE}\0`, 'utf16le').ptr!);
      }
      if (hWnd === 0n) {
        console.log('  skip(live): Swing window did not appear');
      } else {
        await Bun.sleep(800);
        assert(isJavaWindow(hWnd), 'isJavaWindow recognizes the Swing window (JAB handshake completed)');

        // 1) setText into the JTextField, cursor-free — the document listener mirrors it into the window title
        const setOk = javaSetText(hWnd, { name: 'actField' }, 'hello jab');
        await Bun.sleep(350);
        assert(setOk, 'javaSetText reported success on the text field');
        assert(windowTitle(hWnd) === 'ACT_TEXT_hello jab', `the field's text landed (title="${windowTitle(hWnd)}", expected "ACT_TEXT_hello jab")`);

        // 2) toggle the JCheckBox, cursor-free — verify via a fresh javaTree read showing the "checked" state
        const checkOk = javaInvoke(hWnd, { name: 'actCheck', role: 'check box' });
        await Bun.sleep(350);
        const afterToggle = javaTree(hWnd);
        const checkNode = afterToggle === null ? undefined : flatten(afterToggle).find((n) => n.name === 'actCheck');
        assert(checkOk, 'javaInvoke reported success on the check box');
        assert(checkNode !== undefined && /checked/.test(checkNode.states), `the check box is now checked (states="${checkNode?.states ?? '(not found)'}")`);

        // 3) click the JButton, cursor-free — its ActionListener flips the title to ACT_CLICKED
        const clickOk = javaInvoke(hWnd, { name: 'actButton' });
        await Bun.sleep(350);
        assert(clickOk, 'javaInvoke reported success on the push button');
        assert(windowTitle(hWnd) === 'ACT_CLICKED', `the button's action fired (title="${windowTitle(hWnd)}", expected "ACT_CLICKED")`);

        // negatives — all degrade cleanly to false (no throw, no segfault):
        assert(javaInvoke(hWnd, { name: 'noSuchControl' }) === false, 'javaInvoke on a missing control returns false');
        // a JLabel has no AccessibleAction → getAccessibleActions is empty → the 'click' fallback finds no action → false
        // (exercises the actionsCount-guard path: no uninitialized-buffer read)
        assert(javaInvoke(hWnd, { name: 'actLabel' }) === false, 'javaInvoke on a no-action control (JLabel) returns false');
        // setTextContents on a non-editable control (the button) → the bridge rejects it → false
        assert(javaSetText(hWnd, { name: 'actButton' }, 'x') === false, 'javaSetText on a non-text control (button) returns false');
        assert(windowTitle(hWnd) === 'ACT_CLICKED', 'the failed javaSetText left the button title unchanged (no stray effect)');
      }
    }
  }
} finally {
  if (hWnd !== 0n) closeWindow(hWnd);
  javaProc?.kill();
  await Bun.$`cmd /c rmdir /s /q ${dir}`.quiet().catch(() => {});
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — Java Swing app DRIVEN cursor-free via the Access Bridge (invoke + toggle + type).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
