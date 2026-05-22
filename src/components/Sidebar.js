'use client';

import { Home, TrendingUp, LogOut, Coins, BarChart3, Layers, Package, Users, Building2 } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Sidebar({ collapsed, activeTab, setActiveTab, user, logout }) {
  const getInitials = (email) => {
    if (!email) return '??';
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'driven-factor', label: 'Driven Factor', icon: <TrendingUp size={18} /> },
    { id: 'detailed-expense', label: 'Detailed Expense', icon: <Coins size={18} /> },
    { id: 'pnl', label: 'P&L Statement', icon: <BarChart3 size={18} /> },
    { id: 'capex', label: 'CAPEX Register', icon: <Layers size={18} /> },
    { id: 'inventory', label: 'Supplies Inventory', icon: <Package size={18} /> },
    { id: 'manpower', label: 'Manpower Request', icon: <Users size={18} /> },
    { id: 'cost-center', label: 'Cost Centers', icon: <Building2 size={18} /> },
  ];

  return (
    <aside className={`h-screen sticky top-0 left-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-[76px]' : 'w-[260px]'} select-none`}>
      {/* Brand logo container (Slate-navy base, vibrant electric blue details) */}
      <div className={`p-5 border-b border-slate-800 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-sky-500/10 rounded-lg flex items-center justify-center border border-sky-500/20 p-1 shrink-0">
          <img src={logo.src || logo} alt="ASA Philippines" className="object-contain" />
        </div>
        <span className={`font-extrabold text-sm tracking-widest text-slate-100 transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>BUDGET SYSTEM</span>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border-l-4 border-sky-500'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              } ${collapsed ? 'justify-center px-0' : 'px-4'}`}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className={`transition-colors shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`}>{item.icon}</span>
              <span className={`transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Profile & Footer */}
      <div className={`border-t border-slate-800 bg-slate-950/20 transition-all ${collapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center gap-3 bg-slate-800/40 rounded-xl border border-slate-800/80 shadow-sm transition-all ${collapsed ? 'justify-center p-1.5' : 'p-2'}`}>
          <div className="w-9 h-9 rounded-lg bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
            {getInitials(user?.email)}
          </div>
          <div className={`flex-1 overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
            <div className="text-xs font-black text-slate-200 truncate capitalize">
              {user?.email.split('@')[0]}
            </div>
            <div className="text-[10px] font-bold text-slate-500 capitalize">
              {user?.role}
            </div>
          </div>
          <button 
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer shrink-0 ${collapsed ? 'hidden' : ''}`} 
            onClick={logout} 
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
