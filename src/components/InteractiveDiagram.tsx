import React, { useState, useEffect, useRef } from "react";
import { TURBINE_PARTS } from "../data/turbineData";
import { TurbinePart } from "../types";
import { sounds } from "../utils/audio";
import {
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Layers,
  Shuffle,
  ArrowRight,
  Clock,
  Eye,
  Box,
  AlertTriangle,
  Compass,
} from "lucide-react";
import confetti from "canvas-confetti";
import { TurbineCanvas3D } from "./TurbineCanvas3D";

interface InteractiveDiagramProps {
  onPartMatched?: (part: TurbinePart, isCorrect: boolean, bonusScore?: number) => void;
  selectedPart?: TurbinePart | null;
  onSelectPart?: (part: TurbinePart) => void;
  onContinueToQuiz?: () => void;
  onDiagramCompleted?: (completed: boolean) => void;
}

const SECONDS_PER_PART = 20;

export const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({
  onPartMatched,
  selectedPart,
  onSelectPart,
  onContinueToQuiz,
  onDiagramCompleted,
}) => {
  // Map of part ID -> user matched part ID
  const [matchedMap, setMatchedMap] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem("turbine_diagram_matched");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [activeTargetId, setActiveTargetId] = useState<number | null>(1);
  const [wrongShakeId, setWrongShakeId] = useState<number | null>(null);
  const [showTechnicalList, setShowTechnicalList] = useState<boolean>(true);
  const [displayMode, setDisplayMode] = useState<"2d" | "3d" | "split">("2d");
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Timer per part
  const [timeLeft, setTimeLeft] = useState<number>(SECONDS_PER_PART);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Shuffled parts list so the options are NOT in order 1..20
  const [shuffledParts, setShuffledParts] = useState<TurbinePart[]>(() => {
    return [...TURBINE_PARTS].sort(() => Math.random() - 0.5);
  });

  const handleShuffle = () => {
    sounds.playClick();
    setShuffledParts([...TURBINE_PARTS].sort(() => Math.random() - 0.5));
  };

  // Completed count
  const completedCount = Object.keys(matchedMap).length;
  const isAllCompleted = completedCount === TURBINE_PARTS.length;

  // Active target part (what the question is asking for)
  const currentActivePart = activeTargetId ? TURBINE_PARTS.find((p) => p.id === activeTargetId) : null;

  // Timer countdown effect
  useEffect(() => {
    if (isAllCompleted || !activeTargetId) return;

    setTimeLeft(SECONDS_PER_PART);
    setIsTimedOut(false);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        if (prev <= 5 && prev > 1) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTargetId, isAllCompleted]);

  const handleTimeExpired = () => {
    sounds.playWrong();
    setIsTimedOut(true);
    setWrongShakeId(activeTargetId);

    if (currentActivePart && onPartMatched) {
      onPartMatched(currentActivePart, false, 0);
    }

    setResetNotice("¡Tiempo agotado! Se han barajado las respuestas y se reinicia el diagrama desde cero (0/20).");
    setTimeout(() => setResetNotice(null), 3500);

    // Reshuffle parts options
    setShuffledParts([...TURBINE_PARTS].sort(() => Math.random() - 0.5));
    // Clear matches and localStorage
    setMatchedMap({});
    localStorage.removeItem("turbine_diagram_matched");
    if (onDiagramCompleted) onDiagramCompleted(false);

    setTimeout(() => {
      setWrongShakeId(null);
      setIsTimedOut(false);
      setActiveTargetId(1);
      setTimeLeft(SECONDS_PER_PART);
      const firstPart = TURBINE_PARTS.find((p) => p.id === 1);
      if (firstPart && onSelectPart) onSelectPart(firstPart);
    }, 1200);
  };

  const handleSelectHotspot = (partId: number) => {
    sounds.playClick();
    setActiveTargetId(partId);
    const targetPart = TURBINE_PARTS.find((p) => p.id === partId);
    if (targetPart && onSelectPart) {
      onSelectPart(targetPart);
    }
  };

  const handleChooseName = (chosenPart: TurbinePart) => {
    if (!activeTargetId || isTimedOut) return;

    if (chosenPart.id === activeTargetId) {
      // Correct!
      if (timerRef.current) clearInterval(timerRef.current);
      sounds.playCorrect(completedCount + 1);

      const speedBonus = Math.round((timeLeft / SECONDS_PER_PART) * 50);
      const newMap = { ...matchedMap, [activeTargetId]: chosenPart.id };
      setMatchedMap(newMap);
      localStorage.setItem("turbine_diagram_matched", JSON.stringify(newMap));

      if (onPartMatched) {
        onPartMatched(chosenPart, true, 100 + speedBonus);
      }

      // Check if finished
      if (Object.keys(newMap).length === TURBINE_PARTS.length) {
        sounds.playFanfare();
        if (onDiagramCompleted) onDiagramCompleted(true);
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }

      // Advance to next uncompleted target
      const nextUnsolved = TURBINE_PARTS.find((p) => !newMap[p.id]);
      if (nextUnsolved) {
        setActiveTargetId(nextUnsolved.id);
        if (onSelectPart) onSelectPart(nextUnsolved);
      } else {
        setActiveTargetId(null);
      }
    } else {
      // Incorrect -> Reshuffle options and restart diagram from 0!
      sounds.playWrong();
      setWrongShakeId(activeTargetId);

      if (onPartMatched) {
        onPartMatched(chosenPart, false, 0);
      }

      setResetNotice("¡Respuesta incorrecta! Se han barajado las respuestas y se reinicia desde cero (0/20).");
      setTimeout(() => setResetNotice(null), 3500);

      // Reshuffle parts options
      setShuffledParts([...TURBINE_PARTS].sort(() => Math.random() - 0.5));
      // Clear matches and localStorage
      setMatchedMap({});
      localStorage.removeItem("turbine_diagram_matched");
      if (onDiagramCompleted) onDiagramCompleted(false);

      setTimeout(() => {
        setWrongShakeId(null);
        setActiveTargetId(1);
        setTimeLeft(SECONDS_PER_PART);
        const firstPart = TURBINE_PARTS.find((p) => p.id === 1);
        if (firstPart && onSelectPart) onSelectPart(firstPart);
      }, 700);
    }
  };

  const handleReset = () => {
    sounds.playClick();
    setMatchedMap({});
    localStorage.removeItem("turbine_diagram_matched");
    if (onDiagramCompleted) onDiagramCompleted(false);
    setActiveTargetId(1);
    setTimeLeft(SECONDS_PER_PART);
    const firstPart = TURBINE_PARTS.find((p) => p.id === 1);
    if (firstPart && onSelectPart) onSelectPart(firstPart);
  };

  // Timer color
  const timerPercent = (timeLeft / SECONDS_PER_PART) * 100;
  const timerColor =
    timeLeft > 10 ? "bg-emerald-500" : timeLeft > 5 ? "bg-amber-500" : "bg-rose-500 animate-pulse";

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
            20
          </div>
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              Diagrama Técnico del Aerogenerador (20 Piezas)
              {isAllCompleted && (
                <span className="text-xs bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ¡Completado!
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Observa el número activo en el esquema y adivina el componente correcto en el banco de términos.
            </p>
          </div>
        </div>

        {/* View mode toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mode switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                sounds.playClick();
                setDisplayMode("2d");
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                displayMode === "2d" ? "bg-slate-800 text-cyan-300 shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Plano 2D</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setDisplayMode("3d");
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                displayMode === "3d" ? "bg-slate-800 text-emerald-300 shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Modelo 3D</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setDisplayMode("split");
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                displayMode === "split" ? "bg-slate-800 text-amber-300 shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>2D + 3D</span>
            </button>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Aciertos:</span>
            <span className="ml-1.5 text-sm font-bold text-emerald-400 font-mono">
              {completedCount} / {TURBINE_PARTS.length}
            </span>
          </div>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
            title="Desordenar / Barajar opciones"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reiniciar diagrama"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onContinueToQuiz && (
            <button
              onClick={() => {
                sounds.playClick();
                onContinueToQuiz();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md"
            >
              <span>Ir al Cuestionario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* RESET NOTICE BANNER ON WRONG ANSWER OR TIMEOUT */}
      {resetNotice && (
        <div className="bg-rose-950/90 border border-rose-500/80 p-3 rounded-xl flex items-center gap-3 text-rose-200 text-xs sm:text-sm font-bold shadow-lg animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          <span>{resetNotice}</span>
        </div>
      )}

      {/* QUESTION BANNER WITH ACTIVE COMPONENT & TIME LIMIT */}
      {!isAllCompleted && activeTargetId && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-sky-500/30 animate-pulse">
              #{activeTargetId}
            </div>
            <div>
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                Objetivo Activo:
              </span>
              <span className="text-sm font-bold text-white">
                ¿Qué componente técnico señala el número #{activeTargetId}?
              </span>
            </div>
          </div>

          {/* TIMER INDICATOR */}
          <div className="flex items-center gap-3 min-w-[200px] flex-1 sm:flex-initial justify-end">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 font-mono">
              <Clock className={`w-4 h-4 ${timeLeft <= 5 ? "text-rose-400 animate-spin" : "text-emerald-400"}`} />
              <span className={timeLeft <= 5 ? "text-rose-400 font-black text-sm" : "text-white"}>
                {timeLeft}s
              </span>
            </div>
            <div className="w-32 sm:w-44 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-300 rounded-full ${timerColor}`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TIME-OUT ALERT BANNER */}
      {isTimedOut && (
        <div className="p-2.5 bg-rose-950/70 border border-rose-500/60 rounded-xl text-rose-300 text-xs flex items-center justify-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span className="font-bold">¡Tiempo agotado para la pieza #{activeTargetId}! Pasando a la siguiente...</span>
        </div>
      )}

      {/* MAIN VISUAL AREA (2D, 3D, OR SPLIT) */}
      <div
        className={`w-full gap-4 ${
          displayMode === "split" ? "grid grid-cols-1 lg:grid-cols-2" : "flex flex-col"
        }`}
      >
        {/* 2D TECHNICAL BLUEPRINT */}
        {(displayMode === "2d" || displayMode === "split") && (
          <div className="relative w-full aspect-[16/9] min-h-[300px] max-h-[460px] bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 rounded-xl overflow-hidden border border-slate-800/90 shadow-2xl flex items-center justify-center select-none">
            <svg
              viewBox="0 0 1000 580"
              className="w-full h-full object-contain"
              style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.7))" }}
            >
              <defs>
                {/* Metallic Gradients */}
                <linearGradient id="towerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="35%" stopColor="#f8fafc" />
                  <stop offset="70%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>

                <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>

                <linearGradient id="gearboxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#0369a1" />
                  <stop offset="100%" stopColor="#0c4a6e" />
                </linearGradient>

                <linearGradient id="genGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="50%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>

                <linearGradient id="brakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>

                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* TECHNICAL CAD GRID BACKGROUND */}
              <rect width="1000" height="580" fill="#080c16" />
              <g opacity="0.12" stroke="#38bdf8" strokeWidth="0.5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="580" />
                ))}
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} />
                ))}
              </g>

              {/* WIND DIRECTION ARROWS (Upwind to Downwind) */}
              <g opacity="0.4" stroke="#38bdf8" strokeWidth="1.5">
                <line x1="20" y1="120" x2="80" y2="120" markerEnd="url(#arrow)" />
                <path d="M 70 115 L 80 120 L 70 125" fill="none" />
                <line x1="20" y1="250" x2="70" y2="250" />
                <path d="M 60 245 L 70 250 L 60 255" fill="none" />
                <line x1="20" y1="380" x2="80" y2="380" />
                <path d="M 70 375 L 80 380 L 70 385" fill="none" />
                <text x="30" y="105" fill="#38bdf8" fontSize="10" fontWeight="bold">VIENTO INCIDENTE (v₁)</text>
              </g>

              {/* 1. TOWER (Pieza 14: Torre) */}
              <path
                d="M 530 380 L 515 580 L 665 580 L 650 380 Z"
                fill="url(#towerGrad)"
                stroke="#334155"
                strokeWidth="2.5"
              />
              {/* Internal ladder / flange segments */}
              <line x1="526" y1="440" x2="654" y2="440" stroke="#475569" strokeWidth="1.5" />
              <line x1="522" y1="510" x2="658" y2="510" stroke="#475569" strokeWidth="1.5" />

              {/* 2. YAW SYSTEM (Piezas 15 y 16: Anillo y Cojinete de Orientación) */}
              <rect x="525" y="360" width="130" height="20" rx="3" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
              <line x1="530" y1="370" x2="650" y2="370" stroke="#0f172a" strokeWidth="3" strokeDasharray="6,4" />
              {/* Yaw motor pinions */}
              <circle cx="540" cy="370" r="5" fill="#334155" stroke="#94a3b8" />
              <circle cx="640" cy="370" r="5" fill="#334155" stroke="#94a3b8" />

              {/* 3. BEDPLATE (Pieza 17: Placa de asiento de la góndola) */}
              <polygon
                points="480,360 885,360 875,335 490,335"
                fill="#334155"
                stroke="#1e293b"
                strokeWidth="2.5"
              />
              <line x1="495" y1="347" x2="870" y2="347" stroke="#64748b" strokeWidth="1.5" strokeDasharray="10,4" />

              {/* 4. NACELLE CANOPY SHELL (Pieza 19: Dosel / cubierta de la góndola) */}
              <g id="nacelle-canopy-group" className="transition-all">
                {/* Outer fiberglass composite shell with thickness */}
                <path
                  d="M 455 220 C 455 150, 545 140, 840 142 C 915 144, 940 195, 940 280 C 940 342, 898 358, 875 358 L 475 358 Z"
                  fill={activeTargetId === 19 ? "#0284c7" : "#0f172a"}
                  fillOpacity={activeTargetId === 19 ? "0.22" : "0.07"}
                  stroke={activeTargetId === 19 ? "#38bdf8" : "#0284c7"}
                  strokeWidth={activeTargetId === 19 ? "4" : "2.5"}
                  className={activeTargetId === 19 ? "animate-pulse" : ""}
                />
                {/* Inner shell boundary / wall thickness (sandwich core) */}
                <path
                  d="M 465 222 C 465 158, 550 148, 835 150 C 905 152, 930 200, 930 275 C 930 334, 890 348, 870 348 L 485 348"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="6,4"
                  opacity={activeTargetId === 19 ? "0.9" : "0.45"}
                />
                {/* Roof maintenance access hatches & railing (Pieza 19) */}
                <rect x="610" y="137" width="70" height="7" rx="2" fill={activeTargetId === 19 ? "#38bdf8" : "#0284c7"} stroke="#38bdf8" strokeWidth="1.5" />
                <rect x="760" y="139" width="75" height="7" rx="2" fill={activeTargetId === 19 ? "#38bdf8" : "#0284c7"} stroke="#38bdf8" strokeWidth="1.5" />
                {/* Roof safety handrail */}
                <line x1="590" y1="134" x2="850" y2="136" stroke="#94a3b8" strokeWidth="1.8" />
                <line x1="600" y1="134" x2="600" y2="142" stroke="#94a3b8" strokeWidth="1.8" />
                <line x1="720" y1="135" x2="720" y2="142" stroke="#94a3b8" strokeWidth="1.8" />
                <line x1="840" y1="136" x2="840" y2="142" stroke="#94a3b8" strokeWidth="1.8" />
                {/* Distinct Canopy Label tag */}
                <g transform="translate(775, 128)">
                  <rect x="-4" y="-10" width="108" height="15" rx="3" fill="#0369a1" fillOpacity="0.85" stroke="#38bdf8" strokeWidth="1" />
                  <text x="50" y="1" fill="#f0f9ff" fontSize="8.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
                    DOSEL / CUBIERTA (#19)
                  </text>
                </g>
                {/* Canopy tail aerodynamic cooling vents */}
                <line x1="915" y1="230" x2="935" y2="230" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
                <line x1="915" y1="245" x2="935" y2="245" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
                <line x1="915" y1="260" x2="935" y2="260" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
                {/* Canopy tail aerodynamic fin */}
                <polygon points="840,142 925,65 935,115 925,145" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              </g>

              {/* 5. METEOROLOGICAL SENSORS (Pieza 13: Sensores meteorológicos) */}
              <line x1="925" y1="65" x2="930" y2="28" stroke="#f8fafc" strokeWidth="3" />
              <circle cx="930" cy="28" r="6" fill="#ef4444" />
              <line x1="912" y1="40" x2="948" y2="40" stroke="#f8fafc" strokeWidth="2.5" />
              <circle cx="912" cy="40" r="4" fill="#38bdf8" />
              <circle cx="948" cy="40" r="4" fill="#38bdf8" />

              {/* 6. ROTOR HUB (Pieza 5: Buje) & NOSE CONE (Pieza 1: Cono de la hélice) */}
              {/* Outer Nose cone with cutaway showing internal bracket */}
              <path
                d="M 330 160 C 270 180, 200 240, 60 255 C 200 270, 270 330, 330 350 Z"
                fill="url(#bladeGrad)"
                fillOpacity={activeTargetId === 2 ? "0.35" : "0.75"}
                stroke="#64748b"
                strokeWidth="3.5"
              />
              <path
                d="M 330 160 C 270 180, 200 240, 60 255"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* SPINNER SUPPORT BRACKET & RING (Pieza 2: Soporte del cono) */}
              {/* Highly detailed structural tubular steel truss & mounting arms */}
              <g id="spinner-support-bracket" className="transition-all">
                {/* Rear mounting ring flange on hub */}
                <ellipse
                  cx="320"
                  cy="255"
                  rx="32"
                  ry="92"
                  fill="#0f172a"
                  stroke={activeTargetId === 2 ? "#f59e0b" : "#38bdf8"}
                  strokeWidth={activeTargetId === 2 ? "3.5" : "2"}
                  className={activeTargetId === 2 ? "animate-pulse" : ""}
                />
                {/* Forward support collar ring */}
                <ellipse
                  cx="245"
                  cy="255"
                  rx="22"
                  ry="64"
                  fill="#1e293b"
                  stroke={activeTargetId === 2 ? "#fbbf24" : "#0284c7"}
                  strokeWidth={activeTargetId === 2 ? "3" : "1.8"}
                />

                {/* Heavy structural diagonal steel struts / trusses connecting hub to cone tip */}
                {/* Upper diagonal strut arm (Pointer #2 lands right here!) */}
                <polygon
                  points="320,185 315,195 240,225 242,215"
                  fill={activeTargetId === 2 ? "#f59e0b" : "#475569"}
                  stroke={activeTargetId === 2 ? "#fef08a" : "#94a3b8"}
                  strokeWidth="2"
                />
                {/* Lower diagonal strut arm */}
                <polygon
                  points="320,325 315,315 240,285 242,295"
                  fill={activeTargetId === 2 ? "#f59e0b" : "#475569"}
                  stroke={activeTargetId === 2 ? "#fef08a" : "#94a3b8"}
                  strokeWidth="2"
                />
                {/* Center axial support tube */}
                <rect
                  x="180"
                  y="250"
                  width="135"
                  height="10"
                  fill={activeTargetId === 2 ? "#d97706" : "#334155"}
                  stroke={activeTargetId === 2 ? "#fde047" : "#64748b"}
                  strokeWidth="1.5"
                />
                {/* Nose tip cone mount spider */}
                <polygon
                  points="245,220 180,250 180,260 245,290"
                  fill="none"
                  stroke={activeTargetId === 2 ? "#fbbf24" : "#38bdf8"}
                  strokeWidth="2"
                  strokeDasharray="4,2"
                />

                {/* Bolted mounting lugs with high-strength bolts */}
                <circle cx="275" cy="209" r="6" fill={activeTargetId === 2 ? "#ef4444" : "#0284c7"} stroke="#ffffff" strokeWidth="2" />
                <circle cx="318" cy="188" r="4.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx="318" cy="225" r="4.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx="318" cy="285" r="4.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx="318" cy="322" r="4.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />

                {/* Distinct tag for Spinner Bracket (#2) */}
                <g transform="translate(230, 185)">
                  <rect x="-2" y="-10" width="94" height="15" rx="3" fill="#78350f" fillOpacity="0.85" stroke="#f59e0b" strokeWidth="1" />
                  <text x="45" y="1" fill="#fef3c7" fontSize="8" fontWeight="bold" textAnchor="middle">
                    SOPORTE CONO (#2)
                  </text>
                </g>
              </g>

              {/* BLADES (Pieza 3: Pala) */}
              {/* Top Blade */}
              <path
                d="M 345 165 C 350 90, 360 20, 370 -40 C 350 20, 330 90, 320 165 Z"
                fill="url(#bladeGrad)"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              {/* Bottom Blade */}
              <path
                d="M 345 345 C 365 420, 380 480, 420 560 C 370 480, 335 420, 320 345 Z"
                fill="url(#bladeGrad)"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              {/* Pitch Bearings (Pieza 4: Cojinete de paso) */}
              <ellipse cx="335" cy="165" rx="24" ry="9" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
              <ellipse cx="335" cy="345" rx="24" ry="9" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />

              {/* 7. MAIN BEARING (Pieza 6: Cojinete principal) */}
              <rect x="475" y="225" width="40" height="60" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="495" cy="245" r="5" fill="#e0f2fe" />
              <circle cx="495" cy="265" r="5" fill="#e0f2fe" />

              {/* 8. MAIN SHAFT (Pieza 7: Eje principal) */}
              <rect x="345" y="240" width="160" height="30" fill="url(#shaftGrad)" stroke="#475569" strokeWidth="2" />
              <line x1="360" y1="255" x2="495" y2="255" stroke="#f8fafc" strokeWidth="2.5" strokeDasharray="8,6" />

              {/* 9. GEARBOX (Pieza 8: Multiplicadora) */}
              <rect x="505" y="200" width="130" height="110" rx="8" fill="url(#gearboxGrad)" stroke="#38bdf8" strokeWidth="2.5" />
              {/* Planetary gears visual */}
              <circle cx="570" cy="255" r="38" fill="#082f49" stroke="#0284c7" strokeWidth="2" />
              <circle cx="570" cy="255" r="14" fill="#38bdf8" />
              <circle cx="550" cy="240" r="10" fill="#0ea5e9" opacity="0.8" />
              <circle cx="590" cy="240" r="10" fill="#0ea5e9" opacity="0.8" />
              <circle cx="570" cy="275" r="10" fill="#0ea5e9" opacity="0.8" />
              <text x="570" y="259" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                1:90
              </text>

              {/* 10. OIL FILTER (Pieza 18: Filtro de aceite) */}
              <rect x="710" y="275" width="22" height="48" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
              <line x1="712" y1="290" x2="730" y2="290" stroke="#713f12" strokeWidth="1.5" />

              {/* 11. DISC BRAKE & HYDRAULIC CALIPER (Pieza 9: Disco del freno) */}
              <g id="brake-system" className="transition-all">
                {/* Ventilated high-speed brake disc */}
                <rect
                  x="650"
                  y="190"
                  width="18"
                  height="130"
                  rx="3"
                  fill="url(#brakeGrad)"
                  stroke={activeTargetId === 9 ? "#f59e0b" : "#b45309"}
                  strokeWidth={activeTargetId === 9 ? "3.5" : "2"}
                  className={activeTargetId === 9 ? "animate-pulse" : ""}
                />
                {/* Radial cooling air slots & cross-drilled holes */}
                <line x1="653" y1="210" x2="665" y2="210" stroke="#451a03" strokeWidth="2" />
                <line x1="653" y1="225" x2="665" y2="225" stroke="#451a03" strokeWidth="2" />
                <line x1="653" y1="240" x2="665" y2="240" stroke="#451a03" strokeWidth="2" />
                <line x1="653" y1="255" x2="665" y2="255" stroke="#451a03" strokeWidth="2" />
                <line x1="653" y1="270" x2="665" y2="270" stroke="#451a03" strokeWidth="2" />
                <line x1="653" y1="285" x2="665" y2="285" stroke="#451a03" strokeWidth="2" />
                <line x1="653" y1="300" x2="665" y2="300" stroke="#451a03" strokeWidth="2" />

                {/* Dual-Piston Hydraulic Brake Caliper (Brembo style in bright racing red) */}
                <rect
                  x="638"
                  y="186"
                  width="42"
                  height="40"
                  rx="5"
                  fill={activeTargetId === 9 ? "#ef4444" : "#dc2626"}
                  stroke={activeTargetId === 9 ? "#fecaca" : "#991b1b"}
                  strokeWidth={activeTargetId === 9 ? "3" : "2"}
                />
                {/* Caliper pistons */}
                <circle cx="648" cy="206" r="5" fill="#fef2f2" stroke="#991b1b" strokeWidth="1.5" />
                <circle cx="670" cy="206" r="5" fill="#fef2f2" stroke="#991b1b" strokeWidth="1.5" />
                {/* Hydraulic brake fluid hose */}
                <line x1="659" y1="186" x2="659" y2="168" stroke="#ef4444" strokeWidth="3" />
                <line x1="659" y1="168" x2="635" y2="168" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,2" />

                {/* Disc Brake label tag */}
                <g transform="translate(615, 155)">
                  <rect x="-2" y="-10" width="88" height="15" rx="3" fill="#7f1d1d" fillOpacity="0.9" stroke="#ef4444" strokeWidth="1" />
                  <text x="42" y="1" fill="#fee2e2" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                    DISCO FRENO (#9)
                  </text>
                </g>
              </g>

              {/* 12. HIGH SPEED SHAFT & COUPLING (Pieza 10: Acoplamiento) */}
              <rect x="635" y="250" width="50" height="10" fill="#94a3b8" />
              <rect x="680" y="238" width="28" height="34" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
              <line x1="694" y1="240" x2="694" y2="270" stroke="#f1f5f9" strokeWidth="1.5" />

              {/* 13. GENERATOR (Pieza 11: Generador) */}
              <rect x="720" y="195" width="135" height="115" rx="10" fill="url(#genGrad)" stroke="#60a5fa" strokeWidth="2.5" />
              {/* Copper stator windings hint */}
              <rect x="735" y="215" width="105" height="75" rx="5" fill="#b45309" opacity="0.35" />
              {/* Cooling ribs */}
              <line x1="735" y1="195" x2="735" y2="310" stroke="#60a5fa" strokeWidth="1.5" />
              <line x1="755" y1="195" x2="755" y2="310" stroke="#60a5fa" strokeWidth="1.5" />
              <line x1="775" y1="195" x2="775" y2="310" stroke="#60a5fa" strokeWidth="1.5" />
              <line x1="795" y1="195" x2="795" y2="310" stroke="#60a5fa" strokeWidth="1.5" />
              <line x1="815" y1="195" x2="815" y2="310" stroke="#60a5fa" strokeWidth="1.5" />
              <line x1="835" y1="195" x2="835" y2="310" stroke="#60a5fa" strokeWidth="1.5" />

              {/* 14. GENERATOR COOLING FAN (Pieza 20: Ventilador del generador) */}
              <rect x="858" y="220" width="18" height="65" rx="3" fill="#172554" stroke="#38bdf8" strokeWidth="2" />
              <line x1="867" y1="225" x2="867" y2="280" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />

              {/* 15. SERVICE CRANE (Pieza 12: Grúa de servicio) */}
              <line x1="740" y1="175" x2="830" y2="175" stroke="#ef4444" strokeWidth="4.5" />
              <rect x="765" y="172" width="26" height="28" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
              <line x1="778" y1="200" x2="778" y2="225" stroke="#fca5a5" strokeWidth="2" />
              <circle cx="778" cy="227" r="3" fill="none" stroke="#ef4444" strokeWidth="2" />

              {/* POINTER LINES & NUMBERED CIRCLES (1 to 20) */}
              {TURBINE_PARTS.map((part) => {
                const isMatched = !!matchedMap[part.id];
                const isActive = activeTargetId === part.id;
                const isShaking = wrongShakeId === part.id;
                const cx = (part.hotspot.x * 1000) / 100;
                const cy = (part.hotspot.y * 580) / 100;
                const tx = (part.hotspot.lineTarget.x * 1000) / 100;
                const ty = (part.hotspot.lineTarget.y * 580) / 100;

                return (
                  <g
                    key={part.id}
                    className={`cursor-pointer transition-transform ${isShaking ? "animate-bounce" : ""}`}
                    onClick={() => handleSelectHotspot(part.id)}
                  >
                    {/* Pointer Line */}
                    <line
                      x1={cx}
                      y1={cy}
                      x2={tx}
                      y2={ty}
                      stroke={isMatched ? "#10b981" : isActive ? "#38bdf8" : "#94a3b8"}
                      strokeWidth={isActive ? "2.5" : "1.5"}
                      strokeDasharray={isActive ? "none" : "3,2"}
                    />
                    {/* Target endpoint dot & reticle */}
                    <circle
                      cx={tx}
                      cy={ty}
                      r={isActive ? "6" : "3.5"}
                      fill={isMatched ? "#10b981" : isActive ? "#38bdf8" : "#94a3b8"}
                    />

                    {/* High-visibility Target Reticle for Active Hotspot */}
                    {isActive && (
                      <g pointerEvents="none">
                        <circle
                          cx={tx}
                          cy={ty}
                          r="16"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          className="animate-ping"
                          opacity="0.8"
                        />
                        <circle cx={tx} cy={ty} r="10" fill="none" stroke="#38bdf8" strokeWidth="1.8" />
                        <line x1={tx - 14} y1={ty} x2={tx + 14} y2={ty} stroke="#38bdf8" strokeWidth="1.5" />
                        <line x1={tx} y1={ty - 14} x2={tx} y2={ty + 14} stroke="#38bdf8" strokeWidth="1.5" />
                      </g>
                    )}

                    {/* Hotspot Outer Glow if active */}
                    {isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="22"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3.5"
                        className="animate-ping opacity-70"
                      />
                    )}

                    {/* Hotspot Circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="16"
                      fill={isMatched ? "#059669" : isActive ? "#0284c7" : "#0f172a"}
                      stroke={isMatched ? "#34d399" : isActive ? "#38bdf8" : "#cbd5e1"}
                      strokeWidth="2.5"
                      className="transition-all hover:scale-110"
                    />

                    {/* Number Text inside circle */}
                    <text
                      x={cx}
                      y={cy + 5}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {part.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* 3D INTERACTIVE TURBINE VIEWER */}
        {(displayMode === "3d" || displayMode === "split") && (
          <div className="relative w-full aspect-[16/9] min-h-[300px] max-h-[460px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <TurbineCanvas3D
              selectedPart={currentActivePart}
              onSelectPart={(p) => {
                handleSelectHotspot(p.id);
              }}
              isXRayDefault={true}
            />
            <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 pointer-events-none flex items-center gap-1.5 shadow">
              <Box className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rotación 360° • Zoom • Rayos X</span>
            </div>
          </div>
        )}
      </div>

      {/* SELECTION DRAWER / BUTTONS LIST (NO HIGHLIGHTING OF CORRECT ANSWER!) */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Banco de Términos (20 Componentes • Elige la respuesta correcta)
            </span>
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg transition-colors font-medium"
              title="Volver a barajar las opciones"
            >
              <Shuffle className="w-3 h-3" />
              <span>Barajar</span>
            </button>
          </div>
          <button
            onClick={() => setShowTechnicalList(!showTechnicalList)}
            className="text-xs text-sky-400 hover:underline"
          >
            {showTechnicalList ? "Ocultar lista" : "Mostrar lista completa"}
          </button>
        </div>

        {showTechnicalList && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {shuffledParts.map((part) => {
              const isMatched = Object.values(matchedMap).includes(part.id);

              return (
                <button
                  key={part.id}
                  onClick={() => handleChooseName(part)}
                  disabled={isMatched || isTimedOut}
                  className={`text-left text-xs p-2 rounded-xl border transition-all flex items-start gap-2 ${
                    isMatched
                      ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300 opacity-60 cursor-default"
                      : "bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700 hover:border-slate-500 active:scale-[0.98]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isMatched ? "bg-emerald-500 text-slate-950" : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isMatched ? "✓" : "•"}
                  </span>
                  <span className="line-clamp-2 leading-tight font-medium">
                    {part.name}
                    {isMatched && <span className="ml-1 text-[10px] text-emerald-400 font-mono">#{part.id}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {isAllCompleted && onContinueToQuiz && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>¡Has completado las 20 piezas del aerogenerador!</span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onContinueToQuiz();
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold rounded-xl flex items-center gap-1.5 shadow"
            >
              <span>Continuar al Cuestionario</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Active Part Technical Sheet */}
      {selectedPart && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-emerald-400 text-sm">
                #{selectedPart.id}. {selectedPart.spanishName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {selectedPart.englishName}
              </span>
            </div>
            <p className="text-slate-300 mb-1">{selectedPart.shortDescription}</p>
            <p className="text-slate-400 text-[11px]">
              <strong className="text-slate-300">Función técnica en la turbina:</strong> {selectedPart.functionDetail}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
