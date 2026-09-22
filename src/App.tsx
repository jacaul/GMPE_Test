import React, { useState, useEffect, useRef } from "react";
import { TurbineCanvas3D } from "./components/TurbineCanvas3D";
import { InteractiveDiagram } from "./components/InteractiveDiagram";
import { BetzSimulator } from "./components/BetzSimulator";
import { GlobalRankingModal } from "./components/GlobalRankingModal";
import { StudentAuthModal } from "./components/StudentAuthModal";
import { StudentCertificate } from "./components/StudentCertificate";
import { TimerBar } from "./components/TimerBar";
import { BETZ_QUESTIONS } from "./data/betzQuestions";
import { TURBINE_PARTS } from "./data/turbineData";
import { TurbinePart, QuizQuestion, StudentProfile, GameState } from "./types";
import { sounds } from "./utils/audio";
import {
  Trophy,
  Volume2,
  VolumeX,
  User,
  Zap,
  Flame,
  Award,
  BookOpen,
  Sliders,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function App() {
  // Student Profile State
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState<boolean>(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"quiz" | "diagrama" | "simulador">("quiz");

  // Selected turbine part (for 3D sync)
  const [selectedPart, setSelectedPart] = useState<TurbinePart | null>(TURBINE_PARTS[0]);
  const [windSpeed, setWindSpeed] = useState<number>(10);

  // Game / Quiz State
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState<number>(0);
  const [gameStartTime] = useState<number>(Date.now());
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  // Load profile from localStorage on start
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("turbine_student_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
      } else {
        setIsAuthModalOpen(true);
      }

      const savedScore = localStorage.getItem("turbine_saved_score");
      if (savedScore) {
        setScore(parseInt(savedScore, 10) || 0);
      }

      const savedLevels = localStorage.getItem("turbine_completed_levels");
      if (savedLevels) {
        setCompletedLevels(JSON.parse(savedLevels) || []);
      }
    } catch {
      setIsAuthModalOpen(true);
    }
  }, []);

  // Filter questions for current level
  const levelQuestions = BETZ_QUESTIONS.filter((q) => q.level === currentLevel);
  const currentQuestion: QuizQuestion | undefined = levelQuestions[currentQuestionIndex];

  // Sync 3D focus when current question has a diagramPartId
  useEffect(() => {
    if (currentQuestion && currentQuestion.diagramPartId) {
      const part = TURBINE_PARTS.find((p) => p.id === currentQuestion.diagramPartId);
      if (part) {
        setSelectedPart(part);
      }
    }
  }, [currentQuestionIndex, currentLevel, currentQuestion]);

  // Save profile handler
  const handleSaveProfile = (newProfile: StudentProfile) => {
    setProfile(newProfile);
    localStorage.setItem("turbine_student_profile", JSON.stringify(newProfile));
    setIsAuthModalOpen(false);

    // Initial server registration
    syncScoreToServer(newProfile, score, currentLevel, correctAnswersCount, totalQuestionsAnswered);
  };

  // Sync score to server API
  const syncScoreToServer = async (
    studProfile: StudentProfile,
    currentScore: number,
    level: number,
    correctCount: number,
    totalCount: number
  ) => {
    try {
      const totalTimeSecs = Math.max(1, Math.round((Date.now() - gameStartTime) / 1000));
      const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;

      await fetch("/api/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studProfile.name,
          studentClass: studProfile.studentClass,
          score: currentScore,
          levelReached: level,
          totalTime: totalTimeSecs,
          accuracy,
          answersCorrect: correctCount,
          answersTotal: totalCount,
        }),
      });

      // Update local best score
      if (currentScore > (studProfile.bestScore || 0)) {
        const updated = { ...studProfile, bestScore: currentScore };
        setProfile(updated);
        localStorage.setItem("turbine_student_profile", JSON.stringify(updated));
      }
      localStorage.setItem("turbine_saved_score", String(currentScore));

      // Also update local rankings cache for GitHub Pages static hosting
      try {
        const savedRankingsStr = localStorage.getItem("turbine_global_rankings");
        let list = savedRankingsStr ? JSON.parse(savedRankingsStr) : [];
        const existingIdx = list.findIndex(
          (item: any) =>
            item.studentName.toLowerCase() === studProfile.name.toLowerCase() &&
            item.studentClass.toLowerCase() === studProfile.studentClass.toLowerCase()
        );
        const newEntry = {
          id: existingIdx >= 0 ? list[existingIdx].id : `local-${Date.now()}`,
          studentName: studProfile.name,
          studentClass: studProfile.studentClass,
          score: currentScore,
          levelReached: level,
          totalTime: totalTimeSecs,
          accuracy,
          answersCorrect: correctCount,
          answersTotal: totalCount,
          date: new Date().toISOString(),
        };
        if (existingIdx >= 0) {
          if (currentScore >= list[existingIdx].score) {
            list[existingIdx] = newEntry;
          }
        } else {
          list.push(newEntry);
        }
        localStorage.setItem("turbine_global_rankings", JSON.stringify(list));
      } catch {
        // ignore
      }
    } catch (e) {
      console.warn("Could not sync with ranking API:", e);
    }
  };

  // Handle Option Click
  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted || !currentQuestion) return;
    sounds.playClick();
    setSelectedOption(idx);
    setIsAnswerSubmitted(true);
    setIsTimerActive(false);

    const isCorrect = idx === currentQuestion.correctIndex;
    const newTotal = totalQuestionsAnswered + 1;
    setTotalQuestionsAnswered(newTotal);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      sounds.playCorrect(newStreak);

      // Multiplier bonus based on streak (up to x3)
      const streakMultiplier = Math.min(3, 1 + (newStreak - 1) * 0.25);
      const earned = Math.round(currentQuestion.points * streakMultiplier);
      const newScore = score + earned;
      setScore(newScore);

      const newCorrect = correctAnswersCount + 1;
      setCorrectAnswersCount(newCorrect);

      if (profile) {
        syncScoreToServer(profile, newScore, currentLevel, newCorrect, newTotal);
      }
    } else {
      sounds.playWrong();
      setStreak(0);
      if (profile) {
        syncScoreToServer(profile, score, currentLevel, correctAnswersCount, newTotal);
      }
    }
  };

  // Timeout handler
  const handleTimeout = () => {
    if (isAnswerSubmitted || !currentQuestion) return;
    sounds.playWrong();
    setIsAnswerSubmitted(true);
    setIsTimerActive(false);
    setSelectedOption(-1); // timeout indicator
    setStreak(0);

    const newTotal = totalQuestionsAnswered + 1;
    setTotalQuestionsAnswered(newTotal);
    if (profile) {
      syncScoreToServer(profile, score, currentLevel, correctAnswersCount, newTotal);
    }
  };

  // Next Question or Next Level
  const handleNextQuestion = () => {
    sounds.playClick();
    if (currentQuestionIndex + 1 < levelQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setIsTimerActive(true);
    } else {
      // Level completed!
      sounds.playFanfare();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      if (!completedLevels.includes(currentLevel)) {
        const updatedLevels = [...completedLevels, currentLevel];
        setCompletedLevels(updatedLevels);
        localStorage.setItem("turbine_completed_levels", JSON.stringify(updatedLevels));
      }

      if (currentLevel < 5) {
        setCurrentLevel(currentLevel + 1);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
        setIsTimerActive(true);
      } else {
        // Full game completed! Open certificate
        setIsCertificateOpen(true);
      }
    }
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Reset quiz progress
  const handleRestartQuiz = () => {
    sounds.playClick();
    setCurrentLevel(1);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsTimerActive(true);
    setScore(0);
    setStreak(0);
  };

  const accuracyPercent =
    totalQuestionsAnswered > 0 ? Math.round((correctAnswersCount / totalQuestionsAnswered) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white font-sans">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 flex items-center justify-center font-extrabold shadow-md shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              Aerogenerador 3D & Límite de Betz
            </h1>
            <a
              href="https://github.com/jacaul/limite-de-Betz_cr/blob/main/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <span>Basado en jacaul / limite-de-Betz_cr</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("quiz");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "quiz" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Desafío & Niveles</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("diagrama");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "diagrama" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Diagrama (20 Piezas)</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("simulador");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "simulador" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulador Betz</span>
          </button>
        </div>

        {/* Right: Student Profile, Score & Ranking Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Score Counter */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono">
            <span className="text-xs text-slate-400">Puntos:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{score.toLocaleString()}</span>
            {streak > 1 && (
              <span className="flex items-center gap-0.5 text-xs font-extrabold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">
                <Flame className="w-3 h-3 fill-current" />
                x{Math.min(3, 1 + (streak - 1) * 0.25).toFixed(1)}
              </span>
            )}
          </div>

          {/* Ranking Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsRankingModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Ranking</span>
          </button>

          {/* Student Profile Pill */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsAuthModalOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
              {profile ? profile.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left hidden lg:block max-w-[120px]">
              <span className="block font-semibold truncate text-[11px] leading-tight">
                {profile ? profile.name : "Identifícate"}
              </span>
              <span className="text-[10px] text-slate-400 block truncate leading-tight">
                {profile ? profile.studentClass : "Sin clase"}
              </span>
            </div>
          </button>

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isMuted ? "Activar sonido" : "Silenciar sonido"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MOBILE TAB BAR */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-950/90 px-3 py-2 gap-2 overflow-x-auto">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("quiz");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeTab === "quiz" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-300"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Preguntas</span>
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("diagrama");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeTab === "diagrama" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-300"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Diagrama 20p</span>
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("simulador");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
            activeTab === "simulador" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-300"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Simulador</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 flex flex-col gap-5">
        {/* LEVEL PROGRESSOR HEADER */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const isCurrent = currentLevel === lvl;
              const isDone = completedLevels.includes(lvl);
              const label =
                lvl === 1
                  ? "1. Anatomía"
                  : lvl === 2
                  ? "2. Góndola"
                  : lvl === 3
                  ? "3. Límite de Betz"
                  : lvl === 4
                  ? "4. Curva de Potencia"
                  : "5. Desafío Experto";

              return (
                <button
                  key={lvl}
                  onClick={() => {
                    sounds.playClick();
                    setCurrentLevel(lvl);
                    setActiveTab("quiz");
                    setCurrentQuestionIndex(0);
                    setSelectedOption(null);
                    setIsAnswerSubmitted(false);
                    setIsTimerActive(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    isCurrent && activeTab === "quiz"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                      : isDone
                      ? "bg-slate-950 text-emerald-400 border-emerald-500/40"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span>{isDone ? "✓ " : ""}{label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCertificateOpen(true)}
              className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-colors font-medium"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Diploma</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENT: QUIZ / DESAFÍO */}
        {activeTab === "quiz" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
            {/* Left 3D Interactive Viewport (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3 min-h-[420px]">
              <div className="flex-1 relative rounded-2xl overflow-hidden shadow-2xl">
                <TurbineCanvas3D
                  selectedPart={selectedPart}
                  onSelectPart={(part) => setSelectedPart(part)}
                  windSpeed={windSpeed}
                  isXRayDefault={true}
                />
              </div>

              {/* Wind Speed Control Slider */}
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-300 font-medium whitespace-nowrap">Velocidad del viento 3D:</span>
                <input
                  type="range"
                  min="3"
                  max="25"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <span className="font-mono font-bold text-emerald-400 w-12 text-right">
                  {windSpeed} m/s
                </span>
              </div>
            </div>

            {/* Right Question Card (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              {currentQuestion ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between gap-5 flex-1 relative overflow-hidden">
                  {/* Question header info */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          Nivel {currentLevel} • {currentQuestion.category.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Pregunta {currentQuestionIndex + 1} de {levelQuestions.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        +{currentQuestion.points} pts
                      </div>
                    </div>

                    {/* Timer Bar */}
                    <TimerBar
                      duration={currentQuestion.timeLimit}
                      isActive={isTimerActive}
                      onTimeout={handleTimeout}
                      resetKey={`${currentLevel}-${currentQuestionIndex}`}
                    />

                    {/* Question Title & Statement */}
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
                        {currentQuestion.title}
                      </h2>
                      <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                        {currentQuestion.question}
                      </p>
                    </div>

                    {/* Formula box if present */}
                    {currentQuestion.formula && (
                      <div className="bg-slate-950/80 border border-cyan-500/30 p-2.5 rounded-xl font-mono text-xs text-cyan-300">
                        Ecuación de referencia: <strong>{currentQuestion.formula}</strong>
                      </div>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === currentQuestion.correctIndex;

                      let btnStyle =
                        "bg-slate-950/80 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200";

                      if (isAnswerSubmitted) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md ring-1 ring-emerald-500/50";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-950/60 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/50";
                        } else {
                          btnStyle = "bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswerSubmitted}
                          onClick={() => handleSelectOption(idx)}
                          className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${btnStyle}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono ${
                              isAnswerSubmitted && isCorrect
                                ? "bg-emerald-500 text-slate-950"
                                : isAnswerSubmitted && isSelected
                                ? "bg-rose-500 text-white"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 leading-snug">{option}</span>
                          {isAnswerSubmitted && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                          {isAnswerSubmitted && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation Card */}
                  {isAnswerSubmitted && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            selectedOption === currentQuestion.correctIndex
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {selectedOption === currentQuestion.correctIndex ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          <strong
                            className={`block mb-1 font-bold ${
                              selectedOption === currentQuestion.correctIndex
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {selectedOption === currentQuestion.correctIndex
                              ? "¡Excelente respuesta!"
                              : selectedOption === -1
                              ? "¡Tiempo agotado!"
                              : "Respuesta incorrecta"}
                          </strong>
                          {currentQuestion.explanation}
                        </div>
                      </div>

                      <button
                        onClick={handleNextQuestion}
                        className="self-end px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <span>
                          {currentQuestionIndex + 1 < levelQuestions.length
                            ? "Siguiente Pregunta"
                            : currentLevel < 5
                            ? "Completar Nivel y Avanzar"
                            : "Ver Resultados Finales"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">¡Nivel Completado!</h3>
                  <p className="text-sm text-slate-400 max-w-sm">
                    Has completado las preguntas de este nivel con éxito.
                  </p>
                  <button
                    onClick={handleRestartQuiz}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm"
                  >
                    Volver a Jugar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: INTERACTIVE DIAGRAM (The 20-Part Game) */}
        {activeTab === "diagrama" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <InteractiveDiagram
              selectedPart={selectedPart}
              onSelectPart={(part) => setSelectedPart(part)}
              onContinueToQuiz={() => setActiveTab("quiz")}
              onPartMatched={(part, isCorrect) => {
                if (isCorrect) {
                  const earned = 100;
                  const newScore = score + earned;
                  setScore(newScore);
                  const newCorrect = correctAnswersCount + 1;
                  const newTotal = totalQuestionsAnswered + 1;
                  setCorrectAnswersCount(newCorrect);
                  setTotalQuestionsAnswered(newTotal);

                  if (profile) {
                    syncScoreToServer(profile, newScore, currentLevel, newCorrect, newTotal);
                  }
                }
              }}
            />
          </div>
        )}

        {/* TAB CONTENT: BETZ SIMULATOR */}
        {activeTab === "simulador" && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <BetzSimulator onContinueToQuiz={() => setActiveTab("quiz")} />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 py-4 px-4 bg-slate-950 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <div>
          <span>Aerogenerador 3D y Límite de Betz • Aplicación Didáctica Interactiva</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/jacaul/limite-de-Betz_cr/blob/main/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>GitHub: jacaul/limite-de-Betz_cr</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>

      {/* MODALS */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onSaveProfile={handleSaveProfile}
        initialProfile={profile}
      />

      <GlobalRankingModal
        isOpen={isRankingModalOpen}
        onClose={() => setIsRankingModalOpen(false)}
        currentProfile={profile}
        currentScore={score}
      />

      {profile && (
        <StudentCertificate
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          profile={profile}
          score={score}
          levelReached={currentLevel}
          accuracy={accuracyPercent}
        />
      )}
    </div>
  );
}
