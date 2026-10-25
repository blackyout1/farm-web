import React from 'react';
import { 
  Users, 
  SlidersHorizontal, 
  TrendingUp, 
  BarChart3, 
  ShieldAlert, 
  Terminal 
} from 'lucide-react';
import { HubTab } from '../types/hub';

interface MobileNavProps {
  activeTab: HubTab;
  onTabChange: (tab: HubTab) => void;
  dangerIncidentCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  dangerIncidentCount
}) => {
  const tabs = [
    { id: 'overview' as HubTab, label: 'Боты', icon: Users },
    { id: 'control' as HubTab, label: 'Панель', icon: SlidersHorizontal },
    { id: 'graph' as HubTab, label: 'График', icon: TrendingUp },
    { id: 'stats' as HubTab, label: 'Статы', icon: BarChart3 },
    { id: 'incidents' as HubTab, label: 'Инциденты', icon: ShieldAlert, badge: dangerIncidentCount },
    { id: 'logs' as HubTab, label: 'Логи', icon: Terminal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d131f]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 md:hidden">
      <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white font-mono font-bold text-[9px] flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight truncate max-w-full ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
