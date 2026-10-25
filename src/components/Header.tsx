import React from 'react';
import { 
  Play, 
  Pause, 
  Sparkles, 
  Search, 
  Settings, 
  Volume2, 
  VolumeX, 
  Radio, 
  ShieldAlert,
  Server
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  connected: boolean;
  botCount: number;
  activeCount: number;
  mainAccount: string;
  onStartAll: () => void;
  onStopAll: () => void;
  onTransferAll: () => void;
  onOpenScan: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  botCount,
  activeCount,
  mainAccount,
  onStartAll,
  onStopAll,
  onTransferAll,
  onOpenScan,
  onOpenSettings,
  soundEnabled,
  onToggleSound
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0d131f]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <span className="text-xl tracking-tighter">F+</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${connected ? 'bg-emerald-400 opacity-75' : 'bg-rose-500 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                  Farm<span className="text-emerald-400">+</span> Hub
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.0 Web
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <Server className="w-2.5 h-2.5" /> TCP ХАБ АГЕНТОВ
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Сеть: <strong className={connected ? "text-emerald-400" : "text-rose-400"}>{connected ? "Подключено" : "Переподключение..."}</strong></span>
                <span>•</span>
                <span>Боты: <strong className="text-slate-200">{activeCount}/{botCount}</strong> онлайн</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Мейн: <strong className="text-emerald-300 font-mono">{mainAccount}</strong></span>
              </p>
            </div>
          </div>

          {/* Mobile Right Quick Action Trigger */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onToggleSound}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white"
              title={soundEnabled ? "Выключить звук" : "Включить звук"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Hub Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={onStartAll}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Старт всех
          </button>

          <button
            onClick={onStopAll}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 active:scale-95 text-amber-300 text-xs sm:text-sm font-semibold border border-amber-500/30 transition whitespace-nowrap cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            Стоп всех
          </button>

          <button
            onClick={onTransferAll}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 active:scale-95 text-cyan-300 text-xs sm:text-sm font-semibold border border-cyan-500/30 transition whitespace-nowrap cursor-pointer"
            title="Передать опыт всем ботам выше порога на основной аккаунт"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Опыт всем
          </button>

          <button
            onClick={onOpenScan}
            className="hidden sm:flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs sm:text-sm font-medium border border-slate-700 transition whitespace-nowrap cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            Скан портов
          </button>

          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer"
              title={soundEnabled ? "Звуковые сигналы включены" : "Звуковые сигналы выключены"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer"
              title="Настройки хаба"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
