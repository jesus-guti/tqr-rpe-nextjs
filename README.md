# TQR-RPE Form Application

A modern web application for collecting, managing, and analyzing player wellness and training data (TQR, RPE, recovery, soreness, energy) for sports teams. Data is stored in a database and can be automatically synced to Google Sheets for further analysis and reporting.

---

## 🚀 Features

- **Player Self-Reporting**: Players submit daily pre- and post-training forms (TQR, RPE, soreness, energy, recovery).
- **Coach/Admin Dashboard**: Manage players, view and export data, and sync to Google Sheets.
- **Google Sheets Integration**: Syncs all player data to a Google Sheet in a format compatible with sports science workflows.
- **Microcycle Management**: Organize and analyze data by weekly microcycles.
- **Modern UI/UX**: Built with Next.js, React, Tailwind CSS, and Shadcn UI components.
- **Secure & Scalable**: Uses Prisma ORM, PostgreSQL (Supabase), and supports Docker deployment.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL (Supabase)
- **Integrations**: Google Sheets API
- **Dev Tools**: ESLint, Prettier, Jest, React Testing Library, Docker, pnpm

---

## ⚡ Quick Start

1. **Clone the repo:**
   ```sh
   git clone <repo-url>
   cd tqr-rpe-form-nextjs
   ```
2. **Install dependencies:**
   ```sh
   pnpm install
   ```
3. **Configure environment:**
   - Copy `.env.example` to `.env.local` and fill in your database and Google Sheets credentials (see [Google Sheets Integration Setup](./GOOGLE_SHEETS_SETUP.md)).
4. **Run database migrations:**
   ```sh
   pnpm db:generate
   pnpm db:push
   ```
5. **Start the dev server:**
   ```sh
   pnpm dev
   ```
6. **Access the app:**
   - Open [http://localhost:3000](http://localhost:3000)

---

## 📊 Google Sheets Integration

- Automatically syncs all player data to a Google Sheet for easy analysis and reporting.
- See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for detailed setup instructions.
- API endpoints:
  - `POST /api/sheets/create` — Create a new spreadsheet
  - `POST /api/sheets/sync` — Sync all player data to Google Sheets

---

## 🧑‍💻 Development

- **Code Quality**: ESLint, Prettier, Airbnb style guide
- **Testing**: Jest, React Testing Library
- **Type Safety**: TypeScript everywhere
- **CI/CD**: Ready for GitHub Actions, Docker, and Vercel/Netlify deployment

---

## 🐞 Troubleshooting

- **Google Sheets errors**: Double-check your credentials, spreadsheet ID, and sheet/tab names.
- **Database issues**: Ensure your PostgreSQL/Supabase instance is running and credentials are correct.
- **.env issues**: Never commit `.env.local` to version control. Check for typos and correct formatting.
- See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for more help.

---

## 🤝 Contributing

1. Fork the repo and create your feature branch (`git checkout -b feature/my-feature`)
2. Commit your changes (`git commit -am 'Add new feature'`)
3. Push to the branch (`git push origin feature/my-feature`)
4. Open a Pull Request

---

## 📄 License

MIT
