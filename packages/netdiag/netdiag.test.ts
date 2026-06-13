import { describe, expect, test } from 'bun:test';

import { decodeSockaddr, ipv4FromU32, ipv6FromBytes, macFromBytes, portFromNetworkOrder } from './addr';
import { addressFamilyValue, DnsType, icmpStatusName, tcpStateName } from './constants';

const hex = (text: string): Buffer => Buffer.from(text.replace(/\s/g, ''), 'hex');

describe('addr codecs', () => {
  test('ipv4FromU32', () => {
    expect(ipv4FromU32(0x0000_0000)).toBe('0.0.0.0');
    expect(ipv4FromU32(0xffff_ffff)).toBe('255.255.255.255');
    expect(ipv4FromU32(0x0100_007f)).toBe('127.0.0.1'); // 127.0.0.1 in network order
    expect(ipv4FromU32(0x0101_a8c0)).toBe('192.168.1.1'); // 192.168.1.1 in network order
  });

  test('portFromNetworkOrder', () => {
    expect(portFromNetworkOrder(0xbb01)).toBe(443); // 443 = 0x01bb byteswapped
    expect(portFromNetworkOrder(0x5000)).toBe(80);
    expect(portFromNetworkOrder(0xffff)).toBe(65535);
    expect(portFromNetworkOrder(0x0000)).toBe(0);
  });

  test('macFromBytes', () => {
    expect(macFromBytes(Buffer.from([0x50, 0xeb, 0xf6, 0xb2, 0x37, 0xf8]), 0, 6)).toBe('50:eb:f6:b2:37:f8');
    expect(macFromBytes(Buffer.from([0x00, 0x01]), 0, 2)).toBe('00:01');
    expect(macFromBytes(Buffer.from([0xff, 0xaa, 0x00, 0x0b]), 1, 3)).toBe('aa:00:0b'); // honors offset
  });

  test('ipv6FromBytes RFC 5952', () => {
    expect(ipv6FromBytes(hex('00000000000000000000000000000000'), 0)).toBe('::');
    expect(ipv6FromBytes(hex('00000000000000000000000000000001'), 0)).toBe('::1');
    expect(ipv6FromBytes(hex('fe800000000000000000000000000001'), 0)).toBe('fe80::1');
    expect(ipv6FromBytes(hex('20010db8000000000000000000000001'), 0)).toBe('2001:db8::1');
    expect(ipv6FromBytes(hex('20010db800000000000000000000ff00'), 0)).toBe('2001:db8::ff00');
    expect(ipv6FromBytes(hex('00010002000300040005000600070008'), 0)).toBe('1:2:3:4:5:6:7:8'); // no run to compress
    expect(ipv6FromBytes(hex('00010000000000000000000000000000'), 0)).toBe('1::'); // trailing run
  });

  test('decodeSockaddr ipv4', () => {
    const buffer = Buffer.alloc(28);
    buffer.writeUInt16LE(0x0002, 0); // AF_INET
    buffer.writeUInt16BE(443, 2); // network-order port
    buffer.set([127, 0, 0, 1], 4);
    expect(decodeSockaddr(buffer, 0)).toEqual({ family: 'ipv4', address: '127.0.0.1', port: 443 });
  });

  test('decodeSockaddr ipv6', () => {
    const buffer = Buffer.alloc(28);
    buffer.writeUInt16LE(0x0017, 0); // AF_INET6
    buffer.writeUInt16BE(8080, 2);
    hex('fe800000000000000000000000000001').copy(buffer, 8);
    buffer.writeUInt32LE(5, 24); // scope id
    expect(decodeSockaddr(buffer, 0)).toEqual({ family: 'ipv6', address: 'fe80::1', port: 8080, scopeId: 5 });
  });

  test('decodeSockaddr unknown family', () => {
    expect(decodeSockaddr(Buffer.alloc(28), 0)).toEqual({ family: 'unknown', address: '', port: 0 });
  });
});

describe('constants', () => {
  test('tcpStateName', () => {
    expect(tcpStateName(5)).toBe('established');
    expect(tcpStateName(2)).toBe('listen');
    expect(tcpStateName(11)).toBe('time-wait');
    expect(tcpStateName(99)).toBe('unknown(99)');
  });

  test('icmpStatusName', () => {
    expect(icmpStatusName(0)).toBe('success');
    expect(icmpStatusName(11010)).toBe('request timed out');
    expect(icmpStatusName(11013)).toBe('TTL expired in transit');
    expect(icmpStatusName(12345)).toBe('unknown(12345)');
  });

  test('addressFamilyValue', () => {
    expect(addressFamilyValue('all')).toBe(0);
    expect(addressFamilyValue('ipv4')).toBe(2);
    expect(addressFamilyValue('ipv6')).toBe(23);
  });

  test('DnsType record-type values', () => {
    expect(DnsType.DNS_TYPE_A).toBe(1);
    expect(DnsType.DNS_TYPE_AAAA).toBe(28);
    expect(DnsType.DNS_TYPE_MX).toBe(15);
  });
});
