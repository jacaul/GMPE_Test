import React, { useState } from "react";
import { StudentProfile } from "../types";
import { User, School, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { sounds } from "../utils/audio";

interface StudentAuthModalProps {
  isOpen: boolean;
  onSaveProfile: (profile: StudentProfile) => void;
  initialProfile?: StudentProfile | null;
}

const PRESET_CLASSES = [
  "1º FPGS Energías Renovables (Diurno)",
  "1º FPGS Energías Renovables (Vespertino)",
];

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onSaveProfile,
  initialProfile,
}) => {
  const [name, setName] = useState<string>(initialProfile?.name || "");
  const [selectedClass, setSelectedClass] = useState<string>(
    initialProfile?.studentClass && PRESET_CLASSES.includes(initialProfile.studentClass)
      ? initialProfile.studentClass
      : "1º FPGS Energías Renovables (Diurno)"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    const finalClass = selectedClass;

    if (!finalName) {
      setErrorMsg("Por favor, introduce tu nombre y apellidos.");
      return;
    }

    if (!finalClass) {
      setErrorMsg("Por favor, selecciona tu grupo.");
      return;
    }

    sounds.playCorrect();

    const profile: StudentProfile = {
      name: finalName,
      studentClass: finalClass,
      avatar: "avatar-turbine",
      bestScore: initialProfile?.bestScore || 0,
    };

    onSaveProfile(profile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Identificación del Alumno</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Introduce tu nombre y clase para guardar tu progreso automáticamente y competir en el Ranking Global
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Nombre y Apellidos:
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Lucía Martínez Navarro"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Class Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-emerald-400" />
              Curso y Clase / Grupo:
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {PRESET_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <span>Comenzar Juego y Guardar Progreso</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
