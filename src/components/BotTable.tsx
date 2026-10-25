import React from 'react';
import { BotState } from '../types/hub';
import { Play, Pause, SlidersHorizontal, Skull, Heart, Utensils } from 'lucide-react';

interface BotTableProps {
  bots: BotState[];
  selectedBotId: string | null;
  onSelect: (botId: string) => void;
  onCommand: (botId: string, action: string, extra?: Record<string, unknown>) => void;
  onTerminate: (botId: string) => void;
}

export const BotTable: React.FC<BotTableProps> = ({
  bots,
  selectedBotId,
  onSelect,
  onCommand,
  onTerminate
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0d131f]/90 shadow-xl">
      <table className="w-full text-left text-xs sm:text-sm text-slate-300">
        <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px] tracking-wider">
          <tr>
            <th className="px-4 py-3">Бот ID</th>
            <th className="px-4 py-3">Ник</th>
            <th className="px-4 py-3">Ур.</th>
            <th className="px-4 py-3">HP</th>
            <th className="px-4 py-3">Еда</th>
            <th className="px-4 py-3 text-emerald-400">Хор. Книги</th>
            <th className="px-4 py-3 text-rose-400">Мусор</th>
            <th className="px-4 py-3">Действие</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-sans">
          {bots.map((bot) => {
            const isSelected = selectedBotId === bot.id;
            const hp = bot.hp ?? 20;
            const food = bot.food ?? 20;
            const isLowHp = hp < 8;
            const isHungry = food < 10;
            const isAttackActive = bot.modules?.includes('attack');
            const goodBooks = bot.stats?.counters?.books_good || 0;
            const trashBooks = bot.stats?.counters?.books_trash || 0;

            let statusLabel = '🟢 OK';
            let statusColor = 'text-emerald-400';
            if (!bot.connected) {
              statusLabel = '⚫ НЕТ ДАННЫХ';
              statusColor = 'text-slate-500';
            } else if (isLowHp) {
              statusLabel = '🟠 НИЗКОЕ HP';
              statusColor = 'text-amber-400';
            } else if (isHungry) {
              statusLabel = '🟡 ГОЛОДЕН';
              statusColor = 'text-yellow-400';
            }

            return (
              <tr
                key={bot.id}
                onClick={() => onSelect(bot.id)}
                className={`transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/30 text-white font-medium hover:bg-emerald-950/40'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <td className="px-4 py-3 font-mono font-bold text-slate-200">
                  {bot.id}
                </td>
                <td className="px-4 py-3 font-semibold text-white">
                  {bot.username}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                    {bot.level}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono flex items-center gap-1 ${isLowHp ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                    <Heart className="w-3 h-3 text-rose-400" />
                    {hp.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono flex items-center gap-1 ${isHungry ? 'text-yellow-400 font-bold' : 'text-slate-200'}`}>
                    <Utensils className="w-3 h-3 text-amber-400" />
                    {food}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-emerald-400">
                  {goodBooks}
                </td>
                <td className="px-4 py-3 font-bold text-rose-400">
                  {trashBooks}
                </td>
                <td className="px-4 py-3 text-cyan-300 max-w-[200px] truncate">
                  {bot.current_action || 'IDLE'}
                </td>
                <td className={`px-4 py-3 font-medium ${statusColor}`}>
                  {statusLabel}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onCommand(bot.id, isAttackActive ? 'stop_attack' : 'start_attack')}
                      className={`p-1.5 rounded-lg border text-xs font-semibold ${
                        isAttackActive
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      }`}
                      title={isAttackActive ? "Пауза атаки" : "Старт атаки"}
                    >
                      {isAttackActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                    <button
                      onClick={() => onSelect(bot.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700"
                      title="Настройки бота"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onTerminate(bot.id)}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-800/50 hover:bg-rose-900/60"
                      title="Терминировать бота"
                    >
                      <Skull className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
