require("dotenv").config({ quiet: true });

const express = require("express");
const path = require("node:path");
const { Resend } = require("resend");

const app = express();
const port = Number(process.env.PORT) || 3000;
const rootDirectory = __dirname;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const estimatePrices = { cabinets: 150, appliances: 100, worktops: 200 };
const quantityLimits = { cabinets: 100, appliances: 30, worktops: 20 };

const parseQuantity = (value, maximum) => {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 0 && quantity <= maximum ? quantity : null;
};

const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

app.post("/api/estimate", async (request, response) => {
  const body = request.body || {};
  if (body.company) return response.json({ ok: true });

  const phone = String(body.phone || "").trim();
  const phoneDigits = phone.replace(/\D/g, "");
  const quantities = Object.fromEntries(Object.keys(estimatePrices).map((item) => [item, parseQuantity(body[item], quantityLimits[item])]));

  if (body.consent !== true || phoneDigits.length < 10 || phoneDigits.length > 15 || Object.values(quantities).some((quantity) => quantity === null)) {
    return response.status(400).json({ error: "Please enter a valid phone number and quantities." });
  }

  const total = Object.entries(quantities).reduce((sum, [item, quantity]) => sum + quantity * estimatePrices[item], 0);
  if (total === 0) return response.status(400).json({ error: "Please add at least one installation item." });
  if (!resend) return response.status(503).json({ error: "The estimate service is not configured yet. Please call us instead." });

  const recipient = process.env.ESTIMATE_EMAIL_TO || "quote@kitchenezz.co.uk";
  const sender = process.env.ESTIMATE_EMAIL_FROM || "Kitchenezz Website <website@kitchenezz.co.uk>";
  const formattedTotal = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(total);
  const lines = [`Phone: ${phone}`, `Cabinets: ${quantities.cabinets}`, `Appliances: ${quantities.appliances}`, `Worktops: ${quantities.worktops}`, `Estimated installation cost: ${formattedTotal}`];

  try {
    const { error } = await resend.emails.send({
      from: sender,
      to: [recipient],
      subject: `New kitchen estimate enquiry — ${formattedTotal}`,
      text: lines.join("\n"),
      html: `<h2>New kitchen estimate enquiry</h2><p><strong>Phone:</strong> ${escapeHtml(phone)}</p><ul><li>Cabinets: ${quantities.cabinets}</li><li>Appliances: ${quantities.appliances}</li><li>Worktops: ${quantities.worktops}</li></ul><p><strong>Estimated installation cost: ${formattedTotal}</strong></p>`
    });
    if (error) {
      console.error("Resend rejected estimate email:", error.message);
      return response.status(502).json({ error: "We could not send your estimate. Please try again or call us." });
    }
    return response.json({ ok: true, total });
  } catch (error) {
    console.error("Estimate email failed:", error.message);
    return response.status(502).json({ error: "We could not send your estimate. Please try again or call us." });
  }
});

app.get("/", (_request, response) => {
  response.sendFile(path.join(rootDirectory, "index.html"));
});

app.get("/style.css", (_request, response) => {
  response.sendFile(path.join(rootDirectory, "style.css"));
});

app.get("/logo.svg", (_request, response) => {
  response.sendFile(path.join(rootDirectory, "logo.svg"));
});

app.get("/script.js", (_request, response) => {
  response.sendFile(path.join(rootDirectory, "script.js"));
});

app.get("/robots.txt", (_request, response) => {
  response.type("text/plain").sendFile(path.join(rootDirectory, "robots.txt"));
});

app.get("/sitemap.xml", (_request, response) => {
  response.type("application/xml").sendFile(path.join(rootDirectory, "sitemap.xml"));
});

app.use(
  "/assets",
  express.static(path.join(rootDirectory, "assets"), {
    fallthrough: false,
    maxAge: "1d"
  })
);

app.use((_request, response) => {
  response.status(404).send("Page not found");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Kitchenezz is running at http://localhost:${port}`);
});
