"use strict";

const active = new Set(A11yAttempt.get("fernhill").fromUrl(location.search));
const on = (id) => active.has(id);
const $ = (selector) => document.querySelector(selector);

/* ---------- Apply this attempt's defects ---------- */

if (on("V01")) document.documentElement.removeAttribute("lang");
if (on("V11")) document.title = "Document";
if (on("V12")) {
  $('meta[name="viewport"]').setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no");
}
if (on("V02")) $("#announcement-close").removeAttribute("aria-label");
if (on("V03")) $(".site-nav").classList.add("nav-minimal");

if (on("V04")) {
  const link = $("#tour-cta");
  const div = document.createElement("div");
  div.className = link.className;
  div.id = link.id;
  div.textContent = link.textContent;
  div.addEventListener("click", () => {
    $("#tour").scrollIntoView({ behavior: "smooth" });
    $("#name").focus({ preventScroll: true });
  });
  link.replaceWith(div);
}

if (on("V05")) {
  for (const heading of [$("#plans-heading"), $("#testimonials-heading")]) {
    const div = document.createElement("div");
    div.className = heading.tagName === "H2" ? "section-title" : heading.className;
    div.textContent = heading.textContent;
    heading.replaceWith(div);
  }
}

if (on("V06")) {
  const dot = (yes) => `<span class="dot dot-${yes ? "yes" : "no"}"></span>`;
  for (const cell of document.querySelectorAll(".plans-table td")) {
    cell.innerHTML = dot(cell.querySelector(".mark-yes"));
  }
  $(".legend").innerHTML = `${dot(true)} Included ${dot(false)} Not included`;
}

if (on("V07")) $(".fine-print").classList.add("muted");
if (on("V08")) $("img.stats").removeAttribute("alt");

if (on("V09")) {
  const testimonials = document.querySelectorAll("#testimonials .testimonial");
  testimonials.forEach((t, i) => (t.hidden = i !== 0));
  let current = 0;
  setInterval(() => {
    testimonials[current].hidden = true;
    current = (current + 1) % testimonials.length;
    testimonials[current].hidden = false;
  }, 5000);
}

if (on("V10")) {
  for (const [id, text] of [["email", "Email address"], ["phone", "Phone number"]]) {
    document.querySelector(`label[for="${id}"]`).remove();
    document.getElementById(id).placeholder = text;
  }
}

if (on("V13")) {
  for (const id of ["name", "email", "phone"]) document.getElementById(id).removeAttribute("autocomplete");
}
if (on("V15")) $("#tour-form").classList.add("subtle");
if (on("V16")) $("#tour-submit").setAttribute("tabindex", "1");
if (on("V18")) {
  for (const link of document.querySelectorAll("#social a")) link.removeAttribute("aria-label");
}
if (on("V19")) $("#form-status").removeAttribute("role");
if (on("V20")) $("#social").classList.add("compact");

/* ---------- Page behavior ---------- */

$("#announcement-close").addEventListener("click", () => {
  $("#announcement").remove();
  $(".logo").focus();
});

const form = $("#tour-form");
const status = $("#form-status");
const fields = [
  [$("#name"), "Enter your full name."],
  [$("#email"), "Enter an email address, like name@example.com."],
  [$("#phone"), "Enter a phone number."],
  [$("#date"), "Choose a preferred date."],
];

form.addEventListener("submit", (event) => {
  event.preventDefault();
  let firstInvalid = null;
  for (const [input, message] of fields) {
    const valid = input.value.trim() !== "" && input.checkValidity();
    const error = document.getElementById(`${input.id}-error`);
    input.classList.toggle("invalid", !valid);
    if (!on("V14")) {
      error.textContent = valid ? "" : message;
      error.hidden = valid;
      if (valid) input.removeAttribute("aria-invalid");
      else input.setAttribute("aria-invalid", "true");
    }
    if (!valid && !firstInvalid) firstInvalid = input;
  }

  if (firstInvalid) {
    status.textContent = "";
    firstInvalid.focus();
    return;
  }
  const firstName = $("#name").value.trim().split(" ")[0];
  status.textContent = `Thanks, ${firstName}. We’ll email you within one business day to confirm your tour.`;
  form.reset();
});

if (on("V17")) {
  $("#location").addEventListener("change", () => form.requestSubmit());
}
