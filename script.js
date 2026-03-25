const state = {
  sessions: load("meditationSessions"),
  journal: load("awarenessJournal"),
  focus: load("focusCheckins"),
};

const prompts = [
  "What repeated thought appeared today, and what need might be under it?",
  "Where did your attention drift most, and what triggered that drift?",
  "Which emotion needed compassion today instead of control?",
  "What story did your mind tell that may not be fully true?",
  "Which small action today aligned with your long-term purpose?",
];

const timerState = {
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  intervalId: null,
};

const meditationForm = document.getElementById("meditation-form");
const journalForm = document.getElementById("journal-form");
const focusForm = document.getElementById("focus-form");

const sessionDateInput = document.getElementById("session-date");
const journalDateInput = document.getElementById("journal-date");
const focusDateInput = document.getElementById("focus-date");
const timerInput = document.getElementById("timer-minutes");
const timerDisplay = document.getElementById("timer-display");
const timerStatus = document.getElementById("timer-status");
const awarenessPrompt = document.getElementById("awareness-prompt");
const milestoneList = document.getElementById("milestone-list");
const dataStatus = document.getElementById("data-status");
const importDataInput = document.getElementById("import-data");
const today = toISODate(new Date());

sessionDateInput.value = today;
journalDateInput.value = today;
focusDateInput.value = today;
setTimerMinutes(Number(timerInput.value));

document.getElementById("timer-start").addEventListener("click", startTimer);
document.getElementById("timer-pause").addEventListener("click", pauseTimer);
document.getElementById("timer-reset").addEventListener("click", resetTimer);
document.getElementById("new-prompt").addEventListener("click", showNewPrompt);
document.getElementById("export-data").addEventListener("click", exportData);
document.getElementById("reset-data").addEventListener("click", resetAllData);
importDataInput.addEventListener("change", importData);
timerInput.addEventListener("change", () => setTimerMinutes(Number(timerInput.value)));

meditationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const entry = {
    date: toISODate(document.getElementById("session-date").value),
    minutes: Number(document.getElementById("minutes").value),
    technique: document.getElementById("technique").value,
    focus: Number(document.getElementById("focus-score").value),
  };

  state.sessions.push(entry);
  save("meditationSessions", state.sessions);
  meditationForm.reset();
  sessionDateInput.value = toISODate(new Date());
  render();
});

journalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const entry = {
    date: toISODate(document.getElementById("journal-date").value),
    pattern: document.getElementById("thought-pattern").value.trim(),
    intensity: Number(document.getElementById("emotion-intensity").value),
    response: document.getElementById("mindful-response").value.trim(),
  };

  state.journal.push(entry);
  save("awarenessJournal", state.journal);
  journalForm.reset();
  journalDateInput.value = toISODate(new Date());
  render();
});

focusForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const entry = {
    date: toISODate(document.getElementById("focus-date").value),
    goal: document.getElementById("goal-name").value.trim(),
    task: document.getElementById("task-name").value.trim(),
    completed: document.getElementById("task-complete").checked,
  };

  state.focus.push(entry);
  save("focusCheckins", state.focus);
  focusForm.reset();
  focusDateInput.value = toISODate(new Date());
  render();
});

function render() {
  renderStats();
  renderCoach();
  renderLists();
  renderMilestones();
}

function renderStats() {
  const totalSessions = state.sessions.length;
  const totalMinutes = state.sessions.reduce((sum, item) => sum + item.minutes, 0);
  const avgFocus =
    totalSessions === 0
      ? 0
      : state.sessions.reduce((sum, item) => sum + item.focus, 0) / totalSessions;

  const streakDays = calculateStreak(state.sessions.map((item) => item.date));
  const weeklyConsistency = calculateWeeklyConsistency(state.sessions.map((item) => item.date));

  const mindfulResponses = state.journal.filter((entry) => entry.response.length > 0).length;

  const goalCompletionRate =
    state.focus.length === 0
      ? 0
      : Math.round(
          (state.focus.filter((entry) => entry.completed).length / state.focus.length) * 100
        );

  setText("total-sessions", totalSessions);
  setText("total-minutes", totalMinutes);
  setText("streak-days", streakDays);
  setText("weekly-consistency", `${weeklyConsistency}%`);
  setText("avg-focus", avgFocus.toFixed(1));
  setText("mindful-responses", mindfulResponses);
  setText("goal-completion-rate", `${goalCompletionRate}%`);
}

function renderCoach() {
  const message = document.getElementById("coach-message");
  const tipsEl = document.getElementById("coach-tips");

  const tips = [];
  const totalMinutes = state.sessions.reduce((sum, item) => sum + item.minutes, 0);
  const avgFocus =
    state.sessions.length > 0
      ? state.sessions.reduce((sum, item) => sum + item.focus, 0) / state.sessions.length
      : 0;
  const highIntensityCount = state.journal.filter((entry) => entry.intensity >= 7).length;
  const completionRate =
    state.focus.length > 0
      ? state.focus.filter((entry) => entry.completed).length / state.focus.length
      : 0;

  if (state.sessions.length < 3) {
    tips.push("Start with 5-10 minutes daily. Consistency matters more than long sessions.");
  }

  if (avgFocus < 6 && state.sessions.length > 0) {
    tips.push("Before meditating, do one minute of slow breathing to settle your attention.");
  }

  if (highIntensityCount >= 2) {
    tips.push(
      "You are noticing strong emotions. Label them gently (e.g., 'worry', 'fear') to reduce reactivity."
    );
  }

  if (completionRate < 0.6 && state.focus.length >= 3) {
    tips.push(
      "Your goal focus is slipping. Use a 25-minute distraction-free sprint for your most important task."
    );
  }

  if (totalMinutes >= 120) {
    tips.push("Great momentum! Add one weekly 20-minute deep session for deeper self-awareness.");
  }

  if (tips.length === 0) {
    tips.push("Excellent balance. Keep reflecting after each session to deepen awareness.");
  }

  message.textContent =
    state.sessions.length === 0
      ? "Start by logging your first meditation session and journal reflection."
      : "Based on your data, here are your next best improvements:";

  tipsEl.innerHTML = tips.map((tip) => `<li>${tip}</li>`).join("");
}

function renderLists() {
  renderList(
    "session-list",
    sortByDateDesc(state.sessions),
    (item) => `${item.date}: ${item.minutes} min, ${item.technique}, focus ${item.focus}/10`
  );

  renderList(
    "journal-list",
    sortByDateDesc(state.journal),
    (item) => `${item.date}: ${item.pattern} (intensity ${item.intensity}/10)`
  );

  renderList(
    "focus-list",
    sortByDateDesc(state.focus),
    (item) =>
      `${item.date}: ${item.goal} → ${item.task} ` +
      (item.completed
        ? '<span class="tag-good">(completed)</span>'
        : "(needs follow-through)")
  );
}

function renderList(elementId, items, formatter) {
  const list = document.getElementById(elementId);
  const recent = [...items].slice(0, 5);

  if (recent.length === 0) {
    list.innerHTML = "<li>No data yet.</li>";
    return;
  }

  list.innerHTML = recent.map((item) => `<li>${formatter(item)}</li>`).join("");
}

function calculateStreak(sessionDates) {
  if (sessionDates.length === 0) return 0;

  const uniqueDates = [...new Set(sessionDates.map((date) => toISODate(date)))]
    .map((date) => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime())
    .map((date) => toISODate(date));

  const latest = uniqueDates[0];
  const dayGap = diffInDays(toISODate(new Date()), latest);
  if (dayGap > 1) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i += 1) {
    const dayDiff = diffInDays(uniqueDates[i], uniqueDates[i + 1]);

    if (dayDiff === 1) streak += 1;
    else break;
  }

  return streak;
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function renderMilestones() {
  const totalMinutes = state.sessions.reduce((sum, item) => sum + item.minutes, 0);
  const completionCount = state.focus.filter((item) => item.completed).length;
  const streak = calculateStreak(state.sessions.map((item) => item.date));
  const milestones = [];

  if (state.sessions.length >= 1) milestones.push("✅ First meditation session logged");
  if (totalMinutes >= 100) milestones.push("🔥 100+ total meditation minutes");
  if (state.journal.length >= 7) milestones.push("🧠 7+ awareness reflections written");
  if (streak >= 5) milestones.push("📅 5-day active meditation streak");
  if (completionCount >= 10) milestones.push("🎯 10 distraction-free goal tasks completed");

  milestoneList.innerHTML =
    milestones.length > 0
      ? milestones.map((item) => `<li>${item}</li>`).join("")
      : "<li>No milestones yet. Keep practicing daily.</li>";
}

function showNewPrompt() {
  const selected = prompts[Math.floor(Math.random() * prompts.length)];
  awarenessPrompt.textContent = selected;
}

function setTimerMinutes(minutes) {
  const safeMinutes = Number.isFinite(minutes) ? Math.min(Math.max(minutes, 1), 120) : 25;
  timerInput.value = safeMinutes;
  timerState.totalSeconds = safeMinutes * 60;
  timerState.remainingSeconds = safeMinutes * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const mins = Math.floor(timerState.remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (timerState.remainingSeconds % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${mins}:${secs}`;
}

function startTimer() {
  if (timerState.intervalId) return;
  if (timerState.remainingSeconds <= 0) {
    timerState.remainingSeconds = timerState.totalSeconds;
  }
  timerStatus.textContent = "Focus block is active. Stay with one task.";
  timerState.intervalId = setInterval(() => {
    timerState.remainingSeconds -= 1;
    updateTimerDisplay();

    if (timerState.remainingSeconds <= 0) {
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
      timerStatus.textContent =
        "Great work — focus block completed. Log your task as distraction-free if completed.";
      timerState.remainingSeconds = 0;
      updateTimerDisplay();
    }
  }, 1000);
}

function pauseTimer() {
  if (!timerState.intervalId) return;
  clearInterval(timerState.intervalId);
  timerState.intervalId = null;
  timerStatus.textContent = "Timer paused.";
}

function resetTimer() {
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  timerState.remainingSeconds = timerState.totalSeconds;
  timerStatus.textContent = "Timer reset.";
  updateTimerDisplay();
}

function exportData() {
  const payload = {
    meditationSessions: state.sessions,
    awarenessJournal: state.journal,
    focusCheckins: state.focus,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "meditation-journey-data.json";
  link.click();
  URL.revokeObjectURL(url);
  dataStatus.textContent = "Data exported successfully.";
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  file.text().then((content) => {
    const parsed = JSON.parse(content);
    state.sessions = Array.isArray(parsed.meditationSessions) ? parsed.meditationSessions : [];
    state.journal = Array.isArray(parsed.awarenessJournal) ? parsed.awarenessJournal : [];
    state.focus = Array.isArray(parsed.focusCheckins) ? parsed.focusCheckins : [];

    save("meditationSessions", state.sessions);
    save("awarenessJournal", state.journal);
    save("focusCheckins", state.focus);
    render();
    dataStatus.textContent = "Data imported successfully.";
    importDataInput.value = "";
  }).catch(() => {
    dataStatus.textContent = "Import failed. Please choose a valid JSON export file.";
    importDataInput.value = "";
  });
}

function resetAllData() {
  state.sessions = [];
  state.journal = [];
  state.focus = [];
  save("meditationSessions", state.sessions);
  save("awarenessJournal", state.journal);
  save("focusCheckins", state.focus);
  render();
  dataStatus.textContent = "All local data has been reset.";
}

function calculateWeeklyConsistency(sessionDates) {
  if (sessionDates.length === 0) return 0;

  const uniqueDates = new Set(sessionDates.map((date) => toISODate(date)));
  const todayDate = new Date(toISODate(new Date()));
  let daysWithPractice = 0;

  for (let i = 0; i < 7; i += 1) {
    const check = new Date(todayDate);
    check.setDate(todayDate.getDate() - i);
    if (uniqueDates.has(toISODate(check))) {
      daysWithPractice += 1;
    }
  }

  return Math.round((daysWithPractice / 7) * 100);
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function diffInDays(laterDate, earlierDate) {
  return Math.round((new Date(laterDate) - new Date(earlierDate)) / (1000 * 60 * 60 * 24));
}

function toISODate(input) {
  const date = input instanceof Date ? input : new Date(input);
  return date.toISOString().split("T")[0];
}

function load(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

render();
