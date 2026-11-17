# InsightFlow

Transform Data into Decisions — a frontend-only Business Intelligence dashboard for CSV analytics.

## Description

InsightFlow is a modern, browser-based analytics app that turns any CSV into KPIs, interactive charts, data-quality reports, and rule-based smart insights. Upload your own file or use built-in demos (Retail Sales, HR Analytics, Netflix Analytics). Everything runs client-side with no backend, no signup, and no data leaving your device. Built as a Data Science portfolio project with a premium UI inspired by Linear, Stripe, and Vercel.

## Getting Started

### Dependencies

* A modern web browser (Chrome, Edge, Firefox, or Safari)
* Internet connection (Papa Parse, Chart.js, and jsPDF load from CDNs)
* Optional: Node.js (for `npx serve`) or Python 3 (for a simple local server)

### Installing

* Clone or download this repository
* No package install required — pure HTML, CSS, and JavaScript
* Unzip the project folder if you downloaded a ZIP

```bash
git clone https://github.com/Ruchita057/insightflow.git
cd insightflow
```

### Executing program

* **Option A — Open directly:** double-click `index.html`
* **Option B — Local server (recommended):**

```bash
npx serve .
```

or:

```bash
python -m http.server 8080
```

* Open the URL shown in the terminal (e.g. `http://localhost:3000` or `http://localhost:8080`)
* Click **Launch App** or open `dashboard.html` — Retail demo loads automatically
* Switch demos or upload your own CSV from the dashboard

## Help

* **Page shows “No data loaded yet”** — Click a demo chip (Retail / HR / Netflix) or upload a CSV. Opening the dashboard auto-loads Retail Sales.
* **ERR_EMPTY_RESPONSE on Live Server** — Stop Live Server and use `npx serve .` or open `index.html` directly.
* **Charts missing** — Check your internet connection; Chart.js is loaded from a CDN.
* **CSV won’t parse** — Use a valid `.csv` with a header row. Empty files will show an error toast.
* **Theme not saving** — Ensure the browser allows `localStorage` for that site.

## Authors

* Ruchita
* [@Ruchita057](https://github.com/Ruchita057)

## Version History

* 1.0
  * Initial portfolio release
  * Landing page, dashboard, demos, KPIs, charts, insights, quality panel, PDF export
  * Dark/light mode and recent-upload metadata

* 0.1
  * Initial development build

## License

This project is licensed under the MIT License — see the LICENSE file for details.

## Acknowledgments

* [Papa Parse](https://www.papaparse.com/) — CSV parsing
* [Chart.js](https://www.chartjs.org/) — charts
* [jsPDF](https://github.com/parallax/jsPDF) — PDF export
* UI inspiration from Linear, Stripe, and Vercel
* [awesome-readme](https://github.com/matiassingers/awesome-readme) — README structure ideas
