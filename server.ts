import express from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Protocol constants (matching protocol.py)
const BASE_AGENT_PORT = 25580;
const STATE_TIMEOUT_SEC = 10;
const RECONNECT_DELAY_SEC = 5;

// Configuration matching Python config.json
interface HubConfigData {
  mainAccount: string;
  autoPauseAllOnDanger: boolean;
  autoScanOnStart: boolean;
  autoScanPortStart: number;
  autoScanPortEnd: number;
  host: string;
  bots: Array<{ id: string; host: string; port: number }>;
}

const DEFAULT_CONFIG: HubConfigData = {
  mainAccount: "MyMain",
  autoPauseAllOnDanger: false,
  autoScanOnStart: true,
  autoScanPortStart: 25580,
  autoScanPortEnd: 25600,
  host: "127.0.0.1",
  bots: []
};

let config: HubConfigData = { ...DEFAULT_CONFIG };

const CONFIG_FILE = path.join(__dirname, 'config.json');
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('[Hub Server] Ошибка чтения config.json:', e);
  }
} else {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch {}
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Hub Server] Ошибка сохранения config.json:', e);
  }
}

// Bot Data Store
interface BotRecord {
  id: string;
  host: string;
  port: number;
  connected: boolean;
  socket?: net.Socket;
  buffer: string;
  lastSeen: number;
  reconnectTimer?: NodeJS.Timeout;
  state: {
    id: string;
    username: string;
    hp: number;
    maxHp: number;
    food: number;
    level: number;
    current_action: string;
    status_text: string;
    lapis: number;
    books: number;
    trashCount: number;
    trash_limit: number;
    modules: string[];
    foodThreshold: number;
    expThreshold: number;
    enchant_button_index: number;
    anarchy_farm: string;
    anarchy_trash: string;
    enchant_whitelist: string;
    stats: {
      counters: { books_good: number; books_trash: number };
      uptime: number;
      kills: Record<string, number>;
    };
    current_books: Record<string, number>;
    connected: boolean;
    lastSeen: number;
    host: string;
    port: number;
  };
}

const bots = new Map<string, BotRecord>();
const incidents: Array<{ id: string; timestamp: string; bot_id: string; category: string; msg: string }> = [];
const logs: Array<{ id: string; timestamp: string; level: string; bot_id?: string; msg: string }> = [];
const graphHistory: Map<string, Array<{ time: string; rawTime: number; books_good: number; books_trash: number; profit: number }>> = new Map();

function addLog(level: string, msg: string, bot_id?: string) {
  const ts = new Date().toLocaleTimeString('ru-RU', { hour12: false });
  const entry = {
    id: randomUUID(),
    timestamp: ts,
    level,
    bot_id,
    msg
  };
  logs.unshift(entry);
  if (logs.length > 500) logs.pop();
  broadcast({ type: 'log', data: entry });
}

function addIncident(bot_id: string, category: string, msg: string) {
  const ts = new Date().toLocaleTimeString('ru-RU', { hour12: false });
  const inc = {
    id: randomUUID(),
    timestamp: ts,
    bot_id,
    category,
    msg
  };
  incidents.unshift(inc);
  if (incidents.length > 200) incidents.pop();
  broadcast({ type: 'incident', data: inc });

  if (category === 'danger' && config.autoPauseAllOnDanger) {
    addLog('warn', 'HUB: автопауза всех ботов (danger)');
    broadcastCommand('stop_attack');
  }
}

// WebGraph Profit calculation (exact from web_graph.py)
const PRICES: Record<string, number> = {
  "магнит": 1050000,
  "бульдозер": 1500000,
  "починка": 150000,
  "mending": 150000,
  "эффективность": 50000,
  "efficiency": 50000,
  "прочность": 30000,
  "unbreaking": 30000,
};

function calculateBotProfit(books_good: number, current_books: Record<string, number>) {
  let profit = 0;
  for (const [name, count] of Object.entries(current_books || {})) {
    const lower = name.toLowerCase();
    let price = 100000;
    for (const [k, v] of Object.entries(PRICES)) {
      if (lower.includes(k)) {
        price = v;
        break;
      }
    }
    profit += price * (count || 0);
  }
  profit += (books_good || 0) * 500000;
  return profit;
}

function recordHistoryPoint(botId: string, books_good: number, books_trash: number, current_books: Record<string, number>) {
  if (!graphHistory.has(botId)) {
    graphHistory.set(botId, []);
  }
  const hist = graphHistory.get(botId)!;
  const now = Date.now();
  const timeStr = new Date().toLocaleTimeString('ru-RU', { hour12: false });
  const profit = calculateBotProfit(books_good, current_books);

  if (hist.length === 0 || now - hist[hist.length - 1].rawTime >= 4000) {
    hist.push({
      time: timeStr,
      rawTime: now,
      books_good,
      books_trash,
      profit
    });
    if (hist.length > 300) hist.shift();
  }
}

function getStatusText(s: { hp: number; food: number; connected: boolean }) {
  if (!s.connected) return "⚫ ОТКЛЮЧЕН";
  if (s.hp < 8) return "🟠 НИЗКОЕ HP";
  if (s.food < 10) return "🟡 ГОЛОДЕН";
  return "🟢 OK";
}

function createDefaultState(id: string, username: string, host: string, port: number) {
  return {
    id,
    username,
    hp: 20.0,
    maxHp: 20,
    food: 20,
    level: 0,
    current_action: "IDLE",
    status_text: "⚫ ПОДКЛЮЧЕНИЕ...",
    lapis: 0,
    books: 0,
    trashCount: 0,
    trash_limit: 20,
    modules: [],
    foodThreshold: 14,
    expThreshold: 30,
    enchant_button_index: 0,
    anarchy_farm: "1",
    anarchy_trash: "2",
    enchant_whitelist: "minecraft:mending:1,minecraft:efficiency:5,магнит:1,бульдозер:1,minecraft:unbreaking:3",
    stats: {
      counters: { books_good: 0, books_trash: 0 },
      uptime: 0,
      kills: {} as Record<string, number>
    },
    current_books: {} as Record<string, number>,
    connected: false,
    lastSeen: Date.now(),
    host,
    port
  };
}

// -------------------------------------------------------------
// Real TCP Bot Connection (exact replication of bot_connection.py)
// -------------------------------------------------------------
function connectTcpBot(id: string, host: string, port: number) {
  if (bots.has(id)) {
    const existing = bots.get(id)!;
    if (existing.connected) return;
    if (existing.socket) {
      existing.socket.destroy();
      existing.socket = undefined;
    }
  }

  const record: BotRecord = bots.get(id) || {
    id,
    host,
    port,
    connected: false,
    buffer: '',
    lastSeen: Date.now(),
    state: createDefaultState(id, `Agent_${port}`, host, port)
  };

  bots.set(id, record);
  addLog('info', `→ Подключаюсь к ${id} (${host}:${port})`);

  function attemptConnect() {
    if (record.reconnectTimer) {
      clearTimeout(record.reconnectTimer);
      record.reconnectTimer = undefined;
    }

    try {
      const socket = new net.Socket();
      socket.setTimeout(5000);

      socket.connect(port, host, () => {
        socket.setTimeout(0);
        socket.setNoDelay(true);
        record.connected = true;
        record.socket = socket;
        record.lastSeen = Date.now();
        record.state.connected = true;
        record.state.status_text = getStatusText(record.state);
        addLog('info', `✔ ${id}: соединение восстановлено`, id);
        broadcastBotState(record);

        // Ping agent on connect
        sendPing(record);
      });

      socket.on('data', (chunk) => {
        record.lastSeen = Date.now();
        record.buffer += chunk.toString('utf-8');

        while (record.buffer.includes('\n')) {
          const idx = record.buffer.indexOf('\n');
          const line = record.buffer.slice(0, idx).trim();
          record.buffer = record.buffer.slice(idx + 1);

          if (!line) continue;
          try {
            const msg = JSON.parse(line);
            handleAgentMessage(record, msg);
          } catch (e) {
            console.error(`[${id}] Ошибка парсинга JSON:`, line);
          }
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
      });

      socket.on('error', (err) => {
        // TCP connection refused or reset
      });

      socket.on('close', () => {
        const wasConnected = record.connected;
        record.connected = false;
        record.socket = undefined;
        record.state.connected = false;
        record.state.status_text = "⚫ ОТКЛЮЧЕН";

        if (wasConnected) {
          addLog('warn', `⚠ ${id}: соединение потеряно`, id);
        }
        broadcastBotState(record);

        // Schedule auto-reconnect (RECONNECT_DELAY_SEC)
        if (bots.has(id)) {
          record.reconnectTimer = setTimeout(attemptConnect, RECONNECT_DELAY_SEC * 1000);
        }
      });
    } catch (e) {
      if (bots.has(id)) {
        record.reconnectTimer = setTimeout(attemptConnect, RECONNECT_DELAY_SEC * 1000);
      }
    }
  }

  attemptConnect();
}

function sendPing(record: BotRecord) {
  if (record.connected && record.socket) {
    try {
      record.socket.write(JSON.stringify({ type: "ping", id: randomUUID() }) + "\n");
    } catch {}
  }
}

function handleAgentMessage(record: BotRecord, msg: Record<string, unknown>) {
  const mtype = msg.type;

  if (mtype === 'state') {
    Object.assign(record.state, msg);
    record.state.connected = true;
    record.state.lastSeen = Date.now();
    record.state.status_text = getStatusText(record.state);

    const good = record.state.stats?.counters?.books_good || 0;
    const trash = record.state.stats?.counters?.books_trash || 0;
    recordHistoryPoint(record.id, good, trash, record.state.current_books || {});

    broadcastBotState(record);
  } else if (mtype === 'event') {
    const lvl = (msg.level as string) || 'info';
    const text = (msg.msg as string) || '';
    const prefixMap: Record<string, string> = { info: "ℹ", warn: "⚠", error: "✖", danger: "🚨" };
    const tag = prefixMap[lvl] || "•";

    addLog(lvl, `${tag} ${record.id}: ${text}`, record.id);

    if (lvl === 'danger') {
      addIncident(record.id, 'danger', text);
    } else if (lvl === 'error') {
      addIncident(record.id, 'error', text);
    } else if (lvl === 'warn') {
      addIncident(record.id, 'warn', text);
    }
  } else if (mtype === 'config_changed') {
    const key = msg.key as string;
    const value = msg.value;
    if (key && record.state) {
      (record.state as Record<string, unknown>)[key] = value;
      addLog('cmd', `⚙ ${record.id}: ${key} = ${JSON.stringify(value)}`, record.id);
      broadcastBotState(record);
    }
  } else if (mtype === 'ack') {
    const cid = String(msg.id || '').slice(0, 8);
    addLog('ack', `✓ ${record.id}: команда ${cid}… выполнена`, record.id);
  } else if (mtype === 'pong') {
    // pong received
  }
}

// Dispatch command to bot TCP socket
function dispatchCommand(bot_id: string, action: string, extra: Record<string, unknown> = {}): boolean {
  const record = bots.get(bot_id);
  if (!record) return false;

  if (!record.connected || !record.socket) {
    addLog('warn', `⚠ ${bot_id}: нет соединения, команда '${action}' пропущена`, bot_id);
    return false;
  }

  try {
    const cmd = {
      type: "command",
      id: randomUUID(),
      action,
      ...extra
    };
    record.socket.write(JSON.stringify(cmd) + "\n", 'utf-8');
    addLog('cmd', `→ ${bot_id}: ${action} ${Object.keys(extra).length > 0 ? JSON.stringify(extra) : ''}`, bot_id);
    return true;
  } catch (e) {
    addLog('error', `✖ ${bot_id}: ошибка отправки команды ${action}`, bot_id);
    return false;
  }
}

function broadcastCommand(action: string, extra: Record<string, unknown> = {}) {
  let count = 0;
  for (const [bot_id, record] of bots.entries()) {
    if (record.connected && dispatchCommand(bot_id, action, extra)) {
      count++;
    }
  }
  addLog('cmd', `HUB: '${action}' → ${count} ботов`);
}

function terminateBot(bot_id: string) {
  const record = bots.get(bot_id);
  if (record) {
    if (record.connected) {
      dispatchCommand(bot_id, "terminate");
      addLog('danger', `☠ HUB: отправлена терминация ${bot_id}`, bot_id);
    } else {
      addLog('danger', `☠ ${bot_id}: соединения нет, удаляю из списка`, bot_id);
    }

    setTimeout(() => {
      if (record.socket) {
        try { record.socket.destroy(); } catch {}
      }
      if (record.reconnectTimer) {
        clearTimeout(record.reconnectTimer);
      }
      bots.delete(bot_id);
      broadcast({ type: 'bot_removed', bot_id });
      addLog('info', `☠ HUB: ${bot_id} удалён из списка`);
    }, 2000);
  }
}

// Watchdog for stale bots (matching MainWindow._check_stale_bots)
setInterval(() => {
  const now = Date.now();
  for (const [bot_id, record] of bots.entries()) {
    if (record.connected && now - record.lastSeen > STATE_TIMEOUT_SEC * 1000) {
      if (!record.state.status_text.includes("НЕТ ДАННЫХ")) {
        record.state.status_text = "⚫ НЕТ ДАННЫХ";
        addLog('warn', `⚠ ${bot_id}: нет state >${STATE_TIMEOUT_SEC}с`, bot_id);
        broadcastBotState(record);
      }
    }
  }
}, 3000);

// Port Scanner (matching MainWindow._scan_ports)
async function scanPorts(host: string, start: number, end: number): Promise<number[]> {
  const found: number[] = [];
  addLog('info', `🔍 Сканирую ${host}:${start}–${end}…`);

  for (let port = start; port <= end; port++) {
    try {
      await new Promise<void>((resolve) => {
        const s = new net.Socket();
        s.setTimeout(150);
        s.on('connect', () => {
          found.push(port);
          s.destroy();
          resolve();
        });
        s.on('timeout', () => {
          s.destroy();
          resolve();
        });
        s.on('error', () => {
          s.destroy();
          resolve();
        });
        s.connect(port, host);
      });
    } catch {}
  }

  if (found.length === 0) {
    addLog('info', `🔍 Активных агентов не найдено`);
  } else {
    addLog('info', `🔍 Найдено активных агентов: ${found.length} (${found.join(', ')})`);
  }
  return found;
}

// -------------------------------------------------------------
// Express & WebSocket Server Setup
// -------------------------------------------------------------
const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(msg: Record<string, unknown>) {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function broadcastBotState(record: BotRecord) {
  broadcast({
    type: 'state',
    bot_id: record.id,
    state: record.state
  });
}

wss.on('connection', (ws) => {
  const allStates: Record<string, unknown> = {};
  for (const [id, r] of bots.entries()) {
    allStates[id] = r.state;
  }

  const allHistories: Record<string, unknown> = {};
  for (const [id, h] of graphHistory.entries()) {
    allHistories[id] = h;
  }

  ws.send(JSON.stringify({
    type: 'init',
    data: {
      config,
      bots: allStates,
      history: allHistories,
      logs: logs.slice(0, 100),
      incidents: incidents.slice(0, 50)
    }
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'command') {
        if (parsed.action === 'terminate') {
          terminateBot(parsed.bot_id);
        } else {
          dispatchCommand(parsed.bot_id, parsed.action, parsed.extra || {});
        }
      } else if (parsed.type === 'broadcast') {
        broadcastCommand(parsed.action, parsed.extra || {});
      } else if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  });
});

// REST API
app.get('/api/status', (req, res) => {
  const botsList = Array.from(bots.values()).map(b => b.state);
  res.json({
    status: 'ok',
    config,
    botCount: botsList.length,
    activeCount: botsList.filter(b => b.connected).length,
    bots: botsList
  });
});

app.get('/api/config', (req, res) => {
  res.json(config);
});

app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  config = { ...config, ...newConfig };
  saveConfig();

  broadcast({ type: 'config_updated', data: config });
  addLog('info', '⚙ Настройки хаба успешно обновлены');
  res.json({ success: true, config });
});

app.post('/api/command', (req, res) => {
  const { bot_id, action, extra } = req.body;
  if (bot_id === 'all') {
    broadcastCommand(action, extra);
    res.json({ success: true, broadcast: true });
  } else {
    if (action === 'terminate') {
      terminateBot(bot_id);
      res.json({ success: true });
    } else {
      const success = dispatchCommand(bot_id, action, extra);
      res.json({ success });
    }
  }
});

app.post('/api/scan', async (req, res) => {
  const host = req.body.host || config.host || "127.0.0.1";
  const start = parseInt(req.body.start, 10) || config.autoScanPortStart || 25580;
  const end = parseInt(req.body.end, 10) || config.autoScanPortEnd || 25600;

  const found = await scanPorts(host, start, end);
  let added = 0;
  for (const port of found) {
    const botId = `bot_${port}`;
    if (!bots.has(botId)) {
      connectTcpBot(botId, host, port);
      added++;
      addLog('info', `🔍 Найден агент на ${host}:${port} → ${botId}`);
    }
  }

  if (added > 0) {
    addLog('info', `🔍 Добавлено ботов: ${added}`);
  }

  res.json({ success: true, host, start, end, found, added });
});

app.post('/api/bots/add', (req, res) => {
  const { host = "127.0.0.1", port, id } = req.body;
  if (!port) {
    return res.status(400).json({ error: 'Порт обязателен' });
  }
  const botId = id || `bot_${port}`;
  connectTcpBot(botId, host, Number(port));
  res.json({ success: true, botId });
});

app.post('/api/bots/remove', (req, res) => {
  const { bot_id } = req.body;
  if (bot_id) {
    terminateBot(bot_id);
  }
  res.json({ success: true });
});

app.post('/api/incidents/clear', (req, res) => {
  incidents.length = 0;
  broadcast({ type: 'incidents_cleared' });
  addLog('info', '🗑 Журнал инцидентов очищен');
  res.json({ success: true });
});

app.get('/api/export/incidents', (req, res) => {
  const text = incidents.map(i => `[${i.timestamp}] [${i.category.toUpperCase()}] ${i.bot_id} — ${i.msg}`).join('\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="farmplus_incidents.txt"');
  res.send(text || 'Журнал инцидентов пуст\n');
});

// Startup connection & Auto-scan (matching MainWindow.__init__)
for (const b of config.bots || []) {
  if (b.id && b.port) {
    connectTcpBot(b.id, b.host || config.host || "127.0.0.1", b.port);
  }
}

if (config.autoScanOnStart) {
  setTimeout(() => {
    scanPorts(config.host, config.autoScanPortStart, config.autoScanPortEnd).then((found) => {
      for (const port of found) {
        connectTcpBot(`bot_${port}`, config.host, port);
      }
    });
  }, 1000);
}

// Mount Vite or static
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Farm+ Hub Web] Работает на http://0.0.0.0:${PORT}`);
  });
}

startServer();
