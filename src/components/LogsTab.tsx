import React, { useState, useRef, useEffect } from 'react';
import { LogEntry } from '../types/hub';
import { 
  Terminal, 
  Copy, 
  Trash2, 
  ArrowDown, 
  Search, 
  Check, 
  SlidersHorizontal 
} from 'lucide-react';

interface LogsTabProps {
  logs: LogEntry[];
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'cmd'>('all');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((l) => {
    if (filter !== 'all' && l.level !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.msg.toLowerCase().includes(q) ||
        (l.bot_id && l.bot_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const copyLogs = () => {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0d131f]/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Консоль системных логов
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {filteredLogs.length} строк
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Потоковый вывод команд, состояний агентов и сетевых пакетов
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Поиск по логу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={copyLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Скопировано!' : 'Копировать'}
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Все записи' },
          { id: 'info', label: 'ℹ Инфо' },
          { id: 'cmd', label: '⚙ Команды' },
          { id: 'warn', label: '⚠ Варнинги' },
          { id: 'error', label: '✖ Ошибки' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as unknown as typeof filter)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              filter === f.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Terminal View */}
      <div
        ref={containerRef}
        className="rounded-2xl bg-[#080d16] border border-slate-800/80 p-4 font-mono text-xs text-slate-300 h-96 overflow-y-auto space-y-1.5 shadow-2xl selection:bg-emerald-500/30"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-10">
            Логи отсутствуют или отфильтрованы
          </div>
        ) : (
          filteredLogs.map((l) => {
            let textColor = 'text-slate-300';
            let prefix = '•';
            if (l.level === 'warn') {
              textColor = 'text-amber-300';
              prefix = '⚠';
            } else if (l.level === 'error' || l.level === 'danger') {
              textColor = 'text-rose-400 font-bold';
              prefix = '✖';
            } else if (l.level === 'ack') {
              textColor = 'text-emerald-400';
              prefix = '✓';
            } else if (l.level === 'cmd') {
              textColor = 'text-cyan-300';
              prefix = '⚙';
            }

            return (
              <div key={l.id} className="flex items-start gap-2 leading-relaxed hover:bg-slate-800/30 px-1 py-0.5 rounded">
                <span className="text-slate-600 shrink-0 select-none">
                  [{l.timestamp}]
                </span>
                <span className={`shrink-0 ${textColor}`}>
                  {prefix}
                </span>
                <span className={`break-all ${textColor}`}>
                  {l.msg}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
