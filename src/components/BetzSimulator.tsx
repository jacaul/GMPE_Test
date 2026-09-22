import React, { useState } from "react";
import {
  Wind,
  Activity,
  Zap,
  Compass,
  Calculator,
  Info,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Home,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { sounds } from "../utils/audio";

interface BetzSimulatorProps {
  onContinueToQuiz?: () => void;
}

export const BetzSimulator: React.FC<BetzSimulatorProps> = ({ onContinueToQuiz }) => {
  // Active simulator sub-tab
  const [activeMode, setActiveMode] = useState<"teoria" | "rendimientos" | "dimensionamiento">("teoria");

  // Simulator input parameters
  const [windSpeed, setWindSpeed] = useState<number>(10); // m/s
  const [bladeRadius, setBladeRadius] = useState<number>(55); // meters (typical modern ~3-4MW turbine)
  const [airDensity, setAirDensity] = useState<number>(1.225); // kg/m3 (sea level standard)
  const [inductionFactor, setInductionFactor] = useState<number>(0.333); // a (optimal 1/3)
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  // Target sizing for Mode 3
  const [targetPowerMW, setTargetPowerMW] = useState<number>(15);
  const [townPopulation, setTownPopulation] = useState<number>(25000);

  // Challenge questions state
  const [selectedChallengeIdx, setSelectedChallengeIdx] = useState<number>(0);
  const [userChallengeAnswer, setUserChallengeAnswer] = useState<number | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);

  // Fundamental Calculations
  const diameter = bladeRadius * 2;
  const sweptArea = Math.PI * Math.pow(bladeRadius, 2); // m^2
  const totalWindPowerWatts = 0.5 * airDensity * sweptArea * Math.pow(windSpeed, 3); // Watts
  const totalWindPowerMW = totalWindPowerWatts / 1_000_000;

  // Theoretical Betz Power coefficient Cp = 4 * a * (1 - a)^2
  const cp = Math.max(0, 4 * inductionFactor * Math.pow(1 - inductionFactor, 2));
  const cpPercent = cp * 100;

  // Betz limit maximum (16/27 = 0.59259...)
  const betzMaxCp = 16 / 27;
  const betzPowerMW = totalWindPowerMW * betzMaxCp;
  const theoreticalExtractedMW = totalWindPowerMW * cp;

  // Real Commercial Turbine Losses & Efficiency Chain:
  // 1. Aerodynamic tip & wake losses: eta_aero ~ 0.82 of Betz -> Cp_real ~ 48%
  const realAeroCp = Math.min(0.485, cp * 0.82);
  const aeroPowerMW = totalWindPowerMW * realAeroCp;

  // 2. Mechanical Gearbox efficiency ~ 97.2%
  const etaGearbox = 0.972;
  const mechPowerMW = aeroPowerMW * etaGearbox;

  // 3. Electrical Generator efficiency ~ 96.5%
  const etaGenerator = 0.965;
  const electPowerMW = mechPowerMW * etaGenerator;

  // 4. Transformer & Inverter efficiency ~ 98.2%
  const etaTransformer = 0.982;
  const gridPowerMW = electPowerMW * etaTransformer;
  const totalEfficiencyPercent = (gridPowerMW / totalWindPowerMW) * 100;

  // Speeds in Betz streamtube:
  // Upwind: v1
  // At rotor plane: v_rotor = v1 * (1 - a)
  // Downwind wake: v2 = v1 * (1 - 2a)
  const vRotor = windSpeed * (1 - inductionFactor);
  const v2 = Math.max(0, windSpeed * (1 - 2 * inductionFactor));

  // Streamtube cross-sectional areas:
  // Mass flow: m_dot = rho * A1 * v1 = rho * A * v_rotor = rho * A2 * v2
  // A1 = A * (1 - a)
  // A2 = A * (1 - a) / (1 - 2a)  (as long as 1-2a > 0.05)
  const denom = Math.max(0.08, 1 - 2 * inductionFactor);
  const a1Ratio = 1 - inductionFactor;
  const a2Ratio = (1 - inductionFactor) / denom;

  // Energy & Environment metrics:
  // Capacity factor ~ 32% (typical onshore Spain)
  const annualCapacityFactor = 0.32;
  const annualMWh = gridPowerMW * 8760 * annualCapacityFactor;
  // Homes powered (Spanish average ~ 3,500 kWh/yr = 3.5 MWh/yr)
  const homesPowered = Math.round(annualMWh / 3.5);
  // CO2 avoided (approx 0.25 tonnes CO2 per MWh in Spanish grid mix)
  const co2AvoidedTonnes = Math.round(annualMWh * 0.25);

  // Challenges bank
  const CHALLENGES = [
    {
      title: "Límite Máximo Teórico de Betz (1919)",
      question: "¿Cuál es la fracción exacta que demostró Albert Betz como límite físico insuperable para cualquier turbina eólica?",
      options: [
        "16/27 (≈ 59.26%)",
        "1/2 (50.00%)",
        "3/4 (75.00%)",
        "2/3 (66.67%)",
      ],
      correct: 0,
      explanation:
        "Demostrado matemáticamente mediante la conservación de momento y masa: la derivada dCp/da = 4(1-a)(1-3a) se anula exactamente en a = 1/3, dando Cp = 4(1/3)(2/3)² = 16/27 ≈ 59.26%.",
    },
    {
      title: "Ley Cúbica de la Velocidad del Viento (v³)",
      question: "Si el viento arrecia y pasa de 5 m/s a 10 m/s (se duplica la velocidad), ¿por cuánto se multiplica la potencia del viento?",
      options: [
        "Se duplica (x2)",
        "Se cuadruplica (x4)",
        "Se multiplica por 8 (2³ = 8 veces)",
        "Se multiplica por 10 (x10)",
      ],
      correct: 2,
      explanation:
        "La energía cinética es ½·m·v² y el flujo de masa es m_dot = ρ·A·v. Al combinarlas, P = ½·ρ·A·v³. Como la velocidad está al cubo: 2³ = 8. ¡Un pequeño aumento de viento genera una enorme cantidad de energía!",
    },
    {
      title: "Velocidad del Viento Aguas Abajo (v₂)",
      question: "Si el viento incidente es de 12 m/s y el rotor opera en el óptimo de Betz (a = ⅓), ¿a qué velocidad sale el viento tras cruzar el rotor?",
      options: [
        "4 m/s (un tercio de la inicial)",
        "6 m/s (la mitad)",
        "0 m/s (se detiene totalmente)",
        "8 m/s",
      ],
      correct: 0,
      explanation:
        "La ecuación es v₂ = v₁(1 - 2a). Si a = 1/3, v₂ = 12 · (1 - 2/3) = 12 · (1/3) = 4 m/s. Si se detuviera a 0 m/s, el aire actuaría como una pared sólida y ningún viento nuevo podría atravesar el rotor.",
    },
    {
      title: "Área de Barrido y Longitud de Pala",
      question: "Si un fabricante alarga la pala de 40 m a 80 m (duplica el radio R), ¿qué ocurre con el área de barrido y la potencia captada?",
      options: [
        "Se duplican (x2)",
        "Se cuadruplican (x4, porque A = π·R²)",
        "Aumentan un 50%",
        "Se multiplican por 8",
      ],
      correct: 1,
      explanation:
        "El área barrida por las palas es circular: A = π · R². Al duplicar el radio R, el área crece con el cuadrado: 2² = 4 veces más energía.",
    },
  ];

  const handleSelectChallengeAnswer = (ansIdx: number) => {
    setUserChallengeAnswer(ansIdx);
    const challenge = CHALLENGES[selectedChallengeIdx];
    if (ansIdx === challenge.correct) {
      sounds.playCorrect();
      setChallengeFeedback(`¡Correcto! ${challenge.explanation}`);
    } else {
      sounds.playWrong();
      setChallengeFeedback(`Incorrecto. ${challenge.explanation}`);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Laboratorio Aerodinámico: Límite de Betz</h3>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 font-semibold px-2 py-0.5 rounded border border-cyan-500/30 font-mono">
                Cp,max = 16/27 ≈ 59.26%
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Simulador físico interactivo de flujo eólico, tubo de corriente y cadena de eficiencias para FP Energías Renovables.
            </p>
          </div>
        </div>

        {/* Sub-modes tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveMode("teoria");
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeMode === "teoria"
                  ? "bg-slate-800 text-cyan-300 shadow font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              1. Teoría & Tubo de Flujo
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveMode("rendimientos");
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeMode === "rendimientos"
                  ? "bg-slate-800 text-emerald-300 shadow font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              2. Rendimientos Reales
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveMode("dimensionamiento");
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeMode === "dimensionamiento"
                  ? "bg-slate-800 text-amber-300 shadow font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              3. Parque Eólico & CO₂
            </button>
          </div>

          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Fórmulas</span>
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

      {/* Formula helper drop-down modal */}
      {showFormulaModal && (
        <div className="bg-slate-950/95 border border-cyan-500/40 rounded-xl p-4 text-xs text-slate-300 flex flex-col gap-3 animate-in fade-in shadow-2xl">
          <div className="font-bold text-cyan-300 text-sm flex items-center justify-between">
            <span>Ecuaciones Fundamentales de Betz (1919):</span>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <strong className="text-white block font-mono text-sm mb-1">P_viento = ½ · ρ · A · v₁³</strong>
              Potencia cinética total del viento incidente. La potencia es proporcional a <strong>v³</strong> (al cubo) y al área barrida <strong>A = π·R²</strong>.
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <strong className="text-white block font-mono text-sm mb-1">Cp = 4a(1 - a)²</strong>
              Coeficiente de potencia en función de la desaceleración axial <strong>a = (v₁ - v_rotor)/v₁</strong>. Máximo en <strong>a = ⅓</strong> donde Cp,max = 16/27 ≈ 59.26%.
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <strong className="text-white block font-mono text-sm mb-1">v₂ = v₁(1 - 2a) = v₁ / 3</strong>
              Velocidad aguas abajo. En el óptimo de Betz (a = ⅓), el aire abandona la estela a exactamente un tercio de su velocidad de entrada.
            </div>
          </div>
        </div>
      )}

      {/* STAT METRICS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">Potencia del Viento Incidente</span>
          <div className="text-lg font-bold font-mono text-sky-400">
            {totalWindPowerMW.toFixed(2)} MW
          </div>
          <span className="text-[10px] text-slate-500">100% flujo disponible</span>
        </div>

        <div className="bg-slate-950/70 border border-cyan-500/40 p-3 rounded-xl relative overflow-hidden">
          <span className="text-[11px] text-cyan-300 font-medium block mb-0.5">Límite Máx. de Betz</span>
          <div className="text-lg font-bold font-mono text-cyan-400">
            {betzPowerMW.toFixed(2)} MW
          </div>
          <span className="text-[10px] text-cyan-500 font-semibold">16/27 = 59.26% teórico</span>
        </div>

        <div className="bg-slate-950/70 border border-emerald-500/40 p-3 rounded-xl">
          <span className="text-[11px] text-emerald-300 font-medium block mb-0.5">Potencia Eléctrica en Red</span>
          <div className="text-lg font-bold font-mono text-emerald-400">
            {gridPowerMW.toFixed(2)} MW
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">
            η_total = {totalEfficiencyPercent.toFixed(1)}%
          </span>
        </div>

        <div className="bg-slate-950/70 border border-amber-500/40 p-3 rounded-xl">
          <span className="text-[11px] text-amber-300 font-medium block mb-0.5">Hogares Abastecidos / Año</span>
          <div className="text-lg font-bold font-mono text-amber-400">
            {homesPowered.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-500 font-semibold">{annualMWh.toFixed(0)} MWh/año</span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: CONTROLS & SLIDERS (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Parámetros de Entrada
            </h4>
            <button
              onClick={() => {
                setWindSpeed(10);
                setBladeRadius(55);
                setAirDensity(1.225);
                setInductionFactor(0.333);
              }}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer
            </button>
          </div>

          {/* Wind Speed Slider */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Velocidad del Viento (v₁):</span>
              <span className="font-bold text-sky-400 font-mono text-sm">
                {windSpeed} m/s ({Math.round(windSpeed * 3.6)} km/h)
              </span>
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
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>3 m/s (Arranque)</span>
              <span>12 m/s (Nominal)</span>
              <span>25 m/s (Parada)</span>
            </div>
          </div>

          {/* Blade Radius Slider */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Radio de Pala / Longitud (R):</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                R = {bladeRadius} m (Ø {diameter} m)
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="110"
              step="1"
              value={bladeRadius}
              onChange={(e) => setBladeRadius(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Área circular: <strong className="text-slate-200 font-mono">{Math.round(sweptArea).toLocaleString()} m²</strong></span>
              <span className="text-emerald-400/80 font-mono">A = π·R²</span>
            </div>
          </div>

          {/* Induction Factor (a) */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Factor de Inducción Axial (a):</span>
              <span className="font-bold text-amber-400 font-mono text-sm">
                a = {inductionFactor.toFixed(3)}{" "}
                {Math.abs(inductionFactor - 0.333) < 0.01 && "★ ÓPTIMO ⅓"}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.48"
              step="0.005"
              value={inductionFactor}
              onChange={(e) => setInductionFactor(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                Cp teórico: <strong className="text-amber-400 font-mono">{cpPercent.toFixed(1)}%</strong>
              </span>
              <button
                onClick={() => setInductionFactor(0.333)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
              >
                Fijar en Betz (a = ⅓)
              </button>
            </div>
          </div>

          {/* Air density presets */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Densidad del Aire (ρ):</span>
              <span className="font-mono text-slate-200 font-bold">{airDensity} kg/m³</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAirDensity(1.225)}
                className={`text-xs py-1.5 px-2 rounded-lg border transition-colors ${
                  airDensity === 1.225
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                1.225 kg/m³ (Nivel del mar, 15°C)
              </button>
              <button
                onClick={() => setAirDensity(1.06)}
                className={`text-xs py-1.5 px-2 rounded-lg border transition-colors ${
                  airDensity === 1.06
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                1.060 kg/m³ (Altitud 1500m)
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DYNAMIC VISUALIZATIONS (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* TAB 1: TEORÍA DE BETZ & TUBO DE CORRIENTE */}
          {activeMode === "teoria" && (
            <div className="flex flex-col gap-4">
              {/* THE BETZ STREAMTUBE ANIMATED SVG */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 flex flex-col gap-2 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    Tubo de Corriente de Betz (Conservación de Masa y Energía)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    v₁: {windSpeed.toFixed(1)} m/s → v₂: {v2.toFixed(1)} m/s
                  </span>
                </div>

                <div className="w-full h-44 bg-slate-900/90 rounded-xl relative overflow-hidden border border-slate-800/80 flex items-center justify-center">
                  <svg viewBox="0 0 500 160" className="w-full h-full">
                    <defs>
                      <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
                      </linearGradient>
                    </defs>

                    {/* Streamtube Expansion Envelope based on induction factor a */}
                    {/* Rotor is at x = 250, height = 90 */}
                    {/* Inlet x = 50, height = 90 * a1Ratio */}
                    {/* Outlet x = 450, height = min(140, 90 * a2Ratio) */}
                    {(() => {
                      const rotorH = 90;
                      const inH = Math.max(30, rotorH * Math.min(1.2, a1Ratio));
                      const outH = Math.min(145, Math.max(90, rotorH * Math.min(1.7, a2Ratio)));

                      const topIn = 80 - inH / 2;
                      const botIn = 80 + inH / 2;
                      const topRotor = 80 - rotorH / 2;
                      const botRotor = 80 + rotorH / 2;
                      const topOut = 80 - outH / 2;
                      const botOut = 80 + outH / 2;

                      return (
                        <g>
                          {/* Streamtube area polygon */}
                          <path
                            d={`M 50 ${topIn} C 150 ${topIn}, 180 ${topRotor}, 250 ${topRotor} C 320 ${topRotor}, 360 ${topOut}, 450 ${topOut} L 450 ${botOut} C 360 ${botOut}, 320 ${botRotor}, 250 ${botRotor} C 180 ${botRotor}, 150 ${botIn}, 50 ${botIn} Z`}
                            fill="url(#streamGrad)"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="4,3"
                          />

                          {/* Center streamline */}
                          <line x1="40" y1="80" x2="460" y2="80" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />

                          {/* Rotor Disc (Actuator Disc) */}
                          <line x1="250" y1={topRotor - 5} x2="250" y2={botRotor + 5} stroke="#f59e0b" strokeWidth="4" />
                          <circle cx="250" cy="80" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />

                          {/* Labels */}
                          {/* Inlet */}
                          <text x="50" y={topIn - 8} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                            v₁ = {windSpeed.toFixed(1)} m/s
                          </text>
                          <text x="50" y={botIn + 14} fill="#94a3b8" fontSize="8" textAnchor="middle">
                            Sección A₁
                          </text>

                          {/* Rotor Plane */}
                          <text x="250" y={topRotor - 10} fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
                            Rotor (v = {vRotor.toFixed(1)} m/s)
                          </text>
                          <text x="250" y={botRotor + 16} fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                            Área A (Ø {diameter}m)
                          </text>

                          {/* Wake Outlet */}
                          <text x="440" y={topOut - 8} fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">
                            v₂ = {v2.toFixed(1)} m/s
                          </text>
                          <text x="440" y={botOut + 14} fill="#94a3b8" fontSize="8" textAnchor="middle">
                            Estela A₂
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg flex items-center justify-between">
                  <span>
                    El aire <strong>se frena de {windSpeed.toFixed(1)} a {v2.toFixed(1)} m/s</strong> y por continuidad el tubo de corriente <strong>se ensancha</strong>.
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">
                    v₂/v₁ = {(v2 / (windSpeed || 1)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* THE BETZ EFFICIENCY CURVE */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Curva Analítica de Betz: Cp = 4a(1-a)²</span>
                  <span className="text-amber-400 font-mono text-xs">
                    Punto Actual: a={inductionFactor.toFixed(3)}, Cp={cpPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full h-36 bg-slate-900/80 rounded-lg p-2 relative overflow-hidden">
                  <svg viewBox="0 0 400 130" className="w-full h-full">
                    {/* Grid */}
                    <line x1="40" y1="10" x2="40" y2="110" stroke="#334155" strokeWidth="1" />
                    <line x1="40" y1="110" x2="380" y2="110" stroke="#334155" strokeWidth="1" />

                    {/* 59.26% Betz limit dashed line */}
                    <line x1="40" y1="30" x2="380" y2="30" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" />
                    <text x="45" y="26" fill="#06b6d4" fontSize="9" fontWeight="bold">
                      Límite de Betz: 59.26% (16/27)
                    </text>

                    {/* Cp Theoretical Curve */}
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
                          <circle cx={currX} cy={currY} r="5.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1={currX} y1={currY} x2={currX} y2="110" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2,2" />
                        </g>
                      );
                    })()}

                    {/* Labels */}
                    <text x="375" y="123" fill="#94a3b8" fontSize="9" textAnchor="end">a (Inducción)</text>
                    <text x="32" y="33" fill="#94a3b8" fontSize="8" textAnchor="end">59%</text>
                    <text x="32" y="110" fill="#94a3b8" fontSize="8" textAnchor="end">0%</text>
                    <text x="266" y="123" fill="#38bdf8" fontSize="8" textAnchor="middle">a = ⅓ (Óptimo)</text>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CADENA DE RENDIMIENTOS REAL */}
          {activeMode === "rendimientos" && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-inner">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Cadena de Transformación Energética en el Aerogenerador
                </h4>
                <p className="text-xs text-slate-400">
                  De la energía cinética del viento hasta la electricidad inyectada en la red eléctrica.
                </p>
              </div>

              {/* Step by step flow */}
              <div className="flex flex-col gap-2.5">
                {/* 1. Wind Power */}
                <div className="bg-slate-900/90 border border-sky-500/30 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Viento Incidente en el Disco</span>
                      <span className="text-[11px] text-slate-400">E_cinética = ½ · ρ · A · v³</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-sky-400">{totalWindPowerMW.toFixed(2)} MW</span>
                    <span className="text-[10px] text-slate-400 block">100.0%</span>
                  </div>
                </div>

                {/* 2. Rotor Aerodynamics */}
                <div className="bg-slate-900/90 border border-cyan-500/30 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Captación Aerodinámica del Rotor (Cp Real)</span>
                      <span className="text-[11px] text-slate-400">Límite Betz (59.3%) - pérdidas por punta y estela (Prandtl)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-cyan-400">{aeroPowerMW.toFixed(2)} MW</span>
                    <span className="text-[10px] text-cyan-400 block font-semibold">Cp,real ≈ {(realAeroCp * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* 3. Gearbox */}
                <div className="bg-slate-900/90 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Multiplicadora Mecánica (1:90)</span>
                      <span className="text-[11px] text-slate-400">Rendimiento mecánico: η_mec ≈ 97.2% (fricción de engranajes y cojinetes)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-amber-400">{mechPowerMW.toFixed(2)} MW</span>
                    <span className="text-[10px] text-amber-400 block">Pérdida ~ 2.8%</span>
                  </div>
                </div>

                {/* 4. Electrical Generator & Transformer */}
                <div className="bg-slate-900/90 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Generador Eléctrico + Inversor/Trafo</span>
                      <span className="text-[11px] text-slate-400">Rendimiento electromagnético: η_elec ≈ 94.8% (cobre, hierro, calor)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black font-mono text-emerald-400">{gridPowerMW.toFixed(2)} MW</span>
                    <span className="text-[10px] text-emerald-400 block font-bold">η_global = {totalEfficiencyPercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIMENSIONAMIENTO DE PARQUE & CO2 */}
          {activeMode === "dimensionamiento" && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-inner">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-400" />
                  Calculadora de Parque Eólico y Demanda de Población
                </h4>
                <p className="text-xs text-slate-400">
                  Calcula cuántas turbinas de este tamaño hacen falta para abastecer a una localidad.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Población a abastecer (habitantes):</label>
                  <input
                    type="number"
                    min="1000"
                    max="500000"
                    step="5000"
                    value={townPopulation}
                    onChange={(e) => setTownPopulation(Math.max(1000, parseInt(e.target.value) || 1000))}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Aprox. {Math.round(townPopulation / 2.5).toLocaleString()} hogares</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-xs text-slate-300 block mb-0.5">Aerogeneradores necesarios:</span>
                  <div className="text-2xl font-black font-mono text-amber-400">
                    {Math.max(1, Math.ceil((townPopulation / 2.5) / Math.max(1, homesPowered)))} turbinas
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Potencia de parque: {(Math.max(1, Math.ceil((townPopulation / 2.5) / Math.max(1, homesPowered))) * gridPowerMW).toFixed(1)} MW
                  </span>
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-200">
                    Emisiones de CO₂ evitadas anualmente por esta turbina:
                  </span>
                </div>
                <span className="text-sm font-black font-mono text-emerald-300">
                  {co2AvoidedTonnes.toLocaleString()} Toneladas CO₂/año
                </span>
              </div>
            </div>
          )}

          {/* CONCEPT RETOS DE FÍSICA DE BETZ (CON SELECTOR DE 4 RETOS) */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                Retos Conceptuales de Betz (4 Desafíos)
              </span>
              <div className="flex items-center gap-1">
                {CHALLENGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedChallengeIdx(idx);
                      setUserChallengeAnswer(null);
                      setChallengeFeedback(null);
                    }}
                    className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                      selectedChallengeIdx === idx
                        ? "bg-sky-500 text-slate-950"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-bold text-sm text-white mb-1">
                #{selectedChallengeIdx + 1}. {CHALLENGES[selectedChallengeIdx].title}
              </h5>
              <p className="text-xs text-slate-300">
                {CHALLENGES[selectedChallengeIdx].question}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHALLENGES[selectedChallengeIdx].options.map((opt, optIdx) => {
                const isChosen = userChallengeAnswer === optIdx;
                const isCorrect = optIdx === CHALLENGES[selectedChallengeIdx].correct;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectChallengeAnswer(optIdx)}
                    className={`text-left text-xs p-2.5 rounded-xl border transition-all ${
                      userChallengeAnswer === null
                        ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700"
                        : isCorrect
                        ? "bg-emerald-950/70 border-emerald-400 text-emerald-200 font-bold"
                        : isChosen
                        ? "bg-rose-950/70 border-rose-400 text-rose-200"
                        : "bg-slate-900 text-slate-400 border-slate-800 opacity-60"
                    }`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {challengeFeedback && (
              <div
                className={`text-xs p-3 rounded-xl border animate-in fade-in ${
                  userChallengeAnswer === CHALLENGES[selectedChallengeIdx].correct
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                    : "bg-rose-950/60 border-rose-500/50 text-rose-300"
                }`}
              >
                {challengeFeedback}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION BANNER */}
      {onContinueToQuiz && (
        <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/40 p-3 rounded-xl">
          <span className="text-slate-300">
            ¿Listo para responder las preguntas de física y poner a prueba tu conocimiento en el cuestionario oficial?
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onContinueToQuiz();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold flex items-center gap-2 transition-all shadow-md"
          >
            <span>Ir al Cuestionario de Preguntas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
