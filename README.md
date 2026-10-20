# Accessibility Audit Training Lab

A static web app for practicing WCAG 2.2 accessibility audits. Testers audit a realistic landing page that has 10 intentionally injected Level A/AA violations, log their findings, then submit to reveal the answer key and score themselves.

Built with vanilla HTML, CSS and JavaScript. No frameworks, build step or backend.

## How it works

1. **Launch the audit site.** The Fernhill Coworking landing page opens in a new tab. Test it with any tools you like: keyboard, screen reader, browser DevTools, axe or WAVE, a contrast checker.
2. **Log findings.** For each issue, record the element or location, a description and, optionally, the WCAG success criterion. Choosing a criterion shows its definition and testing technique. You can edit and delete findings, and they are saved to `localStorage`.
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
