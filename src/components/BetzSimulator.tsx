import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
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
  Sliders,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { sounds } from "../utils/audio";

export interface BetzChallenge {
  title: string;
  formula: string;
  formulaNote: string;
  variables: { sym: string; desc: string; val: string }[];
  preset: { windSpeed?: number; bladeRadius?: number; inductionFactor?: number; airDensity?: number };
  question: string;
  options: string[];
  correct: number;
  calculation: string;
  explanation: string;
}

export const generateDynamicBetzChallenges = (): BetzChallenge[] => {
  // Reto 1: Factor de inducción y Cp
  const aPool = [
    {
      a: 0.333,
      aName: "a = ⅓ (0.333)",
      question: "Aplicando la fórmula Cp = 4·a·(1-a)² con la inducción óptima de Betz a = ⅓, ¿cuál es el coeficiente de potencia máximo exacto?",
      options: [
        "16/27 (≈ 59.26%)",
        "1/2 (50.00%)",
        "3/4 (75.00%)",
        "2/3 (66.67%)",
      ],
      correct: 0,
      calc: "Cp = 4 · (1/3) · (2/3)² = 4/3 · 4/9 = 16/27 ≈ 59.26%. Límite demostrado por Albert Betz.",
    },
    {
      a: 0.20,
      aName: "a = 0.20",
      question: "Si el aerogenerador opera con factor de inducción axial a = 0.20, calcula con la fórmula Cp = 4·a·(1-a)² el rendimiento aerodinámico obtenido:",
      options: [
        "51.20% (Cp = 0.512)",
        "59.26% (Betz)",
        "42.50% (Cp = 0.425)",
        "64.00% (Cp = 0.640)",
      ],
      correct: 0,
      calc: "Cp = 4 · 0.20 · (1 - 0.20)² = 0.80 · (0.80)² = 0.80 · 0.64 = 0.512 = 51.20%.",
    },
    {
      a: 0.25,
      aName: "a = 0.25",
      question: "Si la turbina frena el viento con factor de inducción axial a = 0.25, calcula según Cp = 4·a·(1-a)² el coeficiente Cp extraído:",
      options: [
        "56.25% (Cp = 0.5625)",
        "50.00% (Cp = 0.5000)",
        "59.26% (Betz)",
        "45.00% (Cp = 0.4500)",
      ],
      correct: 0,
      calc: "Cp = 4 · 0.25 · (1 - 0.25)² = 1.0 · (0.75)² = 0.5625 = 56.25%.",
    },
    {
      a: 0.15,
      aName: "a = 0.15",
      question: "Con un frenado ligero del flujo eólico de a = 0.15, calcula según Cp = 4·a·(1-a)² el rendimiento eólico alcanzado:",
      options: [
        "43.35% (Cp = 0.4335)",
        "30.00% (Cp = 0.3000)",
        "59.26% (Betz)",
        "51.20% (Cp = 0.5120)",
      ],
      correct: 0,
      calc: "Cp = 4 · 0.15 · (1 - 0.15)² = 0.60 · (0.85)² = 0.60 · 0.7225 = 0.4335 = 43.35%.",
    },
    {
      a: 0.40,
      aName: "a = 0.40",
      question: "Si las palas frenan excesivamente el flujo con a = 0.40, calcula según Cp = 4·a·(1-a)² el coeficiente Cp extraído:",
      options: [
        "57.60% (Cp = 0.576)",
        "59.26% (Betz)",
        "48.00% (Cp = 0.480)",
        "62.40% (Cp = 0.624)",
      ],
      correct: 0,
      calc: "Cp = 4 · 0.40 · (1 - 0.40)² = 1.60 · (0.60)² = 1.60 · 0.36 = 0.5760 = 57.60%.",
    },
  ];
  const r1 = aPool[Math.floor(Math.random() * aPool.length)];

  // Reto 2: Ley Cúbica v^3
  const vPool = [
    {
      v1: 6,
      v2: 12,
      factor: 2,
      calc: "P₂/P₁ = (12/6)³ = 2³ = 8 veces.",
      options: ["Se multiplica por 8 (2³ = 8)", "Se duplica (x2)", "Se cuadruplica (x4)", "Se multiplica por 16"],
      correct: 0,
    },
    {
      v1: 5,
      v2: 10,
      factor: 2,
      calc: "P₂/P₁ = (10/5)³ = 2³ = 8 veces.",
      options: ["Se multiplica por 8 (2³ = 8)", "Se duplica (x2)", "Se cuadruplica (x4)", "Se multiplica por 6"],
      correct: 0,
    },
    {
      v1: 4,
      v2: 12,
      factor: 3,
      calc: "P₂/P₁ = (12/4)³ = 3³ = 27 veces.",
      options: ["Se multiplica por 27 (3³ = 27)", "Se multiplica por 9 (3² = 9)", "Se triplica (x3)", "Se multiplica por 18"],
      correct: 0,
    },
    {
      v1: 5,
      v2: 15,
      factor: 3,
      calc: "P₂/P₁ = (15/5)³ = 3³ = 27 veces.",
      options: ["Se multiplica por 27 (3³ = 27)", "Se multiplica por 9 (x9)", "Se triplica (x3)", "Se multiplica por 81"],
      correct: 0,
    },
    {
      v1: 3,
      v2: 6,
      factor: 2,
      calc: "P₂/P₁ = (6/3)³ = 2³ = 8 veces.",
      options: ["Se multiplica por 8 (2³ = 8)", "Se duplica (x2)", "Se cuadruplica (x4)", "Aumenta un 100%"],
      correct: 0,
    },
    {
      v1: 4,
      v2: 8,
      factor: 2,
      calc: "P₂/P₁ = (8/4)³ = 2³ = 8 veces.",
      options: ["Se multiplica por 8 (2³ = 8)", "Se cuadruplica (x4)", "Se duplica (x2)", "Se multiplica por 12"],
      correct: 0,
    },
  ];
  const r2 = vPool[Math.floor(Math.random() * vPool.length)];

  // Reto 3: Velocidad en la estela lejana con a = 1/3 (v2 = v1 / 3)
  const wakeSpeeds = [9, 12, 15, 18, 21, 24];
  const r3v1 = wakeSpeeds[Math.floor(Math.random() * wakeSpeeds.length)];
  const r3v2 = r3v1 / 3;
  const r3Options = [
    `${r3v2} m/s (un tercio del viento inicial: ${r3v1}/3)`,
    `${(r3v1 / 2).toFixed(1)} m/s (la mitad)`,
    "0 m/s (el aire se detiene completamente)",
    `${r3v2 + 3} m/s`,
  ];

  // Reto 4: Radio de pala y área de barrido circular
  const rPool = [
    {
      r1: 40,
      r2: 80,
      factor: 2,
      mult: 4,
      calc: "A₂/A₁ = (80/40)² = 2² = 4. ¡Área y potencia se cuadruplican!",
      options: ["Se cuadruplican (x4, por ser R²)", "Se duplican (x2)", "Aumentan un 50%", "Se multiplican por 8"],
      correct: 0,
    },
    {
      r1: 30,
      r2: 60,
      factor: 2,
      mult: 4,
      calc: "A₂/A₁ = (60/30)² = 2² = 4. ¡El área y la potencia captada se cuadruplican!",
      options: ["Se cuadruplican (x4, proporcional a R²)", "Se duplican (x2)", "Se triplican (x3)", "Se multiplican por 16"],
      correct: 0,
    },
    {
      r1: 30,
      r2: 90,
      factor: 3,
      mult: 9,
      calc: "A₂/A₁ = (90/30)² = 3² = 9. ¡Al triplicar el radio, el área y la potencia se multiplican por 9!",
      options: ["Se multiplican por 9 (3² = 9)", "Se triplican (x3)", "Se multiplican por 6", "Se cuadruplican (x4)"],
      correct: 0,
    },
    {
      r1: 50,
      r2: 100,
      factor: 2,
      mult: 4,
      calc: "A₂/A₁ = (100/50)² = 2² = 4. ¡Al duplicar el radio, el área barrida se cuadruplica!",
      options: ["Se cuadruplican (x4, según π·R²)", "Se duplican (x2)", "Aumentan un 100%", "Se multiplican por 8"],
      correct: 0,
    },
    {
      r1: 25,
      r2: 75,
      factor: 3,
      mult: 9,
      calc: "A₂/A₁ = (75/25)² = 3² = 9. ¡Al triplicar la longitud de pala, el área barrida se multiplica por 9!",
      options: ["Se multiplican por 9 (3² = 9)", "Se triplican (x3)", "Se multiplican por 6", "Se multiplican por 27"],
      correct: 0,
    },
  ];
  const r4 = rPool[Math.floor(Math.random() * rPool.length)];

  // Reto 5: Rendimiento global comercial
  const cpChoices = [0.46, 0.47, 0.48, 0.49];
  const mecChoices = [0.970, 0.972, 0.975];
  const genChoices = [0.962, 0.965, 0.968];
  const trafoChoices = [0.980, 0.982, 0.985];

  const cpSel = cpChoices[Math.floor(Math.random() * cpChoices.length)];
  const mecSel = mecChoices[Math.floor(Math.random() * mecChoices.length)];
  const genSel = genChoices[Math.floor(Math.random() * genChoices.length)];
  const trafoSel = trafoChoices[Math.floor(Math.random() * trafoChoices.length)];
  const netPercent = (cpSel * mecSel * genSel * trafoSel * 100).toFixed(1);

  return [
    {
      title: "Límite Máximo Teórico de Albert Betz (1919)",
      formula: "Cp(a) = 4 · a · (1 - a)²",
      formulaNote: "Derivada igualada a cero: dCp/da = 4(1 - 3a)(1 - a) = 0  ⇒  a = 1/3 (0.333)",
      variables: [
        { sym: "a", desc: "Factor de inducción axial (frenado del flujo)", val: r1.aName },
        { sym: "Cp", desc: "Coeficiente de potencia extraída", val: r1.calc.split("=")[0] },
      ],
      preset: { windSpeed: 10, bladeRadius: 55, inductionFactor: r1.a },
      question: r1.question,
      options: r1.options,
      correct: r1.correct,
      calculation: r1.calc,
      explanation: "Demostrado matemáticamente mediante balance de masa y conservación de cantidad de movimiento lineal.",
    },
    {
      title: "Ley Cúbica de la Potencia del Viento (v³)",
      formula: "P = ½ · ρ · A · v³",
      formulaNote: "La potencia del viento depende directamente del cubo de su velocidad (v · v · v)",
      variables: [
        { sym: "ρ", desc: "Densidad del aire (IEC a nivel del mar)", val: "1.225 kg/m³" },
        { sym: "v₁", desc: "Velocidad inicial del viento", val: `${r2.v1} m/s` },
        { sym: "v₂", desc: "Velocidad final arreciada", val: `${r2.v2} m/s (factor x${r2.factor})` },
      ],
      preset: { windSpeed: r2.v2, bladeRadius: 55, inductionFactor: 0.333 },
      question: `Con la fórmula P = ½·ρ·A·v³ en pantalla, si el viento pasa de v₁ = ${r2.v1} m/s a v₂ = ${r2.v2} m/s, ¿por qué factor se multiplica la potencia total disponible en el flujo de aire?`,
      options: r2.options,
      correct: r2.correct,
      calculation: `Relación de potencias: P₂ / P₁ = (v₂ / v₁)³ = (${r2.v2} / ${r2.v1})³ = ${r2.calc}`,
      explanation: "La potencia del viento es proporcional a la velocidad al cubo (v³). Al elevar el factor al cubo se multiplica drásticamente la potencia.",
    },
    {
      title: "Velocidad del Viento Aguas Abajo en la Estela (v₂)",
      formula: "v₂ = v₁ · (1 - 2a)",
      formulaNote: "Velocidad remanente en la estela lejana tras extraer la máxima energía",
      variables: [
        { sym: "v₁", desc: "Velocidad del viento aguas arriba", val: `${r3v1} m/s` },
        { sym: "a", desc: "Factor de inducción axial óptimo", val: "1/3 (0.333)" },
        { sym: "v₂", desc: "Velocidad estela lejana aguas abajo", val: `v₁ · (1/3) = ${r3v2} m/s` },
      ],
      preset: { windSpeed: r3v1, bladeRadius: 55, inductionFactor: 0.333 },
      question: `Si el viento incidente es v₁ = ${r3v1} m/s y el rotor opera en el óptimo de Betz (a = ⅓), aplica la fórmula v₂ = v₁(1 - 2a) para calcular a qué velocidad sale el viento en la estela detrás de la turbina:`,
      options: r3Options,
      correct: 0,
      calculation: `Cálculo: v₂ = ${r3v1} · [1 - 2·(1/3)] = ${r3v1} · (1 - 2/3) = ${r3v1} · (1/3) = ${r3v2} m/s. El aire conserva un tercio de su velocidad para evacuar la masa de aire sin bloquear el paso.`,
      explanation: "La conservación de masa exige que el aire no se detenga por completo. Con a = 1/3, la estela retiene exactamente 1/3 de la velocidad inicial.",
    },
    {
      title: "Área de Barrido y Radio de Pala (R²)",
      formula: "A = π · R²   ⇒   P = ½ · ρ · (π · R²) · v³",
      formulaNote: "El área circular y la potencia crecen con el cuadrado de la longitud de pala",
      variables: [
        { sym: "R₁", desc: "Longitud de pala inicial", val: `${r4.r1} m` },
        { sym: "R₂", desc: "Nueva longitud de pala (repowering)", val: `${r4.r2} m (factor x${r4.factor})` },
      ],
      preset: { windSpeed: 10, bladeRadius: r4.r2, inductionFactor: 0.333 },
      question: `Si en un parque eólico se sustituyen palas de R₁ = ${r4.r1} m por nuevas palas de R₂ = ${r4.r2} m (factor x${r4.factor}), ¿qué ocurre con el área de barrido y la potencia captada según A = π·R²?`,
      options: r4.options,
      correct: r4.correct,
      calculation: r4.calc,
      explanation: "El área barrida por las palas es un círculo: A = π · R². Crece con el cuadrado del radio: al multiplicar por K el radio, el área y la potencia aumentan en K².",
    },
    {
      title: "Cadena de Rendimientos Comerciales a Red (η_global)",
      formula: "η_global = Cp,real · η_mec · η_gen · η_trafo",
      formulaNote: "Eficiencia neta comercial desde el viento libre hasta la inyección a red eléctrica",
      variables: [
        { sym: "Cp,real", desc: "Rendimiento aerodinámico real", val: `${cpSel} (${(cpSel * 100).toFixed(1)}%)` },
        { sym: "η_mec", desc: "Rendimiento multiplicadora", val: `${mecSel} (${(mecSel * 100).toFixed(1)}%)` },
        { sym: "η_gen", desc: "Rendimiento generador eléctrico", val: `${genSel} (${(genSel * 100).toFixed(1)}%)` },
        { sym: "η_trafo", desc: "Rendimiento transformador", val: `${trafoSel} (${(trafoSel * 100).toFixed(1)}%)` },
      ],
      preset: { windSpeed: 11, bladeRadius: 60, inductionFactor: 0.333 },
      question: `Utilizando la fórmula de la cadena de pérdidas en serie, si Cp = ${cpSel}, η_mec = ${mecSel}, η_gen = ${genSel} y η_trafo = ${trafoSel}, ¿cuál es el rendimiento global neto vertido a la red?`,
      options: [
        `≈ ${netPercent}% de la energía del viento incidente`,
        "≈ 59.3% (Límite de Betz)",
        "≈ 25.0%",
        "≈ 85.0%",
      ],
      correct: 0,
      calculation: `Cálculo: η_global = ${cpSel} · ${mecSel} · ${genSel} · ${trafoSel} ≈ ${(Number(netPercent) / 100).toFixed(4)} = ${netPercent}%.`,
      explanation: "Una turbina comercial de primer nivel convierte un 42-45% de la energía eólica total en electricidad útil inyectada a la red eléctrica.",
    },
  ];
};

interface BetzSimulatorProps {
  onContinueToQuiz?: () => void;
  onBetzChallengesCompleted?: (isCompleted: boolean, solvedCount: number) => void;
  onFailure?: () => void;
}

const SECONDS_PER_CHALLENGE = 45;

export const BetzSimulator: React.FC<BetzSimulatorProps> = ({
  onContinueToQuiz,
  onBetzChallengesCompleted,
  onFailure,
}) => {
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

  // Dynamic Challenge questions state
  const [challenges, setChallenges] = useState<BetzChallenge[]>(() => generateDynamicBetzChallenges());
  const [selectedChallengeIdx, setSelectedChallengeIdx] = useState<number>(0);
  const [userChallengeAnswer, setUserChallengeAnswer] = useState<number | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);
  const [presetLoadedNotice, setPresetLoadedNotice] = useState<string | null>(null);
  const [challengeResetNotice, setChallengeResetNotice] = useState<string | null>(null);

  // Countdown timer for challenges
  const [challengeTimeLeft, setChallengeTimeLeft] = useState<number>(SECONDS_PER_CHALLENGE);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Solved challenges persistence
  const [solvedChallenges, setSolvedChallenges] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("turbine_betz_challenges_completed");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reset function upon failure or timeout
  const triggerFailureAndRestart = (message: string) => {
    sounds.playWrong();
    if (onFailure) onFailure();

    setChallengeResetNotice(message);
    setTimeout(() => setChallengeResetNotice(null), 4000);

    // Regenerate new challenge set with different numbers
    const newChallenges = generateDynamicBetzChallenges();
    setChallenges(newChallenges);

    // Reset progress to 0
    setSolvedChallenges([]);
    localStorage.removeItem("turbine_betz_challenges_completed");
    setSelectedChallengeIdx(0);
    setUserChallengeAnswer(null);
    setChallengeFeedback(null);
    setChallengeTimeLeft(SECONDS_PER_CHALLENGE);

    if (onBetzChallengesCompleted) onBetzChallengesCompleted(false, 0);
  };

  // Timer countdown hook
  useEffect(() => {
    // Only run challenge timer if not all challenges are solved and current challenge is not yet answered correctly
    const isCurrentSolved = solvedChallenges.includes(selectedChallengeIdx);
    if (isCurrentSolved) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setChallengeTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          triggerFailureAndRestart(
            "¡Tiempo agotado en el reto! Se han regenerado nuevos datos y se reinician los retos desde el Reto 1."
          );
          return SECONDS_PER_CHALLENGE;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedChallengeIdx, solvedChallenges, challenges]);

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

  const handleLoadPresetToSimulator = (preset: { windSpeed?: number; bladeRadius?: number; inductionFactor?: number; airDensity?: number }) => {
    sounds.playClick();
    if (preset.windSpeed !== undefined) setWindSpeed(preset.windSpeed);
    if (preset.bladeRadius !== undefined) setBladeRadius(preset.bladeRadius);
    if (preset.inductionFactor !== undefined) setInductionFactor(preset.inductionFactor);
    if (preset.airDensity !== undefined) setAirDensity(preset.airDensity);
    setPresetLoadedNotice("¡Parámetros cargados en el simulador! Observa la animación del flujo y los cálculos de potencia arriba.");
    setTimeout(() => setPresetLoadedNotice(null), 4500);
  };

  const handleSelectChallengeAnswer = (ansIdx: number) => {
    setUserChallengeAnswer(ansIdx);
    const challenge = challenges[selectedChallengeIdx];
    if (ansIdx === challenge.correct) {
      sounds.playCorrect();
      setChallengeFeedback(`¡Correcto! ${challenge.calculation}`);

      const nextSolved = Array.from(new Set([...solvedChallenges, selectedChallengeIdx]));
      setSolvedChallenges(nextSolved);
      localStorage.setItem("turbine_betz_challenges_completed", JSON.stringify(nextSolved));
      setChallengeTimeLeft(SECONDS_PER_CHALLENGE);

      if (nextSolved.length === challenges.length) {
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
        if (onBetzChallengesCompleted) onBetzChallengesCompleted(true, nextSolved.length);
      } else {
        if (onBetzChallengesCompleted) onBetzChallengesCompleted(false, nextSolved.length);
      }
    } else {
      // Incorrect choice: trigger failure and restart from Reto 1 with new randomized data!
      triggerFailureAndRestart(
        "¡Cálculo incorrecto! Se han regenerado nuevos datos para que repitas los cálculos desde el Reto 1."
      );
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

          {/* CONCEPT RETOS DE FÍSICA DE BETZ CON FÓRMULAS EN PANTALLA Y ENLACE AL SIMULADOR */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 sm:p-5 rounded-xl flex flex-col gap-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  Retos Conceptuales de Betz & Cálculos en el Simulador
                </span>
                <span className="text-[11px] text-slate-400">
                  {solvedChallenges.length} de {challenges.length} retos superados
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* COUNTDOWN TIMER BADGE */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold shadow-sm transition-all ${
                    challengeTimeLeft <= 10
                      ? "bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse"
                      : "bg-slate-900 border-slate-700 text-sky-300"
                  }`}
                  title="Tiempo restante para calcular y responder el reto actual"
                >
                  <Clock className={`w-3.5 h-3.5 ${challengeTimeLeft <= 10 ? "text-rose-400 animate-spin" : "text-sky-400"}`} />
                  <span>{challengeTimeLeft}s</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {challenges.map((_, idx) => {
                    const isSolved = solvedChallenges.includes(idx);
                    const isCurrent = selectedChallengeIdx === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedChallengeIdx(idx);
                          setUserChallengeAnswer(null);
                          setChallengeFeedback(null);
                          setChallengeTimeLeft(SECONDS_PER_CHALLENGE);
                        }}
                        className={`relative px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isCurrent
                            ? "bg-sky-500 text-slate-950 shadow-md font-extrabold"
                            : isSolved
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/50"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        <span>Reto {idx + 1}</span>
                        {isSolved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RESET ON ERROR OR TIMEOUT NOTICE */}
            {challengeResetNotice && (
              <div className="bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in shadow-lg">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold">{challengeResetNotice}</span>
              </div>
            )}

            {/* PRESET LOAD NOTIFICATION */}
            {presetLoadedNotice && (
              <div className="bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{presetLoadedNotice}</span>
              </div>
            )}

            {/* CHALLENGE HEADER & FORMULA BANNER */}
            <div className="flex flex-col gap-2">
              <h5 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span className="text-sky-400 font-mono">#{selectedChallengeIdx + 1}</span>
                <span>{challenges[selectedChallengeIdx].title}</span>
              </h5>

              {/* FÓRMULA MATEMÁTICA EN PANTALLA */}
              <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 p-3 sm:p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-sky-300 font-semibold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    Fórmula Física Aplicable:
                  </span>
                  <button
                    onClick={() => handleLoadPresetToSimulator(challenges[selectedChallengeIdx].preset)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Cargar parámetros en el Simulador</span>
                  </button>
                </div>

                <div className="py-2 px-3 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
                  <span className="text-base sm:text-lg font-mono font-black text-cyan-300 tracking-wider">
                    {challenges[selectedChallengeIdx].formula}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-mono italic">
                  {challenges[selectedChallengeIdx].formulaNote}
                </p>

                {/* Variables legend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 border-t border-slate-800/60">
                  {challenges[selectedChallengeIdx].variables.map((v, vIdx) => (
                    <div key={vIdx} className="bg-slate-950/60 px-2 py-1 rounded text-[10px] text-slate-300 flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-bold">{v.sym}:</span>
                      <span className="text-slate-400 truncate ml-1">{v.desc}</span>
                      <span className="font-mono text-emerald-400 ml-1 shrink-0 font-semibold">{v.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QUESTION TEXT */}
              <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium leading-relaxed">
                {challenges[selectedChallengeIdx].question}
              </p>
            </div>

            {/* OPTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {challenges[selectedChallengeIdx].options.map((opt, optIdx) => {
                const isChosen = userChallengeAnswer === optIdx;
                const isCorrect = optIdx === challenges[selectedChallengeIdx].correct;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectChallengeAnswer(optIdx)}
                    className={`text-left text-xs p-3 rounded-xl border transition-all ${
                      userChallengeAnswer === null
                        ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700"
                        : isCorrect
                        ? "bg-emerald-950/70 border-emerald-400 text-emerald-200 font-bold shadow-md"
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

            {/* FEEDBACK & DETAILED CALCULATION WALKTHROUGH */}
            {challengeFeedback && (
              <div
                className={`text-xs p-3.5 rounded-xl border animate-in fade-in flex flex-col gap-1.5 ${
                  userChallengeAnswer === challenges[selectedChallengeIdx].correct
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                    : "bg-rose-950/60 border-rose-500/50 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {userChallengeAnswer === challenges[selectedChallengeIdx].correct ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>¡Respuesta Correcta! Cálculo Verificado</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 text-rose-400" />
                      <span>Revisa el procedimiento con la fórmula:</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed font-sans">{challengeFeedback}</p>
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
