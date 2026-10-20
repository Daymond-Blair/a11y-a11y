"use strict";

const active = new Set(A11yAttempt.get("larkspur").fromUrl(location.search));
const on = (id) => active.has(id);
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* ---------- Apply this attempt's defects ---------- */

// Layout and structure
if (on("E01")) $("#review-es").removeAttribute("lang");
if (on("E02")) {
  for (const th of $$("#specs tbody th")) {
    const td = document.createElement("td");
    td.className = "spec-label";
    td.textContent = th.textContent;
    th.replaceWith(td);
  }
}
if (on("E03")) document.body.classList.add("wide");
if (on("E04")) {
  $("#highlights").classList.add("tight");
  for (const li of $$("#highlights li:not(:first-child)")) li.style.width = `${li.textContent.trim().length}ch`;
}

// Screen reader
if (on("E09")) $("#main-image").removeAttribute("alt");
if (on("E10")) for (const btn of $$(".qty-btn")) btn.removeAttribute("aria-label");
if (on("E11")) $("#cart-status").removeAttribute("role");
if (on("E12")) $("#add-btn").setAttribute("aria-label", "Purchase item");

// Options and controls
if (on("E13")) {
  for (const fieldset of $$(".buy-form fieldset")) {
    const legend = fieldset.querySelector("legend");
    const label = document.createElement("p");
    label.className = "option-label";
    label.append(...legend.childNodes);
    legend.remove();
    const div = document.createElement("div");
    div.className = fieldset.className;
    div.id = fieldset.id;
    div.append(label, ...fieldset.childNodes);
    fieldset.replaceWith(div);
  }
}
if (on("E14")) $("#desc").classList.add("quiet");
if (on("E15")) $("#qty-control").classList.add("compact");
if (on("E16")) $("#swatches").classList.add("soft");

// Visual and content
if (on("E17")) $("#stock").classList.add("light");
if (on("E18")) {
  const banner = document.createElement("img");
  banner.src = "assets/sale-banner.svg";
  banner.alt = $("#promo-text").textContent;
  banner.width = 1100;
  banner.height = 60;
  $("#promo-text").replaceWith(banner);
}
if (on("E19")) {
  $("#instructions").textContent = "Choose a color from the round swatches on the right, then press the green button.";
}

// Keyboard and interaction (behavioral defects are wired up below)
if (on("E05")) {
  for (const label of $$(".swatch")) {
    const input = label.querySelector("input");
    const div = document.createElement("div");
    div.className = `swatch${input.checked ? " is-selected" : ""}`;
    div.dataset.value = input.value;
    div.append(label.querySelector(".swatch-chip"), label.querySelector(".swatch-label"));
    div.addEventListener("click", () => selectColor(input.value));
    label.replaceWith(div);
  }
}

/* ---------- Page behavior ---------- */

let selectedColor = "Slate";
function selectColor(value) {
  selectedColor = value;
  $("#color-name").textContent = value;
  for (const div of $$("div.swatch")) div.classList.toggle("is-selected", div.dataset.value === value);
}
for (const input of $$('input[name="color"]')) {
  input.addEventListener("change", () => selectColor(input.value));
}

for (const thumb of $$(".thumb")) {
  thumb.addEventListener("click", () => {
    const main = $("#main-image");
    main.src = thumb.dataset.src;
    if (!on("E09")) main.alt = thumb.dataset.alt;
    for (const t of $$(".thumb")) t.setAttribute("aria-pressed", String(t === thumb));
  });
}

const qty = $("#qty");
const clampQty = (n) => Math.min(10, Math.max(1, Math.round(n) || 1));
$("#qty-dec").addEventListener("click", () => (qty.value = clampQty(Number(qty.value) - 1)));
$("#qty-inc").addEventListener("click", () => (qty.value = clampQty(Number(qty.value) + 1)));

$("#search-form").addEventListener("submit", (event) => event.preventDefault());

const cart = [];
const PRICE = 71.2;

function itemCount() {
  return cart.reduce((sum, item) => sum + item.n, 0);
}

function renderCart() {
  $("#cart-empty").hidden = cart.length > 0;
  $("#cart-items").replaceChildren(
    ...cart.map((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.n} × Trailhead 28L Daypack, ${item.color}, ${item.size}`;
      return li;
    })
  );
  $("#cart-total").hidden = cart.length === 0;
  $("#cart-total").textContent = `Subtotal: $${(itemCount() * PRICE).toFixed(2)}`;
}

function addToCart() {
  const n = clampQty(Number(qty.value));
  qty.value = n;
  const size = $('input[name="size"]:checked').value;
  cart.push({ n, color: selectedColor, size });
  const total = itemCount();
  $("#cart-count").textContent = total;
  $("#cart-status").textContent = `Added ${n} × Trailhead 28L Daypack (${selectedColor}, ${size}) to your cart. Your cart has ${total} item${total === 1 ? "" : "s"}.`;
  renderCart();
}

let pointerAdded = false;
$("#buy-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (pointerAdded) return;
  addToCart();
});
if (on("E08")) {
  $("#add-btn").addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    pointerAdded = true;
    addToCart();
  });
  document.addEventListener("pointerup", () => setTimeout(() => (pointerAdded = false), 0));
}

// Cart dialog
const cartDialog = $("#cart-dialog");
const cartBtn = $("#cart-btn");
cartBtn.addEventListener("click", () => {
  renderCart();
  if (on("E07")) {
    cartDialog.classList.add("overlay");
    cartDialog.setAttribute("open", "");
  } else {
    cartDialog.showModal();
  }
});
$("#cart-close").addEventListener("click", () => cartDialog.close());
cartDialog.addEventListener("close", () => {
  cartDialog.classList.remove("overlay");
  cartBtn.focus();
});

// Size guide dialog
const sizeDialog = $("#size-dialog");
const sizeBtn = $("#size-guide-btn");
sizeBtn.addEventListener("click", () => {
  if (on("E06")) {
    sizeDialog.classList.add("overlay");
    sizeDialog.setAttribute("open", "");
    sizeDialog.tabIndex = -1;
    sizeDialog.focus();
  } else {
    sizeDialog.showModal();
  }
});
if (on("E06")) {
  const button = $("#size-close");
  const fakeButton = document.createElement("span");
  fakeButton.className = button.className;
  fakeButton.id = button.id;
  fakeButton.innerHTML = button.innerHTML;
  button.replaceWith(fakeButton);
  fakeButton.addEventListener("click", () => sizeDialog.close());
  sizeDialog.addEventListener("keydown", (event) => {
    if (event.key === "Tab" || event.key === "Escape") event.preventDefault();
  });
} else {
  $("#size-close").addEventListener("click", () => sizeDialog.close());
}
sizeDialog.addEventListener("close", () => {
  sizeDialog.classList.remove("overlay");
  sizeBtn.focus();
});

// Ripstop explanation
const tipBtn = $("#ripstop-btn");
const tip = $("#ripstop-tip");
if (on("E20")) {
  tipBtn.removeAttribute("aria-expanded");
  tipBtn.removeAttribute("aria-controls");
  tipBtn.setAttribute("aria-describedby", "ripstop-tip");
  tip.classList.add("floating");
  const show = () => (tip.hidden = false);
  const hide = () => (tip.hidden = true);
  tipBtn.addEventListener("mouseenter", show);
  tipBtn.addEventListener("mouseleave", hide);
  tipBtn.addEventListener("focus", show);
  tipBtn.addEventListener("blur", hide);
} else {
  const setOpen = (open) => {
    tip.hidden = !open;
    tipBtn.setAttribute("aria-expanded", String(open));
  };
  tipBtn.addEventListener("click", () => setOpen(tip.hidden));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !tip.hidden) {
      setOpen(false);
      tipBtn.focus();
    }
  });
}
