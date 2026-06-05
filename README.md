# ATS Intelligence — Deployment Guide

## Project Structure
```
ats-intelligence/
├── api/
│   └── analyze.js        ← Vercel serverless function (calls Anthropic)
├── public/
│   └── index.html        ← Your full website
├── vercel.json           ← Vercel routing config
├── package.json
└── README.md
```

## Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub
1. Go to github.com → New repository → name it `ats-intelligence`
2. On your computer, open terminal in this folder and run:
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ats-intelligence.git
git push -u origin main
```

### Step 2 — Connect to Vercel
1. Go to vercel.com → Sign up with GitHub
2. Click "Add New Project"
3. Import your `ats-intelligence` repository
4. Click "Deploy" (leave all settings as default)

### Step 3 — Add your Anthropic API key
1. In Vercel dashboard → Your project → Settings → Environment Variables
2. Add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-your-actual-key-here`
3. Click Save
4. Go to Deployments → click the 3 dots → Redeploy

### Step 4 — Add your Vercel domain to Firebase
1. Firebase Console → Authentication → Settings → Authorized Domains
2. Add your Vercel domain e.g. `ats-intelligence.vercel.app`
3. Done!

Your site is now live at `https://ats-intelligence.vercel.app`

## Environment Variables
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com |

## Firebase is already configured
Firebase Phone Auth config is baked into the HTML — no changes needed.
