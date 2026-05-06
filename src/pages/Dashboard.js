import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gasPost } from '../api/gasClient';
import Sidebar from '../components/Sidebar';
import DrivenFactor from '../components/DrivenFactor';
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
  Moon,
  Sun
} from 'lucide-react';
import './Dashboard.css';

const CirclePesoSign = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
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
  const [viewMode, setViewMode] = useState('yearly'); // 'monthly' | 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(0); // 0-indexed month

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
                // BM sees notification if branch is approved by AA
                if (app.aa) {
                  dynamicNotifs.push({
                    id: `aa-bm-${b.code}-${idx}`,
                    text: `Your branch target (${b.code}) was approved by Area Accountant (AA).`,
                    time: 'Just now',
                    unread: true
                  });
                }
              } else if (roleUpper === 'AA') {
                // AA sees notification of Action of RA if related to their Area
                if (app.ra) {
                  dynamicNotifs.push({
                    id: `ra-aa-${b.code}-${idx}`,
                    text: `Your Area branch (${b.code} - ${b.name}) target was approved by Regional Accountant (RA).`,
                    time: 'Just now',
                    unread: true
                  });
                }
                // AA sees notifications for BM re-open requests
                if (app.reopenRequested) {
                  dynamicNotifs.push({
                    id: `reopen-req-aa-${b.code}-${idx}`,
                    text: `Branch ${b.code} (${b.name}) requested to re-open targets. 🔔`,
                    time: 'Just now',
                    unread: true
                  });
                }
              } else if (roleUpper === 'RA') {
                // RA sees notification of Action of AVP if related to their Region
                if (app.avp) {
                  dynamicNotifs.push({
                    id: `avp-ra-${b.code}-${idx}`,
                    text: `Your Regional branch (${b.code} - ${b.name}) target was approved by AVP.`,
                    time: 'Just now',
                    unread: true
                  });
                }
              } else if (roleUpper === 'AVP') {
                // AVP sees notification of Action of SVP if related to their Division
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

            // Default notifications fallback if no approvals found
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
      // Yearly View Mode
      if (metricId === 'clients' || metricId === 'savings' || metricId === 'portfolio') {
        // Balance/Snapshot metrics: show latest active month value
        const latestIdx = getLatestActiveMonthIndex(dfData);
        return parseFloat(metric.targets?.[latestIdx]) || 0;
      } else {
        // Flow/Income metrics: show yearly sum
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
      // Yearly View Mode
      if (metricId === 'clients' || metricId === 'savings' || metricId === 'portfolio') {
        // Balance/Snapshot metrics: show latest active month value
        const latestIdx = getLatestActiveMonthIndex(dfData);
        return parseFloat(metric.actuals?.[latestIdx]) || 0;
      } else {
        // Flow/Income metrics: show yearly sum
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
    { id: 'clients', label: getCardLabel('clients', 'Clients Forecast'), value: getMetricTotal('clients'), actual: getMetricActual('clients'), percent: getPercentage('clients'), icon: <Users size={24} />, color: '#7c3aed', target: 'driven-factor' },
    { id: 'savings', label: getCardLabel('savings', 'Total Savings Target'), value: getMetricTotal('savings'), actual: getMetricActual('savings'), percent: getPercentage('savings'), icon: <Wallet size={24} />, color: '#10b981', target: 'driven-factor' },
    { id: 'disbursement', label: getCardLabel('disbursement', 'Loan Disbursement'), value: getMetricTotal('disbursement'), actual: getMetricActual('disbursement'), percent: getPercentage('disbursement'), icon: <Coins size={24} />, color: '#f59e0b', target: 'driven-factor' },
    { id: 'collection', label: getCardLabel('collection', 'Loan Collection'), value: getMetricTotal('collection'), actual: getMetricActual('collection'), percent: getPercentage('collection'), icon: <CirclePesoSign size={24} />, color: '#06b6d4', target: 'driven-factor' },
    { id: 'portfolio', label: getCardLabel('portfolio', 'Loan Portfolio'), value: getMetricTotal('portfolio'), actual: getMetricActual('portfolio'), percent: getPercentage('portfolio'), icon: <Landmark size={24} />, color: '#ef4444', target: 'driven-factor' },
    { id: 'gross_revenue', label: getCardLabel('gross_revenue', 'Gross Revenue'), value: getMetricTotal('gross_revenue'), actual: getMetricActual('gross_revenue'), percent: getPercentage('gross_revenue'), icon: <BarChart3 size={24} />, color: '#6366f1', target: 'driven-factor' },
    { id: 'net_gross', label: getCardLabel('net_gross', 'Net Gross Revenue'), value: getMetricTotal('net_gross'), actual: getMetricActual('net_gross'), percent: getPercentage('net_gross'), icon: <TrendingUp size={24} />, color: '#8b5cf6', target: 'driven-factor' },
    { id: 'rebates', label: getCardLabel('rebates', 'Rebates from Loan'), value: getMetricTotal('rebates'), actual: getMetricActual('rebates'), percent: getPercentage('rebates'), icon: <Percent size={24} />, color: '#ec4899', target: 'driven-factor' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-overview">
            <div className="greeting-section-container">
              <div className="greeting-section">
                <h1>Good day, <span className="highlight-name">{user?.email.split('@')[0]}</span> 👋</h1>
                <p className="scope-indicator">{user?.role} | {user?.scopeCode || 'National Access'}</p>
                <p className="current-date">{today}</p>
              </div>

              <div className="dashboard-controls-card">
                <div className="control-field">
                  <span className="control-label">View Period</span>
                  <select 
                    value={viewMode} 
                    onChange={(e) => setViewMode(e.target.value)}
                    className="premium-select"
                  >
                    <option value="yearly">Yearly Summary</option>
                    <option value="monthly">Monthly Breakdowns</option>
                  </select>
                </div>

                {viewMode === 'monthly' && (
                  <div className="control-field">
                    <span className="control-label">Select Month</span>
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="premium-select month-select"
                    >
                      {MONTHS_FULL.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="stat-cards-container">
              {STAT_CARDS.map((card) => (
                <div 
                  key={card.id} 
                  className="stat-card-premium" 
                  style={{ '--card-color': card.color, cursor: 'pointer' }}
                  onClick={() => setActiveTab(card.target)}
                >
                  <div className="card-icon">{card.icon}</div>
                  <div className="card-main-info">
                    <div className="card-value">{loading ? '...' : card.actual}</div>
                    <div className="card-label">{card.label}</div>
                  </div>
                  
                  <div className="card-secondary-info">
                    <div className="actual-box">
                      <span className="sub-label">TARGET:</span>
                      <span className="sub-value">{card.value}</span>
                    </div>
                    <div className="percent-badge" style={{ backgroundColor: card.color + '15', color: card.color }}>
                      {card.percent} Reach
                    </div>
                  </div>
                  
                  <div className="card-bg-circle"></div>
                </div>
              ))}
            </div>

            <div className="announcements-section">
              <div className="section-card">
                <h3>Recent Announcements</h3>
                <div className="empty-state">
                  <p>No announcements yet.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'driven-factor':
        return <DrivenFactor />;
      default:
        return (
          <div className="placeholder-content">
            <h2>{activeTab.replace('-', ' ').toUpperCase()}</h2>
            <p>This module is currently being optimized. Please check back later.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        collapsed={collapsed} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        logout={logout}
      />
      
      <main className="main-content">
        <header className="top-navbar">
          <div className="breadcrumb-box">
            <button className="menu-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-root">Dashboard</span>
              {activeTab !== 'dashboard' && (
                <>
                  <span className="separator">/</span>
                  <span className="breadcrumb-current">{activeTab.replace('-', ' ')}</span>
                </>
              )}
            </div>
          </div>

          <div className="top-actions">
            {/* Dark Mode Toggle */}
            <button 
              className="icon-action-btn theme-toggle" 
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} 
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Bell */}
            <div className="notification-bell-container">
              <button 
                className="icon-action-btn bell-btn" 
                title="Notifications" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {notifications.some(n => n.unread) && <span className="notification-badge"></span>}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                    <button 
                      className="clear-unread-btn"
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="dropdown-body">
                    {notifications.length === 0 ? (
                      <p className="no-notifications">No new notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`notification-item ${n.unread ? 'unread' : ''}`}>
                          <p className="notif-text">{n.text}</p>
                          <span className="notif-time">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button className="icon-action-btn" title="Refresh" onClick={() => window.location.reload()}>
              <RotateCw size={18} />
            </button>
            <div className="user-email-pill">
              {user?.email}
            </div>
          </div>
        </header>

        <section className="content-viewport">
          {renderContent()}
        </section>
      </main>
    </div>
  );
}
