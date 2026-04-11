# Ledger Finance Dashboard

This project is a personal finance dashboard built with Next.js and React.

## New Feature: Firestore Cloud Sync

The app now supports cloud sync using Firebase Firestore.
This lets you store one shared dashboard state in the cloud and load the same data from another device using a shared sync ID.

## Setup

1. Create a Firebase project at https://console.firebase.google.com.
2. Add a web app to the project.
3. Enable Firestore in test mode for development.
4. Copy your Firebase config values.

## Environment Variables

Create a `.env.local` file at the project root with the following values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## How to Use Cloud Sync

### Step 1: Save Your Dashboard
1. Open the app on your primary device (laptop or mobile)
2. Click the **`Sync`** button in the top-right navbar
3. Click **"Generate ID"** to create a unique sync code
4. Copy the ID (or it's displayed in the sync modal)
5. Click **"Save to Cloud"** to upload your dashboard data

### Step 2: Load on Another Device
1. Open the app on your second device (mobile or laptop)
2. Click the **`Sync`** button in the navbar
3. Paste the sync ID you copied earlier
4. Click **"Load from Cloud"**
5. Your dashboard data will sync instantly

### Pro Tips
- You can use the same sync ID on multiple devices
- The sync ID is the only thing needed to share data — keep it safe if using untrusted devices
- Data syncs include entries, goal, currency, and all settings

---

## What is synced

- All entries (Web2 + Web3)
- Goal
- Currency
- Hide balances setting
- Current mode (Web2/Web3)

## Commands

- `npm install`
- `npm run dev`
- `npm run build`

## Notes

- Firestore sync is a lightweight free option for cross-device data sharing.
- The sync ID is the only shared secret: anyone with the same ID can load the dashboard data.
- This is intended for prototype/demo use only.
- **Mobile Navbar:** Optimized for smaller screens — theme and mode toggles are hidden on mobile to maximize space.
