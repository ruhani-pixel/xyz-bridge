# RD Models — WhatsApp Bridge Control Panel

The ultimate bridge server connecting **RD Models** with its clients via WhatsApp (MSG91) and Chatwoot. This middleware enables a seamless flow of communication with a high-performance admin dashboard.

## Features

- **Bidirectional Messaging**: WhatsApp → MSG91 → Bridge → Chatwoot (and back)
- **Admin Dashboard**: Real-time stats, message logs, conversation viewer
- **DB-Backed Config**: API keys managed from the dashboard (no redeploy needed)
- **Role-Based Access**: Superadmin, Admin, Agent, Viewer roles
- **Firebase Integration**: Auth (Google Sign-In), Firestore (real-time data), Analytics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google)
- **Styling**: Tailwind CSS (Dark glassmorphism theme)
- **Charts**: Recharts
- **Hosting**: Vercel

## Setup

1. Clone this repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Firebase credentials
4. Run `npm run dev`
5. Deploy to Vercel and configure MSG91/Chatwoot webhooks from the Settings page

## Environment Variables

See `.env.example` for a complete list. Only Firebase credentials are needed in `.env.local` — MSG91 and Chatwoot keys are configured through the admin dashboard.

## License

Private — All rights reserved.
