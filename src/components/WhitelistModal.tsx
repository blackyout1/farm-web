import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Sparkles, 
  Check, 
  Shield, 
  Swords, 
  Pickaxe, 
  Layers,
  RotateCcw
} from 'lucide-react';
import { 
  ENCHANT_DEFINITIONS, 
  parseWhitelistString, 
  serializeWhitelist,
  EnchantDef 
} from '../utils/enchantments';

interface WhitelistModalProps {
  currentWhitelist: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newWhitelist: string) => void;
}

export const WhitelistModal: React.FC<WhitelistModalProps> = ({
  currentWhitelist,
  isOpen,
  onClose,
  onSave
}) => {
  const [whitelist, setWhitelist] = useState<Record<string, number>>(() =>
    parseWhitelistString(currentWhitelist)
  );
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'armor' | 'weapons' | 'tools' | 'custom'>('all');
  const [customName, setCustomName] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Sync when opened
  React.useEffect(() => {
    setWhitelist(parseWhitelistString(currentWhitelist));
  }, [currentWhitelist, isOpen]);

  const allItems = useMemo(() => {
    const map = new Map<string, { id: string; ru: string; category: string; maxLevel: number }>();
    
    // Add known defs
    for (const [id, def] of Object.entries(ENCHANT_DEFINITIONS)) {
      map.set(id, def);
    }

    // Add any existing custom items from whitelist
    for (const key of Object.keys(whitelist)) {
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          ru: key.toUpperCase(),
          category: 'custom',
          maxLevel: 10
        });
      }
    }

    return Array.from(map.values());
  }, [whitelist]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchCat = category === 'all' || item.category === category;
      const matchSearch =
        !q ||
        item.ru.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allItems, search, category]);

  if (!isOpen) return null;

  const toggleEnchant = (id: string, defMax = 1) => {
    setWhitelist((prev) => {
      const next = { ...prev };
      if (next[id] !== undefined) {
        delete next[id];
      } else {
        next[id] = defMax;
      }
      return next;
    });
  };

  const changeLevel = (id: string, delta: number) => {
    setWhitelist((prev) => {
      const current = prev[id] || 1;
      const nextLvl = Math.max(1, Math.min(10, current + delta));
      return { ...prev, [id]: nextLvl };
    });
  };

  const addCustomEnchant = () => {
    const trimmed = customName.trim().toLowerCase();
    if (trimmed) {
      setWhitelist((prev) => ({ ...prev, [trimmed]: 1 }));
      setCustomName('');
      setShowAddCustom(false);
    }
  };

  const applyPreset = (preset: 'top_profit' | 'mending_only' | 'pvp' | 'clear') => {
    if (preset === 'clear') {
      setWhitelist({});
    } else if (preset === 'top_profit') {
      setWhitelist({
        'minecraft:mending': 1,
        'minecraft:efficiency': 5,
        'магнит': 1,
        'бульдозер': 1,
        'minecraft:unbreaking': 3,
        'minecraft:fortune': 3,
        'minecraft:silk_touch': 1,
        'minecraft:looting': 3
      });
    } else if (preset === 'mending_only') {
      setWhitelist({
        'minecraft:mending': 1,
        'minecraft:efficiency': 5
      });
    } else if (preset === 'pvp') {
      setWhitelist({
        'minecraft:sharpness': 5,
        'minecraft:protection': 4,
        'minecraft:fire_aspect': 2,
        'minecraft:thorns': 3,
        'minecraft:feather_falling': 4
      });
    }
  };

  const handleSave = () => {
    const result = serializeWhitelist(whitelist);
    onSave(result);
    onClose();
  };

  const activeCount = Object.keys(whitelist).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f172a] rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Whitelist зачарований
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeCount} выбрано
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Бот сохраняет книги из этого списка и выбрасывает остальное в мусор
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Поиск по названию (Починка, Эффективность, Магнит) или ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold whitespace-nowrap transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              Кастомное
            </button>
          </div>

          {/* Add custom enchant form */}
          {showAddCustom && (
            <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/40 flex items-center gap-2 animate-in slide-in-from-top-2">
              <input
                type="text"
                placeholder="Название из Lore (например: бур, вампиризм, магнит)..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomEnchant()}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                autoFocus
              />
              <button
                onClick={addCustomEnchant}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition cursor-pointer"
              >
                Добавить
              </button>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'Все' },
                { id: 'tools', label: 'Инструменты' },
                { id: 'weapons', label: 'Оружие' },
                { id: 'armor', label: 'Броня' },
                { id: 'custom', label: 'Анархия' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id as unknown as typeof category)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                    category === c.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => applyPreset('top_profit')}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap cursor-pointer"
              >
                ТОП Профит
              </button>
              <button
                onClick={() => applyPreset('mending_only')}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 whitespace-nowrap cursor-pointer"
              >
                Починка & 5
              </button>
              <button
                onClick={() => applyPreset('clear')}
                className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950/30 whitespace-nowrap cursor-pointer"
                title="Очистить все"
              >
                Сброс
              </button>
            </div>
          </div>
        </div>

        {/* List of Enchantments */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Зачарований по запросу «{search}» не найдено
            </div>
          ) : (
            filteredItems.map((item) => {
              const isEnabled = whitelist[item.id] !== undefined;
              const level = whitelist[item.id] || 1;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isEnabled
                      ? 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border-purple-500/50 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleEnchant(item.id, item.maxLevel || 1)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition cursor-pointer ${
                        isEnabled
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-transparent hover:border-slate-600'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-bold ${isEnabled ? 'text-white' : 'text-slate-300'}`}>
                          {item.ru}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({item.id})
                        </span>
                      </div>
                      <span className="text-[10px] text-purple-400/80 font-medium">
                        {item.category === 'custom' ? '🔥 Кастомная Анархия' : item.category.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Level Stepper */}
                    {isEnabled ? (
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-purple-500/40">
                        <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Мин. ур:</span>
                        <button
                          onClick={() => changeLevel(item.id, -1)}
                          disabled={level <= 1}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs text-purple-300 w-5 text-center">
                          {level}
                        </span>
                        <button
                          onClick={() => changeLevel(item.id, 1)}
                          disabled={level >= 10}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        выключено
                      </span>
                    )}

                    {/* Toggle button */}
                    <button
                      onClick={() => toggleEnchant(item.id, item.maxLevel || 1)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isEnabled
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Сохранится для выбранного агента
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition cursor-pointer"
            >
              Сохранить Whitelist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
