import React, { useState } from "react";
import { TURBINE_PARTS } from "../data/turbineData";
import { TurbinePart } from "../types";
import { sounds } from "../utils/audio";
import { CheckCircle2, HelpCircle, Sparkles, RefreshCw, Layers, Shuffle, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface InteractiveDiagramProps {
  onPartMatched?: (part: TurbinePart, isCorrect: boolean) => void;
  selectedPart?: TurbinePart | null;
  onSelectPart?: (part: TurbinePart) => void;
  onContinueToQuiz?: () => void;
}

export const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({
  onPartMatched,
  selectedPart,
  onSelectPart,
  onContinueToQuiz,
}) => {
  // Map of part ID -> user matched part ID
  const [matchedMap, setMatchedMap] = useState<Record<number, number>>({});
  const [activeTargetId, setActiveTargetId] = useState<number | null>(1);
  const [wrongShakeId, setWrongShakeId] = useState<number | null>(null);
  const [showTechnicalList, setShowTechnicalList] = useState<boolean>(true);

  // Shuffled parts list so the options are NOT in order 1..20
  const [shuffledParts, setShuffledParts] = useState<TurbinePart[]>(() => {
    return [...TURBINE_PARTS].sort(() => Math.random() - 0.5);
  });

  const handleShuffle = () => {
    sounds.playClick();
    setShuffledParts([...TURBINE_PARTS].sort(() => Math.random() - 0.5));
  };

  // Remaining parts to place
  const completedCount = Object.keys(matchedMap).length;
  const isAllCompleted = completedCount === TURBINE_PARTS.length;

  const handleSelectHotspot = (partId: number) => {
    sounds.playClick();
    setActiveTargetId(partId);
    const targetPart = TURBINE_PARTS.find((p) => p.id === partId);
    if (targetPart && onSelectPart) {
      onSelectPart(targetPart);
    }
  };

  const handleChooseName = (chosenPart: TurbinePart) => {
    if (!activeTargetId) return;

    if (chosenPart.id === activeTargetId) {
      // Correct!
      sounds.playCorrect(completedCount + 1);
      const newMap = { ...matchedMap, [activeTargetId]: chosenPart.id };
      setMatchedMap(newMap);

      if (onPartMatched) {
        onPartMatched(chosenPart, true);
      }

      // Check if finished
      if (Object.keys(newMap).length === TURBINE_PARTS.length) {
        sounds.playFanfare();
        try {
          confetti({
            particleCount: 100,
            spread: 70,
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
      // Incorrect
      sounds.playWrong();
      setWrongShakeId(activeTargetId);
      setTimeout(() => setWrongShakeId(null), 700);

      if (onPartMatched) {
        onPartMatched(chosenPart, false);
      }
    }
  };

  const handleReset = () => {
    sounds.playClick();
    setMatchedMap({});
    setActiveTargetId(1);
    const firstPart = TURBINE_PARTS.find((p) => p.id === 1);
    if (firstPart && onSelectPart) onSelectPart(firstPart);
  };

  const currentActivePart = activeTargetId ? TURBINE_PARTS.find((p) => p.id === activeTargetId) : null;

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
            20
          </div>
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              Diagrama Técnico del Aerogenerador
              {isAllCompleted && (
                <span className="text-xs bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ¡Completado!
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Haz clic en cada círculo numerado y selecciona el componente correspondiente
            </p>
          </div>
        </div>

        {/* Progress Pill & Reset */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Progreso:</span>
            <span className="ml-1.5 text-sm font-bold text-emerald-400 font-mono">
              {completedCount} / {TURBINE_PARTS.length}
            </span>
          </div>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
            title="Desordenar / Barajar respuestas"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
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

      {/* Interactive Diagram SVG Canvas */}
      <div className="relative w-full aspect-[16/9] max-h-[460px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center select-none">
        <svg
          viewBox="0 0 1000 580"
          className="w-full h-full object-contain"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
        >
          <defs>
            {/* Gradients for cutaway machine parts */}
            <linearGradient id="towerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            <linearGradient id="canopyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="gearboxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <linearGradient id="genGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
          </defs>

          {/* BACKGROUND HINT GRID */}
          <rect width="1000" height="580" fill="#090d16" />
          <path
            d="M 50 0 L 50 580 M 150 0 L 150 580 M 250 0 L 250 580 M 350 0 L 350 580 M 450 0 L 450 580 M 550 0 L 550 580 M 650 0 L 650 580 M 750 0 L 750 580 M 850 0 L 850 580 M 950 0 L 950 580"
            stroke="#1e293b"
            strokeWidth="0.5"
            strokeDasharray="4,4"
          />

          {/* 1. TOWER (Pieza 14) */}
          <path
            d="M 530 380 L 520 580 L 660 580 L 650 380 Z"
            fill="url(#towerGrad)"
            stroke="#475569"
            strokeWidth="2"
          />

          {/* 2. YAW SYSTEM (Piezas 15 y 16) */}
          <rect x="525" y="360" width="130" height="20" rx="3" fill="#64748b" stroke="#334155" strokeWidth="2" />
          <line x1="530" y1="370" x2="650" y2="370" stroke="#0f172a" strokeWidth="2" strokeDasharray="6,4" />

          {/* 3. BEDPLATE (Pieza 17) */}
          <polygon
            points="480,360 880,360 870,335 490,335"
            fill="#334155"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* 4. NACELLE CANOPY SHELL (Pieza 19) */}
          <path
            d="M 460 220 C 460 160, 560 140, 840 145 C 910 147, 930 200, 930 280 C 930 340, 890 355, 870 355 L 480 355 Z"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="8,5"
          />
          {/* Canopy tail fin */}
          <polygon points="840,145 920,70 930,120 920,150" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />

          {/* 5. METEOROLOGICAL SENSORS (Pieza 13) */}
          <line x1="920" y1="70" x2="925" y2="35" stroke="#e2e8f0" strokeWidth="3" />
          <circle cx="925" cy="35" r="5" fill="#ef4444" />
          <line x1="910" y1="45" x2="940" y2="45" stroke="#f8fafc" strokeWidth="2" />
          <circle cx="910" cy="45" r="3.5" fill="#38bdf8" />
          <circle cx="940" cy="45" r="3.5" fill="#38bdf8" />

          {/* 6. ROTOR HUB (Pieza 5) & NOSE CONE (Pieza 1) */}
          <path
            d="M 330 160 C 270 180, 200 240, 60 255 C 200 270, 270 330, 330 350 Z"
            fill="url(#bladeGrad)"
            stroke="#64748b"
            strokeWidth="3"
          />
          {/* Spinner support ring (Pieza 2) */}
          <ellipse cx="330" cy="255" rx="35" ry="95" fill="#64748b" stroke="#334155" strokeWidth="2" />
          <ellipse cx="330" cy="255" rx="25" ry="75" fill="#1e293b" />

          {/* BLADES (Pieza 3) */}
          {/* Top Blade */}
          <path
            d="M 345 165 C 350 90, 360 20, 370 -40 C 350 20, 330 90, 320 165 Z"
            fill="url(#bladeGrad)"
            stroke="#64748b"
            strokeWidth="2"
          />
          {/* Bottom Blade */}
          <path
            d="M 345 345 C 365 420, 380 480, 420 560 C 370 480, 335 420, 320 345 Z"
            fill="url(#bladeGrad)"
            stroke="#64748b"
            strokeWidth="2"
          />
          {/* Pitch Bearings (Pieza 4) */}
          <ellipse cx="335" cy="165" rx="22" ry="8" fill="#475569" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="335" cy="345" rx="22" ry="8" fill="#475569" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* 7. MAIN BEARING (Pieza 6) */}
          <rect x="475" y="225" width="40" height="60" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />

          {/* 8. MAIN SHAFT (Pieza 7) */}
          <rect x="345" y="240" width="160" height="30" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <line x1="360" y1="255" x2="495" y2="255" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="8,6" />

          {/* 9. GEARBOX (Pieza 8) */}
          <rect x="505" y="200" width="130" height="110" rx="8" fill="url(#gearboxGrad)" stroke="#38bdf8" strokeWidth="2" />
          <ellipse cx="570" cy="255" rx="35" ry="40" fill="#075985" stroke="#0284c7" strokeWidth="2" />
          <text x="570" y="260" fill="#e0f2fe" fontSize="11" fontWeight="bold" textAnchor="middle">
            1:90
          </text>

          {/* 10. OIL FILTER (Pieza 18) */}
          <rect x="720" y="265" width="22" height="45" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />

          {/* 11. DISC BRAKE & CALIPER (Pieza 9) */}
          <rect x="655" y="220" width="12" height="70" rx="2" fill="#d97706" stroke="#f59e0b" strokeWidth="2" />
          <rect x="650" y="215" width="22" height="22" rx="3" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />

          {/* 12. COUPLING (Pieza 10) */}
          <rect x="680" y="238" width="28" height="34" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />

          {/* 13. GENERATOR (Pieza 11) */}
          <rect x="720" y="195" width="135" height="115" rx="10" fill="url(#genGrad)" stroke="#60a5fa" strokeWidth="2" />
          {/* Cooling ribs */}
          <line x1="735" y1="195" x2="735" y2="310" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="755" y1="195" x2="755" y2="310" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="775" y1="195" x2="775" y2="310" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="795" y1="195" x2="795" y2="310" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="815" y1="195" x2="815" y2="310" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="835" y1="195" x2="835" y2="310" stroke="#3b82f6" strokeWidth="1.5" />

          {/* 14. GENERATOR COOLING FAN (Pieza 20) */}
          <rect x="858" y="220" width="18" height="65" rx="3" fill="#172554" stroke="#38bdf8" strokeWidth="2" />

          {/* 15. SERVICE CRANE (Pieza 12) */}
          <line x1="740" y1="175" x2="830" y2="175" stroke="#ef4444" strokeWidth="4" />
          <rect x="765" y="172" width="25" height="28" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
          <line x1="777" y1="200" x2="777" y2="225" stroke="#fca5a5" strokeWidth="1.5" />
          <circle cx="777" cy="227" r="3" fill="none" stroke="#ef4444" strokeWidth="2" />

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
                {/* Target endpoint dot */}
                <circle
                  cx={tx}
                  cy={ty}
                  r={isActive ? "4.5" : "3"}
                  fill={isMatched ? "#10b981" : isActive ? "#38bdf8" : "#94a3b8"}
                />

                {/* Hotspot Outer Glow if active */}
                {isActive && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="20"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Hotspot Circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="15"
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
                  className="pointer-events-none select-none"
                >
                  {part.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Active Target Instruction */}
        {currentActivePart && !isAllCompleted && (
          <div className="absolute top-2.5 left-2.5 bg-slate-900/90 border border-sky-500/50 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 font-bold text-xs flex items-center justify-center">
              {currentActivePart.id}
            </span>
            <span className="text-xs text-sky-200">
              {matchedMap[currentActivePart.id] ? (
                <span className="text-emerald-400 font-semibold">Identificado: {currentActivePart.name}</span>
              ) : (
                <span>¿Cómo se llama la pieza <strong>#{currentActivePart.id}</strong>? Elige abajo:</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* SELECTION DRAWER / BUTTONS LIST */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Banco de Términos (Desordenado • 20 Componentes)
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
              const isCurrentForActive = currentActivePart?.id === part.id;

              return (
                <button
                  key={part.id}
                  onClick={() => handleChooseName(part)}
                  disabled={isMatched}
                  className={`text-left text-xs p-2 rounded-xl border transition-all flex items-start gap-2 ${
                    isMatched
                      ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300 opacity-60 cursor-default"
                      : isCurrentForActive
                      ? "bg-sky-950/50 border-sky-400 text-sky-200 shadow-md ring-2 ring-sky-500/20"
                      : "bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700 hover:border-slate-500"
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
            <p className="text-slate-400 text-[11px]"><strong className="text-slate-300">Función en góndola:</strong> {selectedPart.functionDetail}</p>
          </div>
        </div>
      )}
    </div>
  );
};
