# Original project specification

This is the prompt I wrote to brief Claude Code (an AI coding agent) before any code existed. It is kept verbatim as a record of how the project was scoped. The [README](../README.md#how-the-project-was-specified) explains how each section shaped the build.

---

Build an Accessibility Audit Training Lab using vanilla HTML, CSS, and JavaScript with the following requirements:

## PROJECT OVERVIEW

Create a web application that allows accessibility testers to practice auditing websites containing intentionally injected WCAG violations.

The goal is to simulate a real-world accessibility audit, where a tester examines a website, documents findings, and compares their results against a known set of injected violations.

This is a simple MVP intended for demonstration during accessibility specialist interviews.

## FEATURES

- Create one realistic landing page containing 10 intentionally injected WCAG 2.2 Level A or AA accessibility violations.
- Allow users to open the landing page in a separate browser tab and audit it using their normal accessibility testing tools.
- Provide a simple findings log where users can add, edit, and delete accessibility issues they discover.
- Each finding should include an element/location, issue description, and optional WCAG success criterion.
- Allow users to submit their completed audit.
- After submission, reveal the 10 injected violations in an answer key.
- Allow users to manually mark which injected violations they successfully identified.
- Calculate a score showing how many of the 10 known violations were found.
- Include a reset button to start the audit again.

## WCAG REFERENCE LIBRARY

- Create `data/wcag-criteria.json` containing all active WCAG 2.2 Level A and AA success criteria.
- Use the official W3C documentation:
  - https://www.w3.org/TR/WCAG22/
  - https://www.w3.org/WAI/WCAG22/Understanding/
- Each entry must contain:
  - `id`
  - `name`
  - `level`
  - `definition`
  - `testing_technique`
  - `failures`
- Use concise, accurate descriptions and practical testing guidance.
- Exclude Level AAA and obsolete success criteria.
- Validate the JSON against the official specification.

## SCENARIO GENERATION

- Use the WCAG reference library to select 10 distinct, reproducible accessibility defects.
- Create a realistic landing page using HTML, CSS, and JavaScript.
- Inject the selected defects into the landing page.
- Include a variety of issues involving keyboard accessibility, screen reader behavior, semantic HTML, forms, and visual accessibility.
- Store the injected violations in a separate scenario-specific JSON answer key.
- Each answer-key entry must identify the affected element, issue description, and associated WCAG success criterion.
- Do not expose the answer key in the visible interface before audit submission.
- Ensure the defects are genuine, testable accessibility failures rather than arbitrary coding mistakes.

## TECHNICAL

- Vanilla HTML5, CSS3, and JavaScript (ES6+).
- No React, frontend frameworks, or CSS frameworks.
- No backend, database, authentication, or paid APIs.
- Use JSON files for WCAG reference data and scenario answer keys.
- Use localStorage to preserve audit findings between page refreshes.
- Use a simple, maintainable project structure.
- Keep JavaScript modular only where necessary.
- Make the application deployable as a static website on Netlify or GitHub Pages.

## ACCESSIBILITY

- The main training application must follow WCAG 2.2 Level AA best practices.
- Use semantic HTML, visible focus indicators, appropriate labels, and full keyboard support.
- Ensure the findings form, answer-key review, and scoring interface work with screen readers.
- The intentionally defective landing page must remain separate from the accessible training interface.
- Do not automatically fix the intentionally injected violations.

## UI

- Clean, minimal, professional interface inspired by modern QA and developer tools.
- Responsive layout for desktop and mobile.
- Simple dashboard displaying the available audit scenario.
- Clearly labeled button to launch the audit website.
- Straightforward findings form resembling a professional accessibility audit report.
- Results screen displaying the answer key, identified violations, missed violations, and final score.
- Avoid gamification, multiple-choice quizzes, unnecessary animations, and complex dashboards.

## DEVELOPMENT APPROACH

- Prioritize simplicity and working functionality over advanced features.
- Build only one audit scenario for the initial MVP.
- Do not implement runtime AI generation or randomized scenario creation.
- Use Claude Code during development to create and inject the accessibility defects.
- Verify that the application runs locally without errors.
- Provide instructions for running the project and deploying it to Netlify.

Before implementation, briefly explain the proposed file structure and implementation order. Then proceed with building the MVP.
