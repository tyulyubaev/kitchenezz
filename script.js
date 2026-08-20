document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");

  if (!track || !previousButton || !nextButton) {
    return;
  }

  const getScrollAmount = () => {
    const item = track.querySelector("[data-carousel-item]");
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;

    return item ? item.getBoundingClientRect().width + gap : track.clientWidth;
  };

  const updateButtons = () => {
    const maximumScroll = track.scrollWidth - track.clientWidth;
    previousButton.disabled = track.scrollLeft <= 1;
    nextButton.disabled = track.scrollLeft >= maximumScroll - 1;
  };

  previousButton.addEventListener("click", () => {
    track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  });

  nextButton.addEventListener("click", () => {
    track.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
  });

  track.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  updateButtons();
});

const calculatorForm = document.querySelector("#cost-calculator");

if (calculatorForm) {
  const quantityInputs = [...calculatorForm.querySelectorAll("input[data-price]")];
  const totalOutput = calculatorForm.querySelector("#calculator-total");
  const pendingMessage = calculatorForm.querySelector("#calculator-pending");
  const statusMessage = calculatorForm.querySelector("#calculator-status");
  const submitButton = calculatorForm.querySelector('button[type="submit"]');
  const contactButtons = document.createElement("div");
  contactButtons.className = "calculator-contact";
  contactButtons.hidden = true;
  contactButtons.innerHTML = `
    <a href="tel:+447380268355">Call 07380 268 355</a>
    <a href="https://wa.me/447380268355" target="_blank" rel="noopener noreferrer">WhatsApp: 07380 268 355</a>
    <a href="mailto:quote@kitchenezz.co.uk">Email: quote@kitchenezz.co.uk</a>
  `;
  submitButton.insertAdjacentElement("afterend", contactButtons);
  const currency = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  });

  const getQuantities = () => Object.fromEntries(quantityInputs.map((input) => {
      const quantity = Math.max(0, Math.floor(Number(input.value) || 0));
      const maximum = Number(input.max) || quantity;
      const safeQuantity = Math.min(quantity, maximum);

      input.value = safeQuantity;
      return [input.name, safeQuantity];
    }));

  calculatorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(calculatorForm);
    const quantities = getQuantities();
    const total = quantityInputs.reduce(
      (sum, input) => sum + quantities[input.name] * Number(input.dataset.price),
      0
    );

    if (total === 0) {
      statusMessage.textContent = "Please add at least one installation item.";
      statusMessage.classList.remove("is-success");
      statusMessage.classList.add("is-error");
      return;
    }

    totalOutput.value = currency.format(total);
    totalOutput.hidden = false;
    contactButtons.hidden = false;
    pendingMessage.hidden = true;
    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    statusMessage.textContent = "Your estimate is ready. Sending your details to Kitchenezz…";
    statusMessage.classList.remove("is-error", "is-success");

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quantities, phone: formData.get("phone"), company: formData.get("company"), consent: formData.get("consent") === "on" })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "We could not send your estimate.");
      totalOutput.value = currency.format(Number.isFinite(result.total) ? result.total : total);
      totalOutput.hidden = false;
      contactButtons.hidden = false;
      pendingMessage.hidden = true;
      statusMessage.textContent = "Thank you — your details have been sent to Kitchenezz.";
      statusMessage.classList.add("is-success");
    } catch (error) {
      statusMessage.textContent = `${error.message} Your estimate is still shown above.`;
      statusMessage.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Calculate estimate";
    }
  });

  calculatorForm.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      totalOutput.hidden = true;
      contactButtons.hidden = true;
      pendingMessage.hidden = false;
      statusMessage.textContent = "";
      statusMessage.classList.remove("is-error", "is-success");
    });
  });
}

const calculatorContactStyles = document.createElement("style");
calculatorContactStyles.textContent = `.calculator-contact{display:grid;gap:12px;margin-top:18px}.calculator-contact[hidden]{display:none}.calculator-contact a{display:flex;align-items:center;justify-content:center;min-height:56px;padding:10px 18px;background:#2d7d52;color:#fff;border-radius:999px;font-weight:600;text-align:center;transition:.2s ease}.calculator-contact a:hover{background:#246b46;transform:translateY(-1px)}`;
document.head.append(calculatorContactStyles);
