'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gasPost } from '../api/gasClient';
import Sidebar from './Sidebar';
import DrivenFactor from './DrivenFactor';
import DetailedExpense from './DetailedExpense';
import PnL from './PnL';
import Capex from './Capex';
import Inventory from './Inventory';
import Manpower from './Manpower';
import CostCenter from './CostCenter';
import { 
  Users, 
  Wallet, 
  Coins, 
  Landmark, 
  BarChart3, 
  TrendingUp, 
  Percent, 
  Menu,
  RotateCw,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

const CirclePesoSign = ({ size = 20, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M10 11h5" />
    <path d="M10 8h5" />
    <path d="M10 5h3.5a3 3 0 0 1 0 6H10v5" />
  </svg>
);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dfData, setDfData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme', 'dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const [viewMode, setViewMode] = useState('yearly'); // 'monthly' | 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(0); // 0-indexed month
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const MONTHS_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getLatestActiveMonthIndex = (data) => {
    if (!data) return 0;
    for (let i = 11; i >= 0; i--) {
      const hasData = Object.keys(data).some(metricId => {
        const actuals = data[metricId]?.actuals;
        return actuals && actuals[i] > 0;
      });
      if (hasData) return i;
    }
    return 0; // fallback to January
  };

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const result = await gasPost({ action: 'getDrivenFactor' });
        if (result.ok) {
          if (result.data) {
            setDfData(result.data);
            const latestIdx = getLatestActiveMonthIndex(result.data);
            setSelectedMonth(latestIdx);
          }

          if (result.branches) {
            const dynamicNotifs = [];
            const roleUpper = user?.role?.toUpperCase();

            result.branches.forEach((b, idx) => {
              const app = b.approvals || {};
              if (roleUpper === 'BM') {
                if (app.aa) {
                  dynamicNotifs.push({
                    id: `aa-bm-${b.code}-${idx}`,
                    text: `Your branch target (${b.code}) was approved by Area Accountant (AA).`,
                    time: 'Just now',
                    unread: true
                  });
                }
              } else if (roleUpper === 'AA') {
                if (app.ra) {
                  dynamicNotifs.push({
                    id: `ra-aa-${b.code}-${idx}`,
                    text: `Your Area branch (${b.code} - ${b.name}) target was approved by Regional Accountant (RA).`,
                    time: 'Just now',
                    unread: true
                  });
                }
                if (app.reopenRequested) {
                  dynamicNotifs.push({
                    id: `reopen-req-aa-${b.code}-${idx}`,
                    text: `Branch ${b.code} (${b.name}) requested to re-open targets. 🔔`,
                    time: 'Just now',
                    unread: true
                  });
                }
              } else if (roleUpper === 'RA') {
                if (app.avp) {
                  dynamicNotifs.push({
                    id: `avp-ra-${b.code}-${idx}`,
                    text: `Your Regional branch (${b.code} - ${b.name}) target was approved by AVP.`,
                    time: 'Just now',
                    unread: true
                  });
                }
              } else if (roleUpper === 'AVP') {
                if (app.svp) {
                  dynamicNotifs.push({
                    id: `svp-avp-${b.code}-${idx}`,
                    text: `Your Divisional branch (${b.code} - ${b.name}) target was approved by SVP.`,
                    time: 'Just now',
                    unread: true
                  });
                }
              }
            });

            if (dynamicNotifs.length === 0) {
              dynamicNotifs.push({
                id: 'default-1',
                text: 'Quarter 2 budgeting forecasting sheet is open.',
                time: '1 hr ago',
                unread: false
              });
              dynamicNotifs.push({
                id: 'default-2',
                text: 'Monthly collection actuals updated for April.',
                time: '3 hrs ago',
                unread: false
              });
            }

            setNotifications(dynamicNotifs);
          }
        }
      } catch (e) {
        console.error('Failed to fetch summary:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [activeTab, user]);

  const getMetricTotalNum = (metricId) => {
    if (!dfData || !dfData[metricId]) return 0;
    const metric = dfData[metricId];
    
    if (viewMode === 'monthly') {
      return parseFloat(metric.targets?.[selectedMonth]) || 0;
    } else {
      if (metricId === 'clients' || metricId === 'savings' || metricId === 'portfolio') {
        const latestIdx = getLatestActiveMonthIndex(dfData);
        return parseFloat(metric.targets?.[latestIdx]) || 0;
      } else {
        return (metric.targets || []).reduce((a, b) => a + (parseFloat(b) || 0), 0);
      }
    }
  };

  const getMetricActualNum = (metricId) => {
    if (!dfData || !dfData[metricId]) return 0;
    const metric = dfData[metricId];
    
    if (viewMode === 'monthly') {
      return parseFloat(metric.actuals?.[selectedMonth]) || 0;
    } else {
      if (metricId === 'clients' || metricId === 'savings' || metricId === 'portfolio') {
        const latestIdx = getLatestActiveMonthIndex(dfData);
        return parseFloat(metric.actuals?.[latestIdx]) || 0;
      } else {
        return (metric.actuals || []).reduce((a, b) => a + (parseFloat(b) || 0), 0);
      }
    }
  };

  const getMetricTotal = (metricId) => {
    return getMetricTotalNum(metricId).toLocaleString();
  };

  const getMetricActual = (metricId) => {
    return getMetricActualNum(metricId).toLocaleString();
  };

  const getPercentage = (metricId) => {
    const target = getMetricTotalNum(metricId);
    const actual = getMetricActualNum(metricId);
    if (target === 0) return '0%';
    return Math.round((actual / target) * 100) + '%';
  };

  const getCardLabel = (metricId, defaultLabel) => {
    if (viewMode === 'monthly') {
      return `${defaultLabel} (${MONTHS_FULL[selectedMonth]})`;
    } else {
      if (metricId === 'clients' || metricId === 'savings' || metricId === 'portfolio') {
        const latestIdx = dfData ? getLatestActiveMonthIndex(dfData) : 0;
        return `${defaultLabel} (${MONTHS_FULL[latestIdx]} Snapshot)`;
      } else {
        return `${defaultLabel} (Yearly Total)`;
      }
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const STAT_CARDS = [
    { id: 'clients', label: getCardLabel('clients', 'Clients Forecast'), value: getMetricTotal('clients'), actual: getMetricActual('clients'), percent: getPercentage('clients'), icon: <Users size={22} />, target: 'driven-factor' },
    { id: 'savings', label: getCardLabel('savings', 'Total Savings Target'), value: getMetricTotal('savings'), actual: getMetricActual('savings'), percent: getPercentage('savings'), icon: <Wallet size={22} />, target: 'driven-factor' },
    { id: 'disbursement', label: getCardLabel('disbursement', 'Loan Disbursement'), value: getMetricTotal('disbursement'), actual: getMetricActual('disbursement'), percent: getPercentage('disbursement'), icon: <Coins size={22} />, target: 'driven-factor' },
    { id: 'collection', label: getCardLabel('collection', 'Loan Collection'), value: getMetricTotal('collection'), actual: getMetricActual('collection'), percent: getPercentage('collection'), icon: <CirclePesoSign size={20} />, target: 'driven-factor' },
    { id: 'portfolio', label: getCardLabel('portfolio', 'Loan Portfolio'), value: getMetricTotal('portfolio'), actual: getMetricActual('portfolio'), percent: getPercentage('portfolio'), icon: <Landmark size={22} />, target: 'driven-factor' },
    { id: 'gross_revenue', label: getCardLabel('gross_revenue', 'Gross Revenue'), value: getMetricTotal('gross_revenue'), actual: getMetricActual('gross_revenue'), percent: getPercentage('gross_revenue'), icon: <BarChart3 size={22} />, target: 'driven-factor' },
    { id: 'net_gross', label: getCardLabel('net_gross', 'Net Gross Revenue'), value: getMetricTotal('net_gross'), actual: getMetricActual('net_gross'), percent: getPercentage('net_gross'), icon: <TrendingUp size={22} />, target: 'driven-factor' },
    { id: 'rebates', label: getCardLabel('rebates', 'Rebates from Loan'), value: getMetricTotal('rebates'), actual: getMetricActual('rebates'), percent: getPercentage('rebates'), icon: <Percent size={22} />, target: 'driven-factor' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Greeting card - White container background, sky branding, grey descriptions */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="flex flex-col">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Good day, <span className="text-sky-500 capitalize">{user?.email.split('@')[0]}</span> 👋
                </h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 border border-sky-100">{user?.role}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400 font-semibold">{user?.scopeCode || 'National Access'}</span>
                </p>
                <p className="text-slate-400 text-xs font-semibold mt-2">{today}</p>
              </div>

              {/* View control selectors */}
              <div className="flex gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
                <div className="flex flex-col">
                  <select 
                    value={viewMode} 
                    onChange={(e) => setViewMode(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs font-bold px-3 py-2 text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="yearly">Yearly Summary</option>
                    <option value="monthly">Monthly Breakdowns</option>
                  </select>
                </div>

                {viewMode === 'monthly' && (
                  <div className="flex flex-col">
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="bg-white border border-slate-200 rounded-lg text-xs font-bold px-3 py-2 text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
                    >
                      {MONTHS_FULL.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {/* Stat metric grids Redesigned to 60/30/10 light mode style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARDS.map((card) => (
                <div 
                  key={card.id} 
                  className="bg-white hover:bg-slate-50/40 rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative overflow-hidden cursor-pointer active:scale-[0.99]" 
                  onClick={() => setActiveTab(card.target)}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/10 group-hover:scale-105 transition-transform">
                      {card.icon}
                    </div>
                    <div className="bg-sky-50 text-sky-600 font-extrabold text-[10px] tracking-wider uppercase px-2 py-1 rounded-lg border border-sky-100">
                      {card.percent} Reach
                    </div>
                  </div>
                  
                  <div className="mt-5 flex flex-col">
                    <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                      {loading ? '...' : card.actual}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2 group-hover:text-slate-600 transition-colors">
                      {card.label}
                    </span>
                  </div>
                  
                  <div className="mt-4 border-t border-dashed border-slate-100 pt-3 flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>TARGET:</span>
                    <span className="text-slate-600 font-mono text-xs">{card.value}</span>
                  </div>
                  
                  {/* Subtle hover background highlight bubble */}
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-br from-sky-500/5 to-transparent rounded-full translate-x-8 translate-y-8 group-hover:scale-110 transition-transform"></div>
                </div>
              ))}
            </div>

            {/* Announcements Segment */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                Recent Announcements
              </h3>
              <div className="py-6 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                📢 No announcements posted at this time.
              </div>
            </div>
          </div>
        );
      case 'driven-factor':
        return <DrivenFactor />;
      case 'detailed-expense':
        return <DetailedExpense />;
      case 'pnl':
        return <PnL />;
      case 'capex':
        return <Capex />;
      case 'inventory':
        return <Inventory />;
      case 'manpower':
        return <Manpower />;
      case 'cost-center':
        return <CostCenter />;
      default:
        return (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl animate-fadeIn">
            <h2 className="text-lg font-black text-slate-800 capitalize mb-1">{activeTab.replace('-', ' ')}</h2>
            <p className="text-sm text-slate-500 font-medium">This module is currently undergoing system tuning. Please check back shortly.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans">
      <Sidebar 
        collapsed={collapsed} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        logout={logout}
      />
      
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Dynamic Nav-header with White-Orange focus guidelines */}
        <header className="h-16 sticky top-0 bg-white/90 backdrop-blur border-b border-slate-200/80 px-6 flex items-center justify-between z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" 
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span className="text-slate-600">ASA Philippines</span>
              <span>/</span>
              <span className="text-sky-500 uppercase tracking-wider font-extrabold">{activeTab.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dynamic Light/Dark Mode Switcher */}
            <button 
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-500 hover:bg-sky-50 transition-colors cursor-pointer" 
              onClick={toggleDarkMode}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun size={15} className="text-amber-500 animate-pulse" />
              ) : (
                <Moon size={15} className="text-slate-500" />
              )}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button 
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-500 hover:bg-sky-50 transition-colors relative cursor-pointer" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={16} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Notifications</h4>
                    <button 
                      className="text-[10px] font-extrabold text-sky-500 hover:text-sky-600 tracking-wide uppercase cursor-pointer"
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                    >
                      Mark read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400 font-bold">No active notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 hover:bg-slate-50 flex flex-col gap-1 ${n.unread ? 'bg-sky-500/5' : ''}`}>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">{n.text}</p>
                          <span className="text-[9px] font-bold text-slate-400">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Refresh App */}
            <button 
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-500 hover:bg-sky-50 transition-colors cursor-pointer" 
              title="Refresh Portal" 
              onClick={() => window.location.reload()}
            >
              <RotateCw size={15} />
            </button>

            {/* Profile email banner */}
            <div className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-extrabold px-3 py-1.5 rounded-xl font-mono select-none">
              {user?.email}
            </div>
          </div>
        </header>

        {/* Scrolling page viewport wrapper */}
        <section className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {renderContent()}
        </section>
      </main>
    </div>
  );
}
