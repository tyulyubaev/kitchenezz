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
    window.gtag_report_conversion();

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

const consentStorageKey = "kitchenezz_analytics_consent";
const cookieBanner = document.querySelector("#cookie-banner");
const acceptAnalyticsButton = document.querySelector("#cookie-accept");
const rejectAnalyticsButton = document.querySelector("#cookie-reject");
const cookieSettingsButton = document.querySelector("#cookie-settings");
let analyticsLoaded = false;

const readConsentChoice = () => {
  try {
    return localStorage.getItem(consentStorageKey);
  } catch (_error) {
    return null;
  }
};

const saveConsentChoice = (choice) => {
  try {
    localStorage.setItem(consentStorageKey, choice);
  } catch (_error) {
    // Continue without persistence when browser storage is unavailable.
  }
};

window.gtag_report_conversion = (url) => {
  const callback = () => {
    if (typeof url !== "undefined") window.location = url;
  };

  if (
    analyticsLoaded &&
    readConsentChoice() === "granted" &&
    typeof window.gtag === "function"
  ) {
    window.gtag("event", "conversion", {
      send_to: "AW-17024632888/fMFyCJ_kt_ccELiQ_bU_",
      value: 1.0,
      currency: "GBP",
      event_callback: callback
    });
  }

  return false;
};

const setConsentControls = (showBanner) => {
  if (!cookieBanner || !cookieSettingsButton) return;
  cookieBanner.hidden = !showBanner;
  cookieSettingsButton.hidden = showBanner;
};

const loadGoogleTag = () => {
  if (document.querySelector('script[data-google-tag="AW-17024632888"]')) return;

  window.gtag("consent", "update", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted"
  });
  window.gtag("js", new Date());
  window.gtag("config", "AW-17024632888");

  const googleTag = document.createElement("script");
  googleTag.async = true;
  googleTag.src = "https://www.googletagmanager.com/gtag/js?id=AW-17024632888";
  googleTag.dataset.googleTag = "AW-17024632888";
  document.head.append(googleTag);
};

const loadClarity = () => {
  if (document.querySelector('script[data-clarity-tag="yi4dcro9nm"]')) return;

  window.clarity = window.clarity || function clarityQueue() {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };
  window.clarity("consentv2", {
    ad_Storage: "granted",
    analytics_Storage: "granted"
  });

  const clarityTag = document.createElement("script");
  clarityTag.async = true;
  clarityTag.src = "https://www.clarity.ms/tag/yi4dcro9nm";
  clarityTag.dataset.clarityTag = "yi4dcro9nm";
  document.head.append(clarityTag);
};

const enableAnalytics = () => {
  analyticsLoaded = true;
  calculatorForm?.setAttribute("data-clarity-mask", "true");
  loadGoogleTag();
  loadClarity();
};

acceptAnalyticsButton?.addEventListener("click", () => {
  saveConsentChoice("granted");
  enableAnalytics();
  setConsentControls(false);
});

rejectAnalyticsButton?.addEventListener("click", () => {
  saveConsentChoice("denied");
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  });
  window.clarity?.("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: "denied"
  });

  if (analyticsLoaded) {
    window.location.reload();
    return;
  }

  setConsentControls(false);
});

cookieSettingsButton?.addEventListener("click", () => setConsentControls(true));

const savedConsentChoice = readConsentChoice();
if (savedConsentChoice === "granted") {
  enableAnalytics();
  setConsentControls(false);
} else if (savedConsentChoice === "denied") {
  setConsentControls(false);
} else {
  setConsentControls(true);
}
