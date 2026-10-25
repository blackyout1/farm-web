import React, { useState } from 'react';
import { BotState } from '../types/hub';
import { 
  BarChart2, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Swords, 
  BookOpen,
  Award
} from 'lucide-react';

interface StatsTabProps {
  bots: Record<string, BotState>;
  selectedBotId: string | null;
  onSelectBot: (id: string) => void;
}

export const StatsTab: React.FC<StatsTabProps> = ({
  bots,
  selectedBotId,
  onSelectBot
}) => {
  const [subTab, setSubTab] = useState<'books' | 'kills'>('books');

  const botList = Object.values(bots);
  const activeBot = selectedBotId ? bots[selectedBotId] : botList[0] || null;

  if (!activeBot) {
    return (
      <div className="p-8 text-center text-slate-500 rounded-2xl bg-[#0d131f]/90 border border-slate-800">
        Нет доступных агентов для отображения статистики
      </div>
    );
  }

  const stats = activeBot.stats || { counters: { books_good: 0, books_trash: 0 }, uptime: 0, kills: {} };
  const good = stats.counters?.books_good || 0;
  const trash = stats.counters?.books_trash || 0;
  const totalEnchants = good + trash;

  // Format uptime
  const uptimeSec = stats.uptime || 0;
  const h = Math.floor(uptimeSec / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const s = uptimeSec % 60;
  const uptimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const currentBooks = activeBot.current_books || {};
  const currentBooksEntries = Object.entries(currentBooks);

  const kills = stats.kills || {};
  const killsEntries = Object.entries(kills).sort((a, b) => b[1] - a[1]);
  const totalKills = killsEntries.reduce((sum, item) => sum + item[1], 0);

  return (
    <div className="space-y-4">
      {/* Bot Selector & Uptime */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0d131f]/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Подробная статистика агента
            </h3>
            <p className="text-xs text-slate-400">
              Инвентарь ценных зачарований и счетчик убийств мобов
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Время работы: <strong className="text-white">{uptimeStr}</strong></span>
          </div>

          <select
            value={activeBot.id}
            onChange={(e) => onSelectBot(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
          >
            {botList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.username} ({b.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Ценных книг
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
              {good}
            </div>
          </div>
          <div className="text-xs font-mono font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {totalEnchants > 0 ? ((good / totalEnchants) * 100).toFixed(0) : 0}% винрейт
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-400" />
              Мусора
            </span>
            <div className="text-2xl font-black font-mono text-rose-400 mt-0.5">
              {trash}
            </div>
          </div>
          <div className="text-xs font-mono font-bold px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
            {totalEnchants > 0 ? ((trash / totalEnchants) * 100).toFixed(0) : 0}% мусора
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Зачаровано всего
            </span>
            <div className="text-2xl font-black font-mono text-purple-400 mt-0.5">
              {totalEnchants}
            </div>
          </div>
          <div className="text-xs font-mono font-bold px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
            {totalKills} мобов убито
          </div>
        </div>
      </div>

      {/* Sub tabs: Books vs Kills */}
      <div className="rounded-2xl bg-[#0d131f]/95 border border-slate-800 shadow-xl overflow-hidden">
        <div className="flex border-b border-slate-800 bg-slate-900/70 p-1.5 gap-2">
          <button
            onClick={() => setSubTab('books')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              subTab === 'books'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            📚 Ценные книги в инвентаре ({currentBooksEntries.length})
          </button>
          <button
            onClick={() => setSubTab('kills')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              subTab === 'kills'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            ⚔️ Убийства мобов ({killsEntries.length})
          </button>
        </div>

        <div className="p-4">
          {subTab === 'books' ? (
            currentBooksEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                В инвентаре бота сейчас нет сохраненных ценных книг (возможно они уже выгружены в шалкер).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentBooksEntries.map(([name, count]) => {
                  const lower = name.toLowerCase();
                  let cardStyle = 'border-slate-800 bg-slate-900/60';
                  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

                  if (lower.includes('mending') || lower.includes('починка')) {
                    cardStyle = 'border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 to-slate-900';
                    badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  } else if (lower.includes('efficiency') || lower.includes('эффективност')) {
                    cardStyle = 'border-cyan-500/50 bg-gradient-to-r from-cyan-950/40 to-slate-900';
                    badgeStyle = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
                  } else if (lower.includes('магнит') || lower.includes('бульдозер') || lower.includes('бур')) {
                    cardStyle = 'border-purple-500/50 bg-gradient-to-r from-purple-950/40 to-slate-900';
                    badgeStyle = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                  }

                  return (
                    <div
                      key={name}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${cardStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-xs font-bold border border-slate-700">
                          📖
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-white block">
                            {name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {lower.includes('магнит') || lower.includes('бульдозер') ? 'Кастомная реликвия' : 'Ванильное зачарование'}
                          </span>
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${badgeStyle}`}>
                        x{count} шт.
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            killsEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Пока нет записей об убийствах мобов.
              </div>
            ) : (
              <div className="space-y-2">
                {killsEntries.map(([mob, count]) => {
                  const share = totalKills > 0 ? (count / totalKills) * 100 : 0;
                  return (
                    <div
                      key={mob}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 flex items-center gap-2">
                          <Swords className="w-3.5 h-3.5 text-emerald-400" />
                          {mob}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {share.toFixed(1)}%
                          </span>
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {count.toLocaleString('ru-RU')}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          style={{ width: `${Math.min(100, Math.max(3, share))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
