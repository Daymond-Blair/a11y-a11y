const tourCta = document.getElementById("tour-cta");
const tourSection = document.getElementById("tour");
const nameInput = document.getElementById("name");

tourCta.addEventListener("click", () => {
  tourSection.scrollIntoView({ behavior: "smooth" });
  nameInput.focus({ preventScroll: true });
});

const announcement = document.getElementById("announcement");
document.getElementById("announcement-close").addEventListener("click", () => {
  announcement.remove();
  document.querySelector(".logo").focus();
});

const testimonials = document.querySelectorAll("#testimonials .testimonial");
let current = 0;
setInterval(() => {
  testimonials[current].hidden = true;
  current = (current + 1) % testimonials.length;
  testimonials[current].hidden = false;
}, 5000);

const form = document.getElementById("tour-form");
const status = document.getElementById("form-status");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const firstName = nameInput.value.trim().split(" ")[0];
  status.textContent = `Thanks, ${firstName}. We’ll email you within one business day to confirm your tour.`;
  form.reset();
});
