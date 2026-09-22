var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_meta = {};
var currentDir = typeof __dirname !== "undefined" ? __dirname : import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var RANKING_FILE = import_path.default.join(DATA_DIR, "ranking.json");
var DEFAULT_SCORES = [
  {
    id: "seed-1",
    studentName: "Luc\xEDa Fern\xE1ndez",
    studentClass: "4\xBA ESO A",
    score: 3420,
    levelReached: 5,
    totalTime: 185,
    accuracy: 95,
    answersCorrect: 24,
    answersTotal: 25,
    date: new Date(Date.now() - 36e5 * 2).toISOString()
  },
  {
    id: "seed-2",
    studentName: "Alejandro G\xF3mez",
    studentClass: "1\xBA Bachillerato B",
    score: 3190,
    levelReached: 5,
    totalTime: 210,
    accuracy: 92,
    answersCorrect: 23,
    answersTotal: 25,
    date: new Date(Date.now() - 36e5 * 5).toISOString()
  },
  {
    id: "seed-3",
    studentName: "Marta S\xE1nchez",
    studentClass: "4\xBA ESO B",
    score: 2950,
    levelReached: 4,
    totalTime: 195,
    accuracy: 88,
    answersCorrect: 21,
    answersTotal: 24,
    date: new Date(Date.now() - 36e5 * 12).toISOString()
  },
  {
    id: "seed-4",
    studentName: "Pablo Navarro",
    studentClass: "3\xBA ESO C",
    score: 2780,
    levelReached: 4,
    totalTime: 230,
    accuracy: 85,
    answersCorrect: 19,
    answersTotal: 22,
    date: new Date(Date.now() - 36e5 * 24).toISOString()
  },
  {
    id: "seed-5",
    studentName: "Carmen Morales",
    studentClass: "1\xBA Bachillerato A",
    score: 2640,
    levelReached: 4,
    totalTime: 245,
    accuracy: 84,
    answersCorrect: 18,
    answersTotal: 22,
    date: new Date(Date.now() - 36e5 * 30).toISOString()
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
    date: new Date(Date.now() - 36e5 * 48).toISOString()
  }
];
function loadScores() {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (import_fs.default.existsSync(RANKING_FILE)) {
      const data = import_fs.default.readFileSync(RANKING_FILE, "utf-8");
      return JSON.parse(data);
    }
    import_fs.default.writeFileSync(RANKING_FILE, JSON.stringify(DEFAULT_SCORES, null, 2), "utf-8");
    return DEFAULT_SCORES;
  } catch (err) {
    console.error("Error loading scores, fallback to defaults", err);
    return DEFAULT_SCORES;
  }
}
function saveScores(scores) {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    import_fs.default.writeFileSync(RANKING_FILE, JSON.stringify(scores, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving scores", err);
  }
}
var rankingList = loadScores();
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/ranking", (req, res) => {
  const filterClass = req.query.class;
  let result = [...rankingList];
  if (filterClass && filterClass !== "all") {
    result = result.filter((entry) => entry.studentClass.toLowerCase() === filterClass.toLowerCase());
  }
  result.sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
  res.json({ success: true, count: result.length, data: result });
});
app.post("/api/ranking", (req, res) => {
  try {
    const { studentName, studentClass, score, levelReached, totalTime, accuracy, answersCorrect, answersTotal } = req.body;
    if (!studentName || !studentClass) {
      res.status(400).json({ error: "El nombre del alumno y la clase son obligatorios" });
      return;
    }
    const cleanName = String(studentName).trim();
    const cleanClass = String(studentClass).trim();
    const existingIndex = rankingList.findIndex(
      (entry) => entry.studentName.toLowerCase() === cleanName.toLowerCase() && entry.studentClass.toLowerCase() === cleanClass.toLowerCase()
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (existingIndex >= 0) {
      if (Number(score) >= rankingList[existingIndex].score) {
        rankingList[existingIndex] = {
          ...rankingList[existingIndex],
          score: Math.max(rankingList[existingIndex].score, Number(score) || 0),
          levelReached: Math.max(rankingList[existingIndex].levelReached, Number(levelReached) || 1),
          totalTime: Number(totalTime) || rankingList[existingIndex].totalTime,
          accuracy: Number(accuracy) || rankingList[existingIndex].accuracy,
          answersCorrect: Number(answersCorrect) || rankingList[existingIndex].answersCorrect,
          answersTotal: Number(answersTotal) || rankingList[existingIndex].answersTotal,
          date: now
        };
      }
    } else {
      const newEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentName: cleanName,
        studentClass: cleanClass,
        score: Number(score) || 0,
        levelReached: Number(levelReached) || 1,
        totalTime: Number(totalTime) || 0,
        accuracy: Number(accuracy) || 0,
        answersCorrect: Number(answersCorrect) || 0,
        answersTotal: Number(answersTotal) || 0,
        date: now
      };
      rankingList.push(newEntry);
    }
    rankingList.sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
    saveScores(rankingList);
    const currentPosition = rankingList.findIndex(
      (e) => e.studentName.toLowerCase() === cleanName.toLowerCase() && e.studentClass.toLowerCase() === cleanClass.toLowerCase()
    ) + 1;
    res.json({ success: true, position: currentPosition, totalStudents: rankingList.length });
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({ error: "Error al guardar la puntuaci\xF3n" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Turbine 3D & Betz app running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
