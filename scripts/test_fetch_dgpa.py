#!/usr/bin/env python3
"""Offline discovery parser fixtures (not proof of live DGPA access)."""
import unittest
from fetch_dgpa import find_announcement, find_attachment, safe_url

class DiscoveryTests(unittest.TestCase):
    def test_listing(self):
        html = '''<a href="/information?pid=13114&amp;uid=30">中華民國一百一十六年政府行政機關辦公日曆表圖檔</a>
        <a href="/information?pid=12982&amp;uid=30">中華民國一百一十六年政府行政機關辦公日曆表</a>
        <a href="/information?pid=12573&amp;uid=30">中華民國一百一十五年政府行政機關辦公日曆表</a>'''.encode()
        self.assertIn('pid=12982', find_announcement(html, 116))
        self.assertIn('pid=12573', find_announcement(html, 115))
    def test_attachment(self):
        html = '''<a href="/FileConversion?filename=dgpa%2Ffiles%2Fx.xlsx&amp;name=116.xlsx">116年辦公日曆表.xlsx</a>
        <a href="/x.pdf">.pdf</a>'''.encode()
        self.assertIn('FileConversion', find_attachment(html, 116))
    def test_reject_external(self):
        with self.assertRaises(ValueError): safe_url('https://evil.example.com/file.xlsx')
    def test_missing_attachment_fails(self):
        with self.assertRaises(ValueError): find_attachment(b'<a href="x.pdf">.pdf</a>', 116)

if __name__ == '__main__': unittest.main(verbosity=2)
