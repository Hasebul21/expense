# Expense Tracker

A personal website for tracking your monthly expenses and visualizing where your money goes.

## Features

- ➕ Add expenses with amount, category, date, and an optional note
- 📊 **Bar chart** of total expense per month (last 12 months)
- 🥧 **Pie chart** breaking down the selected month's spending by category
- 📅 Month selector to review any month's transactions
- 💵 Summary cards: monthly total, transaction count, all-time total
- 🔒 100% private — data is stored in your browser's `localStorage`, nothing is sent to a server
- 💱 Switchable currency symbol

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Recharts](https://recharts.org) for charts

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for production

```bash
npm run build
npm start
```

## Deploy

The app is a static-friendly Next.js project and deploys to [Vercel](https://vercel.com) with zero configuration — just import the repo.
