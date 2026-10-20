"use strict";

const SCENARIO_ID = "fernhill";
const STORAGE_KEY = `a11y-audit-lab:${SCENARIO_ID}`;

const $ = (id) => document.getElementById(id);

const els = {
  loadError: $("load-error"),
  title: $("scenario-title"),
  summary: $("scenario-summary"),
  meta: $("scenario-meta"),
  scope: $("scenario-scope"),
  launch: $("launch-link"),
  auditState: $("audit-state"),
  form: $("finding-form"),
  formHeading: $("form-heading"),
  formLocked: $("form-locked"),
  location: $("f-location"),
  description: $("f-description"),
  wcag: $("f-wcag"),
  wcagHelp: $("f-wcag-help"),
  saveBtn: $("save-btn"),
  cancelBtn: $("cancel-edit-btn"),
  findingsHeading: $("findings-heading"),
  findingsCount: $("findings-count"),
  findingsEmpty: $("findings-empty"),
  findingsList: $("findings-list"),
  submitPanel: $("submit-panel"),
  submitBtn: $("submit-btn"),
  results: $("results"),
  resultsHeading: $("results-heading"),
  score: $("score"),
  answerKey: $("answer-key"),
  identifiedList: $("identified-list"),
  missedList: $("missed-list"),
  resetBtn: $("reset-btn"),
  announcer: $("announcer"),
};

let scenario = null;
let criteria = new Map();
let answerKey = null;
let editingId = null;
let state = loadState();

/* ---------- State ---------- */

function emptyState() {
  return { findings: [], submitted: false, identified: [] };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.findings)) return { ...emptyState(), ...saved };
  } catch (err) {
    // Storage unavailable or corrupt: start fresh.
  }
  return emptyState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Private mode or quota exceeded: the app still works for this session.
  }
}

function announce(message) {
  els.announcer.textContent = "";
  // Clearing first lets screen readers repeat an identical message.
  setTimeout(() => {
    els.announcer.textContent = message;
  }, 50);
}

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

/* ---------- Rendering helpers ---------- */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child != null) node.append(child);
  }
  return node;
}

function criterionLabel(id) {
  const c = criteria.get(id);
  return c ? `${c.id} ${c.name} (Level ${c.level})` : id;
}

/* ---------- Scenario ---------- */

function renderScenario() {
  els.title.textContent = scenario.title;
  els.summary.textContent = scenario.summary;
  els.scope.textContent = scenario.scope;
  els.launch.href = scenario.url;
  els.meta.replaceChildren(
    ...[
      ["Standard", scenario.standard],
      ["Known violations", String(scenario.violation_count)],
      ["Page", scenario.url],
    ].map(([term, value]) => el("div", {}, el("dt", { text: term }), el("dd", { text: value })))
  );
}

function populateCriteria() {
  const principles = { 1: "Perceivable", 2: "Operable", 3: "Understandable", 4: "Robust" };
  const groups = {};
  for (const c of criteria.values()) {
    const p = c.id.split(".")[0];
    groups[p] ??= el("optgroup", { label: `${p}. ${principles[p]}` });
    groups[p].append(el("option", { value: c.id, text: `${c.id} ${c.name} (${c.level})` }));
  }
  els.wcag.append(...Object.values(groups));
}

function renderCriterionHelp() {
  const c = criteria.get(els.wcag.value);
  if (!c) {
    els.wcagHelp.replaceChildren();
    return;
  }
  els.wcagHelp.replaceChildren(
    el("p", {}, el("strong", { text: "Definition: " }), c.definition),
    el("p", {}, el("strong", { text: "How to test: " }), c.testing_technique)
  );
}

/* ---------- Findings ---------- */

function renderFindings() {
  const { findings, submitted } = state;
  els.findingsCount.textContent = `(${findings.length})`;
  els.findingsEmpty.hidden = findings.length > 0;

  els.findingsList.replaceChildren(
    ...findings.map((f, i) => {
      const n = i + 1;
      const item = el(
        "li",
        { class: "finding", id: `finding-${f.id}` },
        el("h3", {}, el("span", { class: "finding-number", text: `#${n} ` }), f.location),
        el("p", { text: f.description }),
        f.wcag
          ? el("span", { class: "sc-tag", text: criterionLabel(f.wcag) })
          : el("span", { class: "muted", text: "No criterion specified" })
      );
      if (!submitted) {
        item.append(
          el(
            "div",
            { class: "finding-actions" },
            actionButton("Edit", `finding ${n}`, "btn-secondary", () => startEdit(f.id)),
            actionButton("Delete", `finding ${n}`, "btn-secondary btn-danger", () => deleteFinding(f.id))
          )
        );
      }
      return item;
    })
  );
}

function actionButton(label, context, variant, onClick) {
  const btn = el(
    "button",
    { type: "button", class: `btn btn-small ${variant}` },
    label,
    el("span", { class: "visually-hidden", text: ` ${context}` })
  );
  btn.addEventListener("click", onClick);
  return btn;
}

function setFieldError(input, message) {
  const error = $(`${input.id}-error`);
  if (message) {
    error.textContent = `Error: ${message}`;
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");
  } else {
    error.textContent = "";
    error.hidden = true;
    input.removeAttribute("aria-invalid");
  }
}

function validateForm() {
  const checks = [
    [els.location, "Enter the element or location of the issue."],
    [els.description, "Describe the issue."],
  ];
  let firstInvalid = null;
  for (const [input, message] of checks) {
    const invalid = !input.value.trim();
    setFieldError(input, invalid ? message : "");
    if (invalid && !firstInvalid) firstInvalid = input;
  }
  return firstInvalid;
}

function handleSubmitFinding(event) {
  event.preventDefault();
  const firstInvalid = validateForm();
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const data = {
    location: els.location.value.trim(),
    description: els.description.value.trim(),
    wcag: els.wcag.value,
  };

  if (editingId) {
    const index = state.findings.findIndex((f) => f.id === editingId);
    state.findings[index] = { ...state.findings[index], ...data };
    const id = editingId;
    saveState();
    resetForm();
    renderFindings();
    announce(`Finding ${index + 1} updated.`);
    focusFinding(id);
  } else {
    state.findings.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), ...data });
    saveState();
    resetForm();
    renderFindings();
    announce(`Finding ${state.findings.length} added. ${state.findings.length} findings logged.`);
    els.location.focus();
  }
  renderAuditState();
}

function startEdit(id) {
  const index = state.findings.findIndex((f) => f.id === id);
  const finding = state.findings[index];
  editingId = id;
  els.location.value = finding.location;
  els.description.value = finding.description;
  els.wcag.value = finding.wcag;
  renderCriterionHelp();
  setFieldError(els.location, "");
  setFieldError(els.description, "");
  els.formHeading.textContent = `Edit finding #${index + 1}`;
  els.saveBtn.textContent = "Save changes";
  els.cancelBtn.hidden = false;
  els.location.focus();
}

function resetForm() {
  editingId = null;
  els.form.reset();
  renderCriterionHelp();
  setFieldError(els.location, "");
  setFieldError(els.description, "");
  els.formHeading.textContent = "Log a finding";
  els.saveBtn.textContent = "Add finding";
  els.cancelBtn.hidden = true;
}

function cancelEdit() {
  const id = editingId;
  resetForm();
  announce("Edit cancelled.");
  focusFinding(id);
}

function focusFinding(id) {
  const button = document.querySelector(`#finding-${CSS.escape(id)} button`);
  (button || els.findingsHeading).focus();
}

function deleteFinding(id) {
  const index = state.findings.findIndex((f) => f.id === id);
  if (!window.confirm(`Delete finding #${index + 1}? This cannot be undone.`)) return;
  state.findings.splice(index, 1);
  if (editingId === id) resetForm();
  saveState();
  renderFindings();
  renderAuditState();
  announce(`Finding ${index + 1} deleted. ${state.findings.length} findings remaining.`);
  els.findingsHeading.focus();
}

/* ---------- Submission and results ---------- */

function renderAuditState() {
  const { submitted, findings } = state;
  els.auditState.textContent = submitted ? "Submitted" : `In progress · ${findings.length} logged`;
  els.auditState.classList.toggle("is-submitted", submitted);
  els.form.hidden = submitted;
  els.formLocked.hidden = !submitted;
  els.formHeading.textContent = submitted ? "Findings locked" : els.formHeading.textContent;
  els.submitPanel.hidden = submitted;
  els.results.hidden = !submitted;
}

async function submitAudit() {
  if (editingId) {
    window.alert("Save or cancel the finding you are editing before submitting.");
    els.location.focus();
    return;
  }
  const count = state.findings.length;
  const message =
    count === 0
      ? "You have not logged any findings. Submit anyway and reveal the answer key?"
      : `Submit your audit with ${count} finding${count === 1 ? "" : "s"}? Your findings will be locked.`;
  if (!window.confirm(message)) return;

  try {
    await loadAnswerKey();
  } catch (err) {
    showLoadError(err);
    return;
  }
  state.submitted = true;
  state.identified = [];
  saveState();
  renderAll();
  els.resultsHeading.focus();
}

async function loadAnswerKey() {
  if (!answerKey) answerKey = await fetchJson(scenario.answer_key);
}

function renderResults() {
  if (!answerKey) return;
  els.answerKey.replaceChildren(...answerKey.violations.map(renderViolation));
  renderScore();
}

function renderViolation(v) {
  const identified = state.identified.includes(v.id);
  const matches = state.findings
    .map((f, i) => ({ ...f, n: i + 1 }))
    .filter((f) => f.wcag && (f.wcag === v.wcag || v.related_wcag.includes(f.wcag)));

  const checkbox = el("input", { type: "checkbox", id: `identified-${v.id}` });
  checkbox.checked = identified;
  checkbox.addEventListener("change", () => toggleIdentified(v.id, checkbox.checked));

  const rows = [
    ["Criterion", criterionLabel(v.wcag)],
    v.related_wcag.length ? ["Related", v.related_wcag.map(criterionLabel).join("; ")] : null,
    ["Element", el("span", {}, `${v.element} `, el("code", { text: v.selector }))],
    ["Issue", v.description],
    ["How to find", v.how_to_find],
    ["Fix", v.fix],
  ].filter(Boolean);

  return el(
    "li",
    { class: `violation${identified ? " is-identified" : ""}`, id: `violation-${v.id}` },
    el("h4", {}, el("span", { class: "violation-id", text: `${v.id} ` }), v.title),
    el("dl", {}, ...rows.flatMap(([term, value]) => [el("dt", { text: term }), el("dd", {}, value)])),
    el(
      "p",
      { class: "matches muted" },
      matches.length
        ? `Possible matches in your findings: ${matches.map((m) => `#${m.n}`).join(", ")} (same or related criterion).`
        : "No findings cite this criterion. Check your findings in case you logged it under a different one."
    ),
    el("label", { class: "check", for: checkbox.id }, checkbox, `I identified ${v.id}: ${v.title}`)
  );
}

function toggleIdentified(id, checked) {
  state.identified = checked
    ? [...new Set([...state.identified, id])]
    : state.identified.filter((x) => x !== id);
  saveState();
  $(`violation-${id}`).classList.toggle("is-identified", checked);
  renderScore();
}

function renderScore() {
  const total = answerKey.violations.length;
  const found = answerKey.violations.filter((v) => state.identified.includes(v.id));
  const missed = answerKey.violations.filter((v) => !state.identified.includes(v.id));
  const percent = Math.round((found.length / total) * 100);

  els.score.replaceChildren(
    el("span", { class: "score-value", text: `${found.length} of ${total} found` }),
    el("span", { text: `${percent}% of known violations identified · ${state.findings.length} findings logged` })
  );

  const item = (v) => el("li", {}, el("a", { href: `#violation-${v.id}`, text: `${v.id}: ${v.title}` }));
  els.identifiedList.replaceChildren(...(found.length ? found.map(item) : [el("li", { text: "None marked yet." })]));
  els.missedList.replaceChildren(...(missed.length ? missed.map(item) : [el("li", { text: "None. Every known violation identified." })]));
}

function resetAudit() {
  if (!window.confirm("Reset the audit? All findings and results will be deleted.")) return;
  state = emptyState();
  saveState();
  resetForm();
  renderAll();
  announce("Audit reset. Findings cleared.");
  els.formHeading.focus();
}

function renderAll() {
  renderFindings();
  renderAuditState();
  if (state.submitted) renderResults();
}

function showLoadError(err) {
  els.loadError.textContent = `Could not load scenario data (${err.message}). Serve the project over HTTP, for example with "python3 -m http.server", rather than opening the file directly.`;
  els.loadError.hidden = false;
  console.error(err);
}

/* ---------- Init ---------- */

async function init() {
  els.form.addEventListener("submit", handleSubmitFinding);
  els.cancelBtn.addEventListener("click", cancelEdit);
  els.wcag.addEventListener("change", renderCriterionHelp);
  els.submitBtn.addEventListener("click", submitAudit);
  els.resetBtn.addEventListener("click", resetAudit);
  for (const input of [els.location, els.description]) {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true" && input.value.trim()) setFieldError(input, "");
    });
  }

  try {
    const [scenarios, wcag] = await Promise.all([
      fetchJson("data/scenarios.json"),
      fetchJson("data/wcag-criteria.json"),
    ]);
    scenario = scenarios.scenarios.find((s) => s.id === SCENARIO_ID);
    criteria = new Map(wcag.criteria.map((c) => [c.id, c]));
    renderScenario();
    populateCriteria();
    if (state.submitted) await loadAnswerKey();
  } catch (err) {
    showLoadError(err);
  }
  renderAll();
}

init();
