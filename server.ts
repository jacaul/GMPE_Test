import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const currentDir = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory + file-backed storage for Global Ranking
interface ScoreEntry {
  id: string;
  studentName: string;
  studentClass: string;
  score: number;
  levelReached: number;
  totalTime: number; // in seconds
  failsCount: number; // total mistakes/failures
  accuracy: number; // percentage
  answersCorrect: number;
  answersTotal: number;
  date: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const RANKING_FILE = path.join(DATA_DIR, "ranking.json");

const DEFAULT_SCORES: ScoreEntry[] = [];

function loadScores(): ScoreEntry[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(RANKING_FILE)) {
      const data = fs.readFileSync(RANKING_FILE, "utf-8");
      return JSON.parse(data);
    }
    fs.writeFileSync(RANKING_FILE, JSON.stringify(DEFAULT_SCORES, null, 2), "utf-8");
    return DEFAULT_SCORES;
  } catch (err) {
    console.error("Error loading scores, fallback to defaults", err);
    return DEFAULT_SCORES;
  }
}

function saveScores(scores: ScoreEntry[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(RANKING_FILE, JSON.stringify(scores, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving scores", err);
  }
}

let rankingList: ScoreEntry[] = loadScores();

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET ranking with optional class filter
app.get("/api/ranking", (req, res) => {
  const filterClass = req.query.class as string | undefined;
  let result = [...rankingList];
  if (filterClass && filterClass !== "all") {
    result = result.filter((entry) => entry.studentClass.toLowerCase() === filterClass.toLowerCase());
  }
  // Calculate ranking strictly based on fewest failures, then lowest time, then highest score
  result.sort((a, b) => {
    const failsA = a.failsCount ?? 0;
    const failsB = b.failsCount ?? 0;
    if (failsA !== failsB) return failsA - failsB;
    if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime;
    return b.score - a.score;
  });
  res.json({ success: true, count: result.length, data: result });
});

// POST score update / registration
app.post("/api/ranking", (req, res) => {
  try {
    const { studentName, studentClass, score, levelReached, totalTime, failsCount, accuracy, answersCorrect, answersTotal } = req.body;
    if (!studentName || !studentClass) {
      res.status(400).json({ error: "El nombre del alumno y la clase son obligatorios" });
      return;
    }

    const cleanName = String(studentName).trim();
    const cleanClass = String(studentClass).trim();
    const cleanFails = Number(failsCount) || 0;

    // Check if student already has a score in this class
    const existingIndex = rankingList.findIndex(
      (entry) =>
        entry.studentName.toLowerCase() === cleanName.toLowerCase() &&
        entry.studentClass.toLowerCase() === cleanClass.toLowerCase()
    );

    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      rankingList[existingIndex] = {
        ...rankingList[existingIndex],
        score: Math.max(rankingList[existingIndex].score, Number(score) || 0),
        levelReached: Math.max(rankingList[existingIndex].levelReached, Number(levelReached) || 1),
        totalTime: Number(totalTime) || rankingList[existingIndex].totalTime,
        failsCount: cleanFails,
        accuracy: Number(accuracy) || rankingList[existingIndex].accuracy,
        answersCorrect: Number(answersCorrect) || rankingList[existingIndex].answersCorrect,
        answersTotal: Number(answersTotal) || rankingList[existingIndex].answersTotal,
        date: now,
      };
    } else {
      const newEntry: ScoreEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentName: cleanName,
        studentClass: cleanClass,
        score: Number(score) || 0,
        levelReached: Number(levelReached) || 1,
        totalTime: Number(totalTime) || 0,
        failsCount: cleanFails,
        accuracy: Number(accuracy) || 0,
        answersCorrect: Number(answersCorrect) || 0,
        answersTotal: Number(answersTotal) || 0,
        date: now,
      };
      rankingList.push(newEntry);
    }

    // Sort rankings: fewest failures first, then lowest time, then highest score
    rankingList.sort((a, b) => {
      const failsA = a.failsCount ?? 0;
      const failsB = b.failsCount ?? 0;
      if (failsA !== failsB) return failsA - failsB;
      if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime;
      return b.score - a.score;
    });
    saveScores(rankingList);

    // Find student position
    const currentPosition = rankingList.findIndex(
      (e) => e.studentName.toLowerCase() === cleanName.toLowerCase() && e.studentClass.toLowerCase() === cleanClass.toLowerCase()
    ) + 1;

    res.json({ success: true, position: currentPosition, totalStudents: rankingList.length });
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({ error: "Error al guardar la puntuación" });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Turbine 3D & Betz app running on http://localhost:${PORT}`);
  });
}

startServer();
