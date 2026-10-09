import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 5000);
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://localhost:11434").replace(
  /\/+$/,
  "",
);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:1b";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    model: OLLAMA_MODEL,
    ollamaUrl: OLLAMA_URL,
  });
});

// Safely handle text returned by the model
function safeString(value, fallback, maxLength = 200) {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, maxLength) || fallback;
}

// Remove labels accidentally included in activity steps
function cleanStep(step) {
  if (typeof step !== "string") return "";

  return step
    .replace(/^\s*(?:step\s*)?\d+\s*[:.)-]\s*/i, "")
    .replace(/^\s*(?:safety\s*tip|safety\s*reminder|safetytip)\s*:\s*/i, "")
    .replace(/^\s*(?:reflection|reflection\s*question)\s*:\s*/i, "")
    .trim();
}

// Fallback mission if the model response cannot be parsed
function fallbackMission(preferences) {
  return {
    title: "Your Outdoor Reset",
    duration: `${preferences.minutes} minutes`,
    intro: "Take a break from your screen and enjoy a little time outdoors.",
    steps: [
      "Choose a familiar, public outdoor place.",
      "Spend a few minutes noticing the sounds, colors, plants, or sky.",
      "Walk at a comfortable pace and enjoy your surroundings.",
    ],
    safetyTip:
      "Choose a familiar public place, check local conditions, and stay aware of your surroundings.",
    reflection: "What was one thing you noticed outside?",
  };
}

// Validate and organize the model response
function parseModelResponse(raw, preferences) {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (!data || typeof data !== "object") {
      return fallbackMission(preferences);
    }

    const steps = [];
    let safetyTip = safeString(
      data.safetyTip,
      "Choose a familiar public place and watch your footing.",
      240,
    );

    let reflection = safeString(
      data.reflection,
      "What did you notice outside that you usually miss?",
      180,
    );

    if (Array.isArray(data.steps)) {
      for (const item of data.steps) {
        if (typeof item !== "string") continue;

        const original = item.trim();

        const safetyMatch = original.match(
          /^(?:safety\s*tip|safety\s*reminder|safetytip)\s*:\s*(.+)$/i,
        );

        if (safetyMatch) {
          safetyTip = safetyMatch[1].trim().slice(0, 240);
          continue;
        }

        const reflectionMatch = original.match(
          /^(?:reflection|reflection\s*question)\s*:\s*(.+)$/i,
        );

        if (reflectionMatch) {
          reflection = reflectionMatch[1].trim().slice(0, 180);
          continue;
        }

        const step = cleanStep(original);

        if (
          step &&
          !/^safety\s*tip\s*:/i.test(step) &&
          !/^safety\s*reminder\s*:/i.test(step) &&
          !/^safetytip\s*:/i.test(step) &&
          !/^reflection(?:\s*question)?\s*:/i.test(step)
        ) {
          steps.push(step.slice(0, 200));
        }
      }
    }

    if (steps.length === 0) {
      return fallbackMission(preferences);
    }

    return {
      title: safeString(data.title, "Your Outdoor Mission", 80),
      duration: `${preferences.minutes} minutes`,
      intro: safeString(
        data.intro,
        "A simple mission to help you spend time outdoors.",
        240,
      ),
      steps: steps.slice(0, 5),
      safetyTip,
      reflection,
    };
  } catch (error) {
    console.error("Could not parse Gemma response:", error.message);
    return fallbackMission(preferences);
  }
}

// Check whether Ollama is reachable
app.get("/api/ollama-health", async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: "Ollama returned an unsuccessful response.",
      });
    }

    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models : [];

    return res.json({
      ok: true,
      modelConfigured: OLLAMA_MODEL,
      modelInstalled: models.some(
        (model) =>
          model.name === OLLAMA_MODEL ||
          model.name?.startsWith(`${OLLAMA_MODEL}:`),
      ),
      models: models.map((model) => model.name),
    });
  } catch (error) {
    console.error("Ollama health check failed:", error.message);

    return res.status(503).json({
      ok: false,
      error: "Cannot connect to Ollama.",
      details: error.message,
    });
  }
});

// Generate an outdoor mission
app.post("/api/missions", async (req, res) => {
  const minutes = Number(req.body?.minutes);
  const allowedMinutes = [10, 20, 30, 45, 60];

  const preferences = {
    minutes: allowedMinutes.includes(minutes) ? minutes : 30,
    interest: safeString(req.body?.interest, "nature", 60),
    difficulty: ["easy", "moderate", "challenging"].includes(
      req.body?.difficulty,
    )
      ? req.body.difficulty
      : "easy",
  };

  const prompt = `
You are TouchGrass AI, a practical outdoor activity planner.

Create one safe, low-cost outdoor mission.

USER PREFERENCES:
- Available time: ${preferences.minutes} minutes
- Interest: ${preferences.interest}
- Difficulty: ${preferences.difficulty}

RULES:
1. Return only valid JSON, with no Markdown or code fences.
2. Include exactly these keys: title, intro, steps, safetyTip, reflection.
3. The steps field must contain 3 to 5 short, actionable strings.
4. Keep the mission achievable within the available time.
5. Never put safety advice or reflection questions in steps.
6. Suggest familiar, public outdoor places.
7. Do not invent nearby locations, weather, opening hours, or routes.
8. Never suggest trespassing, touching unknown plants, approaching wildlife, or dangerous activities.
9. Use friendly, simple English.
10. Make the mission specific to the selected interest.
11. Put safety advice only in safetyTip.
12. Put one reflection question only in reflection.

Return JSON in this structure:
{
  "title": "A short, creative mission title",
  "intro": "A friendly introduction.",
  "steps": [
    "Choose a suitable public outdoor place.",
    "Observe something interesting around you.",
    "Spend a few minutes enjoying the activity."
  ],
  "safetyTip": "Choose a familiar public place and watch your footing.",
  "reflection": "What did you notice outside?"
}
`;

  try {
    console.log("Generating mission with Ollama:", {
      model: OLLAMA_MODEL,
      preferences,
    });

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.3,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const details = await response.text();

      console.error("Ollama returned an error:", details);

      return res.status(502).json({
        error: "The local AI model could not generate a mission.",
        details: details.slice(0, 300),
        hint: `Check that Ollama is running and "${OLLAMA_MODEL}" is installed.`,
      });
    }

    const result = await response.json();

    if (typeof result.response !== "string" || !result.response.trim()) {
      console.error("Ollama returned an empty response:", result);

      return res.status(502).json({
        error: "Ollama returned an empty response.",
        hint: "Try generating the mission again.",
      });
    }

    const mission = parseModelResponse(result.response, preferences);

    return res.json({
      ok: true,
      model: OLLAMA_MODEL,
      preferences,
      mission,
    });
  } catch (error) {
    console.error("Mission generation failed:", error);

    const isTimeout =
      error.name === "TimeoutError" || error.name === "AbortError";

    return res.status(isTimeout ? 504 : 503).json({
      error: isTimeout
        ? "The AI model took too long to respond."
        : "Could not connect to Ollama.",
      details: error.message,
      hint: `Check that Ollama is running at ${OLLAMA_URL} and "${OLLAMA_MODEL}" is installed.`,
    });
  }
});

// Handle unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({
    error: "API route not found.",
  });
});

app.listen(PORT, () => {
  console.log(`TouchGrass AI API running at http://localhost:${PORT}`);
  console.log(`Ollama URL: ${OLLAMA_URL}`);
  console.log(`Ollama model: ${OLLAMA_MODEL}`);
});
