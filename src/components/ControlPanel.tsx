import React, { useState } from 'react';
import { BotState } from '../types/hub';
import { 
  Swords, 
  Sparkles, 
  Ghost, 
  Utensils, 
  ArrowRightLeft, 
  Boxes, 
  Package, 
  Layers, 
  Settings2, 
  Trash2, 
  Skull, 
  Zap,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { parseWhitelistString } from '../utils/enchantments';

interface ControlPanelProps {
  bot: BotState | null;
  mainAccount: string;
  onCommand: (botId: string, action: string, extra?: Record<string, unknown>) => void;
  onOpenWhitelist: () => void;
  onTerminate: (botId: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  bot,
  mainAccount,
  onCommand,
  onOpenWhitelist,
  onTerminate
}) => {
  const [activeTab, setActiveTab] = useState<'farm' | 'enchant'>('farm');
  const [showConfirmTerminate, setShowConfirmTerminate] = useState(false);

  if (!bot) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 rounded-2xl bg-[#0d131f]/90 border border-slate-800 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3 border border-slate-700">
          <Settings2 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-300">Бот не выбран</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Выберите нужного бота из списка слева или сверху, чтобы управлять его модулями, фармом и зачарованиями.
        </p>
      </div>
    );
  }

  const modules = bot.modules || [];
  const isModuleActive = (mod: string) => modules.includes(mod);

  const toggleModule = (mod: string) => {
    const active = isModuleActive(mod);
    onCommand(bot.id, active ? 'module_off' : 'module_on', { module: mod });
  };

  const handleConfigChange = (key: string, value: string | number) => {
    onCommand(bot.id, 'set_config', { key, value: String(value) });
  };

  const activeWhitelistCount = Object.keys(parseWhitelistString(bot.enchant_whitelist || '')).length;

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#0d131f]/95 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Bot Header Card */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-850 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/30 flex items-center justify-center font-bold text-lg text-emerald-400 border border-emerald-500/40">
                {bot.username.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {bot.username}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  {bot.id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Activity className="w-3 h-3" />
                  {bot.current_action || 'IDLE'}
                </span>
                <span>•</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {bot.level} ур.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const amount = Math.max(1, (bot.level || 0) - 5);
                onCommand(bot.id, 'transfer_exp', { target: mainAccount, amount });
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 text-xs font-semibold transition"
              title="Передать опыт на аккаунт"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Сдать опыт
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 mt-3 border border-slate-800/80">
          <button
            onClick={() => setActiveTab('farm')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'farm'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            Фарм & Модули
          </button>
          <button
            onClick={() => setActiveTab('enchant')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'enchant'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Зачарование & Анархия
          </button>
        </div>
      </div>

      {/* Body content based on tab */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
        {activeTab === 'farm' && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Боевые и защитные модули
            </div>

            {/* Module Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ToggleCard
                title="Авто-атака"
                desc="Убийство мобов на спавне"
                icon={<Swords className="w-4 h-4 text-emerald-400" />}
                active={isModuleActive('attack')}
                onToggle={() => toggleModule('attack')}
              />

              <ToggleCard
                title="Авто-инвиз"
                desc="Маскировка / зелья невидимости"
                icon={<Ghost className="w-4 h-4 text-cyan-400" />}
                active={isModuleActive('invis')}
                onToggle={() => toggleModule('invis')}
              />

              <ToggleCard
                title="Авто-еда"
                desc="Пополнение сытости из инвентаря"
                icon={<Utensils className="w-4 h-4 text-amber-400" />}
                active={isModuleActive('food')}
                onToggle={() => toggleModule('food')}
              />

              <ToggleCard
                title="Передача опыта"
                desc={`Авто-сдача на ${mainAccount}`}
                icon={<ArrowRightLeft className="w-4 h-4 text-purple-400" />}
                active={isModuleActive('exp')}
                onToggle={() => toggleModule('exp')}
              />
            </div>

            {/* Threshold controls */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Порог авто-еды</span>
                  <span className="text-[11px] text-slate-400">Кушать, если сытость падает ниже</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={bot.foodThreshold || 14}
                    onChange={(e) => handleConfigChange('foodThreshold', Number(e.target.value))}
                    className="w-24 sm:w-32 accent-emerald-500 cursor-pointer"
                  />
                  <span className="w-8 text-center font-mono font-bold text-emerald-400 text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    {bot.foodThreshold || 14}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Порог опыта для сдачи</span>
                  <span className="text-[11px] text-slate-400">Сдавать опыт при достижении уровня</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={bot.expThreshold || 30}
                    onChange={(e) => handleConfigChange('expThreshold', Number(e.target.value))}
                    className="w-24 sm:w-32 accent-purple-500 cursor-pointer"
                  />
                  <span className="w-8 text-center font-mono font-bold text-purple-400 text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    {bot.expThreshold || 30}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enchant' && (
          <div className="space-y-4">
            {/* Resources Banner */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-center">
                <span className="text-[11px] text-blue-300 block font-medium">Лазурит</span>
                <span className="text-base sm:text-lg font-bold font-mono text-blue-400">
                  {bot.lapis ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-center">
                <span className="text-[11px] text-amber-300 block font-medium">Книги</span>
                <span className="text-base sm:text-lg font-bold font-mono text-amber-400">
                  {bot.books ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center">
                <span className="text-[11px] text-emerald-300 block font-medium">Уровень</span>
                <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                  {bot.level ?? 0}
                </span>
              </div>
            </div>

            {/* Enchant Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ToggleCard
                title="Авто-зачарование"
                desc="Зачаровывать книги на столе"
                icon={<Sparkles className="w-4 h-4 text-purple-400" />}
                active={isModuleActive('enchant')}
                onToggle={() => toggleModule('enchant')}
              />

              <ToggleCard
                title="Авто-сортировка"
                desc="Фоновая раскладка по шалкерам"
                icon={<Boxes className="w-4 h-4 text-cyan-400" />}
                active={isModuleActive('auto_sort')}
                onToggle={() => toggleModule('auto_sort')}
              />
            </div>

            {/* Level selection & Anarchy inputs */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Кнопка зачарования (Уровень):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 0, label: 'Макс (30 ур)', color: 'border-purple-500/50 text-purple-300' },
                    { id: 1, label: 'Средний (20)', color: 'border-blue-500/50 text-blue-300' },
                    { id: 2, label: 'Минимум (10)', color: 'border-cyan-500/50 text-cyan-300' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => handleConfigChange('enchant_button_index', lvl.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                        (bot.enchant_button_index || 0) === lvl.id
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anarchy inputs */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Анархия (Фарм):
                  </label>
                  <input
                    type="text"
                    value={bot.anarchy_farm || '1'}
                    onChange={(e) => handleConfigChange('anarchy_farm', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Мусор (Сервер):
                  </label>
                  <input
                    type="text"
                    value={bot.anarchy_trash || '2'}
                    onChange={(e) => handleConfigChange('anarchy_trash', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    placeholder="2"
                  />
                </div>
              </div>

              {/* Trash limit & Whitelist status */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Лимит мусора:</span>
                    <span className="text-[11px] text-slate-400">
                      Сброс при заполнении: <strong className="text-rose-400 font-mono">{bot.trashCount || 0}/{bot.trash_limit || 20}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="5"
                      max="35"
                      value={bot.trash_limit || 20}
                      onChange={(e) => handleConfigChange('trash_limit', Number(e.target.value))}
                      className="w-24 sm:w-28 accent-rose-500 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-rose-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {bot.trash_limit || 20}
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-rose-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, ((bot.trashCount || 0) / (bot.trash_limit || 20)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Whitelist Config Trigger */}
              <div className="pt-2">
                <button
                  onClick={onOpenWhitelist}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/40 text-purple-300 text-xs font-bold transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-purple-400" />
                    Настроить Whitelist зачарований
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-mono text-[11px] border border-purple-500/30">
                    {activeWhitelistCount} активных
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Terminate Bot */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800">
        {!showConfirmTerminate ? (
          <button
            onClick={() => setShowConfirmTerminate(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs sm:text-sm font-bold transition shadow-lg shadow-rose-950/40 cursor-pointer"
          >
            <Skull className="w-4 h-4 text-rose-400" />
            ТЕРМИНИРОВАТЬ БОТА
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-600/80 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-200 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              Точно терминировать {bot.username} ({bot.id})?
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onTerminate(bot.id);
                  setShowConfirmTerminate(false);
                }}
                className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition cursor-pointer"
              >
                Да, терминировать
              </button>
              <button
                onClick={() => setShowConfirmTerminate(false)}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ToggleCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onToggle: () => void;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ title, desc, icon, active, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
        active
          ? 'bg-slate-900/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-lg ${active ? 'bg-emerald-500/15' : 'bg-slate-800'}`}>
          {icon}
        </div>
        <div>
          <span className={`text-xs font-bold block ${active ? 'text-white' : 'text-slate-300'}`}>
            {title}
          </span>
          <span className="text-[10px] text-slate-400 block line-clamp-1">
            {desc}
          </span>
        </div>
      </div>

      <div
        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
          active ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
        }`}
      >
        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
      </div>
    </div>
  );
};
