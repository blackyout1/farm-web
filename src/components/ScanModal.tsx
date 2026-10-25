import React, { useState } from 'react';
import { Search, X, Loader2, CheckCircle2, AlertCircle, Plus, Server } from 'lucide-react';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultHost: string;
  defaultStart: number;
  defaultEnd: number;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  defaultHost,
  defaultStart,
  defaultEnd
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  
  // Scan state
  const [host, setHost] = useState(defaultHost || '127.0.0.1');
  const [startPort, setStartPort] = useState(defaultStart || 25580);
  const [endPort, setEndPort] = useState(defaultEnd || 25600);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ found: number[]; added: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual connect state
  const [manualHost, setManualHost] = useState(defaultHost || '127.0.0.1');
  const [manualPort, setManualPort] = useState(25580);
  const [manualId, setManualId] = useState('');
  const [manualSuccess, setManualSuccess] = useState(false);

  if (!isOpen) return null;

  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          start: startPort,
          end: endPort
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult({ found: data.found || [], added: data.added || 0 });
      } else {
        setError('Ошибка при сканировании');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    setLoading(true);
    setError(null);
    setManualSuccess(false);
    try {
      const res = await fetch('/api/bots/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: manualHost,
          port: manualPort,
          id: manualId.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setManualSuccess(true);
        setTimeout(() => {
          setManualSuccess(false);
          onClose();
        }, 900);
      } else {
        setError(data.error || 'Ошибка подключения бота');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#0f172a] rounded-2xl border border-slate-700/80 shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Подключение Minecraft агентов
              </h2>
              <p className="text-xs text-slate-400">
                Авто-поиск TCP портов или ручное добавление
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

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => { setActiveTab('scan'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'scan' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔍 Авто-поиск по диапазону
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'manual' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ➕ Добавить порт вручную
          </button>
        </div>

        {/* Scan Tab */}
        {activeTab === 'scan' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                IP / Хост агентов:
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                placeholder="127.0.0.1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Начальный порт:
                </label>
                <input
                  type="number"
                  value={startPort}
                  onChange={(e) => setStartPort(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Конечный порт:
                </label>
                <input
                  type="number"
                  value={endPort}
                  onChange={(e) => setEndPort(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Сканирование завершено!
                </div>
                <div className="text-xs text-slate-300">
                  Найдено активных сокетов: <strong className="text-white font-mono">{result.found.length}</strong>
                  {result.found.length > 0 && ` (${result.found.join(', ')})`}
                </div>
                <div className="text-[11px] text-slate-400">
                  {result.added > 0 ? `Добавлено новых ботов: ${result.added}` : 'Все найденные боты уже в списке'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Хост / IP бота:
              </label>
              <input
                type="text"
                value={manualHost}
                onChange={(e) => setManualHost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="127.0.0.1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  TCP Порт:
                </label>
                <input
                  type="number"
                  value={manualPort}
                  onChange={(e) => setManualPort(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  placeholder="25580"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Имя (ID) опционально:
                </label>
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="bot_25580"
                />
              </div>
            </div>

            {manualSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Бот успешно добавлен и подключен!
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Закрыть
          </button>
          
          {activeTab === 'scan' ? (
            <button
              onClick={handleScan}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Сканирование...' : 'Начать поиск'}
            </button>
          ) : (
            <button
              onClick={handleManualAdd}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Подключить
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
