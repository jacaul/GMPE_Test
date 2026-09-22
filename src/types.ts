export interface StudentProfile {
  name: string;
  studentClass: string;
  avatar: string;
  bestScore: number;
}

export type PartCategory = "aerodinamica" | "mecanica" | "electrica" | "estructural" | "control";

export interface TurbinePart {
  id: number; // 1 to 20 matching the uploaded diagram
  name: string;
  spanishName: string;
  englishName: string;
  category: PartCategory;
  categoryLabel: string;
  shortDescription: string;
  functionDetail: string;
  // Hotspot position on diagram (percentage coordinates 0-100)
  hotspot: {
    x: number; // % from left
    y: number; // % from top
    lineTarget: { x: number; y: number }; // where the pointer line leads to on the component
  };
  // 3D focus coordinate offset in local space
  threeFocus: {
    x: number;
    y: number;
    z: number;
  };
}

export interface QuizQuestion {
  id: string;
  level: number;
  category: "anatomia" | "mecanica" | "betz" | "calculo" | "desafio";
  title: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  diagramPartId?: number; // if related to one of the 20 parts
  timeLimit: number; // seconds
  points: number;
  hint?: string;
  formula?: string;
}

export interface ScoreEntry {
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

export interface GameState {
  currentLevel: number;
  totalScore: number;
  levelScore: number;
  streak: number;
  maxStreak: number;
  answersCorrect: number;
  answersTotal: number;
  elapsedSeconds: number;
  isGameActive: boolean;
  isLevelCompleted: boolean;
  completedLevels: number[];
}
