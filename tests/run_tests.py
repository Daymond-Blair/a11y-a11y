#!/usr/bin/env python3
"""Run the browser test suites in headless Chrome and report the results.

Each suite is an HTML page in tests/ that drives the app and audit pages in an iframe,
runs axe-core (loaded from cdnjs, so an internet connection is needed) and reports
PASS/FAIL lines back to this script.

Usage:
    python3 tests/run_tests.py                  # run every suite
    python3 tests/run_tests.py fernhill app     # run selected suites
    python3 tests/run_tests.py -v               # also print passing checks

Set CHROME to the browser executable if it is not found automatically.
The suites run on a random local port with a temporary browser profile, so they never
touch the findings you have saved while practising.
"""

import argparse
import functools
import http.server
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# name: (page, timeout in seconds)
SUITES = {
    "app": ("tests/app.html", 120),
    "fernhill": ("tests/fernhill.html", 300),
    "larkspur-cedarvalley": ("tests/larkspur-cedarvalley.html", 400),
    "multi-scenario": ("tests/multi-scenario.html", 240),
}

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
]


def find_chrome():
    for candidate in [os.environ.get("CHROME"), *CHROME_CANDIDATES]:
        if not candidate:
            continue
        if Path(candidate).exists():
            return candidate
        found = shutil.which(candidate)
        if found:
            return found
    sys.exit("Chrome not found. Set the CHROME environment variable to its executable.")


class Handler(http.server.SimpleHTTPRequestHandler):
    result = None

    def do_GET(self):
        if self.path.startswith("/__results?"):
            Handler.result = urllib.parse.unquote(self.path.split("?", 1)[1])
            self.send_response(204)
            self.end_headers()
            return
        super().do_GET()

    def log_message(self, *args):
        pass


def run_suite(chrome, port, page, timeout):
    Handler.result = None
    with tempfile.TemporaryDirectory() as profile:
        browser = subprocess.Popen(
            [chrome, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
             f"--user-data-dir={profile}", "--window-size=1400,1000", f"http://127.0.0.1:{port}/{page}"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            deadline = time.time() + timeout
            while Handler.result is None and time.time() < deadline:
                time.sleep(0.5)
        finally:
            browser.terminate()
            try:
                browser.wait(timeout=10)
            except subprocess.TimeoutExpired:
                browser.kill()
    return Handler.result


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("suites", nargs="*", choices=[[], *SUITES], help="suites to run (default: all)")
    parser.add_argument("-v", "--verbose", action="store_true", help="print passing checks too")
    args = parser.parse_args()

    chrome = find_chrome()
    handler = functools.partial(Handler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]

    totals = {"PASS": 0, "FAIL": 0}
    failed_suites = []
    for name in args.suites or SUITES:
        page, timeout = SUITES[name]
        print(f"\n== {name} ==", flush=True)
        started = time.time()
        result = run_suite(chrome, port, page, timeout)
        if result is None:
            print(f"  TIMEOUT after {timeout}s (no results reported)")
            failed_suites.append(name)
            continue
        lines = result.splitlines()
        passes = sum(line.startswith("PASS") for line in lines)
        fails = sum(line.startswith("FAIL") for line in lines)
        for line in lines:
            if line.startswith("FAIL") or args.verbose:
                print(f"  {line}")
        print(f"  {passes} passed, {fails} failed ({time.time() - started:.0f}s)")
        totals["PASS"] += passes
        totals["FAIL"] += fails
        if fails:
            failed_suites.append(name)

    server.shutdown()
    print(f"\nTotal: {totals['PASS']} passed, {totals['FAIL']} failed")
    if failed_suites:
        print(f"Failed suites: {', '.join(failed_suites)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
