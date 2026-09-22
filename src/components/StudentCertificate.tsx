import React from "react";
import { StudentProfile } from "../types";
import {
  Award,
  Printer,
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
  Sliders,
  Compass,
} from "lucide-react";

interface StudentCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  score: number;
  levelReached: number;
  accuracy: number;
  isQuizCompleted?: boolean;
  isDiagramCompleted?: boolean;
  isBetzCompleted?: boolean;
  diagramCount?: number;
  betzCount?: number;
  onNavigateToTab?: (tab: "cuestionario" | "diagrama" | "simulador") => void;
}

export const StudentCertificate: React.FC<StudentCertificateProps> = ({
  isOpen,
  onClose,
  profile,
  score,
  levelReached,
  accuracy,
  isQuizCompleted = false,
  isDiagramCompleted = false,
  isBetzCompleted = false,
  diagramCount = 0,
  betzCount = 0,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Strict pedagogical rules requested by instructor:
  // Must complete quiz/levels, Diagram (20/20), Betz Challenges, and accuracy > 75%
  const isAccuracyMet = accuracy > 75;
  const isDiplomaGranted = isQuizCompleted && isDiagramCompleted && isBetzCompleted && isAccuracyMet;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Actions bar (hidden in print) */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Award className={`w-4 h-4 ${isDiplomaGranted ? "text-amber-400" : "text-slate-400"}`} />
            <span>
              {isDiplomaGranted
                ? "Certificado Oficial Acreditado (> 75% Superado)"
                : "Estado de Acreditación de Diploma Académico"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isDiplomaGranted && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto">
          {isDiplomaGranted ? (
            /* PRINTABLE CERTIFICATE LAYOUT - GRANTED */
            <div className="p-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col items-center text-center relative border-8 border-double border-amber-500/40 m-3 rounded-xl print:m-0 print:border-amber-600">
              {/* Watermark / Corner flourishes */}
              <div className="absolute top-3 left-3 text-xs text-amber-500/50 font-serif">✦ 1º FPGS ENERGÍAS RENOVABLES ✦</div>
              <div className="absolute top-3 right-3 text-xs text-amber-500/50 font-serif">✦ AEROGENERADOR & BETZ ✦</div>

              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center mb-3 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                <Award className="w-9 h-9" />
              </div>

              <span className="text-xs uppercase tracking-[0.3em] text-amber-400 font-bold mb-1">
                Certificado Oficial de Rendimiento Académico
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 font-serif tracking-tight">
                Especialista en Aerogeneradores & Ley de Betz
              </h1>

              <p className="text-xs text-slate-400 max-w-md mb-4">
                Se certifica formalmente que el alumno/a ha superado con éxito las pruebas técnicas de identificación anatómica en 3D, cálculos físicos de energía eólica y la Ley de Betz con un rendimiento acreditado superior al 75%:
              </p>

              <div className="border-b-2 border-amber-400/60 pb-1 mb-2 px-8">
                <span className="text-xl sm:text-2xl font-bold text-amber-300 font-serif">
                  {profile.name}
                </span>
              </div>

              <span className="text-sm text-slate-300 font-medium mb-4">
                Grupo: <strong className="text-white">{profile.studentClass}</strong>
              </span>

              {/* Requirement Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-[11px]">
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 5 Niveles Superados
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Diagrama 20/20 Piezas
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Retos de Betz en Simulador
                </span>
              </div>

              {/* Metrics summary */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-slate-900/80 border border-slate-800 p-3 rounded-xl mb-6 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Puntuación</span>
                  <strong className="text-emerald-400 text-base font-mono">{score.toLocaleString()} pts</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nivel Logrado</span>
                  <strong className="text-cyan-400 text-base font-mono">Nivel {levelReached} / 5</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Precisión Oficial</span>
                  <strong className="text-amber-400 text-base font-mono">{accuracy}% (&gt; 75%)</strong>
                </div>
              </div>

              {/* Footer date & signature */}
              <div className="flex items-center justify-between w-full max-w-md text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                <div>
                  <span className="block text-[10px]">Fecha de Expedición:</span>
                  <span className="text-slate-200 font-medium">{todayStr}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px]">Acreditación Oficial:</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1 justify-end font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Aprobado con Éxito
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* REQUIREMENT CHECKLIST MODAL - DIPLOMA PENDING */
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl text-amber-200">
                <AlertCircle className="w-8 h-8 text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-amber-300">
                    Diploma No Disponible Todavía
                  </h3>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    Según la normativa académica del curso, el Diploma Aceptado solo se otorga tras completar todos los niveles, el diagrama anatómico de 20 piezas, los retos conceptuales de Betz y alcanzar <strong>más del 75% de precisión</strong>.
                  </p>
                </div>
              </div>

              {/* Student Header */}
              <div className="flex items-center justify-between bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Alumno/a:</span>
                  <span className="text-white font-bold text-sm">{profile.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Grupo:</span>
                  <span className="text-sky-400 font-semibold">{profile.studentClass}</span>
                </div>
              </div>

              {/* 4 Required Conditions */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Requisitos Obligatorios para la Expedición:
                </span>

                {/* 1. Quiz Levels */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  isQuizCompleted
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : "bg-slate-950 border-slate-800 text-slate-300"
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isQuizCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>1. Desafío de Niveles Técnicos</span>
                        {isQuizCompleted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-normal">Superado</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">Nivel {levelReached}/5</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Debes superar los 5 niveles del cuestionario de anatomía, física y cálculo de Betz.
                      </p>
                    </div>
                  </div>
                  {!isQuizCompleted && onNavigateToTab && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToTab("cuestionario");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shrink-0 flex items-center gap-1"
                    >
                      <span>Jugar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 2. Diagram Completion */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  isDiagramCompleted
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : "bg-slate-950 border-slate-800 text-slate-300"
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isDiagramCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>2. Diagrama Anatómico Completo</span>
                        {isDiagramCompleted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-normal">20/20 Piezas</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">{diagramCount}/20 Piezas</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Identifica las 20 piezas clave en el plano interactivo de la góndola.
                      </p>
                    </div>
                  </div>
                  {!isDiagramCompleted && onNavigateToTab && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToTab("diagrama");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shrink-0 flex items-center gap-1"
                    >
                      <span>Diagrama</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 3. Betz Conceptual Challenges */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  isBetzCompleted
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : "bg-slate-950 border-slate-800 text-slate-300"
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isBetzCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>3. Retos Conceptuales de Betz (Simulador)</span>
                        {isBetzCompleted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-normal">5/5 Retos Superados</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">{betzCount}/5 Retos</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Resuelve los retos de física y cálculos con las fórmulas en el simulador.
                      </p>
                    </div>
                  </div>
                  {!isBetzCompleted && onNavigateToTab && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToTab("simulador");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shrink-0 flex items-center gap-1"
                    >
                      <span>Simulador</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 4. Accuracy > 75% */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  isAccuracyMet
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : "bg-slate-950 border-slate-800 text-slate-300"
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isAccuracyMet ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>4. Precisión Mínima Exigida (&gt; 75%)</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          isAccuracyMet
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}>
                          Tu precisión: {accuracy}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isAccuracyMet
                          ? "¡Excelente! Has alcanzado la precisión académica requerida."
                          : "Tu precisión actual es inferior o igual al 75%. Responde con atención para superar el 75%."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close / Action footer */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Continuar Practicando
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
