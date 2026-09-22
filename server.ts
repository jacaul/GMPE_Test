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
  accuracy: number; // percentage
  answersCorrect: number;
  answersTotal: number;
  date: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const RANKING_FILE = path.join(DATA_DIR, "ranking.json");

const DEFAULT_SCORES: ScoreEntry[] = [
  {
    id: "seed-1",
    studentName: "Lucía Fernández",
    studentClass: "4º ESO A",
    score: 3420,
    levelReached: 5,
    totalTime: 185,
    accuracy: 95,
    answersCorrect: 24,
    answersTotal: 25,
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "seed-2",
    studentName: "Alejandro Gómez",
    studentClass: "1º Bachillerato B",
    score: 3190,
    levelReached: 5,
    totalTime: 210,
    accuracy: 92,
    answersCorrect: 23,
    answersTotal: 25,
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "seed-3",
    studentName: "Marta Sánchez",
    studentClass: "4º ESO B",
    score: 2950,
    levelReached: 4,
    totalTime: 195,
    accuracy: 88,
    answersCorrect: 21,
    answersTotal: 24,
    date: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "seed-4",
    studentName: "Pablo Navarro",
    studentClass: "3º ESO C",
    score: 2780,
    levelReached: 4,
    totalTime: 230,
    accuracy: 85,
    answersCorrect: 19,
    answersTotal: 22,
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "seed-5",
    studentName: "Carmen Morales",
    studentClass: "1º Bachillerato A",
    score: 2640,
    levelReached: 4,
    totalTime: 245,
    accuracy: 84,
    answersCorrect: 18,
    answersTotal: 22,
    date: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: "seed-6",
    studentName: "Hugo Vidal",
    studentClass: "FP Renovables",
    score: 2510,
    levelReached: 3,
    totalTime: 170,
    accuracy: 80,
    answersCorrect: 16,
    answersTotal: 20,
    date: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

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
  // Sort by score DESC, then totalTime ASC
  result.sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
  res.json({ success: true, count: result.length, data: result });
});

// POST score update / registration
app.post("/api/ranking", (req, res) => {
  try {
    const { studentName, studentClass, score, levelReached, totalTime, accuracy, answersCorrect, answersTotal } = req.body;
    if (!studentName || !studentClass) {
      res.status(400).json({ error: "El nombre del alumno y la clase son obligatorios" });
      return;
    }

    const cleanName = String(studentName).trim();
    const cleanClass = String(studentClass).trim();

    // Check if student already has a score in this class
    const existingIndex = rankingList.findIndex(
      (entry) =>
        entry.studentName.toLowerCase() === cleanName.toLowerCase() &&
        entry.studentClass.toLowerCase() === cleanClass.toLowerCase()
    );

    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      // Keep highest score or update if new score is higher
      if (Number(score) >= rankingList[existingIndex].score) {
        rankingList[existingIndex] = {
          ...rankingList[existingIndex],
          score: Math.max(rankingList[existingIndex].score, Number(score) || 0),
          levelReached: Math.max(rankingList[existingIndex].levelReached, Number(levelReached) || 1),
          totalTime: Number(totalTime) || rankingList[existingIndex].totalTime,
          accuracy: Number(accuracy) || rankingList[existingIndex].accuracy,
          answersCorrect: Number(answersCorrect) || rankingList[existingIndex].answersCorrect,
          answersTotal: Number(answersTotal) || rankingList[existingIndex].answersTotal,
          date: now,
        };
      }
    } else {
      const newEntry: ScoreEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentName: cleanName,
        studentClass: cleanClass,
        score: Number(score) || 0,
        levelReached: Number(levelReached) || 1,
        totalTime: Number(totalTime) || 0,
        accuracy: Number(accuracy) || 0,
        answersCorrect: Number(answersCorrect) || 0,
        answersTotal: Number(answersTotal) || 0,
        date: now,
      };
      rankingList.push(newEntry);
    }

    // Sort rankings
    rankingList.sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
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
