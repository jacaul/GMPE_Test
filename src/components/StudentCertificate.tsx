import React from "react";
import { StudentProfile } from "../types";
import { Award, Printer, X, Download, ShieldCheck } from "lucide-react";

interface StudentCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  score: number;
  levelReached: number;
  accuracy: number;
}

export const StudentCertificate: React.FC<StudentCertificateProps> = ({
  isOpen,
  onClose,
  profile,
  score,
  levelReached,
  accuracy,
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Actions bar (hidden in print) */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Certificado Oficial de Superación Eólica</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Layout */}
        <div className="p-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col items-center text-center relative border-8 border-double border-amber-500/40 m-3 rounded-xl print:m-0 print:border-amber-600">
          {/* Watermark / Corner flourishes */}
          <div className="absolute top-3 left-3 text-xs text-amber-500/50 font-serif">✦ AEROGENERADOR 3D ✦</div>
          <div className="absolute top-3 right-3 text-xs text-amber-500/50 font-serif">✦ LÍMITE DE BETZ ✦</div>

          <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center mb-3 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <Award className="w-9 h-9" />
          </div>

          <span className="text-xs uppercase tracking-[0.3em] text-amber-400 font-bold mb-1">
            Certificado de Rendimiento Académico
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 font-serif tracking-tight">
            Especialista en Aerogeneradores & Ley de Betz
          </h1>

          <p className="text-xs text-slate-400 max-w-md mb-4">
            Se certifica formalmente que el alumno/a ha superado con éxito las pruebas técnicas de identificación anatómica en 3D y cálculo físico de energía eólica:
          </p>

          <div className="border-b-2 border-amber-400/60 pb-1 mb-2 px-8">
            <span className="text-xl sm:text-2xl font-bold text-amber-300 font-serif">
              {profile.name}
            </span>
          </div>

          <span className="text-sm text-slate-300 font-medium mb-5">
            Clase / Grupo: <strong className="text-white">{profile.studentClass}</strong>
          </span>

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-slate-900/80 border border-slate-800 p-3 rounded-xl mb-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Puntuación</span>
              <strong className="text-emerald-400 text-base font-mono">{score.toLocaleString()} pts</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Nivel Logrado</span>
              <strong className="text-cyan-400 text-base font-mono">Nivel {levelReached}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Precisión</span>
              <strong className="text-amber-400 text-base font-mono">{accuracy}%</strong>
            </div>
          </div>

          {/* Footer date & signature */}
          <div className="flex items-center justify-between w-full max-w-md text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <div>
              <span className="block text-[10px]">Fecha de Expedición:</span>
              <span className="text-slate-200 font-medium">{todayStr}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px]">Verificación:</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" /> Acreditado
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
