import React, { useEffect, useState } from "react";
import { ScoreEntry, StudentProfile } from "../types";
import { Trophy, Medal, Award, Search, Filter, RefreshCw, X, User, CheckCircle } from "lucide-react";
import { sounds } from "../utils/audio";

interface GlobalRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: StudentProfile | null;
  currentScore: number;
}

export const GlobalRankingModal: React.FC<GlobalRankingModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  currentScore,
}) => {
  const [rankings, setRankings] = useState<ScoreEntry[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [classesList, setClassesList] = useState<string[]>([
    "1º FPGS Energías Renovables (Diurno)",
    "1º FPGS Energías Renovables (Vespertino)",
  ]);

  const FALLBACK_SCORES: ScoreEntry[] = [];

  const fetchRankings = async () => {
    setIsLoading(true);
    let loadedData: ScoreEntry[] = [];
    try {
      const url = selectedClass && selectedClass !== "all" ? `/api/ranking?class=${encodeURIComponent(selectedClass)}` : "/api/ranking";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          loadedData = json.data;
        }
      }
    } catch {
      // Static host fallback (e.g. GitHub Pages)
    }

    if (!loadedData || loadedData.length === 0) {
      try {
        const saved = localStorage.getItem("turbine_global_rankings");
        if (saved) {
          loadedData = JSON.parse(saved);
        } else {
          loadedData = FALLBACK_SCORES;
          localStorage.setItem("turbine_global_rankings", JSON.stringify(FALLBACK_SCORES));
        }
      } catch {
        loadedData = FALLBACK_SCORES;
      }
    }

    if (selectedClass && selectedClass !== "all") {
      loadedData = loadedData.filter((item) => item.studentClass.toLowerCase() === selectedClass.toLowerCase());
    }

    // Sort strictly based on fewest failures, then lowest time, then highest score
    loadedData.sort((a, b) => {
      const failsA = a.failsCount ?? 0;
      const failsB = b.failsCount ?? 0;
      if (failsA !== failsB) return failsA - failsB;
      if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime;
      return b.score - a.score;
    });

    setRankings(loadedData);

    // Extract unique classes
    const uniqueClasses = Array.from(new Set(loadedData.map((item: ScoreEntry) => item.studentClass))) as string[];
    setClassesList(uniqueClasses);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRankings();
    }
  }, [isOpen, selectedClass]);

  if (!isOpen) return null;

  const filteredRankings = rankings.filter((entry) => {
    const matchesSearch = entry.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Clasificación Escolar Global
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                  En directo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compara tu puntuación con los alumnos de tu clase y de todo el centro
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Student Quick Status Card */}
        {currentProfile && (
          <div className="mx-4 mt-4 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center">
                {currentProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-white block">{currentProfile.name}</span>
                <span className="text-emerald-400">{currentProfile.studentClass}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <div>
                <span className="text-slate-400">Puntos actual:</span>{" "}
                <strong className="text-emerald-400 text-sm">{currentScore.toLocaleString()}</strong>
              </div>
              {currentProfile.bestScore > 0 && (
                <div>
                  <span className="text-slate-400">Récord:</span>{" "}
                  <strong className="text-white text-sm">{currentProfile.bestScore.toLocaleString()}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters and search bar */}
        <div className="p-4 flex flex-wrap gap-2 items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Class filter dropdown */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 py-1.5 px-3 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todas las Clases</option>
              {classesList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchRankings}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Podium for Top 3 */}
        {filteredRankings.length >= 3 && searchQuery === "" && selectedClass === "all" && (
          <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-3 gap-2 sm:gap-4 items-end">
            {/* 2nd Place */}
            <div className="bg-slate-900/90 border border-slate-700/60 p-2.5 rounded-xl text-center flex flex-col items-center">
              <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-extrabold text-xs flex items-center justify-center mb-1">
                2
              </span>
              <span className="text-xs font-bold text-slate-200 truncate w-full">
                {filteredRankings[1].studentName}
              </span>
              <span className="text-[10px] text-slate-400 truncate w-full">{filteredRankings[1].studentClass}</span>
              <span className="text-xs font-mono font-bold text-slate-300 mt-1">
                {filteredRankings[1].score.toLocaleString()} pts
              </span>
            </div>

            {/* 1st Place */}
            <div className="bg-amber-950/30 border border-amber-500/50 p-3 rounded-xl text-center flex flex-col items-center shadow-lg -translate-y-1">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center mb-1 shadow-md">
                1
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-amber-200 truncate w-full">
                {filteredRankings[0].studentName}
              </span>
              <span className="text-[11px] text-amber-400/80 truncate w-full">{filteredRankings[0].studentClass}</span>
              <span className="text-sm font-mono font-extrabold text-amber-400 mt-1">
                {filteredRankings[0].score.toLocaleString()} pts
              </span>
            </div>

            {/* 3rd Place */}
            <div className="bg-slate-900/90 border border-slate-700/60 p-2.5 rounded-xl text-center flex flex-col items-center">
              <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center mb-1">
                3
              </span>
              <span className="text-xs font-bold text-slate-200 truncate w-full">
                {filteredRankings[2].studentName}
              </span>
              <span className="text-[10px] text-slate-400 truncate w-full">{filteredRankings[2].studentClass}</span>
              <span className="text-xs font-mono font-bold text-amber-600 mt-1">
                {filteredRankings[2].score.toLocaleString()} pts
              </span>
            </div>
          </div>
        )}

        {/* Table List */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 pl-2 w-12">Pos.</th>
                <th className="pb-2">Alumno</th>
                <th className="pb-2">Clase</th>
                <th className="pb-2 text-center">Tiempo</th>
                <th className="pb-2 text-center">Fallos</th>
                <th className="pb-2 text-right">Puntos</th>
                <th className="pb-2 text-right hidden sm:table-cell">Nivel</th>
                <th className="pb-2 text-right pr-2">Precisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRankings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No se han encontrado registros en esta categoría
                  </td>
                </tr>
              ) : (
                filteredRankings.map((entry, idx) => {
                  const isCurrent =
                    currentProfile &&
                    entry.studentName.toLowerCase() === currentProfile.name.toLowerCase() &&
                    entry.studentClass.toLowerCase() === currentProfile.studentClass.toLowerCase();

                  const fails = entry.failsCount ?? 0;

                  return (
                    <tr
                      key={entry.id || idx}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isCurrent ? "bg-emerald-950/40 font-semibold" : ""
                      }`}
                    >
                      <td className="py-2.5 pl-2 font-mono font-bold">
                        {idx === 0 ? (
                          <span className="text-amber-400 flex items-center gap-1">🥇 1</span>
                        ) : idx === 1 ? (
                          <span className="text-slate-300 flex items-center gap-1">🥈 2</span>
                        ) : idx === 2 ? (
                          <span className="text-amber-600 flex items-center gap-1">🥉 3</span>
                        ) : (
                          <span className="text-slate-400">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-white font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{entry.studentName}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                              Tú
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-300">{entry.studentClass}</td>
                      <td className="py-2.5 text-center font-mono text-sky-400">
                        {formatTime(entry.totalTime)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] font-bold border ${
                            fails === 0
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                              : fails <= 2
                              ? "bg-amber-950/80 text-amber-300 border-amber-500/30"
                              : "bg-rose-950/80 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {fails}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400 text-sm">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-300 hidden sm:table-cell">
                        Nivel {entry.levelReached}
                      </td>
                      <td className="py-2.5 text-right pr-2 font-mono text-cyan-300">
                        {entry.accuracy}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Participantes: {filteredRankings.length} alumnos registrados</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
