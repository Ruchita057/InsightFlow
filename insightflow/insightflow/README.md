# InsightFlow

**Transform Data into Decisions**

A modern, frontend-only Business Intelligence dashboard built as a portfolio project for Data Analyst / Data Science internships.

## Features

- **Landing page** — Hero, features, how-it-works, CTA, responsive navbar & footer
- **CSV upload** — Drag & drop or browse (Papa Parse)
- **Demo datasets** — Retail Sales, HR Analytics, Netflix Analytics
- **KPI cards** — Auto-detected revenue, profit, orders, customers, etc.
- **Interactive charts** — Line, bar, donut (Chart.js)
- **Data quality panel** — Missing values, duplicates, column types, completeness
- **Smart insights** — Rule-based insight cards (top categories, anomalies, trends)
- **Data explorer** — Search, sort, paginated table
- **Dark / light mode** — Persisted in localStorage
- **Recent uploads** — Metadata saved in localStorage
- **PDF export** — jsPDF report of KPIs, insights & quality
- **Fully responsive** — Mobile-friendly sidebar & layout
- **Premium UI** — Glassmorphism, gradients, micro-interactions (Linear / Stripe / Vercel inspired)

## Tech Stack

| Library     | Purpose              |
|-------------|----------------------|
| Papa Parse  | CSV parsing          |
| Chart.js    | Charts               |
| jsPDF       | PDF export           |
| Vanilla JS  | App logic            |
| CSS Variables | Theming            |

No backend. No build step. Open `index.html` or serve the folder.

## Folder Structure

```
insightflow/
├── index.html          # Landing page
├── dashboard.html      # Analytics dashboard
├── css/
│   ├── styles.css      # Global + landing styles
│   └── dashboard.css   # Dashboard-specific styles
├── js/
│   ├── main.js         # Theme, mobile nav, landing
│   ├── utils.js        # Helpers, theme, quality, storage
│   ├── demo-data.js    # Built-in demo generators
│   ├── insights.js     # Rule-based insights engine
│   └── dashboard.js    # Dashboard controller
├── data/               # (optional) static CSVs
└── README.md
```

## How to Run

1. Open `index.html` in a modern browser, **or**
2. Serve locally:

```bash
npx serve .
# or
python -m http.server 8080
```

Then visit `http://localhost:8080` (or the port shown).

## Demo Datasets

| Dataset           | Rows | Highlights                          |
|-------------------|------|-------------------------------------|
| Retail Sales      | 200  | Revenue, Profit, Category, Region   |
| HR Analytics      | 150  | Salary, Attrition, Department       |
| Netflix Analytics | 180  | Views, Genre, IMDb, Est. Revenue    |

## Accessibility & UX

- Semantic HTML & ARIA labels
- Keyboard-friendly upload zone & table headers
- Loading states & toast notifications
- Error handling for bad CSVs
- Respects `prefers-color-scheme` via manual toggle + persistence

## Author

Built as a B.Sc. Computer Science portfolio project targeting Data Analyst and Data Science internships.

---

© 2026 InsightFlow
