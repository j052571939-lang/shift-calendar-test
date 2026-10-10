#!/usr/bin/env python3
"""Offline regression tests against the user's two official DGPA workbooks."""
import datetime, json, pathlib, tempfile, unittest
from build_calendar import parse
ROOT=pathlib.Path(__file__).resolve().parents[1]
class CalendarTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'data/official_calendar.json').read_text(encoding='utf-8'))
    def test_annual_calendar(self):
        for year,total in [(2026,120),(2027,121)]:
            with self.subTest(year=year):
                days=parse(ROOT/'official'/f'{year-1911}年辦公日曆表.xlsx',year)
                self.assertEqual(len(days),365)
                self.assertEqual(sum(d['off'] for d in days.values()),total)
                self.assertEqual({k:v['off'] for k,v in days.items()}, {k:v['off'] for k,v in self.data['years'][str(year)]['days'].items()})
    def test_official_2027_makeup(self):
        days=self.data['years']['2027']['days']
        for day in ('2027-02-09','2027-02-10','2027-04-06','2027-12-31'):
            with self.subTest(day=day):
                self.assertTrue(days[day]['off'])
                self.assertTrue(days[day]['name'])
    def test_every_off_weekday_has_label(self):
        for year,rec in self.data['years'].items():
            for key,day in rec['days'].items():
                if day['off'] and datetime.date.fromisoformat(key).weekday()<5:
                    self.assertTrue(day['name'],key)
if __name__=='__main__':unittest.main(verbosity=2)
