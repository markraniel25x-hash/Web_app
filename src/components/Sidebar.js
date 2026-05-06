import React from 'react';
import { Home, TrendingUp, LogOut } from 'lucide-react';
import logo from '../assets/logo.png';
import './Sidebar.css';

export default function Sidebar({ collapsed, activeTab, setActiveTab, user, logout }) {
  const getInitials = (email) => {
    if (!email) return '??';
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'driven-factor', label: 'Driven Factor', icon: <TrendingUp size={20} /> },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'hidden' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-box">
          <div className="asa-logo-small">
            <img src={logo} alt="ASA Philippines" />
          </div>
          <span className="brand-name">BUDGET SYSTEM</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-section">
          <div className="user-avatar">{getInitials(user?.email)}</div>
          <div className="user-info">
            <div className="user-name">{user?.email.split('@')[0]}</div>
          </div>
          <button className="logout-mini-btn" onClick={logout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
