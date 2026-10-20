"use strict";

const active = new Set(A11yAttempt.get("cedarvalley").fromUrl(location.search));
const on = (id) => active.has(id);
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const form = $("#reg-form");
const IDLE_MS = 90 * 1000;

/* ---------- Apply this attempt's defects ---------- */

// Labels and instructions
if (on("F01")) {
  $("#p-dob-hint").remove();
  $("#p-dob").setAttribute("aria-describedby", "p-dob-error");
}
if (on("F02")) $("#password").setAttribute("aria-describedby", "password-error");
if (on("F03")) {
  for (const [id, text] of [["p-name", "Name"], ["e-name", "Name"], ["p-phone", "Phone"], ["e-phone", "Phone"]]) {
    document.querySelector(`label[for="${id}"] .label-text`).textContent = text;
  }
}
if (on("F04")) {
  for (const req of $$(".reg-form .req")) {
    req.parentElement.classList.add("required-color");
    req.remove();
  }
  $("#required-note").textContent = "Required fields are shown in red.";
}

// Error handling: F05–F08 change how validate() reports errors.
if (on("F08")) {
  for (const input of $$(".field input")) {
    const ids = (input.getAttribute("aria-describedby") || "").split(" ").filter((id) => !id.endsWith("-error"));
    if (ids.length) input.setAttribute("aria-describedby", ids.join(" "));
    else input.removeAttribute("aria-describedby");
  }
  $("#program-group").removeAttribute("aria-describedby");
  $("#terms").removeAttribute("aria-describedby");
}

// Interaction and timing
if (on("F09")) form.classList.add("flat");
if (on("F11")) {
  const input = $("#terms");
  const fake = document.createElement("span");
  fake.className = "fake-check";
  fake.id = "terms";
  input.replaceWith(fake);
  $("#terms-row").addEventListener("click", () => fake.classList.toggle("is-checked"));
}

// Process and data entry
if (on("F13")) {
  $("#same-address-row").remove();
  $("#billing-fields").hidden = false;
}
if (on("F14")) {
  $("#continue-btn").textContent = "Register and pay";
  $("#finish-note").textContent = "When you have finished, select Register and pay.";
}
if (on("F15")) for (const input of $$("#reg-form [autocomplete]")) input.removeAttribute("autocomplete");
if (on("F16")) {
  const button = $("#pw-toggle");
  button.className = "icon-toggle";
  button.setAttribute("aria-label", "Show password");
  button.innerHTML = eyeIcon(false);
}

// Visual and layout
if (on("F17")) form.classList.add("faint");
if (on("F18")) document.documentElement.style.scrollPaddingBottom = "0px";
if (on("F19")) $("#finish-note").textContent = "When you have finished, press the green button at the bottom right of the screen.";
if (on("F20")) form.classList.add("custom");

function eyeIcon(open) {
  const slash = open ? "" : '<path d="M3 3l18 18" stroke="currentColor" stroke-width="2"/>';
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>${slash}</svg>`;
}

/* ---------- Fee ---------- */

function selectedProgram() {
  return $('input[name="program"]:checked');
}

function feeTotal() {
  const program = selectedProgram();
  const addons = $$('input[name="addons"]:checked');
  return (program ? Number(program.dataset.price) : 0) + addons.reduce((sum, a) => sum + Number(a.dataset.price), 0);
}

function updateFee() {
  $("#fee-total").textContent = `$${feeTotal().toFixed(2)}`;
}

form.addEventListener("change", updateFee);

if (on("F10")) {
  for (const radio of $$('input[name="program"]')) {
    radio.addEventListener("change", () => $("#addon-rental").focus());
  }
}

/* ---------- Billing address ---------- */

const sameAddress = $("#same-address");
if (sameAddress) {
  sameAddress.addEventListener("change", () => {
    $("#billing-fields").hidden = sameAddress.checked;
  });
}

/* ---------- Password toggle ---------- */

const pwToggle = $("#pw-toggle");
pwToggle.addEventListener("click", () => {
  const password = $("#password");
  const show = password.type === "password";
  password.type = show ? "text" : "password";
  if (on("F16")) pwToggle.innerHTML = eyeIcon(show);
  else pwToggle.textContent = show ? "Hide password" : "Show password";
});

/* ---------- Validation ---------- */

const value = (id) => document.getElementById(id).value.trim();

function validDate(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return false;
  const [day, month, year] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && year > 1900 && date < new Date();
}

function suggestion(message, generic) {
  return on("F06") ? generic : message;
}

function checks() {
  const list = [
    ["p-name", !value("p-name") && "Enter the participant’s full name."],
    ["p-dob", !value("p-dob") ? "Enter your date of birth." : !validDate(value("p-dob")) && suggestion("Enter your date of birth as DD/MM/YYYY, for example 27/03/1990.", "Invalid date of birth.")],
    ["p-email", !value("p-email") ? "Enter your email address." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("p-email")) && suggestion("Enter an email address in the correct format, like name@example.com.", "Invalid email address.")],
    ["p-phone", !value("p-phone") && "Enter the participant’s phone number."],
    ["a-line1", !value("a-line1") && "Enter the first line of your address."],
    ["a-city", !value("a-city") && "Enter your town or city."],
    ["a-postcode", !value("a-postcode") && "Enter your postcode."],
    ["e-name", !value("e-name") && "Enter your emergency contact’s full name."],
    ["e-phone", !value("e-phone") && "Enter your emergency contact’s phone number."],
    ["program", !selectedProgram() && "Choose a program."],
  ];
  if (!$("#billing-fields").hidden) {
    list.push(
      ["b-line1", !value("b-line1") && "Enter the first line of your billing address."],
      ["b-city", !value("b-city") && "Enter your billing town or city."],
      ["b-postcode", !value("b-postcode") && "Enter your billing postcode."]
    );
  }
  const pw = value("password");
  list.push(
    ["password", !pw ? "Create a password." : (pw.length < 10 || !/\d/.test(pw)) && suggestion("Your password must be at least 10 characters and include a number.", "Invalid password.")],
    ["terms", !termsChecked() && "Agree to the program terms and cancellation policy to register."]
  );
  return list;
}

function termsChecked() {
  const terms = $("#terms");
  return terms.tagName === "INPUT" ? terms.checked : terms.classList.contains("is-checked");
}

function showError(id, message) {
  const error = document.getElementById(`${id}-error`);
  const valid = !message;
  if (id === "program") {
    if (on("F05")) {
      $("#program-group").classList.toggle("invalid-color", !valid);
      return;
    }
  } else if (id !== "terms") {
    const input = document.getElementById(id);
    input.classList.toggle("invalid", !valid);
    if (valid || on("F08")) input.removeAttribute("aria-invalid");
    else input.setAttribute("aria-invalid", "true");
  }
  error.textContent = message || "";
  error.hidden = valid;
}

function focusTarget(id) {
  if (id === "program") return $('input[name="program"]');
  return document.getElementById(id);
}

function validate() {
  const results = checks();
  for (const [id, message] of results) showError(id, message);
  return results.filter(([, message]) => message);
}

function showSummary(problems) {
  const summary = $("#error-summary");
  $("#error-summary-title").textContent =
    problems.length === 1 ? "There is a problem" : `There are ${problems.length} problems with your registration`;
  $("#error-list").replaceChildren(
    ...problems.map(([id, message]) => {
      const target = focusTarget(id);
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${target.id}`;
      link.textContent = message;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        target.focus();
      });
      li.append(link);
      return li;
    })
  );
  summary.hidden = false;
  if (!on("F07")) summary.focus();
}

/* ---------- Submit, review and confirm ---------- */

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const problems = validate();
  if (problems.length) {
    // With F05 the program error is shown only by color, so it is left out of the text summary too.
    const listed = on("F05") ? problems.filter(([id]) => id !== "program") : problems;
    if (listed.length) showSummary(listed);
    else $("#error-summary").hidden = true;
    return;
  }
  $("#error-summary").hidden = true;
  if (on("F14")) complete();
  else showReview();
});

function reviewRows() {
  const program = selectedProgram();
  const addons = $$('input[name="addons"]:checked').map((a) => a.dataset.label);
  const billing = $("#billing-fields").hidden
    ? "Same as home address"
    : `${value("b-line1")}, ${value("b-city")}, ${value("b-postcode")}`;
  return [
    ["Participant", value("p-name")],
    ["Date of birth", value("p-dob")],
    ["Email", value("p-email")],
    ["Phone", value("p-phone")],
    ["Home address", `${value("a-line1")}, ${value("a-city")}, ${value("a-postcode")}`],
    ["Emergency contact", `${value("e-name")}, ${value("e-phone")}`],
    ["Program", program.dataset.label],
    ["Add-ons", addons.length ? addons.join(", ") : "None"],
    ["Billing address", billing],
  ];
}

function setStage(stage) {
  form.hidden = stage !== "form";
  $("#fee-bar").hidden = stage !== "form";
  $("#required-note").hidden = stage !== "form";
  $("#finish-note").hidden = stage !== "form";
  $("#review").hidden = stage !== "review";
  $("#done").hidden = stage !== "done";
}

function showReview() {
  $("#review-list").replaceChildren(
    ...reviewRows().flatMap(([term, detail]) => {
      const dt = document.createElement("dt");
      dt.textContent = term;
      const dd = document.createElement("dd");
      dd.textContent = detail;
      return [dt, dd];
    })
  );
  $("#review-total").textContent = `Total: $${feeTotal().toFixed(2)}`;
  $("#confirm-btn").textContent = `Confirm and pay $${feeTotal().toFixed(2)}`;
  setStage("review");
  $("#review-heading").focus();
}

function complete() {
  const program = selectedProgram().dataset.label;
  $("#done-text").textContent = `You are registered for ${program}. $${feeTotal().toFixed(2)} has been charged to your account, and a confirmation has been sent to ${value("p-email")}.`;
  setStage("done");
  $("#done-heading").focus();
}

$("#edit-btn").addEventListener("click", () => {
  setStage("form");
  $("#p-name").focus();
});
$("#confirm-btn").addEventListener("click", complete);

/* ---------- Inactivity ---------- */

if (on("F12")) {
  let timer = null;
  const restart = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (form.hidden) return;
      form.reset();
      for (const [id] of checks()) showError(id, "");
      $("#error-summary").hidden = true;
      if (sameAddress) $("#billing-fields").hidden = true;
      if (on("F11")) $("#terms").classList.remove("is-checked");
      updateFee();
    }, IDLE_MS);
  };
  for (const type of ["input", "change", "keydown", "pointerdown"]) document.addEventListener(type, restart);
  restart();
}

updateFee();
