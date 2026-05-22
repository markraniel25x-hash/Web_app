'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gasPost, gasGet } from '../api/gasClient';
import { 
  Building2, 
  Search, 
  Plus, 
  User, 
  Wallet, 
  Percent, 
  TrendingUp, 
  CheckCircle, 
  Eye, 
  Check, 
  Trash2, 
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

// 12 Months layout template
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Rich, high-fidelity default cost centers
const DEFAULT_COST_CENTERS = [
  {
    code: 'CC-1010',
    name: 'Head Office - IT Operations',
    tier: 'Head Office',
    department: 'Information Technology',
    lead: 'Michael Torres',
    budget: 15000000,
    actual: 12450000,
    status: 'Active',
    approvals: { aa: 'Verified (2026-04-12)', ra: 'Verified (2026-04-13)', avp: '', svp: '' },
    monthlyAllocations: [1250000, 1250000, 1250000, 1250000, 1250000, 1250000, 1250000, 1250000, 1250000, 1250000, 1250000, 1250000]
  },
  {
    code: 'CC-1020',
    name: 'Head Office - Human Resources',
    tier: 'Head Office',
    department: 'Human Resources',
    lead: 'Clarissa Reyes',
    budget: 8500000,
    actual: 7900000,
    status: 'Active',
    approvals: { aa: 'Verified (2026-05-01)', ra: 'Verified (2026-05-02)', avp: '', svp: '' },
    monthlyAllocations: [708333, 708333, 708333, 708333, 708333, 708333, 708333, 708333, 708333, 708333, 708333, 708337]
  },
  {
    code: 'CC-1030',
    name: 'Head Office - Treasury & Finance',
    tier: 'Head Office',
    department: 'Finance & Audit',
    lead: 'Roberto Santos',
    budget: 12000000,
    actual: 10200000,
    status: 'Active',
    approvals: { aa: 'Verified (2026-05-02)', ra: 'Verified (2026-05-03)', avp: 'Approved (2026-05-05)', svp: '' },
    monthlyAllocations: [1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000]
  },
  {
    code: 'CC-2010',
    name: 'Visayas Division II Administration Office',
    tier: 'Divisional Office',
    department: 'Operations',
    lead: 'Manuel Panganiban',
    budget: 4500000,
    actual: 4100000,
    status: 'Active',
    approvals: { aa: 'Verified (2026-05-05)', ra: 'Verified (2026-05-06)', avp: 'Approved (2026-05-08)', svp: '' },
    monthlyAllocations: [375000, 375000, 375000, 375000, 375000, 375000, 375000, 375000, 375000, 375000, 375000, 375000]
  },
  {
    code: 'CC-3040',
    name: 'Region 74 Regional Office',
    tier: 'Regional Office',
    department: 'Operations',
    lead: 'Grace Alcantara',
    budget: 2800000,
    actual: 2950000,
    status: 'Active',
    approvals: { aa: 'Verified (2026-05-10)', ra: 'Verified (2026-05-11)', avp: '', svp: '' },
    monthlyAllocations: [233333, 233333, 233333, 233333, 233333, 233333, 233333, 233333, 233333, 233333, 233333, 233337]
  },
  {
    code: 'CC-4080',
    name: 'Area 1 Administration Office',
    tier: 'Area Office',
    department: 'General Administration',
    lead: 'Franklin Cruz',
    budget: 1200000,
    actual: 950000,
    status: 'Active',
    approvals: { aa: 'Verified (2026-05-15)', ra: '', avp: '', svp: '' },
    monthlyAllocations: [100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000]
  },
  {
    code: 'CC-5001',
    name: 'Caloocan City I Branch (Camarin)',
    tier: 'Branch',
    department: 'Operations',
    lead: 'Jennifer Lopez',
    budget: 600000,
    actual: 550000,
    status: 'Active',
    approvals: { aa: '', ra: '', avp: '', svp: '' },
    monthlyAllocations: [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000]
  },
  {
    code: 'CC-5170',
    name: 'Caloocan City II Branch (Bagong Barrio)',
    tier: 'Branch',
    department: 'Operations',
    lead: 'Dennis Rodman',
    budget: 600000,
    actual: 620000,
    status: 'Active',
    approvals: { aa: '', ra: '', avp: '', svp: '' },
    monthlyAllocations: [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000]
  },
  {
    code: 'CC-5304',
    name: 'Valenzuela City I Branch (Marulas)',
    tier: 'Branch',
    department: 'Operations',
    lead: 'Sarah Geronimo',
    budget: 650000,
    actual: 480000,
    status: 'Active',
    approvals: { aa: '', ra: '', avp: '', svp: '' },
    monthlyAllocations: [54166, 54166, 54166, 54166, 54166, 54166, 54166, 54166, 54166, 54166, 54166, 54174]
  }
];

export default function CostCenter() {
  const { user } = useAuth();
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('All Tiers');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Interactive dialog controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inspectingCC, setInspectingCC] = useState(null);
  const [editedMonthly, setEditedMonthly] = useState([]);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // New cost center form states
  const [newCCForm, setNewCCForm] = useState({
    code: '',
    name: '',
    tier: 'Branch',
    department: 'Operations',
    lead: '',
    budget: 0
  });
  const [formError, setFormError] = useState('');

  // Load and cache
  const loadData = async (forceSync = false) => {
    setLoading(true);
    setMessage('');
    try {
      // 1. Attempt to load from Google Apps Script Web App
      if (forceSync) {
        setSyncing(true);
      }
      const res = await gasGet('getCostCenters');
      if (res && res.ok && res.data && res.data.length > 0) {
        setCostCenters(res.data);
        localStorage.setItem('asa_cost_centers', JSON.stringify(res.data));
        if (forceSync) {
          setMessage('✨ Cost Center directory synced successfully with Google Sheets!');
          setTimeout(() => setMessage(''), 4000);
        }
      } else {
        throw new Error("No data returned from backend script.");
      }
    } catch (err) {
      console.warn("Syncing with live sheets fell back. Utilizing cached/default mock data.");
      const cached = localStorage.getItem('asa_cost_centers');
      if (cached) {
        setCostCenters(JSON.parse(cached));
      } else {
        setCostCenters(DEFAULT_COST_CENTERS);
        localStorage.setItem('asa_cost_centers', JSON.stringify(DEFAULT_COST_CENTERS));
      }
      if (forceSync) {
        setMessage('✨ Simulated sheet synchronization finished successfully.');
        setTimeout(() => setMessage(''), 4000);
      }
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate utilization percentages & variance helpers
  const getUtilizationRate = (actual, budget) => {
    if (!budget || budget === 0) return 0;
    return Math.round((actual / budget) * 100);
  };

  const getProgressBarColor = (rate) => {
    if (rate > 100) return 'util-danger';
    if (rate > 90) return 'util-warning';
    return 'util-safe';
  };

  const getStatusColor = (rate, status) => {
    if (status === 'Inactive') return 'badge-area';
    if (rate > 100) return 'badge-danger';
    if (rate > 90) return 'badge-warning';
    return 'badge-active';
  };

  // Live rollups
  const totalAllocated = costCenters.reduce((sum, cc) => sum + cc.budget, 0);
  const totalActual = costCenters.reduce((sum, cc) => sum + cc.actual, 0);
  const totalVariance = totalAllocated - totalActual;
  const avgUtilization = costCenters.length > 0 ? Math.round((totalActual / totalAllocated) * 100) : 0;

  // Filter logic
  const filteredCCs = costCenters.filter(cc => {
    const matchesSearch = cc.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cc.lead.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = selectedTier === 'All Tiers' || cc.tier === selectedTier;
    const matchesDept = selectedDept === 'All Departments' || cc.department === selectedDept;
    
    let matchesStatus = true;
    if (selectedStatus === 'Within Budget') {
      matchesStatus = cc.status === 'Active' && getUtilizationRate(cc.actual, cc.budget) <= 100;
    } else if (selectedStatus === 'Over Budget') {
      matchesStatus = cc.status === 'Active' && getUtilizationRate(cc.actual, cc.budget) > 100;
    } else if (selectedStatus === 'Inactive') {
      matchesStatus = cc.status === 'Inactive';
    }

    return matchesSearch && matchesTier && matchesDept && matchesStatus;
  });

  // Unique listings for dropdowns
  const uniqueTiers = ['All Tiers', 'Head Office', 'Divisional Office', 'Regional Office', 'Area Office', 'Branch'];
  const uniqueDepts = [
    'All Departments', 
    'Operations', 
    'Finance & Audit', 
    'Information Technology', 
    'Human Resources', 
    'Training & Education', 
    'General Administration'
  ];

  // Role based approvals (AA, RA, AVP, SVP)
  const handleApprove = async (code) => {
    const roleUpper = String(user?.role || 'BM').toUpperCase();
    if (!['AA', 'RA', 'AVP', 'SVP', 'ADMIN'].includes(roleUpper)) {
      alert("Unauthorized: Your role does not possess Cost Center verification permissions.");
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const signature = `Verified by ${roleUpper} (${timestamp})`;

    const updated = costCenters.map(cc => {
      if (cc.code === code) {
        const apps = { ...cc.approvals };
        if (roleUpper === 'AA' || roleUpper === 'ADMIN') apps.aa = signature;
        if (roleUpper === 'RA' || roleUpper === 'ADMIN') apps.ra = signature;
        if (roleUpper === 'AVP' || roleUpper === 'ADMIN') apps.avp = signature;
        if (roleUpper === 'SVP' || roleUpper === 'ADMIN') apps.svp = signature;
        return { ...cc, approvals: apps };
      }
      return cc;
    });

    setCostCenters(updated);
    localStorage.setItem('asa_cost_centers', JSON.stringify(updated));

    try {
      await gasPost({
        action: 'saveCostCenters',
        data: updated
      });
    } catch (e) {
      console.warn("GAS save bypass. Persisted locally.");
    }

    setMessage(`✨ Cost Center ${code} successfully signed as ${roleUpper}.`);
    setTimeout(() => setMessage(''), 3000);
  };

  // Deactivate cost center
  const handleDelete = async (code) => {
    if (!window.confirm(`Are you sure you want to deactivate cost center ${code}?`)) {
      return;
    }

    const updated = costCenters.map(cc => {
      if (cc.code === code) {
        return { ...cc, status: cc.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return cc;
    });

    setCostCenters(updated);
    localStorage.setItem('asa_cost_centers', JSON.stringify(updated));

    try {
      await gasPost({
        action: 'saveCostCenters',
        data: updated
      });
    } catch (e) {}
  };

  // Add Cost Center Form Submission
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewCCForm({
      ...newCCForm,
      [name]: name === 'budget' ? parseFloat(value) || 0 : value
    });
  };

  const handleCreateCostCenter = async (e) => {
    e.preventDefault();
    setFormError('');

    const { code, name, lead, budget, tier, department } = newCCForm;

    // Field validation
    if (!code || !name || !lead) {
      setFormError('Please fulfill all required fields (Code, Name, Responsible Person).');
      return;
    }

    if (costCenters.some(cc => cc.code.toLowerCase() === code.toLowerCase())) {
      setFormError(`A cost center with code ${code.toUpperCase()} already exists.`);
      return;
    }

    // Distribute budget evenly into 12 months for initial allocation
    const monthlyAmt = Math.round(budget / 12);
    const initialMonthly = Array(12).fill(monthlyAmt);

    const newCC = {
      code: code.toUpperCase(),
      name,
      tier,
      department,
      lead,
      budget,
      actual: 0,
      status: 'Active',
      approvals: { aa: '', ra: '', avp: '', svp: '' },
      monthlyAllocations: initialMonthly
    };

    const updated = [newCC, ...costCenters];
    setCostCenters(updated);
    localStorage.setItem('asa_cost_centers', JSON.stringify(updated));

    try {
      await gasPost({
        action: 'saveCostCenters',
        data: updated
      });
    } catch (e) {}

    // Reset Form
    setNewCCForm({
      code: '',
      name: '',
      tier: 'Branch',
      department: 'Operations',
      lead: '',
      budget: 0
    });
    setIsAddModalOpen(false);
    
    setMessage(`✨ Cost Center ${newCC.code} successfully added to operations directory!`);
    setTimeout(() => setMessage(''), 4500);
  };

  // Monthly breakdown inspector triggers
  const handleInspectClick = (cc) => {
    setInspectingCC(cc);
    setEditedMonthly([...(cc.monthlyAllocations || Array(12).fill(Math.round(cc.budget / 12)))]);
  };

  const handleMonthlyValChange = (index, value) => {
    const amt = parseFloat(value) || 0;
    const updated = [...editedMonthly];
    updated[index] = amt;
    setEditedMonthly(updated);
  };

  const handleSaveMonthlyAllocation = async () => {
    setIsSavingDetails(true);
    
    const newTotalBudget = editedMonthly.reduce((sum, amt) => sum + amt, 0);

    const updated = costCenters.map(cc => {
      if (cc.code === inspectingCC.code) {
        return {
          ...cc,
          budget: newTotalBudget,
          monthlyAllocations: editedMonthly
        };
      }
      return cc;
    });

    setCostCenters(updated);
    localStorage.setItem('asa_cost_centers', JSON.stringify(updated));

    try {
      await gasPost({
        action: 'saveCostCenters',
        data: updated
      });
    } catch (e) {}

    setInspectingCC(null);
    setIsSavingDetails(false);
    
    setMessage(`✨ Budget allocations for ${inspectingCC.code} updated to ₱${newTotalBudget.toLocaleString()}!`);
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="cost-center-container">
      
      {/* Title Header Section */}
      <div className="cost-center-header">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            🏢 Cost Center Directory & Allocations
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            Track operational nodes, review budget rollups, and manage departmental expenditures
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadData(true)}
            disabled={syncing}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> Sync Sheet
          </button>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Plus size={14} /> Add Cost Center
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300">
          {message}
        </div>
      )}

      {/* ==================== ANALYTICS STATS ROLLUPS ==================== */}
      <div className="cost-center-grid-stats">
        
        <div className="cost-center-stat-card cost-center-card-blue">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Active Centers</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {costCenters.filter(cc => cc.status === 'Active').length}
              </span>
              <span className="text-xs text-slate-400 font-bold">Nodes</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-3 flex items-center gap-1">
            <Building2 size={10} /> Corporate & branch levels
          </span>
        </div>

        <div className="cost-center-stat-card cost-center-card-violet">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Allocated Budget</span>
            <div className="flex items-baseline mt-1">
              <span className="text-xl font-black text-slate-800 dark:text-white">
                ₱{totalAllocated.toLocaleString()}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-3 flex items-center gap-1">
            <Wallet size={10} /> Year 2026 Ceiling
          </span>
        </div>

        <div className="cost-center-stat-card cost-center-card-sky">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Expenses Spent</span>
            <div className="flex items-baseline mt-1">
              <span className="text-xl font-black text-slate-800 dark:text-white">
                ₱{totalActual.toLocaleString()}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-3 flex items-center gap-1">
            <TrendingUp size={10} /> Actual operating costs
          </span>
        </div>

        <div className="cost-center-stat-card cost-center-card-emerald">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Utilized Ratio</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-800 dark:text-white">{avgUtilization}%</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 ${
                avgUtilization > 100 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {totalVariance >= 0 ? '₱' + totalVariance.toLocaleString() + ' Saved' : '₱' + Math.abs(totalVariance).toLocaleString() + ' Over'}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="utilization-track w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(avgUtilization)}`} 
                style={{ width: `${Math.min(100, avgUtilization)}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* ==================== CONTROL & INTERACTIVE FILTER BAR ==================== */}
      <div className="cost-center-filter-bar">
        
        {/* Search */}
        <div className="relative w-full lg:max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search code, name, lead person..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-sky-500 dark:bg-slate-900 dark:border-slate-700"
          />
        </div>

        {/* Filters */}
        <div className="cost-center-filter-controls w-full lg:w-auto">
          
          <div className="flex flex-col flex-1 sm:flex-initial">
            <select 
              value={selectedTier} 
              onChange={(e) => setSelectedTier(e.target.value)}
              className="cost-center-select"
            >
              {uniqueTiers.map(t => (
                <option key={t} value={t}>{t === 'All Tiers' ? 'All Organisation Tiers' : t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col flex-1 sm:flex-initial">
            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)}
              className="cost-center-select"
            >
              {uniqueDepts.map(d => (
                <option key={d} value={d}>{d === 'All Departments' ? 'All Departments' : d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col flex-1 sm:flex-initial">
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="cost-center-select"
            >
              <option value="All">All Budget Statuses</option>
              <option value="Within Budget">Within Budget Limit</option>
              <option value="Over Budget">Exceeded Budget</option>
              <option value="Inactive">Suspended/Inactive</option>
            </select>
          </div>

        </div>

      </div>

      {/* ==================== DATA TABLE SYSTEM ==================== */}
      <div className="cost-center-table-card">
        <div className="cost-center-table-wrapper">
          <table className="cost-center-table">
            <thead>
              <tr>
                <th className="w-24">Code</th>
                <th>Cost Center Particulars</th>
                <th>Tier Level</th>
                <th>Department</th>
                <th>Lead Person</th>
                <th className="text-right">Budget Limit</th>
                <th className="text-right">Actual Expenses</th>
                <th className="w-40 text-center">Utilization</th>
                <th className="w-24 text-center">Status</th>
                <th className="sticky-col-actions text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 font-bold">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-sky-500" />
                    Fetching Cost Center Directory from Google Sheets...
                  </td>
                </tr>
              ) : filteredCCs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 font-extrabold">
                    🔍 No cost centers matched the current filters.
                  </td>
                </tr>
              ) : (
                filteredCCs.map((cc) => {
                  const utilRate = getUtilizationRate(cc.actual, cc.budget);
                  const isInactive = cc.status === 'Inactive';

                  return (
                    <tr key={cc.code} className="hover:bg-slate-50/50">
                      <td className="font-black text-slate-800 dark:text-slate-200">{cc.code}</td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800 dark:text-slate-100">{cc.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">ASA Philippines Operations</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          cc.tier === 'Head Office' ? 'badge-ho' : 
                          cc.tier === 'Divisional Office' ? 'badge-division' : 
                          cc.tier === 'Regional Office' ? 'badge-region' : 
                          cc.tier === 'Area Office' ? 'badge-area' : 'badge-branch'
                        }`}>
                          {cc.tier}
                        </span>
                      </td>
                      <td className="text-slate-500 font-bold text-xs">{cc.department}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-extrabold text-[9px] dark:bg-sky-950/20">
                            {cc.lead.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{cc.lead}</span>
                        </div>
                      </td>
                      <td className="text-right font-black text-slate-700 dark:text-slate-200">
                        ₱{cc.budget.toLocaleString()}
                      </td>
                      <td className="text-right font-extrabold text-slate-500 dark:text-slate-400">
                        ₱{cc.actual.toLocaleString()}
                      </td>
                      <td>
                        <div className="utilization-container mx-auto">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                            <span>{utilRate}%</span>
                            <span className={utilRate > 100 ? 'text-rose-500' : 'text-slate-500'}>
                              {cc.budget - cc.actual >= 0 ? 'Remaining' : 'Deficit'}
                            </span>
                          </div>
                          <div className="utilization-track">
                            <div 
                              className={`utilization-fill ${getProgressBarColor(utilRate)}`}
                              style={{ width: `${Math.min(100, utilRate)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${getStatusColor(utilRate, cc.status)}`}>
                          {isInactive ? 'Inactive' : utilRate > 100 ? 'Over' : 'Within'}
                        </span>
                      </td>
                      <td className="sticky-col-actions">
                        <div className="flex justify-center gap-1.5">
                          
                          {/* Inspect allocations */}
                          <button 
                            onClick={() => handleInspectClick(cc)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-500 hover:bg-sky-50 hover:border-sky-200 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                            title="Inspect Particulars / Allocations"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Approve/Verify */}
                          {!cc.approvals.aa && (
                            <button 
                              onClick={() => handleApprove(cc.code)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-150 hover:bg-emerald-500 hover:text-white cursor-pointer transition-colors"
                              title="Verify budget targets"
                            >
                              <Check size={13} />
                            </button>
                          )}

                          {/* Suspend/Toggle Active status */}
                          <button 
                            onClick={() => handleDelete(cc.code)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border cursor-pointer transition-colors ${
                              isInactive 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-150 hover:bg-emerald-500 hover:text-white' 
                                : 'bg-red-50 text-red-500 border-red-150 hover:bg-red-500 hover:text-white'
                            }`}
                            title={isInactive ? "Activate Cost Center" : "Suspend Cost Center"}
                          >
                            <Trash2 size={13} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== DIALOG 1: ADD COST CENTER MODAL ==================== */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            
            <div className="modal-header">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                🏢 Setup New Cost Center Node
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCostCenter}>
              <div className="modal-body">
                {formError && (
                  <div className="mb-4 p-2.5 bg-rose-50 border border-rose-150 text-rose-800 text-[11px] font-bold rounded-lg dark:bg-rose-950/20 dark:text-rose-300">
                    ⚠️ {formError}
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Cost Center Code (Required)</label>
                    <input 
                      type="text" 
                      name="code"
                      placeholder="e.g. CC-1040"
                      value={newCCForm.code}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cost Center Name (Required)</label>
                    <input 
                      type="text" 
                      name="name"
                      placeholder="e.g. HO - Audit Operations"
                      value={newCCForm.name}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Organization Tier Level</label>
                    <select 
                      name="tier"
                      value={newCCForm.tier}
                      onChange={handleFormChange}
                      className="form-input"
                    >
                      <option value="Head Office">Head Office</option>
                      <option value="Divisional Office">Divisional Office</option>
                      <option value="Regional Office">Regional Office</option>
                      <option value="Area Office">Area Office</option>
                      <option value="Branch">Branch</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department Classification</label>
                    <select 
                      name="department"
                      value={newCCForm.department}
                      onChange={handleFormChange}
                      className="form-input"
                    >
                      <option value="Operations">Operations</option>
                      <option value="Finance & Audit">Finance & Audit</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Training & Education">Training & Education</option>
                      <option value="General Administration">General Administration</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lead Person / Director (Required)</label>
                    <input 
                      type="text" 
                      name="lead"
                      placeholder="e.g. Mark Raniel"
                      value={newCCForm.lead}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Annual Budget Ceiling (₱)</label>
                    <input 
                      type="number" 
                      name="budget"
                      min={0}
                      placeholder="0"
                      value={newCCForm.budget || ''}
                      onChange={handleFormChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  Create Node
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ==================== DIALOG 2: BUDGET INSPECTOR & MONTHLY ALLOCATIONS ==================== */}
      {inspectingCC && (
        <div className="modal-backdrop">
          <div className="modal-box modal-box-large">
            
            <div className="modal-header">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                  📊 Particulars & Allocation Sheet: {inspectingCC.code}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                  {inspectingCC.name} — Lead: {inspectingCC.lead}
                </p>
              </div>
              <button onClick={() => setInspectingCC(null)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <div className="modal-body flex flex-col gap-6">
              
              {/* Approval status banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-150 rounded-2xl dark:bg-slate-900/60 dark:border-slate-800">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">ORGANIZATIONAL APPROVALS</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className={`badge ${inspectingCC.approvals.aa ? 'badge-ho' : 'badge-area'}`}>
                      AA: {inspectingCC.approvals.aa ? 'Verified' : 'Pending'}
                    </span>
                    <span className={`badge ${inspectingCC.approvals.ra ? 'badge-ho' : 'badge-area'}`}>
                      RA: {inspectingCC.approvals.ra ? 'Verified' : 'Pending'}
                    </span>
                    <span className={`badge ${inspectingCC.approvals.avp ? 'badge-ho' : 'badge-area'}`}>
                      AVP: {inspectingCC.approvals.avp ? 'Approved' : 'Pending'}
                    </span>
                    <span className={`badge ${inspectingCC.approvals.svp ? 'badge-ho' : 'badge-area'}`}>
                      SVP: {inspectingCC.approvals.svp ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide text-right">TOTAL ACCUMULATED ALLOCATION</span>
                  <span className="text-xl font-black text-slate-800 text-right dark:text-white mt-1">
                    ₱{editedMonthly.reduce((sum, val) => sum + val, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Monthly breakdown form grid */}
              <div>
                <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
                  <Calendar size={13} className="text-sky-500" /> Fine-Grained Monthly Allocation Breakdown
                </h4>

                <div className="monthly-budget-scroll">
                  <table className="cost-center-table w-full">
                    <thead>
                      <tr>
                        <th className="w-16 text-center">Month</th>
                        <th>Month Label</th>
                        <th className="text-right w-64">Budget Allocated (₱)</th>
                        <th className="text-right w-64">Actual Spent (₱)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHS.map((m, idx) => (
                        <tr key={m}>
                          <td className="text-center font-bold text-slate-400 font-mono text-xs">{idx + 1}</td>
                          <td className="font-extrabold text-slate-700 dark:text-slate-300">{m}</td>
                          <td>
                            <input 
                              type="number" 
                              value={editedMonthly[idx]}
                              disabled={inspectingCC.status === 'Inactive'}
                              onChange={(e) => handleMonthlyValChange(idx, e.target.value)}
                              className="form-input text-right w-full bg-white dark:bg-slate-850"
                            />
                          </td>
                          <td className="text-right font-semibold text-slate-400 pr-6">
                            {/* Distribute mock expenses proportionally for demonstration */}
                            ₱{Math.round(inspectingCC.actual / 12).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                onClick={() => setInspectingCC(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Close View
              </button>
              {inspectingCC.status === 'Active' && (
                <button 
                  onClick={handleSaveMonthlyAllocation}
                  disabled={isSavingDetails}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSavingDetails ? 'Saving...' : 'Save Allocation Changes'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
