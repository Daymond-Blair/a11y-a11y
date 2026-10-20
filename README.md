# Accessibility Audit Training Lab

A practice environment for WCAG 2.2 conformance audits. You audit a realistic web page with known, intentionally injected Level A/AA violations, document what you find, and then compare your report against an answer key to see exactly what you caught and what you missed.

Built with vanilla HTML, CSS and JavaScript. No frameworks, build step or backend.

## Why this exists

A WCAG conformance audit is more than spotting problems. A professional audit follows a repeatable workflow:

1. **Investigation:** systematically testing a page with a keyboard, a screen reader, visual checks, code inspection and automated tools.
2. **Reproduction:** confirming each issue reliably and knowing the exact steps and conditions that expose it.
3. **Documentation:** recording each finding clearly: where it is, what fails, who it affects, and which success criterion it violates.
4. **Remediation:** recommending a specific, correct fix.

The only way to get good at this workflow is repetition. The obvious way to practise is to pick a random website and audit it, but **auditing a random site gives you no feedback.** You never learn which violations you missed, so you can't tell whether a clean result means the site is accessible or your testing has gaps. Blind spots stay blind.

This lab closes that loop. Every violation on the audit page is known and documented. Everything else on the page has been verified to pass, so a missed item is a real gap in your process rather than an ambiguity in the test. After you submit, the answer key shows each violation with how to find it (reproduction) and how to fix it (remediation). You can compare your own documentation against that model, not just tick a box.

It is also deliberately designed so that **automated tools are not enough.** axe-core detects only 3 of the 10 injected defects. The other 7 need manual keyboard, screen reader and visual testing, the same skills a real audit and an interview audit exercise test.

## How the project was specified

I wrote a structured brief before any code existed and used it to direct Claude Code (an AI coding agent) through the build. The full prompt is in [`docs/project-spec.md`](docs/project-spec.md). Each section addresses one aspect of the problem:

| Section of the brief | What it pinned down | Why it mattered |
|---|---|---|
| **Project overview** | Simulate a real audit: examine, document, compare against known violations | Set the goal as practising a workflow rather than a quiz |
| **Features** | One page, 10 violations, a findings log (add, edit, delete), submit, answer key, manual marking, score, reset | Defined the minimum loop: audit, document, get feedback, repeat |
| **WCAG reference library** | All active 2.2 A/AA criteria from W3C sources, a fixed schema, AAA and obsolete criteria excluded, validated against the spec | Grounded every finding and answer in the official standard instead of AI recall |
| **Scenario generation** | Distinct, reproducible defects across keyboard, screen reader, semantics, forms and visual design; answer key kept separate and hidden | Required genuine, testable failures covering the full range of audit skills, not arbitrary bugs |
| **Technical** | Vanilla stack, JSON data, localStorage, static hosting, no backend or paid APIs | Kept it simple, free to run and easy to deploy for demos |
| **Accessibility** | The training app itself meets WCAG 2.2 AA; the defective page is kept separate; injected defects are never auto-fixed | An accessibility tool has to be accessible, and the defects must survive as test material |
| **UI** | QA-tool styling, responsive, a professional audit-report form, no gamification | Mirrors a professional audit, not a game |
| **Development approach** | MVP first, one scenario, no runtime AI, explain the plan before building, verify it runs | Scoped the AI's work and required a plan and verification instead of unchecked output |

## How AI output was verified

An AI agent wrote the code, injected the defects and drafted the WCAG library. None of that output was trusted without checks:

- **WCAG library:** `tools/validate_wcag.py` fetches the official W3C Recommendation and confirms that the JSON contains exactly the 55 active Level A and AA criteria, with matching ids, names and levels.
- **Injected defects:** a browser test harness confirmed that each of the 10 defects is present and behaves as described.
- **No unintended violations:** axe-core and a computed contrast scan of every text element showed that nothing outside the answer key fails, so the answer key can be trusted.
- **The training app:** axe-core reported zero violations, contrast passes in light and dark mode, the layout reflows at 320px, and focus management and screen reader announcements were tested for every action.

This matters in accessibility work in particular. AI-generated code often introduces accessibility defects, so AI-assisted work is only useful when it's verified against the standard.

## How it works

1. **Launch the audit site.** The Fernhill Coworking landing page opens in a new tab. Test it with any tools you like: keyboard, screen reader, browser DevTools, axe or WAVE, a contrast checker.
2. **Log findings.** For each issue, record the element or location and a description. Optionally add steps to reproduce, a recommended fix and the WCAG success criterion, matching the fields in the answer key. Choosing a criterion shows its definition and testing technique. You can edit and delete findings, and they are saved to `localStorage`.
3. **Submit.** Your findings are locked and the answer key is loaded and revealed.
4. **Score.** Tick each known violation you identified. Findings that cite the same or a related criterion are suggested as possible matches. The score, identified list and missed list update as you go.
5. **Reset** clears everything to start over.

Automated tools find only about 3 of the 10 defects. The rest need manual keyboard, screen reader and visual testing.

## Project structure

```
index.html                      Training app (dashboard, findings log, results)
css/app.css                     App styles (light/dark, visible focus, responsive)
js/app.js                       App logic: state, localStorage, findings CRUD, scoring
data/wcag-criteria.json         All 55 WCAG 2.2 Level A/AA success criteria
data/scenarios.json             Scenario metadata shown on the dashboard
data/answer-keys/fernhill.json  Answer key (fetched only after submission)
scenarios/fernhill/             The intentionally inaccessible landing page
tools/validate_wcag.py          Validates the criteria JSON against the W3C spec
docs/project-spec.md            The original project brief
```

The defective page in `scenarios/fernhill/` is deliberately broken. **Do not fix its violations**, because the answer key depends on them. Apart from the 10 documented defects, the page is built to pass, so testers aren't penalized for finding real issues that aren't in the key.

## Run locally

The app loads JSON with `fetch`, so it must be served over HTTP. Opening `index.html` directly from disk will not work.

```bash
cd a11y_a11y
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Validate the WCAG data

```bash
python3 tools/validate_wcag.py
```

This fetches the [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) and confirms that `data/wcag-criteria.json` contains exactly the active Level A and AA criteria (31 A, 24 AA, with 4.1.1 Parsing excluded as obsolete), with matching ids, names and levels and all required fields. It also checks that every criterion referenced in the answer keys exists. To validate offline, pass a saved copy of the spec: `python3 tools/validate_wcag.py spec.html`.

## Deploy to Netlify

The project is a plain static site with no build step.

**Drag and drop (fastest):**
1. Sign in at <https://app.netlify.com>.
2. Go to **Sites → Add new site → Deploy manually**.
3. Drag the `a11y_a11y` folder onto the upload area.

**From a Git repository (auto-deploys on push):**
1. Push the project to GitHub, GitLab or Bitbucket.
2. In Netlify, choose **Add new site → Import an existing project** and select the repo.
3. Leave **Build command** empty and set **Publish directory** to the folder containing `index.html` (`.` if it is the repo root).
4. Click **Deploy**.

**GitHub Pages** also works: push the repo, then enable Pages under **Settings → Pages** with the branch root as the source.

## Notes and limitations

- On a static host the answer key is a public JSON file. It stays out of the interface until submission, but a determined user could open it directly. That's acceptable for a training tool. Real secrecy would need a backend.
- Findings live only in the current browser's `localStorage`.
- One scenario is included. To add another, create a folder under `scenarios/`, an answer key under `data/answer-keys/`, and an entry in `data/scenarios.json`. The app currently loads the scenario named by `SCENARIO_ID` in `js/app.js`.

## Credits

Success criterion names and levels come from the W3C [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Recommendation. Definitions and testing guidance are concise paraphrases. See [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/) for the authoritative text. Fernhill Coworking is a fictional company.
