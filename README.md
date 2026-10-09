# TouchGrass AI 🌿

A small full-stack web app that turns a user's available time, interests, and preferred difficulty into a practical outdoor mission. It uses an open-weight Gemma model served locally by Ollama.

## Stack
- React + Vite frontend
- Express backend
- Gemma 3 1B via local Ollama API
- Local browser storage for completed mission count and minutes (no account required)

## Requirements
- Node.js 20+
- Ollama installed
- Enough RAM to run the selected model

## 1. Start the open-weight model
Install Ollama from https://ollama.com, then in a terminal run:

```bash
ollama pull gemma3:1b
ollama run gemma3:1b
```

You can exit the interactive chat after confirming the model starts. Ollama normally serves its API at `http://localhost:11434`.

## 2. Install dependencies
From the project root:

```bash
npm install
npm run install:all
```

## 3. Start the app
From the project root:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, usually http://localhost:5173.

The backend runs on http://localhost:5000. The frontend calls it through `/api` via the Vite proxy.

## How it works
1. The user chooses available time, activity interest, and difficulty.
2. React sends these preferences to the Express API.
3. Express calls the locally running Gemma model through Ollama.
4. The response is parsed and displayed as a mission.
5. The user can mark the mission complete. Basic progress is saved in that browser.

## Troubleshooting
- **“Could not connect to Ollama”**: open Ollama and make sure it is running, then try `ollama run gemma3:1b`.
- **Model not found**: run `ollama pull gemma3:1b`.
- **Port 5000 busy**: change `PORT` in `server/.env` (copy `.env.example` first) and update the Vite proxy in `client/vite.config.js`.
- **No map or verified local recommendations**: this starter creates activity ideas, not navigation directions. Always choose a familiar, public, safe outdoor location and check local conditions yourself.

## Before submitting to a challenge
- Test the app outdoors and include honest notes about what worked and what did not.
- Add your own screenshots/demo video.
- Push this project to your GitHub repository.
- In the DEV.to post, describe the actual model and setup you used. Do not claim offline phone inference: this starter runs Gemma locally on the computer hosting Ollama.
