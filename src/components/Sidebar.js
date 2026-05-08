import { Home, TrendingUp, LogOut, Coins, BarChart3, Layers, Package, Users } from 'lucide-react';
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
  ];

  return (
    <aside className={`h-screen sticky top-0 left-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-0 overflow-hidden' : 'w-[260px]'} select-none`}>
      {/* Brand logo container (60% white panel base, 30% brand orange details) */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-100 p-1">
          <img src={logo} alt="ASA Philippines" className="object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-widest text-slate-800">BUDGET SYSTEM</span>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className={`transition-colors ${isActive ? 'text-orange-500' : 'text-slate-400'}`}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Profile & Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-150 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-orange-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
            {getInitials(user?.email)}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-black text-slate-800 truncate capitalize">
              {user?.email.split('@')[0]}
            </div>
            <div className="text-[10px] font-bold text-slate-400 capitalize">
              {user?.role}
            </div>
          </div>
          <button 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer" 
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
