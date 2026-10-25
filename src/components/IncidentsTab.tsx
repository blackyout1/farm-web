import React, { useState } from 'react';
import { Incident } from '../types/hub';
import { 
  ShieldAlert, 
  Download, 
  Trash2, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Skull,
  Filter
} from 'lucide-react';

interface IncidentsTabProps {
  incidents: Incident[];
  onClear: () => void;
  onTerminateBot: (botId: string) => void;
}

export const IncidentsTab: React.FC<IncidentsTabProps> = ({
  incidents,
  onClear,
  onTerminateBot
}) => {
  const [filter, setFilter] = useState<'all' | 'danger' | 'warn' | 'error'>('all');

  const filteredIncidents = incidents.filter((i) => {
    if (filter === 'all') return true;
    return i.category === filter;
  });

  const exportToFile = () => {
    const text = incidents
      .map((i) => `[${i.timestamp}] [${i.category.toUpperCase()}] ${i.bot_id} — ${i.msg}`)
      .join('\n');
    const blob = new Blob([text || 'Журнал инцидентов пуст\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farmplus_incidents_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dangerCount = incidents.filter((i) => i.category === 'danger').length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0d131f]/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Журнал инцидентов и угроз бана
              {dangerCount > 0 && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  {dangerCount} опасных
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Фиксация заходов модераторов, проверок, предупреждений и критических сбоев
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Сохранить в файл
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/50 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Очистить
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Все события', count: incidents.length },
          { id: 'danger', label: '🚨 Опасность (Danger)', count: dangerCount },
          { id: 'warn', label: '⚠ Предупреждения', count: incidents.filter((i) => i.category === 'warn').length },
          { id: 'error', label: '✖ Ошибки', count: incidents.filter((i) => i.category === 'error').length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as unknown as typeof filter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              filter === f.id
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Incidents List */}
      <div className="space-y-2.5">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 rounded-2xl bg-[#0d131f]/90 border border-slate-800 text-xs">
            Инцидентов не зафиксировано. Все системы в норме.
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isDanger = inc.category === 'danger';
            const isWarn = inc.category === 'warn';
            const isError = inc.category === 'error';

            return (
              <div
                key={inc.id}
                className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  isDanger
                    ? 'bg-rose-950/40 border-rose-600/70 shadow-lg shadow-rose-950/30'
                    : isWarn
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                    isDanger ? 'bg-rose-500/20 text-rose-400' : isWarn ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isDanger ? <ShieldAlert className="w-4 h-4 animate-bounce" /> : isWarn ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {inc.timestamp}
                      </span>
                      <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                        isDanger ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : isWarn ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300'
                      }`}>
                        [{inc.category.toUpperCase()}]
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-400">
                        {inc.bot_id}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm font-medium ${isDanger ? 'text-rose-200 font-semibold' : 'text-slate-200'}`}>
                      {inc.msg}
                    </p>
                  </div>
                </div>

                {/* Direct Action if danger */}
                {isDanger && (
                  <button
                    onClick={() => onTerminateBot(inc.bot_id)}
                    className="self-end sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Skull className="w-3.5 h-3.5" />
                    Экстренно терминировать
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
