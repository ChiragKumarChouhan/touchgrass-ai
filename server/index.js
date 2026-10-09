import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 5000);
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://localhost:11434").replace(
  /\/$/,
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

// Validate and organize the model's response
function parseModelResponse(raw, preferences) {
  const cleaned = String(raw || "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start >= 0 && end > start) {
    try {
      const data = JSON.parse(cleaned.slice(start, end + 1));

      // Clean activity steps and remove misplaced safety/reflection labels
      const rawSteps = Array.isArray(data.steps) ? data.steps : [];

      let safetyTip = safeString(
        data.safetyTip,
        "Choose a familiar public place and stay aware of your surroundings.",
        240,
      );

      let reflection = safeString(
        data.reflection,
        "What did you notice outside that you usually miss?",
        180,
      );

      const steps = [];

      for (const item of rawSteps) {
        if (typeof item !== "string") continue;

        const original = item.trim();

        // Recover safety advice if the model placed it in the steps array
        const safetyMatch = original.match(
          /^(?:safety\s*tip|safety\s*reminder|safetytip)\s*:\s*(.+)$/i,
        );

        if (safetyMatch) {
          safetyTip = safetyMatch[1].trim();
          continue;
        }

        // Recover reflection questions if placed in the steps array
        const reflectionMatch = original.match(
          /^(?:reflection|reflection\s*question)\s*:\s*(.+)$/i,
        );

        if (reflectionMatch) {
          reflection = reflectionMatch[1].trim();
          continue;
        }

        const step = cleanStep(original);

        if (
          step &&
          !/^safety\s*tip\s*:/i.test(step) &&
          !/^safety\s*reminder\s*:/i.test(step) &&
          !/^reflection(?:\s*question)?\s*:/i.test(step)
        ) {
          steps.push(step);
        }
      }

      if (steps.length > 0) {
        return {
          title: safeString(data.title, "Your outdoor mission", 80),
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
      }
    } catch {
      // Use the safe fallback below if the model returns invalid JSON.
    }
  }

  // Fallback when the model response cannot be parsed
  return {
    title: "Your outdoor mission",
    duration: `${preferences.minutes} minutes`,
    intro: "Take a short break outdoors and notice what is around you.",
    steps: [
      "Choose a familiar, public outdoor place.",
      "Spend a few minutes noticing sounds, colors, plants, or the sky.",
      "Walk at a comfortable pace and return safely.",
    ],
    safetyTip:
      "This is an AI-generated suggestion, not verified local guidance. Check weather and local conditions.",
    reflection: "What was one thing you noticed outside?",
  };
}

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

Create ONE safe, low-cost outdoor mission that encourages the user
to leave their screen and spend time in the real world.

USER PREFERENCES:
- Available time: ${preferences.minutes} minutes
- Interest: ${preferences.interest}
- Difficulty: ${preferences.difficulty}

STRICT RULES:
1. Return ONLY valid JSON. Do not include Markdown or code fences.
2. Return exactly these five keys:
   title, intro, steps, safetyTip, reflection.
3. The steps value must be an array of 3 to 5 short strings.
4. Every step must describe an actionable outdoor activity.
5. NEVER put safety advice or reflection questions in the steps array.
6. NEVER write labels such as "Step 1:", "SafetyTip:", or
   "Reflection:" inside any step.
7. Put all safety advice ONLY in the safetyTip field.
8. Put one reflection question ONLY in the reflection field.
9. Do not repeat the safety tip or reflection in other fields.
10. Keep the mission achievable within the available time.
11. Use friendly, simple English.
12. Suggest public, familiar outdoor places.
13. Do not invent nearby locations, weather, opening hours, or routes.
14. Never suggest trespassing, touching unknown plants,
    approaching wildlife, or doing anything dangerous.
15. Make the mission specific to the user's selected interest.

REQUIRED JSON STRUCTURE:
{
  "title": "A short, creative mission title",
  "intro": "A friendly introduction in one or two sentences.",
  "steps": [
    "Choose a suitable public outdoor place.",
    "Observe something interesting around you.",
    "Spend a few minutes enjoying the activity."
  ],
  "safetyTip": "Choose a familiar public place and watch your footing.",
  "reflection": "What did you notice outside that you usually miss?"
}

The examples above show the structure only. Create a NEW mission
based on the user's preferences. Return valid JSON only.
`;

  try {
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

      return res.status(502).json({
        error: "The local AI model could not generate a mission.",
        details: details.slice(0, 300),
        hint: `Check that Ollama is running and "${OLLAMA_MODEL}" is installed.`,
      });
    }

    const result = await response.json();

    const mission = parseModelResponse(result.response || "", preferences);

    return res.json({
      ok: true,
      model: OLLAMA_MODEL,
      preferences,
      mission,
    });
  } catch (error) {
    const isTimeout = error?.name === "TimeoutError";

    return res.status(503).json({
      error: isTimeout
        ? "The AI model took too long to respond."
        : "Could not connect to Ollama.",
      hint: `Start Ollama and make sure "${OLLAMA_MODEL}" is installed.`,
      details:
        "This application uses a model running locally on the computer hosting the backend.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`TouchGrass AI API running at http://localhost:${PORT}`);
  console.log(`Ollama model: ${OLLAMA_MODEL}`);
});
