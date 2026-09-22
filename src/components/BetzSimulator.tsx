import React, { useState } from "react";
import { Wind, Activity, Zap, Compass, Calculator, Info, CheckCircle, HelpCircle, ArrowRight } from "lucide-react";
import { sounds } from "../utils/audio";

interface BetzSimulatorProps {
  onContinueToQuiz?: () => void;
}

export const BetzSimulator: React.FC<BetzSimulatorProps> = ({ onContinueToQuiz }) => {
  // Simulator input parameters
  const [windSpeed, setWindSpeed] = useState<number>(10); // m/s
  const [bladeRadius, setBladeRadius] = useState<number>(55); // meters
  const [airDensity, setAirDensity] = useState<number>(1.225); // kg/m3
  const [inductionFactor, setInductionFactor] = useState<number>(0.333); // a (optimal 1/3)
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  // Calculations
  const sweptArea = Math.PI * Math.pow(bladeRadius, 2); // m^2
  const totalWindPowerWatts = 0.5 * airDensity * sweptArea * Math.pow(windSpeed, 3); // Watts
  const totalWindPowerMW = totalWindPowerWatts / 1_000_000;

  // Power coefficient Cp = 4 * a * (1 - a)^2
  const cp = 4 * inductionFactor * Math.pow(1 - inductionFactor, 2);
  const cpPercent = cp * 100;

  // Betz limit max
  const betzMaxCp = 16 / 27; // 0.592592...
  const betzPowerMW = totalWindPowerMW * betzMaxCp;
  const extractedPowerMW = totalWindPowerMW * cp;

  // Downstream wind speed v2 = v1 * (1 - 2a)
  const v2 = Math.max(0, windSpeed * (1 - 2 * inductionFactor));

  // Equivalent Spanish homes powered (avg 3500 kWh/yr)
  const homesPowered = Math.round((extractedPowerMW * 1000 * 24 * 365 * 0.35) / 3500);

  // Quick challenge state
  const [challengeAnswer, setChallengeAnswer] = useState<number | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);

  const handleChallenge = (ansIndex: number) => {
    setChallengeAnswer(ansIndex);
    if (ansIndex === 0) {
      sounds.playCorrect();
      setChallengeFeedback("¡Exacto! 16/27 equivale exactamente al 59.26% de límite físico insuperable.");
    } else {
      sounds.playWrong();
      setChallengeFeedback("Respuesta incorrecta. Recuerda: según Betz ningún rotor puede extraer más del 59.26% (16/27).");
    }
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Laboratorio Físico: Límite de Betz</h3>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 font-semibold px-2 py-0.5 rounded border border-cyan-500/30">
                16/27 ≈ 59.3%
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Modifica los parámetros físicos y comprueba en tiempo real cómo cambia la potencia extraída
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fórmulas Físicas</span>
          </button>

          {onContinueToQuiz && (
            <button
              onClick={() => {
                sounds.playClick();
                onContinueToQuiz();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md"
            >
              <span>Ir al Cuestionario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Formula helper drop-down / modal */}
      {showFormulaModal && (
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl p-3 text-xs text-slate-300 flex flex-col gap-2 animate-in fade-in">
          <div className="font-bold text-cyan-300 text-sm">Ecuaciones Fundamentales de Betz (1919):</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
              <strong className="text-white block font-mono">P = ½ · ρ · A · v³</strong>
              Potencia cinética total del viento incidente. La potencia es proporcional a <strong>v³</strong> (al cubo).
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
              <strong className="text-white block font-mono">Cp = 4a(1 - a)²</strong>
              Coeficiente de potencia. Máximo en <strong>a = ⅓</strong>: Cp,max = 16/27 ≈ 59.26%.
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
              <strong className="text-white block font-mono">v₂ = v₁(1 - 2a) = v₁ / 3</strong>
              Velocidad aguas abajo. Si a = ⅓, el viento sale a un tercio de su velocidad inicial.
            </div>
          </div>
        </div>
      )}

      {/* Grid: Controls & Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Sliders (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Variables del Sistema Eólico
          </h4>

          {/* Wind speed slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Velocidad del Viento (v₁):</span>
              <span className="font-bold text-sky-400 font-mono text-sm">{windSpeed} m/s ({Math.round(windSpeed * 3.6)} km/h)</span>
            </div>
            <input
              type="range"
              min="3"
              max="25"
              step="0.5"
              value={windSpeed}
              onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Arranque (3 m/s)</span>
              <span>Nominal (12 m/s)</span>
              <span>Corte (25 m/s)</span>
            </div>
          </div>

          {/* Blade radius slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Longitud de Pala / Radio (R):</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">{bladeRadius} m (Ø {bladeRadius * 2} m)</span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              step="1"
              value={bladeRadius}
              onChange={(e) => setBladeRadius(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[11px] text-slate-400">
              Área de barrido: <strong className="text-slate-200 font-mono">{Math.round(sweptArea).toLocaleString()} m²</strong>
            </div>
          </div>

          {/* Axial induction factor slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Factor de Inducción Axial (a):</span>
              <span className="font-bold text-amber-400 font-mono text-sm">
                a = {inductionFactor.toFixed(3)} {Math.abs(inductionFactor - 0.333) < 0.01 && "(ÓPTIMO ⅓)"}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.005"
              value={inductionFactor}
              onChange={(e) => setInductionFactor(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <button
              onClick={() => setInductionFactor(0.333)}
              className="self-start text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              Fijar en valor óptimo de Betz (a = ⅓)
            </button>
          </div>

          {/* Air density presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-300 font-medium">Densidad del Aire (ρ):</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setAirDensity(1.225)}
                className={`text-xs py-1 px-2 rounded-lg border transition-colors ${
                  airDensity === 1.225
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                1.225 kg/m³ (Nivel del mar)
              </button>
              <button
                onClick={() => setAirDensity(1.06)}
                className={`text-xs py-1 px-2 rounded-lg border transition-colors ${
                  airDensity === 1.06
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                1.060 kg/m³ (Meseta 1500m)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Graphs & Results (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Output Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-0.5">Potencia del Viento</span>
              <div className="text-lg font-bold font-mono text-sky-400">
                {totalWindPowerMW.toFixed(2)} MW
              </div>
              <span className="text-[10px] text-slate-400">100% flujo incidente</span>
            </div>

            <div className="bg-slate-950/70 border border-cyan-500/40 p-3 rounded-xl relative overflow-hidden">
              <span className="text-[11px] text-cyan-300 font-medium block mb-0.5">Límite Máx. Betz</span>
              <div className="text-lg font-bold font-mono text-cyan-400">
                {betzPowerMW.toFixed(2)} MW
              </div>
              <span className="text-[10px] text-cyan-500 font-semibold">16/27 = 59.26%</span>
            </div>

            <div className="bg-slate-950/70 border border-emerald-500/40 p-3 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[11px] text-emerald-300 font-medium block mb-0.5">Potencia Captada (Cp)</span>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {extractedPowerMW.toFixed(2)} MW
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">
                Cp = {cpPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* BETZ EFFICIENCY CURVE (SVG GRAPH) */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Curva de Eficiencia de Betz: Cp vs. Inducción Axial (a)</span>
              <span className="text-amber-400 font-mono text-xs">Punto Actual: a={inductionFactor.toFixed(3)}, Cp={cpPercent.toFixed(1)}%</span>
            </div>

            <div className="w-full h-36 bg-slate-900/80 rounded-lg p-2 relative overflow-hidden">
              <svg viewBox="0 0 400 130" className="w-full h-full">
                {/* Horizontal and vertical grid lines */}
                <line x1="40" y1="10" x2="40" y2="110" stroke="#334155" strokeWidth="1" />
                <line x1="40" y1="110" x2="380" y2="110" stroke="#334155" strokeWidth="1" />

                {/* 59.26% Betz limit dashed line */}
                <line x1="40" y1="30" x2="380" y2="30" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" />
                <text x="45" y="26" fill="#06b6d4" fontSize="9" fontWeight="bold">Límite de Betz: 59.26% (16/27)</text>

                {/* The Theoretical Betz Curve: Cp = 4a(1-a)^2 for a from 0 to 0.5 */}
                {/* X-axis: a=0 (x=40) to a=0.5 (x=380). Scale: x = 40 + (a / 0.5) * 340 */}
                {/* Y-axis: Cp=0 (y=110) to Cp=0.6 (y=28). Scale: y = 110 - (Cp / 0.6) * 82 */}
                <path
                  d={`M 40 110 ${Array.from({ length: 50 }, (_, i) => {
                    const aVal = (i + 1) * 0.01;
                    const cpVal = 4 * aVal * Math.pow(1 - aVal, 2);
                    const x = 40 + (aVal / 0.5) * 340;
                    const y = 110 - (cpVal / 0.6) * 82;
                    return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                  }).join(" ")}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />

                {/* Current operating point marker */}
                {(() => {
                  const currX = 40 + (inductionFactor / 0.5) * 340;
                  const currY = 110 - (cp / 0.6) * 82;
                  return (
                    <g>
                      <circle cx={currX} cy={currY} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                      <line x1={currX} y1={currY} x2={currX} y2="110" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
                    </g>
                  );
                })()}

                {/* Axis Labels */}
                <text x="360" y="125" fill="#94a3b8" fontSize="9" textAnchor="end">a (Inducción)</text>
                <text x="30" y="32" fill="#94a3b8" fontSize="8" textAnchor="end">59%</text>
                <text x="30" y="110" fill="#94a3b8" fontSize="8" textAnchor="end">0%</text>
                <text x="40 + (0.333/0.5)*340" y="123" fill="#38bdf8" fontSize="8" textAnchor="middle">a = ⅓</text>
              </svg>
            </div>

            {/* Speeds comparison */}
            <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-900 rounded-lg">
              <span className="text-slate-400">
                Velocidad inicial (v₁): <strong className="text-sky-300">{windSpeed.toFixed(1)} m/s</strong>
              </span>
              <span className="text-slate-400">
                Velocidad tras el rotor (v₂): <strong className="text-emerald-300">{v2.toFixed(1)} m/s</strong>
              </span>
              <span className="text-slate-400">
                Hogares abastecidos aprox: <strong className="text-amber-300">{homesPowered.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Quick Concept Quiz Challenge */}
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex flex-col gap-2">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Reto de Comprensión: Ley de Betz
            </span>
            <p className="text-xs text-slate-300">
              ¿Por qué es imposible que un aerogenerador convierta el 100% de la energía del viento?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                onClick={() => handleChallenge(0)}
                className={`text-left text-xs p-2 rounded-lg border transition-colors ${
                  challengeAnswer === 0
                    ? "bg-emerald-950/50 border-emerald-500 text-emerald-200"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                }`}
              >
                A) Porque el aire tras el rotor se detendría por completo (v₂=0) impidiendo el paso de nuevo viento.
              </button>
              <button
                onClick={() => handleChallenge(1)}
                className={`text-left text-xs p-2 rounded-lg border transition-colors ${
                  challengeAnswer === 1
                    ? "bg-rose-950/50 border-rose-500 text-rose-200"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                }`}
              >
                B) Porque el generador eléctrico siempre tiene un límite fijo de 200 voltios.
              </button>
            </div>

            {challengeFeedback && (
              <div
                className={`text-xs p-2 rounded-lg ${
                  challengeAnswer === 0 ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800" : "bg-rose-950/40 text-rose-300 border border-rose-800"
                }`}
              >
                {challengeFeedback}
              </div>
            )}

            {onContinueToQuiz && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onContinueToQuiz();
                }}
                className="w-full mt-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Continuar con las Preguntas del Cuestionario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Banner */}
      {onContinueToQuiz && (
        <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/40 p-3 rounded-xl">
          <span className="text-slate-300">
            ¿Listo para responder las preguntas de física y poner a prueba tu conocimiento?
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onContinueToQuiz();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold flex items-center gap-2 transition-all shadow"
          >
            <span>Ir al Cuestionario de Preguntas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
