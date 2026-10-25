import { useState, useEffect, useRef, useCallback } from 'react';
import { BotState, Incident, LogEntry, GraphPoint, HubConfig } from '../types/hub';
import { soundManager } from '../utils/audio';

const DEFAULT_CONFIG: HubConfig = {
  mainAccount: "MyMain",
  autoPauseAllOnDanger: false,
  autoScanOnStart: true,
  autoScanPortStart: 25580,
  autoScanPortEnd: 25600,
  host: "127.0.0.1",
  bots: []
};

export function useHubWebSocket() {
  const [connected, setConnected] = useState<boolean>(false);
  const [config, setConfig] = useState<HubConfig>(DEFAULT_CONFIG);
  const [bots, setBots] = useState<Record<string, BotState>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [graphHistory, setGraphHistory] = useState<Record<string, GraphPoint[]>>({});
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [urgentAlert, setUrgentAlert] = useState<{ bot_id: string; msg: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWs = useCallback(() => {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const type = payload.type;

          if (type === 'init') {
            const data = payload.data;
            if (data.config) setConfig(data.config);
            if (data.bots) {
              setBots(data.bots);
              const botIds = Object.keys(data.bots);
              if (botIds.length > 0) {
                setSelectedBotId((prev) => (prev && data.bots[prev] ? prev : botIds[0]));
              }
            }
            if (data.history) setGraphHistory(data.history);
            if (data.logs) setLogs(data.logs);
            if (data.incidents) setIncidents(data.incidents);
          } else if (type === 'state') {
            const bot_id = payload.bot_id as string;
            const state = payload.state as BotState;
            setBots((prev) => {
              const updated = { ...prev, [bot_id]: state };
              return updated;
            });

            // Update graph history for this bot
            if (state && state.stats) {
              const now = Date.now();
              const timeStr = new Date().toLocaleTimeString('ru-RU', { hour12: false });
              // Profit calculation
              const goodBooks = state.stats?.counters?.books_good || 0;
              const trashBooks = state.stats?.counters?.books_trash || 0;
              let profit = 0;
              for (const [name, count] of Object.entries(state.current_books || {})) {
                profit += 100000 * (count || 0);
              }
              profit += goodBooks * 500000;

              setGraphHistory((prev) => {
                const existing = prev[bot_id] || [];
                const last = existing[existing.length - 1];
                if (!last || now - last.rawTime >= 3500) {
                  const nextPoints = [...existing, {
                    time: timeStr,
                    rawTime: now,
                    books_good: goodBooks,
                    books_trash: trashBooks,
                    profit
                  }];
                  if (nextPoints.length > 300) nextPoints.shift();
                  return { ...prev, [bot_id]: nextPoints };
                }
                return prev;
              });
            }

            // Default select first bot if none selected
            setSelectedBotId((prev) => prev || bot_id);
          } else if (type === 'log') {
            const entry = payload.data as LogEntry;
            setLogs((prev) => [entry, ...prev.slice(0, 499)]);
          } else if (type === 'incident') {
            const inc = payload.data as Incident;
            setIncidents((prev) => [inc, ...prev.slice(0, 199)]);
            if (inc.category === 'danger') {
              soundManager.playDangerAlert();
              setUrgentAlert({ bot_id: inc.bot_id, msg: inc.msg });
            } else if (inc.category === 'warn') {
              soundManager.playWarnAlert();
            }
          } else if (type === 'incidents_cleared') {
            setIncidents([]);
          } else if (type === 'bot_removed') {
            const removedId = payload.bot_id;
            setBots((prev) => {
              const next = { ...prev };
              delete next[removedId];
              return next;
            });
            setSelectedBotId((prev) => (prev === removedId ? null : prev));
          } else if (type === 'config_updated') {
            setConfig(payload.data);
          }
        } catch (e) {
          console.error('[WS Parse error]', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
    }
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWs]);

  const sendCommand = useCallback((bot_id: string, action: string, extra: Record<string, unknown> = {}) => {
    soundManager.playClick();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'command',
        bot_id,
        action,
        extra
      }));
    } else {
      // Fallback to fetch
      fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id, action, extra })
      }).catch(console.error);
    }
  }, []);

  const broadcastCommand = useCallback((action: string, extra: Record<string, unknown> = {}) => {
    soundManager.playClick();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'broadcast',
        action,
        extra
      }));
    } else {
      fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: 'all', action, extra })
      }).catch(console.error);
    }
  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<HubConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (data.config) setConfig(data.config);
      soundManager.playSuccessTone();
    } catch (e) {
      console.error('Error updating config', e);
    }
  }, []);

  const clearIncidents = useCallback(async () => {
    try {
      await fetch('/api/incidents/clear', { method: 'POST' });
      setIncidents([]);
      soundManager.playClick();
    } catch (e) {
      console.error('Error clearing incidents', e);
    }
  }, []);

  const clearUrgentAlert = useCallback(() => {
    setUrgentAlert(null);
  }, []);

  return {
    connected,
    config,
    bots,
    selectedBotId,
    setSelectedBotId,
    selectedBot: selectedBotId ? bots[selectedBotId] : null,
    incidents,
    logs,
    graphHistory,
    urgentAlert,
    clearUrgentAlert,
    sendCommand,
    broadcastCommand,
    updateConfig,
    clearIncidents
  };
}
