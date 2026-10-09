import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Compass,
  Footprints,
  Leaf,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Trees,
} from "lucide-react";

import { useEffect, useState } from "react";

const HISTORY_KEY = "touchgrass-history";
const PROGRESS_KEY = "touchgrass-progress";

const interests = [
  {
    value: "nature",
    label: "Nature",
    icon: Trees,
    note: "Notice the little things",
  },
  {
    value: "walking",
    label: "Walking",
    icon: Footprints,
    note: "Move at your own pace",
  },
  {
    value: "mindfulness",
    label: "Mindfulness",
    icon: Sun,
    note: "Slow down and reset",
  },
  {
    value: "photography",
    label: "Photography",
    icon: Compass,
    note: "Find a fresh perspective",
  },
  {
    value: "gardening",
    label: "Gardening",
    icon: Sprout,
    note: "Connect with plants",
  },
  {
    value: "birdwatching",
    label: "Birdwatching",
    icon: Leaf,
    note: "Listen and observe",
  },
];

const timeOptions = [10, 20, 30, 45, 60];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readProgress() {
  const value = readStorage(PROGRESS_KEY, {
    completed: 0,
    minutes: 0,
  });

  return {
    completed: Number(value?.completed) || 0,
    minutes: Number(value?.minutes) || 0,
  };
}

function readHistory() {
  const value = readStorage(HISTORY_KEY, []);
  return Array.isArray(value) ? value : [];
}

export default function App() {
  const [minutes, setMinutes] = useState(30);
  const [interest, setInterest] = useState("nature");
  const [difficulty, setDifficulty] = useState("easy");

  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState([]);

  const [progress, setProgress] = useState(readProgress);
  const [history, setHistory] = useState(readHistory);

  // Save progress and history whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      console.error("Could not save progress.");
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      console.error("Could not save mission history.");
    }
  }, [history]);

  async function generateMission(event) {
    event?.preventDefault();

    setLoading(true);
    setError("");
    setMission(null);
    setCompleted(false);
    setCheckedSteps([]);

    try {
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          minutes,
          interest,
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.hint
            ? `${data.error} ${data.hint}`
            : data.error || "Could not generate a mission.",
        );
      }

      if (!data.mission || !Array.isArray(data.mission.steps)) {
        throw new Error(
          "The AI returned an invalid mission. Please try again.",
        );
      }

      setMission(data.mission);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Record a mission only after every step is checked.
  function finishMission() {
    if (
      completed ||
      !mission ||
      !Array.isArray(mission.steps) ||
      mission.steps.length === 0 ||
      checkedSteps.length !== mission.steps.length
    ) {
      return;
    }

    const completedMission = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: mission.title,
      interest,
      duration: minutes,
      completedAt: new Date().toISOString(),
    };

    setHistory((oldHistory) => [completedMission, ...oldHistory]);

    setProgress((old) => ({
      completed: old.completed + 1,
      minutes: old.minutes + minutes,
    }));

    setCompleted(true);
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "Reset your progress statistics? Your mission history will be kept.",
    );

    if (!confirmed) return;

    setProgress({
      completed: 0,
      minutes: 0,
    });
  }

  function clearHistory() {
    const confirmed = window.confirm(
      "Delete all your saved mission history? This cannot be undone.",
    );

    if (confirmed) {
      setHistory([]);
    }
  }

  const activeInterest = interests.find((item) => item.value === interest);

  const allStepsChecked =
    mission &&
    mission.steps.length > 0 &&
    checkedSteps.length === mission.steps.length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="TouchGrass AI home">
          <span className="brand-mark">
            <Sprout size={22} strokeWidth={2.2} />
          </span>
          <span>
            touchgrass<span className="brand-ai">.ai</span>
          </span>
        </a>

        <div className="topbar-right">
          <span className="open-badge">
            <span className="status-dot" />
            Open AI project
          </span>

          <a className="nav-link" href="#how-it-works">
            How it works <ArrowDownRight size={15} />
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />A LITTLE LESS SCROLLING, A LITTLE
              MORE LIVING
            </div>

            <h1>
              Make room
              <br />
              for <span className="headline-accent">outside.</span>
            </h1>

            <p className="hero-description">
              A small nudge toward a better kind of screen time. Get a simple,
              personalized outdoor mission and take it into the real world.
            </p>

            <div className="hero-meta">
              <span>
                <Clock3 size={16} /> 10–60 minutes
              </span>
              <span>
                <Leaf size={16} /> Made for real life
              </span>
            </div>

            <a className="text-link" href="#planner">
              Plan a little adventure <ArrowRight size={17} />
            </a>
          </div>

          <div
            className="hero-art"
            role="img"
            aria-label="Illustration of a sunny outdoor landscape"
          >
            <div className="sun-disc" />
            <div className="hill hill-back" />
            <div className="hill hill-front" />
            <div className="path" />

            <div className="art-label">
              <span className="art-label-icon">
                <Leaf size={17} />
              </span>
              <span>
                <b>Outside is calling</b>
                <small>Your next little adventure awaits.</small>
              </span>
            </div>

            <div className="floating-leaf leaf-one">✳</div>
            <div className="floating-leaf leaf-two">✳</div>
          </div>
        </section>

        {/* Progress statistics */}
        <section className="stats-strip" aria-label="Your outdoor progress">
          <div className="stat">
            <span className="stat-icon">
              <CheckCircle2 size={18} />
            </span>
            <span className="stat-copy">
              <b>{progress.completed}</b>
              <small>missions completed</small>
            </span>
          </div>

          <div className="stat-divider" />

          <div className="stat">
            <span className="stat-icon">
              <Clock3 size={18} />
            </span>
            <span className="stat-copy">
              <b>{progress.minutes} min</b>
              <small>time outdoors logged</small>
            </span>
          </div>

          <button
            className="reset-link"
            onClick={resetProgress}
            type="button"
            title="Reset local progress"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </section>

        {/* Mission planner */}
        <section className="planner-section" id="planner">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                YOUR NEXT LITTLE ADVENTURE
              </div>

              <h2>What feels good today?</h2>

              <p>
                Tell us a little about your day. We&apos;ll turn it into a
                doable outdoor mission.
              </p>
            </div>

            <div className="heading-stamp">
              <Leaf size={24} />
              <span>
                Step outside.
                <br />
                Come back lighter.
              </span>
            </div>
          </div>

          <form className="planner-grid" onSubmit={generateMission}>
            <div className="planner-controls">
              {/* Time selection */}
              <fieldset className="control-group">
                <legend>
                  <span className="step-number">01</span>
                  How much time do you have?
                </legend>

                <div className="time-options">
                  {timeOptions.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={`time-option ${
                        minutes === option ? "selected" : ""
                      }`}
                      onClick={() => setMinutes(option)}
                      aria-pressed={minutes === option}
                    >
                      <b>{option}</b>
                      <small>min</small>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Interest selection */}
              <fieldset className="control-group">
                <legend>
                  <span className="step-number">02</span>
                  What are you in the mood for?
                </legend>

                <div className="interest-grid">
                  {interests.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        type="button"
                        key={item.value}
                        className={`interest-card ${
                          interest === item.value ? "selected" : ""
                        }`}
                        onClick={() => setInterest(item.value)}
                        aria-pressed={interest === item.value}
                      >
                        <Icon size={19} strokeWidth={1.8} />

                        <span>
                          <b>{item.label}</b>
                          <small>{item.note}</small>
                        </span>

                        {interest === item.value && (
                          <span className="selected-check">
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Difficulty selection */}
              <fieldset className="control-group difficulty-group">
                <legend>
                  <span className="step-number">03</span>
                  Pick your pace
                </legend>

                <div className="difficulty-options">
                  {[
                    ["easy", "Easy", "Keep it gentle"],
                    ["moderate", "Moderate", "A little more movement"],
                    ["challenging", "Challenging", "Ready to stretch"],
                  ].map(([value, label, description]) => (
                    <button
                      type="button"
                      key={value}
                      className={`difficulty-option ${
                        difficulty === value ? "selected" : ""
                      }`}
                      onClick={() => setDifficulty(value)}
                      aria-pressed={difficulty === value}
                    >
                      <span
                        className={`radio-dot ${
                          difficulty === value ? "active" : ""
                        }`}
                      />
                      <span>
                        <b>{label}</b>
                        <small>{description}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                className="generate-button"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="spin" size={18} />
                    Creating your mission...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Create my outdoor mission <ArrowRight size={17} />
                  </>
                )}
              </button>

              <p className="privacy-note">
                <ShieldCheck size={14} />
                Your preferences are sent to your local AI server.
              </p>
            </div>

            {/* Mission display */}
            <aside
              className={`mission-panel ${mission ? "has-mission" : ""}`}
              aria-live="polite"
            >
              {!mission && !loading && !error && (
                <div className="empty-state">
                  <div className="empty-illustration">
                    <div className="empty-sun" />
                    <div className="empty-ground" />
                    <Trees className="empty-tree" size={77} strokeWidth={1.1} />
                    <Footprints className="empty-footprints" size={29} />
                  </div>

                  <span className="empty-kicker">
                    YOUR CANVAS FOR ADVENTURE
                  </span>

                  <h3>
                    A little outside
                    <br />
                    goes a long way.
                  </h3>

                  <p>
                    Your personalized mission will show up here. No pressure, no
                    perfection — just a reason to step out.
                  </p>

                  <div className="empty-note">
                    <Sparkles size={15} />
                    Powered by a locally run open-weight model
                  </div>
                </div>
              )}

              {loading && (
                <div className="loading-state">
                  <div className="loading-orbit">
                    <Leaf size={29} />
                    <span />
                  </div>

                  <h3>Dreaming up your mission...</h3>

                  <p>
                    Your local AI is putting together something that fits your
                    day.
                  </p>
                </div>
              )}

              {error && (
                <div className="error-state">
                  <div className="error-icon">
                    <Sprout size={28} />
                  </div>

                  <h3>We couldn&apos;t reach the AI yet.</h3>
                  <p>{error}</p>

                  <div className="setup-tip">
                    <b>Quick setup</b>
                    <code>ollama pull gemma3:1b</code>
                    <span>Then start the app&apos;s backend again.</span>
                  </div>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={generateMission}
                  >
                    Try again <RotateCcw size={15} />
                  </button>
                </div>
              )}

              {mission && (
                <div className="mission-content">
                  <div className="mission-topline">
                    <span className="mission-tag">
                      <Sparkles size={13} /> YOUR MISSION
                    </span>

                    <span className="mission-time">
                      <Clock3 size={14} /> {mission.duration}
                    </span>
                  </div>

                  <div className="mission-symbol">
                    <span>{activeInterest?.label || "Outside"}</span>
                    <Leaf size={27} />
                  </div>

                  <h3>{mission.title}</h3>
                  <p className="mission-intro">{mission.intro}</p>

                  <div className="mission-divider" />

                  <div className="steps-title">
                    YOUR LITTLE PLAN
                    <span>
                      {checkedSteps.length}/{mission.steps.length}
                    </span>
                  </div>

                  <div className="mission-steps">
                    {mission.steps.map((step, index) => (
                      <button
                        className={`mission-step ${
                          checkedSteps.includes(index) ? "step-done" : ""
                        }`}
                        type="button"
                        key={`${index}-${step}`}
                        onClick={() =>
                          setCheckedSteps((old) =>
                            old.includes(index)
                              ? old.filter((n) => n !== index)
                              : [...old, index],
                          )
                        }
                        aria-pressed={checkedSteps.includes(index)}
                      >
                        <span className="step-check">
                          {checkedSteps.includes(index) ? (
                            <Check size={14} />
                          ) : (
                            String(index + 1).padStart(2, "0")
                          )}
                        </span>
                        <span>{step}</span>
                      </button>
                    ))}
                  </div>

                  <div className="safety-note">
                    <ShieldCheck size={17} />
                    <span>
                      <b>A little safety reminder</b>
                      {mission.safetyTip}
                    </span>
                  </div>

                  <div className="reflection">
                    <span>ON YOUR WAY BACK</span>
                    <p>“{mission.reflection}”</p>
                  </div>

                  {completed ? (
                    <div className="completed-banner">
                      <CheckCircle2 size={19} />
                      <span>
                        <b>Mission complete!</b>
                        <small>Nice work making room for outside.</small>
                      </span>
                    </div>
                  ) : (
                    <button
                      className="complete-button"
                      type="button"
                      onClick={finishMission}
                      disabled={!allStepsChecked}
                      title={
                        !allStepsChecked
                          ? "Complete all steps first"
                          : "Complete mission"
                      }
                    >
                      <CheckCircle2 size={18} />
                      {!allStepsChecked
                        ? `Complete all steps (${checkedSteps.length}/${mission.steps.length})`
                        : "I completed this mission"}
                    </button>
                  )}

                  <button
                    className="new-mission-button"
                    type="button"
                    onClick={generateMission}
                    disabled={loading}
                  >
                    Make another mission <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </aside>
          </form>
        </section>

        {/* Mission history */}
        <section className="history-section" id="history">
          <div className="history-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                YOUR OUTDOOR JOURNEY
              </div>

              <h2>Mission history</h2>
              <p>Every little step outside counts.</p>
            </div>

            <span className="history-count">{history.length} completed</span>
          </div>

          {history.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">
                <Leaf size={25} />
              </div>

              <h3>Your story starts outside.</h3>

              <p>
                Complete your first outdoor mission and it will appear here.
              </p>

              <a href="#planner" className="history-cta">
                Create your first mission
                <ArrowRight size={15} />
              </a>
            </div>
          ) : (
            <>
              <div className="history-list">
                {history.map((item) => (
                  <article className="history-item" key={item.id}>
                    <div className="history-item-icon">
                      <CheckCircle2 size={21} />
                    </div>

                    <div className="history-item-info">
                      <h3>{item.title}</h3>

                      <p>
                        {item.interest} · {item.duration} minutes
                      </p>

                      <time dateTime={item.completedAt}>
                        {new Date(item.completedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>

                    <span className="history-completed">
                      <Check size={14} />
                      Done
                    </span>
                  </article>
                ))}
              </div>

              <button
                className="reset-link"
                type="button"
                onClick={clearHistory}
                style={{ marginTop: "16px" }}
              >
                <RotateCcw size={14} /> Clear history
              </button>
            </>
          )}
        </section>

        {/* How it works */}
        <section className="how-section" id="how-it-works">
          <div className="how-heading">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              LESS APP. MORE LIFE.
            </div>

            <h2>
              Technology that points
              <br />
              you back to the world.
            </h2>
          </div>

          <div className="how-cards">
            <article className="how-card">
              <span className="how-number">01</span>
              <span className="how-icon">
                <Sparkles size={20} />
              </span>
              <h3>Make it yours</h3>
              <p>
                Choose the time you have, the things you like, and the pace that
                feels right.
              </p>
            </article>

            <article className="how-card">
              <span className="how-number">02</span>
              <span className="how-icon">
                <Sprout size={20} />
              </span>
              <h3>Get a little nudge</h3>
              <p>
                A locally hosted open-weight model turns your preferences into a
                practical mission.
              </p>
            </article>

            <article className="how-card">
              <span className="how-number">03</span>
              <span className="how-icon">
                <Footprints size={20} />
              </span>
              <h3>Take it outside</h3>
              <p>
                Close the tab, head somewhere safe, and notice what&apos;s
                waiting beyond your screen.
              </p>
            </article>
          </div>
        </section>

        {/* Closing banner */}
        <section className="closing-banner">
          <div className="closing-icon">
            <Leaf size={25} />
          </div>

          <div>
            <h2>The world is still out there.</h2>
            <p>Let your next scroll be the one that gets you moving.</p>
          </div>

          <a href="#planner" className="closing-link">
            Find your mission <ArrowRight size={17} />
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark">
            <Sprout size={19} />
          </span>
          <span>
            touchgrass<span className="brand-ai">.ai</span>
          </span>
        </a>

        <p>
          Made for the Hacktoberfest Open-Source AI Challenge · Week 1: Touch
          Grass
        </p>

        <span className="footer-note">Go gently. Go outside. 🌱</span>
      </footer>
    </div>
  );
}
