import React, { useState } from 'react';
import { useHubWebSocket } from './hooks/useHubWebSocket';
import { Header } from './components/Header';
import { BotCard } from './components/BotCard';
import { BotTable } from './components/BotTable';
import { ControlPanel } from './components/ControlPanel';
import { WebGraphTab } from './components/WebGraphTab';
import { StatsTab } from './components/StatsTab';
import { IncidentsTab } from './components/IncidentsTab';
import { LogsTab } from './components/LogsTab';
import { WhitelistModal } from './components/WhitelistModal';
import { ScanModal } from './components/ScanModal';
import { SettingsModal } from './components/SettingsModal';
import { UrgentAlertBanner } from './components/UrgentAlertBanner';
import { MobileNav } from './components/MobileNav';
import { HubTab } from './types/hub';
import { soundManager } from './utils/audio';
import { 
  LayoutGrid, 
  Table as TableIcon, 
  TrendingUp, 
  BarChart3, 
  ShieldAlert, 
  Terminal, 
  Info,
  BookOpen,
  Trash2,
  Coins,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { formatCoins } from './utils/enchantments';

export default function App() {
  const {
    connected,
    config,
    bots,
    selectedBotId,
    setSelectedBotId,
    selectedBot,
    incidents,
    logs,
    graphHistory,
    urgentAlert,
    clearUrgentAlert,
    sendCommand,
    broadcastCommand,
    updateConfig,
    clearIncidents
  } = useHubWebSocket();

  // Desktop active bottom tab
  const [desktopBottomTab, setDesktopBottomTab] = useState<'graph' | 'stats' | 'incidents' | 'logs' | 'info'>('graph');
  
  // Mobile active main tab
  const [mobileTab, setMobileTab] = useState<HubTab>('overview');

  // View mode for bots on desktop (cards vs table)
  const [botViewMode, setBotViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [isWhitelistOpen, setIsWhitelistOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const botList = Object.values(bots);
  const activeCount = botList.filter((b) => b.connected).length;
  const dangerIncidentsCount = incidents.filter((i) => i.category === 'danger').length;

  // Aggregate stats
  const totalGood = botList.reduce((sum, b) => sum + (b.stats?.counters?.books_good || 0), 0);
  const totalTrash = botList.reduce((sum, b) => sum + (b.stats?.counters?.books_trash || 0), 0);
  const totalCoinsEstimate = botList.reduce((sum, b) => {
    let p = (b.stats?.counters?.books_good || 0) * 500000;
    for (const [_, cnt] of Object.entries(b.current_books || {})) {
      p += 100000 * (cnt || 0);
    }
    return sum + p;
  }, 0);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  const handleSaveWhitelist = (newWl: string) => {
    if (selectedBotId) {
      sendCommand(selectedBotId, 'set_config', { key: 'enchant_whitelist', value: newWl });
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col pb-20 md:pb-6">
      {/* Top Header */}
      <Header
        connected={connected}
        botCount={botList.length}
        activeCount={activeCount}
        mainAccount={config.mainAccount}
        onStartAll={() => broadcastCommand('start_attack')}
        onStopAll={() => broadcastCommand('stop_attack')}
        onTransferAll={() => {
          for (const b of botList) {
            if ((b.level || 0) >= (b.expThreshold || 30)) {
              const amount = Math.max(1, (b.level || 0) - 5);
              sendCommand(b.id, 'transfer_exp', { target: config.mainAccount, amount });
            }
          }
        }}
        onOpenScan={() => setIsScanOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      {/* Urgent Warning Banner */}
      <UrgentAlertBanner
        alert={urgentAlert}
        onDismiss={clearUrgentAlert}
        onTerminate={(botId) => sendCommand(botId, 'terminate')}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-5 flex-1 space-y-5">
        {/* Quick Ticker Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ботов в сети: <strong className="text-white font-mono">{activeCount}/{botList.length}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <BookOpen className="w-3.5 h-3.5" />
              Всего топ книг: <strong className="font-mono">{totalGood}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <Trash2 className="w-3.5 h-3.5" />
              Мусора: <strong className="font-mono">{totalTrash}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              Расчетный доход: <strong className="font-mono font-bold">{formatCoins(totalCoinsEstimate)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Основной ник:</span>
            <span className="font-mono text-emerald-300 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {config.mainAccount}
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE VIEW (tab-based)                                         */}
        {/* ============================================================== */}
        <div className="block md:hidden">
          {mobileTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Список агентов ({botList.length})
                </h2>
                <button
                  onClick={() => setIsScanOpen(true)}
                  className="text-xs text-cyan-400 font-semibold"
                >
                  🔍 Найти ботов
                </button>
              </div>

              {botList.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-[#0d131f] border border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-cyan-400 mx-auto border border-slate-700">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Ожидание подключения агентов
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Хаб сканирует TCP сокеты на <span className="font-mono text-cyan-300">{config.host}:{config.autoScanPortStart}–{config.autoScanPortEnd}</span>. Запустите ботов в Minecraft или выполните поиск.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsScanOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 cursor-pointer"
                  >
                    🔍 Найти ботов / Добавить порт
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {botList.map((bot) => (
                    <BotCard
                      key={bot.id}
                      bot={bot}
                      isSelected={selectedBotId === bot.id}
                      onSelect={(id) => {
                        setSelectedBotId(id);
                        setMobileTab('control');
                      }}
                      onCommand={sendCommand}
                      onTerminate={(id) => sendCommand(id, 'terminate')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {mobileTab === 'control' && (
            <div className="space-y-3">
              {/* Mobile Bot Picker */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-bold text-slate-400">Выбор бота:</span>
                <select
                  value={selectedBotId || ''}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                >
                  {botList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.username} ({b.id})
                    </option>
                  ))}
                </select>
              </div>

              <ControlPanel
                bot={selectedBot}
                mainAccount={config.mainAccount}
                onCommand={sendCommand}
                onOpenWhitelist={() => setIsWhitelistOpen(true)}
                onTerminate={(id) => sendCommand(id, 'terminate')}
              />
            </div>
          )}

          {mobileTab === 'graph' && (
            <WebGraphTab
              bots={bots}
              selectedBotId={selectedBotId}
              onSelectBot={setSelectedBotId}
              graphHistory={graphHistory}
            />
          )}

          {mobileTab === 'stats' && (
            <StatsTab
              bots={bots}
              selectedBotId={selectedBotId}
              onSelectBot={setSelectedBotId}
            />
          )}

          {mobileTab === 'incidents' && (
            <IncidentsTab
              incidents={incidents}
              onClear={clearIncidents}
              onTerminateBot={(id) => sendCommand(id, 'terminate')}
            />
          )}

          {mobileTab === 'logs' && (
            <LogsTab logs={logs} />
          )}
        </div>

        {/* ============================================================== */}
        {/* DESKTOP VIEW (dual pane + rich bottom tabbed panel)            */}
        {/* ============================================================== */}
        <div className="hidden md:flex flex-col gap-6">
          {/* Top Row: Left List / Table + Right Control Panel */}
          <div className="grid grid-cols-12 gap-5 items-start">
            {/* Left Bot Area */}
            <div className="col-span-7 xl:col-span-8 space-y-3">
              {/* View Switcher bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Активные боты ({botList.length})
                  </h2>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {activeCount} онлайн
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                    <button
                      onClick={() => setBotViewMode('cards')}
                      className={`p-1.5 rounded-lg transition ${
                        botViewMode === 'cards' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Карточки"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setBotViewMode('table')}
                      className={`p-1.5 rounded-lg transition ${
                        botViewMode === 'table' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Таблица"
                    >
                      <TableIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {botList.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#0d131f]/90 border border-slate-800 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-cyan-400 mx-auto border border-slate-700">
                    <Radio className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Ожидание подключения агентов Farm+ Hub
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Хаб опрашивает TCP порты <span className="font-mono text-cyan-300 font-bold">{config.host}:{config.autoScanPortStart}–{config.autoScanPortEnd}</span>.
                      Запустите ваших ботов (FarmAgent) или воспользуйтесь ручным добавлением.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setIsScanOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 transition cursor-pointer"
                    >
                      🔍 Найти ботов / Добавить порт
                    </button>
                  </div>
                </div>
              ) : botViewMode === 'cards' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                  {botList.map((bot) => (
                    <BotCard
                      key={bot.id}
                      bot={bot}
                      isSelected={selectedBotId === bot.id}
                      onSelect={setSelectedBotId}
                      onCommand={sendCommand}
                      onTerminate={(id) => sendCommand(id, 'terminate')}
                    />
                  ))}
                </div>
              ) : (
                <BotTable
                  bots={botList}
                  selectedBotId={selectedBotId}
                  onSelect={setSelectedBotId}
                  onCommand={sendCommand}
                  onTerminate={(id) => sendCommand(id, 'terminate')}
                />
              )}
            </div>

            {/* Right: Active Bot Control Panel */}
            <div className="col-span-5 xl:col-span-4 sticky top-20">
              <ControlPanel
                bot={selectedBot}
                mainAccount={config.mainAccount}
                onCommand={sendCommand}
                onOpenWhitelist={() => setIsWhitelistOpen(true)}
                onTerminate={(id) => sendCommand(id, 'terminate')}
              />
            </div>
          </div>

          {/* Desktop Bottom Tabs Area */}
          <div className="rounded-2xl bg-[#0d131f]/95 border border-slate-800 shadow-xl overflow-hidden">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'graph', label: '📈 График в браузере', icon: TrendingUp },
                  { id: 'stats', label: '📊 Статистика', icon: BarChart3 },
                  { id: 'incidents', label: '🚨 Инциденты', icon: ShieldAlert, badge: dangerIncidentsCount },
                  { id: 'logs', label: '📜 Системные Логи', icon: Terminal },
                  { id: 'info', label: 'ℹ Инфо', icon: Info },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = desktopBottomTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setDesktopBottomTab(t.id as unknown as typeof desktopBottomTab)}
                      className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                      {Boolean(t.badge && t.badge > 0) && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[10px] animate-pulse">
                          {t.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Farm+ Hub v2.0 Web • Localhost & Mobile Ready
              </span>
            </div>

            {/* Tab Body */}
            <div className="p-5">
              {desktopBottomTab === 'graph' && (
                <WebGraphTab
                  bots={bots}
                  selectedBotId={selectedBotId}
                  onSelectBot={setSelectedBotId}
                  graphHistory={graphHistory}
                />
              )}

              {desktopBottomTab === 'stats' && (
                <StatsTab
                  bots={bots}
                  selectedBotId={selectedBotId}
                  onSelectBot={setSelectedBotId}
                />
              )}

              {desktopBottomTab === 'incidents' && (
                <IncidentsTab
                  incidents={incidents}
                  onClear={clearIncidents}
                  onTerminateBot={(id) => sendCommand(id, 'terminate')}
                />
              )}

              {desktopBottomTab === 'logs' && (
                <LogsTab logs={logs} />
              )}

              {desktopBottomTab === 'info' && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
                  <div><strong>Основной аккаунт:</strong> <span className="text-emerald-400">{config.mainAccount}</span></div>
                  <div><strong>Auto-pause all on danger:</strong> <span className={config.autoPauseAllOnDanger ? "text-emerald-400" : "text-slate-500"}>{String(config.autoPauseAllOnDanger)}</span></div>
                  <div><strong>Auto-scan on start:</strong> <span className={config.autoScanOnStart ? "text-emerald-400" : "text-slate-500"}>{String(config.autoScanOnStart)}</span></div>
                  <div><strong>Диапазон сканирования портов:</strong> <span className="text-cyan-400">{config.autoScanPortStart} – {config.autoScanPortEnd}</span></div>
                  <div><strong>Хост подключения:</strong> <span className="text-cyan-400">{config.host || '127.0.0.1'}</span></div>
                  <div><strong>TCP протокол:</strong> <span className="text-emerald-400">Прямое подключение (JSON / Newline)</span></div>
                  <div><strong>Статус watchdog:</strong> <span className="text-emerald-400">Активен (10с таймаут)</span></div>
                  <div className="pt-2 text-slate-500">
                    Совет: Чтобы подключиться с телефона в домашней сети, откройте IP адрес вашего компьютера (например: http://192.168.1.50:3000) в мобильном браузере.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Navigation */}
      <MobileNav
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        dangerIncidentCount={dangerIncidentsCount}
      />

      {/* Whitelist Modal */}
      <WhitelistModal
        isOpen={isWhitelistOpen}
        onClose={() => setIsWhitelistOpen(false)}
        currentWhitelist={selectedBot?.enchant_whitelist || ''}
        onSave={handleSaveWhitelist}
      />

      {/* Port Scanner Modal */}
      <ScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        defaultHost={config.host}
        defaultStart={config.autoScanPortStart}
        defaultEnd={config.autoScanPortEnd}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={updateConfig}
      />
    </div>
  );
}
