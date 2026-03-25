import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  sessions: "meditationSessions",
  journal: "awarenessJournal",
  focus: "focusCheckins",
};

const prompts = [
  "What repeated thought showed up today?",
  "What distracted you most and why?",
  "What action made you feel proud today?",
  "Where can you be kinder to yourself this week?",
  "What fear is blocking your next meaningful step?",
];

const today = new Date().toISOString().split("T")[0];

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [journal, setJournal] = useState([]);
  const [focus, setFocus] = useState([]);

  const [sessionForm, setSessionForm] = useState({
    date: today,
    minutes: "10",
    technique: "Breath awareness",
    focusScore: "6",
  });
  const [journalForm, setJournalForm] = useState({
    date: today,
    thought: "",
    intensity: "5",
    response: "",
  });
  const [focusForm, setFocusForm] = useState({
    date: today,
    goal: "",
    task: "",
    completed: false,
  });

  const [prompt, setPrompt] = useState(prompts[0]);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [status, setStatus] = useState("Welcome! Start logging your journey.");

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setStatus("Focus block complete. Great work!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  const stats = useMemo(() => {
    const totalMinutes = sessions.reduce((sum, item) => sum + item.minutes, 0);
    const avgFocus = sessions.length
      ? sessions.reduce((sum, item) => sum + item.focusScore, 0) / sessions.length
      : 0;
    const completionRate = focus.length
      ? Math.round((focus.filter((f) => f.completed).length / focus.length) * 100)
      : 0;

    const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
    let streak = 0;
    if (uniqueDates.length) {
      const latest = uniqueDates[0];
      const gap = diffInDays(today, latest);
      if (gap <= 1) {
        streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i += 1) {
          if (diffInDays(uniqueDates[i], uniqueDates[i + 1]) === 1) streak += 1;
          else break;
        }
      }
    }

    return {
      totalSessions: sessions.length,
      totalMinutes,
      avgFocus: avgFocus.toFixed(1),
      completionRate,
      streak,
    };
  }, [sessions, focus]);

  const milestones = useMemo(() => {
    const badges = [];
    if (stats.totalSessions >= 1) badges.push("✅ First meditation logged");
    if (stats.totalMinutes >= 100) badges.push("🔥 100+ minutes meditated");
    if (journal.length >= 7) badges.push("🧠 7 reflection entries");
    if (stats.streak >= 5) badges.push("📅 5-day streak");
    if (focus.filter((f) => f.completed).length >= 10) badges.push("🎯 10 completed focus tasks");
    return badges;
  }, [stats, journal, focus]);

  const coachTips = useMemo(() => {
    const tips = [];
    if (sessions.length < 3) tips.push("Start with 10 minutes daily for consistency.");
    if (Number(stats.avgFocus) < 6 && sessions.length) tips.push("Add one minute of deep breathing before meditation.");
    if (journal.filter((j) => j.intensity >= 7).length >= 2) tips.push("Name strong emotions with a single word to reduce reactivity.");
    if (stats.completionRate < 60 && focus.length >= 3) tips.push("Use one 25-minute deep work block on your top task.");
    if (!tips.length) tips.push("Excellent momentum—keep reflecting and refining.");
    return tips;
  }, [sessions, journal, focus, stats]);

  async function loadAllData() {
    const [sessionRaw, journalRaw, focusRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.sessions),
      AsyncStorage.getItem(STORAGE_KEYS.journal),
      AsyncStorage.getItem(STORAGE_KEYS.focus),
    ]);

    setSessions(sessionRaw ? JSON.parse(sessionRaw) : []);
    setJournal(journalRaw ? JSON.parse(journalRaw) : []);
    setFocus(focusRaw ? JSON.parse(focusRaw) : []);
  }

  async function persistAll(nextSessions, nextJournal, nextFocus) {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(nextSessions)),
      AsyncStorage.setItem(STORAGE_KEYS.journal, JSON.stringify(nextJournal)),
      AsyncStorage.setItem(STORAGE_KEYS.focus, JSON.stringify(nextFocus)),
    ]);
  }

  async function saveSession() {
    const entry = {
      date: sessionForm.date,
      minutes: Number(sessionForm.minutes),
      technique: sessionForm.technique,
      focusScore: Number(sessionForm.focusScore),
    };
    const nextSessions = [entry, ...sessions];
    setSessions(nextSessions);
    await persistAll(nextSessions, journal, focus);
    setStatus("Meditation session saved.");
  }

  async function saveJournal() {
    const entry = {
      date: journalForm.date,
      thought: journalForm.thought.trim(),
      intensity: Number(journalForm.intensity),
      response: journalForm.response.trim(),
    };
    const nextJournal = [entry, ...journal];
    setJournal(nextJournal);
    await persistAll(sessions, nextJournal, focus);
    setStatus("Awareness journal entry saved.");
  }

  async function saveFocus() {
    const entry = {
      date: focusForm.date,
      goal: focusForm.goal.trim(),
      task: focusForm.task.trim(),
      completed: focusForm.completed,
    };
    const nextFocus = [entry, ...focus];
    setFocus(nextFocus);
    await persistAll(sessions, journal, nextFocus);
    setStatus("Goal focus check-in saved.");
  }

  function startTimer() {
    if (remainingSeconds === 0) setRemainingSeconds(timerMinutes * 60);
    setTimerRunning(true);
  }

  function pauseTimer() {
    setTimerRunning(false);
  }

  function resetTimer() {
    setTimerRunning(false);
    setRemainingSeconds(timerMinutes * 60);
  }

  function updateTimerDuration(value) {
    const minutes = Math.min(120, Math.max(1, Number(value) || 25));
    setTimerMinutes(minutes);
    setRemainingSeconds(minutes * 60);
  }

  function makeBackup() {
    setBackupText(
      JSON.stringify(
        {
          meditationSessions: sessions,
          awarenessJournal: journal,
          focusCheckins: focus,
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
    setStatus("Backup generated. Copy and save it safely.");
  }

  async function restoreBackup() {
    try {
      const parsed = JSON.parse(backupText);
      const nextSessions = Array.isArray(parsed.meditationSessions) ? parsed.meditationSessions : [];
      const nextJournal = Array.isArray(parsed.awarenessJournal) ? parsed.awarenessJournal : [];
      const nextFocus = Array.isArray(parsed.focusCheckins) ? parsed.focusCheckins : [];
      setSessions(nextSessions);
      setJournal(nextJournal);
      setFocus(nextFocus);
      await persistAll(nextSessions, nextJournal, nextFocus);
      setStatus("Backup restored successfully.");
    } catch {
      setStatus("Backup restore failed. Check JSON format.");
    }
  }

  function randomPrompt() {
    setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Meditation Journey (Play Store Ready)</Text>
        <Text style={styles.subtitle}>{status}</Text>

        <Card title="Meditation Session">
          <Field label="Date (YYYY-MM-DD)" value={sessionForm.date} onChangeText={(v) => setSessionForm({ ...sessionForm, date: v })} />
          <Field label="Minutes" value={sessionForm.minutes} keyboardType="numeric" onChangeText={(v) => setSessionForm({ ...sessionForm, minutes: v })} />
          <Field label="Technique" value={sessionForm.technique} onChangeText={(v) => setSessionForm({ ...sessionForm, technique: v })} />
          <Field label="Focus Score (1-10)" value={sessionForm.focusScore} keyboardType="numeric" onChangeText={(v) => setSessionForm({ ...sessionForm, focusScore: v })} />
          <Button text="Save Session" onPress={saveSession} />
        </Card>

        <Card title="Self-Awareness Journal">
          <Field label="Date (YYYY-MM-DD)" value={journalForm.date} onChangeText={(v) => setJournalForm({ ...journalForm, date: v })} />
          <Field label="Thought Pattern" value={journalForm.thought} onChangeText={(v) => setJournalForm({ ...journalForm, thought: v })} multiline />
          <Field label="Intensity (1-10)" value={journalForm.intensity} keyboardType="numeric" onChangeText={(v) => setJournalForm({ ...journalForm, intensity: v })} />
          <Field label="Mindful Response" value={journalForm.response} onChangeText={(v) => setJournalForm({ ...journalForm, response: v })} multiline />
          <Button text="Save Journal" onPress={saveJournal} />
        </Card>

        <Card title="Goal Focus Check-In">
          <Field label="Date (YYYY-MM-DD)" value={focusForm.date} onChangeText={(v) => setFocusForm({ ...focusForm, date: v })} />
          <Field label="Goal" value={focusForm.goal} onChangeText={(v) => setFocusForm({ ...focusForm, goal: v })} />
          <Field label="Most Important Task" value={focusForm.task} onChangeText={(v) => setFocusForm({ ...focusForm, task: v })} />
          <Button
            text={focusForm.completed ? "Completed Without Distraction ✅" : "Mark as Completed"}
            onPress={() => setFocusForm({ ...focusForm, completed: !focusForm.completed })}
            type={focusForm.completed ? "success" : "secondary"}
          />
          <Button text="Save Focus Check-In" onPress={saveFocus} />
        </Card>

        <Card title="Progress Snapshot">
          <Text style={styles.listItem}>• Sessions: {stats.totalSessions}</Text>
          <Text style={styles.listItem}>• Total minutes: {stats.totalMinutes}</Text>
          <Text style={styles.listItem}>• Current streak: {stats.streak} day(s)</Text>
          <Text style={styles.listItem}>• Average focus: {stats.avgFocus}</Text>
          <Text style={styles.listItem}>• Goal completion rate: {stats.completionRate}%</Text>
        </Card>

        <Card title="AI-Style Coach Tips">
          {coachTips.map((tip) => (
            <Text key={tip} style={styles.listItem}>• {tip}</Text>
          ))}
        </Card>

        <Card title="Deep Focus Timer">
          <Field label="Timer Minutes" value={String(timerMinutes)} keyboardType="numeric" onChangeText={updateTimerDuration} />
          <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
          <View style={styles.row}>
            <Button text="Start" onPress={startTimer} compact />
            <Button text="Pause" onPress={pauseTimer} type="secondary" compact />
            <Button text="Reset" onPress={resetTimer} type="secondary" compact />
          </View>
        </Card>

        <Card title="Reflection Prompt & Milestones">
          <Text style={styles.prompt}>{prompt}</Text>
          <Button text="New Prompt" onPress={randomPrompt} type="secondary" />
          {milestones.length ? milestones.map((m) => <Text key={m} style={styles.listItem}>• {m}</Text>) : <Text style={styles.listItem}>• No milestones yet.</Text>}
        </Card>

        <Card title="Backup & Restore">
          <Button text="Generate Backup JSON" onPress={makeBackup} />
          <Field label="Backup JSON (paste to restore)" value={backupText} onChangeText={setBackupText} multiline />
          <Button text="Restore from JSON" onPress={restoreBackup} type="secondary" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, multiline = false, ...rest }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...rest}
      />
    </View>
  );
}

function Button({ text, onPress, type = "primary", compact = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        type === "secondary" && styles.secondaryButton,
        type === "success" && styles.successButton,
        compact && styles.compactButton,
      ]}
    >
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
}

function formatTime(totalSeconds) {
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function diffInDays(laterISO, earlierISO) {
  return Math.round((new Date(laterISO) - new Date(earlierISO)) / (1000 * 60 * 60 * 24));
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eef2ff" },
  container: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { color: "#374151", marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", color: "#1f2937" },
  fieldWrap: { gap: 4 },
  label: { fontSize: 13, color: "#4b5563" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 80 },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButton: { backgroundColor: "#64748b" },
  successButton: { backgroundColor: "#047857" },
  compactButton: { flex: 1 },
  buttonText: { color: "white", fontWeight: "600" },
  timerText: { fontSize: 34, fontWeight: "700", textAlign: "center", color: "#111827" },
  row: { flexDirection: "row", gap: 8 },
  listItem: { color: "#1f2937", marginBottom: 2 },
  prompt: { color: "#1f2937", fontStyle: "italic" },
});
