import React from 'react';
import { BotState } from '../types/hub';
import { 
  Heart, 
  Utensils, 
  BookOpen, 
  Trash2, 
  Play, 
  Pause, 
  SlidersHorizontal, 
  Skull,
  Zap,
  Activity
} from 'lucide-react';

interface BotCardProps {
  bot: BotState;
  isSelected: boolean;
  onSelect: (botId: string) => void;
  onCommand: (botId: string, action: string, extra?: Record<string, unknown>) => void;
  onTerminate: (botId: string) => void;
}

export const BotCard: React.FC<BotCardProps> = ({
  bot,
  isSelected,
  onSelect,
  onCommand,
  onTerminate
}) => {
  const hp = bot.hp ?? 20;
  const food = bot.food ?? 20;
  const isLowHp = hp < 8;
  const isHungry = food < 10;
  const isAttackActive = bot.modules?.includes('attack');
  const isEnchantActive = bot.modules?.includes('enchant');

  const goodBooks = bot.stats?.counters?.books_good || 0;
  const trashBooks = bot.stats?.counters?.books_trash || 0;

  // Status text determination
  let statusBadge = { text: '🟢 В НОРМЕ', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  if (!bot.connected) {
    statusBadge = { text: '⚫ ОТКЛЮЧЕН', color: 'bg-slate-700/30 text-slate-400 border-slate-600/30' };
  } else if (isLowHp) {
    statusBadge = { text: '🟠 НИЗКОЕ HP', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
  } else if (isHungry) {
    statusBadge = { text: '🟡 ГОЛОДЕН', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' };
  }

  return (
    <div
      onClick={() => onSelect(bot.id)}
      className={`relative group rounded-2xl p-4 transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-emerald-950/20 border-emerald-500/70 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
          : 'bg-[#111827]/80 hover:bg-[#162033]/90 border-slate-800 hover:border-slate-700 shadow-md'
      }`}
    >
      {/* Top row: Bot ID & Level badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-base text-emerald-400 border border-slate-700 group-hover:border-emerald-500/40 transition">
            {bot.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-emerald-300 transition">
                {bot.username}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ({bot.id})
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                {statusBadge.text}
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {bot.level} ур.
              </span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onCommand(bot.id, isAttackActive ? 'stop_attack' : 'start_attack')}
            className={`p-2 rounded-xl text-xs font-medium border transition ${
              isAttackActive
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
            title={isAttackActive ? "Остановить атаку" : "Начать атаку"}
          >
            {isAttackActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button
            onClick={() => onSelect(bot.id)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700"
            title="Открыть панель управления"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Health & Food meters */}
      <div className="grid grid-cols-2 gap-2 my-2.5">
        <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <Heart className="w-3 h-3 fill-rose-500/40 text-rose-400" /> HP
            </span>
            <span className={`font-mono font-bold ${isLowHp ? 'text-amber-400 animate-pulse' : 'text-slate-200'}`}>
              {hp.toFixed(1)}/20
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isLowHp ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (hp / 20) * 100))}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Utensils className="w-3 h-3 text-amber-400" /> Еда
            </span>
            <span className={`font-mono font-bold ${isHungry ? 'text-yellow-400 animate-pulse' : 'text-slate-200'}`}>
              {food}/20
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isHungry ? 'bg-gradient-to-r from-yellow-600 to-amber-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (food / 20) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Action Banner */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs mb-3">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-cyan-400" />
          Действие:
        </span>
        <span className="font-semibold text-cyan-300 truncate max-w-[180px]">
          {bot.current_action || 'Ожидание'}
        </span>
      </div>

      {/* Book Counters & Trash */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Ценных книг зачаровано">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-emerald-300">{goodBooks}</span>
            <span className="text-[10px] text-slate-400">топ</span>
          </div>
          <div className="flex items-center gap-1" title="Мусорных книг зачаровано">
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-bold text-rose-300">{trashBooks}</span>
            <span className="text-[10px] text-slate-400">мусор</span>
          </div>
        </div>

        {/* Modules mini pills */}
        <div className="flex items-center gap-1">
          {bot.modules?.map((m) => (
            <span
              key={m}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80 uppercase"
            >
              {m === 'attack' ? 'ATK' : m === 'enchant' ? 'ENCH' : m === 'food' ? 'EAT' : m === 'exp' ? 'EXP' : m === 'auto_sort' ? 'SORT' : m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
