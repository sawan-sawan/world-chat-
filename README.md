# World Chat

A small WhatsApp-style realtime chat app built with React, Vite, Node, Express, and Socket.IO.

## Run locally

```bash
npm install
npm run dev
```

Open the frontend on your computer:

```text
http://localhost:5173
```

To test from two phones on the same Wi-Fi, use your computer's local network IP:

```text
http://YOUR_COMPUTER_IP:5173
```

Both phones should enter the same room code.

## Chat with someone in another country

Localhost only works on your own machine. For real global chat, deploy both parts:

### Recommended deployment

Deploy this project as two services:

1. Backend: Render Web Service
2. Frontend: Vercel Vite app

### 1. Push to GitHub

Create a GitHub repository and push this folder.

### 2. Deploy backend on Render

Create a new Render Web Service from the same GitHub repo.

Use these settings:

```text
Name: world-chat-backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

Add this environment variable after the frontend is deployed:

```bash
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
```

Render will also provide its own `PORT` automatically.

### 3. Deploy frontend on Vercel

Import the same GitHub repo in Vercel.

Use these settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Set this Vercel environment variable:

```bash
VITE_SOCKET_URL=https://your-backend-domain.com
```

Example:

```bash
VITE_SOCKET_URL=https://world-chat-backend.onrender.com
```

After changing Vercel environment variables, redeploy the frontend.

### Production note

This demo stores room messages in memory, so messages disappear when the server restarts. For production, add a database, user accounts, encryption, media uploads, and push notifications.
