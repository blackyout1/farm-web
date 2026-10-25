export interface EnchantDef {
  id: string;
  ru: string;
  category: 'armor' | 'weapons' | 'tools' | 'custom';
  maxLevel: number;
  basePrice: number;
}

export const ENCHANT_DEFINITIONS: Record<string, EnchantDef> = {
  // Armor
  "minecraft:protection": { id: "minecraft:protection", ru: "Защита", category: "armor", maxLevel: 4, basePrice: 40000 },
  "minecraft:fire_protection": { id: "minecraft:fire_protection", ru: "Огнеупорность", category: "armor", maxLevel: 4, basePrice: 20000 },
  "minecraft:blast_protection": { id: "minecraft:blast_protection", ru: "Взрывоустойчивость", category: "armor", maxLevel: 4, basePrice: 20000 },
  "minecraft:projectile_protection": { id: "minecraft:projectile_protection", ru: "Защита от снарядов", category: "armor", maxLevel: 4, basePrice: 15000 },
  "minecraft:respiration": { id: "minecraft:respiration", ru: "Подводное дыхание", category: "armor", maxLevel: 3, basePrice: 25000 },
  "minecraft:aqua_affinity": { id: "minecraft:aqua_affinity", ru: "Подводник", category: "armor", maxLevel: 1, basePrice: 30000 },
  "minecraft:thorns": { id: "minecraft:thorns", ru: "Шипы", category: "armor", maxLevel: 3, basePrice: 45000 },
  "minecraft:depth_strider": { id: "minecraft:depth_strider", ru: "Подводная ходьба", category: "armor", maxLevel: 3, basePrice: 35000 },
  "minecraft:frost_walker": { id: "minecraft:frost_walker", ru: "Ледоход", category: "armor", maxLevel: 2, basePrice: 25000 },
  "minecraft:soul_speed": { id: "minecraft:soul_speed", ru: "Скорость души", category: "armor", maxLevel: 3, basePrice: 60000 },
  "minecraft:feather_falling": { id: "minecraft:feather_falling", ru: "Невесомость", category: "armor", maxLevel: 4, basePrice: 50000 },
  "minecraft:swift_sneak": { id: "minecraft:swift_sneak", ru: "Быстрый шаг", category: "armor", maxLevel: 3, basePrice: 120000 },

  // Weapons
  "minecraft:sharpness": { id: "minecraft:sharpness", ru: "Острота", category: "weapons", maxLevel: 5, basePrice: 60000 },
  "minecraft:smite": { id: "minecraft:smite", ru: "Небесная кара", category: "weapons", maxLevel: 5, basePrice: 30000 },
  "minecraft:bane_of_arthropods": { id: "minecraft:bane_of_arthropods", ru: "Бич членистоногих", category: "weapons", maxLevel: 5, basePrice: 15000 },
  "minecraft:knockback": { id: "minecraft:knockback", ru: "Отдача", category: "weapons", maxLevel: 2, basePrice: 20000 },
  "minecraft:fire_aspect": { id: "minecraft:fire_aspect", ru: "Заговор огня", category: "weapons", maxLevel: 2, basePrice: 40000 },
  "minecraft:looting": { id: "minecraft:looting", ru: "Добыча", category: "weapons", maxLevel: 3, basePrice: 90000 },
  "minecraft:sweeping_edge": { id: "minecraft:sweeping_edge", ru: "Разящий клинок", category: "weapons", maxLevel: 3, basePrice: 40000 },
  "minecraft:power": { id: "minecraft:power", ru: "Сила", category: "weapons", maxLevel: 5, basePrice: 50000 },
  "minecraft:punch": { id: "minecraft:punch", ru: "Откидывание", category: "weapons", maxLevel: 2, basePrice: 20000 },
  "minecraft:flame": { id: "minecraft:flame", ru: "Воспламеняющая стрела", category: "weapons", maxLevel: 1, basePrice: 35000 },
  "minecraft:infinity": { id: "minecraft:infinity", ru: "Бесконечность", category: "weapons", maxLevel: 1, basePrice: 80000 },
  "minecraft:loyalty": { id: "minecraft:loyalty", ru: "Верность", category: "weapons", maxLevel: 3, basePrice: 30000 },
  "minecraft:impaling": { id: "minecraft:impaling", ru: "Пронзатель", category: "weapons", maxLevel: 5, basePrice: 25000 },
  "minecraft:riptide": { id: "minecraft:riptide", ru: "Тягун", category: "weapons", maxLevel: 3, basePrice: 40000 },
  "minecraft:channeling": { id: "minecraft:channeling", ru: "Громоотвод", category: "weapons", maxLevel: 1, basePrice: 30000 },
  "minecraft:multishot": { id: "minecraft:multishot", ru: "Тройной выстрел", category: "weapons", maxLevel: 1, basePrice: 40000 },
  "minecraft:quick_charge": { id: "minecraft:quick_charge", ru: "Быстрая зарядка", category: "weapons", maxLevel: 3, basePrice: 35000 },
  "minecraft:piercing": { id: "minecraft:piercing", ru: "Пронизывающая стрела", category: "weapons", maxLevel: 4, basePrice: 30000 },

  // Tools & Universal
  "minecraft:efficiency": { id: "minecraft:efficiency", ru: "Эффективность", category: "tools", maxLevel: 5, basePrice: 50000 },
  "minecraft:silk_touch": { id: "minecraft:silk_touch", ru: "Шелковое касание", category: "tools", maxLevel: 1, basePrice: 70000 },
  "minecraft:unbreaking": { id: "minecraft:unbreaking", ru: "Прочность", category: "tools", maxLevel: 3, basePrice: 30000 },
  "minecraft:fortune": { id: "minecraft:fortune", ru: "Фортуна", category: "tools", maxLevel: 3, basePrice: 85000 },
  "minecraft:mending": { id: "minecraft:mending", ru: "Починка", category: "tools", maxLevel: 1, basePrice: 150000 },

  // Anarchy / Custom Server Runes
  "магнит": { id: "магнит", ru: "Магнит (Кастом)", category: "custom", maxLevel: 3, basePrice: 1050000 },
  "бульдозер": { id: "бульдозер", ru: "Бульдозер (Кастом)", category: "custom", maxLevel: 3, basePrice: 1500000 },
  "бур": { id: "бур", ru: "Бур 3х3 (Кастом)", category: "custom", maxLevel: 1, basePrice: 900000 },
  "вампиризм": { id: "вампиризм", ru: "Вампиризм", category: "custom", maxLevel: 3, basePrice: 450000 },
  "авто-плавка": { id: "авто-плавка", ru: "Авто-плавка", category: "custom", maxLevel: 1, basePrice: 350000 },
};

export const BOOK_PRICES: Record<string, number> = {
  "магнит": 1050000,
  "бульдозер": 1500000,
  "починка": 150000,
  "mending": 150000,
  "эффективность": 50000,
  "efficiency": 50000,
  "прочность": 30000,
  "unbreaking": 30000,
  "бур": 900000,
  "вампиризм": 450000,
  "авто-плавка": 350000,
};

export const DEFAULT_BOOK_PRICE = 100000;
export const SHULKER_BOOK_VAL = 500000;

export function parseWhitelistString(whitelistStr: string): Record<string, number> {
  const result: Record<string, number> = {};
  if (!whitelistStr) return result;
  const parts = whitelistStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const segments = trimmed.split(':');
    if (segments.length >= 3) {
      // e.g. "minecraft:mending:1"
      result[`${segments[0]}:${segments[1]}`] = parseInt(segments[2], 10) || 1;
    } else if (segments.length === 2) {
      // e.g. "mending:1" or "minecraft:mending"
      if (!isNaN(Number(segments[1]))) {
        result[segments[0]] = parseInt(segments[1], 10) || 1;
      } else {
        result[trimmed] = 1;
      }
    } else {
      result[trimmed] = 1;
    }
  }
  return result;
}

export function serializeWhitelist(dict: Record<string, number>): string {
  return Object.entries(dict)
    .map(([key, lvl]) => `${key}:${lvl}`)
    .join(',');
}

export function calculateProfit(goodBooks: number, currentBooks: Record<string, number>): number {
  let profit = 0;
  for (const [name, count] of Object.entries(currentBooks || {})) {
    const lower = name.toLowerCase();
    let price = DEFAULT_BOOK_PRICE;
    for (const [key, val] of Object.entries(BOOK_PRICES)) {
      if (lower.includes(key)) {
        price = val;
        break;
      }
    }
    profit += price * (count || 0);
  }
  // Baseline for books moved to shulker / processed
  profit += (goodBooks || 0) * SHULKER_BOOK_VAL;
  return profit;
}

export function formatCoins(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(2) + 'M';
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(1) + 'k';
  }
  return amount.toLocaleString('ru-RU');
}
