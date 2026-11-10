#!/usr/bin/env python3
# Screenshot hand-built share cards at 1200x630 into public/og/<key>.png.
#   python3 scripts/shoot-og.py resume tape carmen      (after node scripts/bake-trivia-og.mjs)
# Needs Playwright for Python and a Chromium; pass CHROME=/path/to/chrome to use an installed one.
import os, sys, tempfile
from playwright.sync_api import sync_playwright

src = os.path.join(tempfile.gettempdir(), 'trivia-og')
keys = sys.argv[1:] or ['resume', 'tape', 'carmen']
with sync_playwright() as p:
    kw = {'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}
    b = p.chromium.launch(**kw)
    pg = b.new_page(viewport={'width': 1200, 'height': 630})
    for k in keys:
        pg.goto('file://' + os.path.join(src, k + '.html'))
        pg.wait_for_timeout(700)
        pg.locator('#c').screenshot(path=os.path.join('public', 'og', k + '.png'))
        print('wrote public/og/%s.png' % k)
    b.close()
