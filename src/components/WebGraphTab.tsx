import React, { useState, useMemo } from 'react';
import { GraphPoint, BotState } from '../types/hub';
import { 
  TrendingUp, 
  Coins, 
  BookOpen, 
  Trash2, 
  Clock, 
  BarChart3,
  Bot
} from 'lucide-react';
import { formatCoins } from '../utils/enchantments';

interface WebGraphTabProps {
  bots: Record<string, BotState>;
  selectedBotId: string | null;
  onSelectBot: (id: string) => void;
  graphHistory: Record<string, GraphPoint[]>;
}

export const WebGraphTab: React.FC<WebGraphTabProps> = ({
  bots,
  selectedBotId,
  onSelectBot,
  graphHistory
}) => {
  const [viewMode, setViewMode] = useState<string>('selected'); // 'selected' or 'all'
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const botList = Object.values(bots);
  const activeBot = selectedBotId ? bots[selectedBotId] : botList[0] || null;

  // Active dataset
  const points: GraphPoint[] = useMemo(() => {
    if (viewMode === 'all') {
      // Aggregate all bots by timestamp or step
      const botKeys = Object.keys(graphHistory);
      if (botKeys.length === 0) return [];
      const primary = graphHistory[botKeys[0]] || [];
      return primary.map((pt, idx) => {
        let totalGood = 0;
        let totalTrash = 0;
        let totalProfit = 0;
        for (const k of botKeys) {
          const bPt = graphHistory[k]?.[idx];
          if (bPt) {
            totalGood += bPt.books_good;
            totalTrash += bPt.books_trash;
            totalProfit += bPt.profit;
          }
        }
        return {
          time: pt.time,
          rawTime: pt.rawTime,
          books_good: totalGood,
          books_trash: totalTrash,
          profit: totalProfit
        };
      });
    }

    if (!activeBot) return [];
    return graphHistory[activeBot.id] || [];
  }, [viewMode, activeBot, graphHistory]);

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  const goodCount = lastPoint?.books_good || 0;
  const trashCount = lastPoint?.books_trash || 0;
  const currentProfit = lastPoint?.profit || 0;

  // Rate of profit per hour
  const hourlyRate = useMemo(() => {
    if (!lastPoint || !firstPoint || points.length < 2) return 0;
    const durationHours = Math.max(0.005, (lastPoint.rawTime - firstPoint.rawTime) / 3600000);
    const profitDelta = Math.max(0, lastPoint.profit - firstPoint.profit);
    return Math.round(profitDelta / durationHours);
  }, [points, lastPoint, firstPoint]);

  // Chart coordinate calculations
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 60, bottom: 40, left: 50 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxBooks = useMemo(() => {
    if (points.length === 0) return 10;
    let max = 0;
    for (const p of points) {
      if (p.books_good > max) max = p.books_good;
      if (p.books_trash > max) max = p.books_trash;
    }
    return Math.max(10, Math.ceil(max * 1.2));
  }, [points]);

  const maxProfit = useMemo(() => {
    if (points.length === 0) return 1000000;
    let max = 0;
    for (const p of points) {
      if (p.profit > max) max = p.profit;
    }
    return Math.max(1000000, Math.ceil(max * 1.15));
  }, [points]);

  const getX = (idx: number) => {
    if (points.length <= 1) return padding.left;
    return padding.left + (idx / (points.length - 1)) * innerWidth;
  };

  const getYBooks = (val: number) => {
    return padding.top + innerHeight - (val / maxBooks) * innerHeight;
  };

  const getYProfit = (val: number) => {
    return padding.top + innerHeight - (val / maxProfit) * innerHeight;
  };

  // Build SVG path
  const goodPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYBooks(p.books_good)}`).join(' ');
  const trashPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYBooks(p.books_trash)}`).join(' ');
  const profitPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYProfit(p.profit)}`).join(' ');

  const goodArea = points.length > 0
    ? `${goodPath} L ${getX(points.length - 1)} ${padding.top + innerHeight} L ${getX(0)} ${padding.top + innerHeight} Z`
    : '';

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : lastPoint;

  return (
    <div className="space-y-4">
      {/* Bot Selector and View mode switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0d131f]/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Аналитика зачарований и прибыли
            </h3>
            <p className="text-xs text-slate-400">
              График динамики добычи ценных книг, мусора и расчетного заработка
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('selected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'selected' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Один бот
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Суммарно все
            </button>
          </div>

          {viewMode === 'selected' && (
            <select
              value={activeBot?.id || ''}
              onChange={(e) => onSelectBot(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-cyan-500"
            >
              {botList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.username} ({b.id})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Ценных книг
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Топ
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {goodCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Починка, Эффективность, Магнит и др.
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              Мусорных книг
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
              Сброс
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
            {trashCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Утилизировано или выброшено
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              Примерный доход
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Монеты
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {formatCoins(currentProfit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Инвентарь + шалкеры
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Темп фарма
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              В час
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
            ~{formatCoins(hourlyRate)}/ч
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Средняя скорость генерации монет
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0d131f]/95 border border-slate-800 shadow-2xl relative">
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              Ценные книги (левая шкала)
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-rose-400">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              Мусор
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-amber-400">
              <span className="w-3 h-1 bg-amber-400 border-dashed" />
              Доход в монетах (правая шкала)
            </span>
          </div>

          {hoveredPoint && (
            <div className="text-xs font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
              Время: <strong className="text-white">{hoveredPoint.time}</strong> | Топ: <strong className="text-emerald-400">{hoveredPoint.books_good}</strong> | Мусор: <strong className="text-rose-400">{hoveredPoint.books_trash}</strong> | Профит: <strong className="text-amber-400">{formatCoins(hoveredPoint.profit)}</strong>
            </div>
          )}
        </div>

        {/* Chart Canvas */}
        <div className="w-full h-72 sm:h-84 mt-2">
          {points.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              Сбор данных с агентов... подождите пару секунд.
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full overflow-visible"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="goodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = padding.top + innerHeight * (1 - pct);
                const valBooks = Math.round(maxBooks * pct);
                const valProfit = Math.round(maxProfit * pct);
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + innerWidth}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      fill="#10b981"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {valBooks}
                    </text>
                    <text
                      x={padding.left + innerWidth + 8}
                      y={y + 4}
                      fill="#fbbf24"
                      fontSize="10"
                      textAnchor="start"
                      fontFamily="monospace"
                    >
                      {formatCoins(valProfit)}
                    </text>
                  </g>
                );
              })}

              {/* Area gradient for valuable books */}
              {goodArea && <path d={goodArea} fill="url(#goodGrad)" />}

              {/* Lines */}
              <path
                d={goodPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={trashPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={profitPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="5 5"
                strokeLinecap="round"
              />

              {/* Interactive Hover Bars */}
              {points.map((p, i) => {
                const x = getX(i);
                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoverIndex(i)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x - (innerWidth / points.length) / 2}
                      y={padding.top}
                      width={Math.max(8, innerWidth / points.length)}
                      height={innerHeight}
                      fill="transparent"
                    />
                    {hoverIndex === i && (
                      <>
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={padding.top + innerHeight}
                          stroke="#64748b"
                          strokeDasharray="2 2"
                        />
                        <circle cx={x} cy={getYBooks(p.books_good)} r="4" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                        <circle cx={x} cy={getYBooks(p.books_trash)} r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                        <circle cx={x} cy={getYProfit(p.profit)} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                      </>
                    )}
                  </g>
                );
              })}

              {/* X Axis Time Labels */}
              {points.length > 0 && (
                <>
                  <text
                    x={padding.left}
                    y={chartHeight - 12}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="start"
                    fontFamily="monospace"
                  >
                    {firstPoint.time}
                  </text>
                  <text
                    x={padding.left + innerWidth}
                    y={chartHeight - 12}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {lastPoint.time}
                  </text>
                </>
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
