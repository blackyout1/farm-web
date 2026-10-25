import React from 'react';
import { ShieldAlert, Skull, X } from 'lucide-react';

interface UrgentAlertBannerProps {
  alert: { bot_id: string; msg: string } | null;
  onDismiss: () => void;
  onTerminate: (botId: string) => void;
}

export const UrgentAlertBanner: React.FC<UrgentAlertBannerProps> = ({
  alert,
  onDismiss,
  onTerminate
}) => {
  if (!alert) return null;

  return (
    <div className="fixed top-18 left-4 right-4 z-40 max-w-2xl mx-auto animate-in slide-in-from-top-4 duration-300">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-2 border-rose-500 shadow-2xl shadow-rose-950/80 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/40 shrink-0 animate-pulse">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wider text-rose-300">
                🚨 FARM+ ВНИМАНИЕ: УГРОЗА БАНА!
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-500/30 border border-rose-400">
                {alert.bot_id}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-rose-100 mt-1 line-clamp-2">
              {alert.msg}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => {
              onTerminate(alert.bot_id);
              onDismiss();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-black/40 transition cursor-pointer"
          >
            <Skull className="w-4 h-4" />
            Терминировать бота
          </button>
          <button
            onClick={onDismiss}
            className="p-2 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 transition cursor-pointer"
            title="Игнорировать"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
