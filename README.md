# Kitchenezz

Node.js website for **kitchenezz.co.uk**, focused on independent Wren kitchen installation services in London.

## Run locally

Install the dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

For production, set the optional `PORT` environment variable and run:

```bash
npm start
```

## Project structure

- `server.js` — Express web server
- `index.html` — website content
- `style.css` — website styling
- `assets/` — website images

> GitHub Pages only hosts static files and cannot run the Node.js server. Deploy the Node.js app with a Node-compatible hosting provider.

## Deploy on Render

The repository includes a `render.yaml` Blueprint. In Render, create a new Blueprint from this GitHub repository and enter the three requested secret environment variables:

- `RESEND_API_KEY`
- `ESTIMATE_EMAIL_TO`
- `ESTIMATE_EMAIL_FROM`

Render installs dependencies with `npm ci`, starts the app with `npm start`, and checks `/health`. Test the generated `onrender.com` address before connecting the custom domain.

## Deploy on Vercel

Vercel serves the website files statically and deploys `api/estimate.js` as a serverless function. Import the GitHub repository with Framework Preset set to **Other**, leave the Root Directory blank, and add these Production environment variables:

- `RESEND_API_KEY`
- `ESTIMATE_EMAIL_TO`
- `ESTIMATE_EMAIL_FROM`

## Next updates

- Add genuine project photos
- Add genuine customer reviews
- Add dedicated Kitchenezz email / WhatsApp contact
- Connect `kitchenezz.co.uk`
- Add analytics and Search Console after launch
