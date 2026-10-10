#!/usr/bin/env python3
"""Discover DGPA calendar announcements and XLSX attachments; fail closed.

This program only fetches 2026/2027, which the current parser supports.
No publication occurs until build_calendar.py and test_calendar.py pass.
"""
import io
import os
import pathlib
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = 'https://www.dgpa.gov.tw'
LIST_URL = BASE + '/informationlist?uid=30'
MAX_BYTES = 5_000_000
YEARS = {115: '一百一十五', 116: '一百一十六'}

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.href = None
        self.label = []
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.href = dict(attrs).get('href')
            self.label = []
    def handle_data(self, data):
        if self.href is not None:
            self.label.append(data)
    def handle_endtag(self, tag):
        if tag == 'a' and self.href is not None:
            self.links.append((''.join(self.label).strip(), self.href))
            self.href = None
            self.label = []

def safe_url(url):
    u = urllib.parse.urlparse(url)
    if u.scheme != 'https' or (u.hostname or '').lower() not in ('www.dgpa.gov.tw', 'dgpa.gov.tw') or u.username or u.password:
        raise ValueError('non-DGPA HTTPS URL')
    return url

def get(url, limit=MAX_BYTES):
    safe_url(url)
    req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0 (compatible; DGPA-Calendar-Checker/1.0)'})
    with urllib.request.urlopen(req, timeout=30) as response:
        safe_url(response.url)
        body = response.read(limit+1)
    if len(body) > limit:
        raise ValueError('response too large')
    return body

def anchors(html):
    parser = Links()
    parser.feed(html.decode('utf-8-sig', errors='replace'))
    return parser.links

def find_announcement(listing, roc):
    yearname = YEARS[roc]
    candidates = []
    for label, href in anchors(listing):
        if yearname not in label or '政府行政機關辦公日曆表' not in label or '圖檔' in label:
            continue
        url = urllib.parse.urljoin(BASE, href)
        safe_url(url)
        parsed = urllib.parse.urlparse(url)
        if parsed.path.lower() != '/information' or not re.search(r'(?:^|&)pid=\d+(?:&|$)', parsed.query):
            continue
        candidates.append(url)
    if len(set(candidates)) != 1:
        raise ValueError(f'{roc}: expected one calendar announcement, found {len(set(candidates))}')
    return candidates[0]

def find_attachment(page, roc):
    matches = []
    for label, href in anchors(page):
        # Some official pages place the filename in the href rather than the link label.
        decoded = urllib.parse.unquote(href)
        if f'{roc}年辦公日曆表' not in (label + ' ' + decoded) or '.xlsx' not in (label + ' ' + decoded).lower():
            continue
        url = urllib.parse.urljoin(BASE, href)
        safe_url(url)
        matches.append(url)
    if len(set(matches)) != 1:
        raise ValueError(f'{roc}: expected one XLSX attachment, found {len(set(matches))}')
    return matches[0]

def verify_xlsx(data):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = set(archive.namelist())
        if not {'xl/workbook.xml', '[Content_Types].xml'}.issubset(names):
            raise ValueError('not a valid XLSX structure')
        if len(names) > 300 or sum(info.file_size for info in archive.infolist()) > 25_000_000:
            raise ValueError('unreasonable workbook size')

def main():
    listing = get(LIST_URL, 2_000_000)
    # Stage all downloads before writing any local file.
    staged = {}
    for roc in YEARS:
        page_url = find_announcement(listing, roc)
        attachment = find_attachment(get(page_url, 2_000_000), roc)
        print(f'{roc}: announcement={page_url}; attachment={attachment}')
        data = get(attachment)
        verify_xlsx(data)
        staged[roc] = data
    for roc, data in staged.items():
        (ROOT/'official').mkdir(parents=True, exist_ok=True)
        (ROOT/'official'/f'{roc}年辦公日曆表.xlsx').write_bytes(data)
        print(f'{roc}: downloaded and validated {len(data)} bytes')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        sys.exit(f'DGPA download aborted; existing published JSON unchanged: {error}')
