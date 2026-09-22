import React, { useEffect, useState } from "react";
import { ScoreEntry, StudentProfile } from "../types";
import {
  Trophy,
  Medal,
  Award,
  Search,
  Filter,
  RefreshCw,
  User,
  Calendar,
  Clock,
  CheckCircle,
  Sparkles,
  School,
} from "lucide-react";
import { sounds } from "../utils/audio";

interface RankingViewProps {
  currentProfile: StudentProfile | null;
  currentScore: number;
  onOpenAuthModal?: () => void;
}

export const RankingView: React.FC<RankingViewProps> = ({
  currentProfile,
  currentScore,
  onOpenAuthModal,
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
      const url =
        selectedClass && selectedClass !== "all"
          ? `/api/ranking?class=${encodeURIComponent(selectedClass)}`
          : "/api/ranking";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          loadedData = json.data;
        }
      }
    } catch {
      // Local fallback
    }

    if (loadedData.length === 0) {
      try {
        const local = localStorage.getItem("turbine_global_rankings");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedData = parsed;
          }
        }
      } catch {
        // ignore
      }
    }

    if (loadedData.length === 0) {
      loadedData = FALLBACK_SCORES;
    }

    // Extract unique classes
    const uniqueClasses = Array.from(new Set(loadedData.map((e) => e.studentClass))).filter(Boolean);
    setClassesList(uniqueClasses);

    // Sort by score desc
    const sorted = [...loadedData].sort((a, b) => b.score - a.score);
    setRankings(sorted);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRankings();
  }, [selectedClass]);

  const filteredRankings = rankings.filter((item) => {
    const matchClass = selectedClass === "all" || item.studentClass === selectedClass;
    const matchSearch =
      searchQuery.trim() === "" ||
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentClass.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const currentRank = currentProfile
    ? rankings.findIndex((r) => r.studentName.toLowerCase() === currentProfile.name.toLowerCase()) + 1
    : null;

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl flex flex-col gap-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shadow-lg shadow-amber-500/10">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              Clasificación y Puntuaciones
              <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                Oficial
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Registro con nombre del estudiante, fecha y puntuación obtenida en el aerogenerador
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              fetchRankings();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
            <span>Actualizar</span>
          </button>

          {!currentProfile && onOpenAuthModal && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAuthModal();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md"
            >
              <User className="w-3.5 h-3.5" />
              <span>Identificarme</span>
            </button>
          )}
        </div>
      </div>

      {/* Student position banner if logged in */}
      {currentProfile && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center text-sm">
              {currentRank && currentRank > 0 ? `#${currentRank}` : <User className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Estudiante Actual:</span>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                {currentProfile.name}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {currentProfile.studentClass}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Puntuación:</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {currentScore.toLocaleString()} pts
              </span>
            </div>
            {currentRank && currentRank > 0 && (
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Posición:</span>
                <span className="text-lg font-black font-mono text-amber-400">
                  Top #{currentRank}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de alumno o clase..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todas las clases ({rankings.length})</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RANKINGS TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
              <th className="py-3 px-3 sm:px-4 font-bold text-center w-14">#</th>
              <th className="py-3 px-3 sm:px-4 font-bold">Estudiante / Alumno</th>
              <th className="py-3 px-3 sm:px-4 font-bold hidden sm:table-cell">Curso / Clase</th>
              <th className="py-3 px-3 sm:px-4 font-bold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Fecha
                </span>
              </th>
              <th className="py-3 px-3 sm:px-4 font-bold text-right">Puntuación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRankings.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No se encontraron resultados con ese criterio.
                </td>
              </tr>
            ) : (
              filteredRankings.map((entry, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;
                const isCurrent =
                  currentProfile &&
                  entry.studentName.toLowerCase() === currentProfile.name.toLowerCase();

                return (
                  <tr
                    key={entry.id || index}
                    className={`transition-colors ${
                      isCurrent
                        ? "bg-amber-950/30 text-white font-semibold ring-1 ring-amber-500/40"
                        : "hover:bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    {/* Rank Number / Medal */}
                    <td className="py-3 px-3 sm:px-4 text-center font-bold">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30">
                          1
                        </span>
                      ) : isTop2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black">
                          2
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black">
                          3
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400">#{index + 1}</span>
                      )}
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{entry.studentName}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Tú
                          </span>
                        )}
                        {entry.levelReached && (
                          <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Nivel {entry.levelReached}
                          </span>
                        )}
                      </div>
                      <span className="sm:hidden text-[10px] text-slate-400 block mt-0.5">
                        {entry.studentClass}
                      </span>
                    </td>

                    {/* Class */}
                    <td className="py-3 px-3 sm:px-4 hidden sm:table-cell text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <School className="w-3 h-3 text-slate-400" />
                        {entry.studentClass}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 sm:px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 sm:px-4 text-right font-black font-mono text-sm text-emerald-400">
                      {entry.score.toLocaleString()} pts
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
