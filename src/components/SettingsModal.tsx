import React, { useState } from 'react';
import { HubConfig } from '../types/hub';
import { 
  Settings, 
  X, 
  User, 
  ShieldAlert, 
  Radio, 
  Save, 
  Server,
  Zap,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HubConfig;
  onSaveConfig: (newConfig: Partial<HubConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [mainAccount, setMainAccount] = useState(config.mainAccount || 'MyMain');
  const [autoPauseAllOnDanger, setAutoPauseAllOnDanger] = useState(config.autoPauseAllOnDanger ?? false);
  const [autoScanOnStart, setAutoScanOnStart] = useState(config.autoScanOnStart ?? true);
  const [host, setHost] = useState(config.host || '127.0.0.1');
  const [scanStart, setScanStart] = useState(config.autoScanPortStart || 25580);
  const [scanEnd, setScanEnd] = useState(config.autoScanPortEnd || 25600);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      mainAccount,
      autoPauseAllOnDanger,
      autoScanOnStart,
      host,
      autoScanPortStart: scanStart,
      autoScanPortEnd: scanEnd
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#0f172a] rounded-2xl border border-slate-700/80 shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Параметры Farm+ Hub
              </h2>
              <p className="text-xs text-slate-400">
                Настройки основного аккаунта, защиты и режимов работы
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Main Account Nickname */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Основной аккаунт (для авто-передачи опыта):
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={mainAccount}
                onChange={(e) => setMainAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                placeholder="MyMain"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Имя игрока на сервере, которому боты передают накопленный опыт
            </span>
          </div>

          {/* TCP Connection Info */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Server className="w-4 h-4" />
              Прямой TCP шлюз к Minecraft агентам
            </div>
            <p className="text-[11px] text-slate-400">
              Хаб подключается по сокетам к запущенным ботам на <span className="font-mono text-slate-200">{host}:{scanStart}–{scanEnd}</span>.
              Данные передаются напрямую без посредников.
            </p>
          </div>

          {/* Auto Pause on Danger */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Автопауза всех ботов при опасности
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Останавливать авто-атаку при появлении модератора или угрозе бана
                </span>
              </div>
              <button
                onClick={() => setAutoPauseAllOnDanger(!autoPauseAllOnDanger)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  autoPauseAllOnDanger ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>

          {/* Auto Scan on Start */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Автосканирование портов при запуске
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Автоматически искать запущенных агентов на {host}:{scanStart}–{scanEnd}
                </span>
              </div>
              <button
                onClick={() => setAutoScanOnStart(!autoScanOnStart)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  autoScanOnStart ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>

          {/* Network Host & Range */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Хост агентов:
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Нач. порт:
              </label>
              <input
                type="number"
                value={scanStart}
                onChange={(e) => setScanStart(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Кон. порт:
              </label>
              <input
                type="number"
                value={scanEnd}
                onChange={(e) => setScanEnd(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Сохранено!' : 'Сохранить настройки'}
          </button>
        </div>
      </div>
    </div>
  );
};
