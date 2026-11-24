# TimeTrack

Part-time employee hour tracker. Employees clock in/out, hours and pay are calculated automatically, admin manages everything.
Next.js 14 (App Router, JavaScript) · Tailwind · MongoDB Atlas · JWT cookie login · installable PWA.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI` and `JWT_SECRET`
3. `npm run seed` — creates the first admin (uses ADMIN_USERNAME / ADMIN_PASSWORD from `.env.local`)
4. `npm run dev` → http://localhost:3000

## Deploy (Vercel)
Push to GitHub, import in Vercel, add `MONGODB_URI` and `JWT_SECRET` as environment variables.
In MongoDB Atlas > Network Access, allow `0.0.0.0/0` so Vercel can connect.

## Use on phone
Open the site in Chrome (Android) or Safari (iPhone) > "Add to Home Screen".

## Payroll flow
1. Employees clock in/out. Each shift shows **Due** until it is paid.
2. Admin > **Report**: pick an employee and Today / This week / Last week / This month / Last month / custom dates. Hours, earned, paid and due are shown.
3. Tap **Pay** on an employee, add an optional bonus or deduction, choose **Cash / bKash / Nagad** (+ transaction ID) and confirm. Those shifts become **Paid** and are locked.
4. Admin > **Payments**: history, totals per method, printable receipts, and **Undo** (shifts go back to Due).
5. Employees see Paid/Due on every shift, their total due, and their payment history. Everyone can change their own password.

## Good to know
- Pay week starts on Saturday. Change `WEEK_START` in `lib/utils.js` (0 = Sun ... 6 = Sat).
- Currency symbol: `CURRENCY` in `lib/utils.js`.
- Each shift stores the rate it started with, so changing an hourly rate never alters past pay.
- Start/End times come from the server clock, not the phone.
