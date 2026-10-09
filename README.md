# TouchGrass AI

TouchGrass AI is a full-stack web application that turns your available time, interests, and preferred difficulty into a practical outdoor mission. It uses the Gemma 3 1B open-weight language model through Ollama to generate personalized activity ideas.

The goal is simple: spend less time sitting indoors and more time exploring the world outside.

##  Features

- **AI-generated missions:** Generate outdoor activities based on your preferences.
- **Flexible duration:** Choose how much time you have available.
- **Interest-based activities:** Get suggestions based on the type of activity you prefer.
- **Difficulty selection:** Choose a difficulty level that suits you.
- **Mission checklist:** Complete the steps of your generated mission.
- **Progress tracking:** Track completed missions and time spent through browser storage.
- **No account required:** Your basic progress is saved locally in your browser.
- **Locally hosted AI:** Generate missions using Gemma through Ollama running on your computer.

##  Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend development server and build tool |
| Tailwind CSS | Styling and responsive design |
| Node.js | JavaScript runtime |
| Express.js | Backend API |
| Gemma 3 1B | AI mission generation |
| Ollama | Runs the language model locally |
| Browser localStorage | Stores basic user progress |

##  Requirements

Before running the project, make sure you have:

- Node.js 20 or later
- npm
- Ollama installed
- Enough available RAM to run the selected model

##  Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/touchgrass-ai.git
cd touchgrass-ai
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Install Ollama and download Gemma

Download Ollama from [https://ollama.com](https://ollama.com).

Open a terminal and run:

```bash
ollama pull gemma3:1b
```

To verify that the model works, run:

```bash
ollama run gemma3:1b
```

After confirming that the model responds, exit the interactive chat.

Ollama normally exposes its local API at:

`http://localhost:11434`

Keep Ollama running while using the application.

### 3. Install project dependencies

Open a terminal in the project root and run:

```bash
npm install
npm run install:all
```

The first command installs the root dependencies. The second installs dependencies for the frontend and backend.

### 4. Start the application

From the project root, run:

```bash
npm run dev
```

Open the frontend URL displayed in the terminal. It will usually be:

`http://localhost:5173`

The Express backend normally runs at:

`http://localhost:5000`

The frontend communicates with the backend through `/api` using the Vite development proxy.

##  How It Works

1. The user selects their available time, activity interest, and preferred difficulty.
2. The React frontend sends these preferences to
## Demo Screenshot

![TouchGrass AI Demo](screenshots/Screenshot%202026-10-09%20151715.png)
