# KapMarkets

The landing page + a tiny server that emails every lead straight to your inbox. No third-party form service.

## What's inside
- `public/index.html` — the page (two-step opt-in: contact details, then "tell us about your business")
- `server.js` — serves the page and sends each submission to your Gmail
- `package.json` — dependencies (express, nodemailer)

Every submission sends an email to **kapmarkets@gmail.com**. The lead's own email is set as the reply-to, so you can reply straight to the prospect.

---

## Setup (one-time, ~5 minutes)

### 1. Get a Gmail App Password
The server logs into Gmail to send mail. Gmail needs an **App Password** (not your normal password):

1. Turn on 2-Step Verification for kapmarkets@gmail.com → https://myaccount.google.com/security
2. Go to https://myaccount.google.com/apppasswords
3. Create a password (name it "KapMarkets"), copy the 16-character code.

### 2. Push to GitHub, deploy on Railway
1. Push this folder to a new GitHub repo.
2. In Railway → **New Project → Deploy from GitHub repo** → pick the repo.
3. Railway auto-detects Node, runs `npm install`, then `npm start`.

### 3. Add your environment variables in Railway
Railway → your service → **Variables** → add these three:

```
GMAIL_USER=kapmarkets@gmail.com
GMAIL_APP_PASSWORD=the-16-char-code-from-step-1
TO_EMAIL=kapmarkets@gmail.com
```

Railway redeploys automatically. That's it — the form is live and emailing you.

### 4. Point your domain
Railway → your service → **Settings → Networking → Custom Domain** → add `kapmarkets.com`.
Railway shows a CNAME record; add it at your domain registrar. Done.

---

## Run it locally first (optional)
```
npm install
GMAIL_USER=kapmarkets@gmail.com GMAIL_APP_PASSWORD=xxxx TO_EMAIL=kapmarkets@gmail.com npm start
```
Open http://localhost:3000 and submit the form — check your inbox.

## Notes
- Never commit real passwords. `.gitignore` already excludes `.env` and `node_modules/`.
- The page also keeps a local backup of submissions in the visitor's browser as a fallback; the email is the real delivery.
