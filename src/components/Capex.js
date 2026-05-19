'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  X, 
  ShieldCheck, 
  Calendar,
  RefreshCw
} from 'lucide-react';
import { gasPost, gasGet } from '../api/gasClient';

const INITIAL_CAPEX_DATA = [
  {
    no: 1,
    particulars: "Laptop",
    subAccount: "Office Equipment (Laptop)",
    accountTitle: "Depreciation and Amortization",
    typeOfPurchase: "Renewal",
    lastPurchased: "2019",
    staffName: "BLANCAFLOR, BENJIE B.",
    idNumber: "08363",
    designation: "BH",
    month: "February",
    qty: 1,
    unitCost: 73000,
    usefulLife: 3,
    status: "Verified"
  },
  {
    no: 2,
    particulars: "Motorcycle",
    subAccount: "Transportation Equipment (Motorcycle)",
    accountTitle: "Depreciation and Amortization",
    typeOfPurchase: "First-time",
    lastPurchased: "—",
    staffName: "RANILLE, MARK RANIEL B.",
    idNumber: "22080",
    designation: "ABH",
    month: "November",
    qty: 1,
    unitCost: 130000,
    usefulLife: 3,
    status: "Verified"
  }
];

const MONTHS_REMAINING_LOOKUP = {
  "January": 12, "February": 11, "March": 10, "April": 9,
  "May": 8, "June": 7, "July": 6, "August": 5,
  "September": 4, "October": 3, "November": 2, "December": 1
};

export default function Capex() {
  const [capexList, setCapexList] = useState(INITIAL_CAPEX_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form states for new asset entry
  const [formData, setFormData] = useState({
    particulars: '',
    subAccount: 'Office Equipment (Laptop)',
    typeOfPurchase: 'Renewal',
    lastPurchased: '',
    staffName: '',
    idNumber: '',
    designation: 'BH',
    month: 'January',
    qty: 1,
    unitCost: 0,
    usefulLife: 3
  });

  // Load from Sheets on Mount
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await gasGet('getCapex');
      if (res && res.ok && res.data && res.data.length > 0) {
        setCapexList(res.data);
      }
    } catch (err) {
      console.warn("Using fallback mock data.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save allocations live to Google Sheets
  const saveToSheets = async (updatedList) => {
    setSaving(true);
    try {
      await gasPost({
        action: 'saveCapex',
        data: updatedList || capexList
      });
      setMessage('✨ CAPEX modifications synced to Google Sheets successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (e) {
      console.warn(e);
    } finally {
      setSaving(false);
    }
  };

  // Calculate dynamic outputs for a single Capex row
  const calculateRowMetrics = (row) => {
    const totalCost = row.qty * row.unitCost;
    const monthlyDep = totalCost / (row.usefulLife * 12);
    const remMonths = MONTHS_REMAINING_LOOKUP[row.month] || 12;
    const depreciation = monthlyDep * remMonths;

    return {
      totalCost,
      monthlyDep,
      depreciation,
      totalBudget: totalCost
    };
  };

  // Aggregated summaries
  const totals = capexList.reduce((acc, row) => {
    const metrics = calculateRowMetrics(row);
    acc.totalBudget += metrics.totalBudget;
    acc.depreciation += metrics.depreciation;
    acc.monthlyDep += metrics.monthlyDep;
    if (row.status !== 'Verified') {
      acc.unverifiedCount += 1;
    }
    return acc;
  }, { totalBudget: 0, depreciation: 0, monthlyDep: 0, unverifiedCount: 0 });

  // Handle verify status toggle
  const toggleVerification = (no) => {
    const updated = capexList.map(row => {
      if (row.no === no) {
        return { ...row, status: row.status === 'Verified' ? 'Pending' : 'Verified' };
      }
      return row;
    });
    setCapexList(updated);
    saveToSheets(updated);
  };

  // Delete a CAPEX line item
  const deleteItem = (no) => {
    const updated = capexList.filter(row => row.no !== no);
    setCapexList(updated);
    saveToSheets(updated);
  };

  // Submit asset registration form
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const nextNo = capexList.length > 0 ? Math.max(...capexList.map(r => r.no)) + 1 : 1;
    const newEntry = {
      ...formData,
      no: nextNo,
      qty: Number(formData.qty),
      unitCost: Number(formData.unitCost),
      usefulLife: Number(formData.usefulLife),
      status: 'Pending'
    };

    const updated = [...capexList, newEntry];
    setCapexList(updated);
    saveToSheets(updated);
    setIsModalOpen(false);
    
    // Reset form
    setFormData({
      particulars: '',
      subAccount: 'Office Equipment (Laptop)',
      typeOfPurchase: 'Renewal',
      lastPurchased: '',
      staffName: '',
      idNumber: '',
      designation: 'BH',
      month: 'January',
      qty: 1,
      unitCost: 0,
      usefulLife: 3
    });
  };

  const filteredCapex = capexList.filter(row => 
    row.particulars.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.idNumber.includes(searchQuery)
  );

  return (
    <div className="capex-container p-6">
      
      {/* Header action panel */}
      <div className="capex-header">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            ⚙️ Details of Capital Expenditures (CAPEX)
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            Branch Asset Procurement Registrations & Depreciation Schedules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Sheet
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Plus size={14} /> New CAPEX Request
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300">
          {message}
        </div>
      )}

      {/* ==================== SUMMARY KPI STATS ==================== */}
      <div className="capex-grid-stats">
        
        <div className="capex-stat-card capex-card-primary">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">2026 Total CAPEX Budget</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-slate-800 dark:text-white">₱{totals.totalBudget.toLocaleString()}</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-2">Active Asset Registry Allocation</span>
        </div>

        <div className="capex-stat-card capex-card-warning">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Unverified Requests</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-slate-800 dark:text-white">{totals.unverifiedCount}</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-2">Awaiting supervisor check</span>
        </div>

        <div className="capex-stat-card capex-card-info">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Monthly Depreciation Impact</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-slate-800 dark:text-white">₱{totals.monthlyDep.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-2">Monthly P&L Allocation</span>
        </div>

        <div className="capex-stat-card capex-card-success">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Cumulative 2026 Depreciation</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-slate-800 dark:text-white">₱{totals.depreciation.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-2">Total remaining 2026 impact</span>
        </div>

      </div>

      {/* ==================== FILTERS BAR ==================== */}
      <div className="expense-filter-bar mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search particulars, planning staff, ID number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none focus:border-sky-500 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Calendar size={14} />
          <span>Procurements target year: 2026</span>
        </div>
      </div>

      {/* ==================== DATAGRID SPREADSHEET VIEW ==================== */}
      <div className="capex-table-card">
        <div className="capex-table-wrapper">
          <table className="capex-table">
            <thead>
              <tr>
                <th className="w-12 text-center">No.</th>
                <th>Asset Particulars</th>
                <th>Sub-Account Category</th>
                <th>Type of Purchase</th>
                <th>Staff Planning to Buy</th>
                <th>ID Number</th>
                <th>Desig.</th>
                <th>Month</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Unit Cost</th>
                <th className="text-right">Total Cost</th>
                <th className="text-center">Useful Life</th>
                <th className="text-right">2026 Depreciation</th>
                <th className="text-right">Monthly Dep.</th>
                <th className="text-center">Verification</th>
                <th className="text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCapex.map(row => {
                const metrics = calculateRowMetrics(row);

                return (
                  <tr key={row.no}>
                    <td className="text-center text-slate-400 font-mono text-xs">{row.no}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 dark:text-slate-100">{row.particulars}</span>
                      </div>
                    </td>
                    <td className="text-slate-500 text-xs font-bold">{row.subAccount}</td>
                    <td>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {row.typeOfPurchase}
                      </span>
                    </td>
                    <td>{row.staffName}</td>
                    <td className="font-mono text-xs font-bold text-slate-400">{row.idNumber}</td>
                    <td>
                      <span className="font-extrabold text-xs text-sky-600">{row.designation}</span>
                    </td>
                    <td className="text-xs font-black text-slate-700 dark:text-slate-300">{row.month}</td>
                    <td className="text-center">{row.qty}</td>
                    <td className="text-right font-black">₱{row.unitCost.toLocaleString()}</td>
                    <td className="text-right font-black text-slate-800 dark:text-slate-100">
                      ₱{metrics.totalCost.toLocaleString()}
                    </td>
                    <td className="text-center font-mono">{row.usefulLife} yrs</td>
                    <td className="text-right text-emerald-600 font-black">
                      ₱{metrics.depreciation.toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </td>
                    <td className="text-right text-emerald-600 font-bold">
                      ₱{metrics.monthlyDep.toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </td>
                    <td className="text-center">
                      <span className={`capex-status-badge ${row.status === 'Verified' ? 'capex-status-verified' : 'capex-status-pending'}`}>
                        {row.status === 'Verified' ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="capex-actions-row justify-center">
                        <button 
                          onClick={() => toggleVerification(row.no)}
                          className="capex-verify-btn"
                          title="Verify / Toggle check"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => deleteItem(row.no)}
                          className="capex-delete-btn"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== CREATE REQUEST ENTRY MODAL ==================== */}
      {isModalOpen && (
        <div className="capex-modal-overlay">
          <div className="capex-modal">
            
            <div className="capex-modal-header">
              <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                ⚙️ Add Capital Expenditures Request
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="capex-modal-body space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Asset Particulars</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.particulars}
                      onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                      placeholder="e.g. Printer, Vault"
                      className="capex-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Sub-Account Category</label>
                    <select 
                      value={formData.subAccount}
                      onChange={(e) => setFormData({ ...formData, subAccount: e.target.value })}
                      className="capex-input"
                    >
                      <option value="Office Equipment (Laptop)">Office Equipment (Laptop)</option>
                      <option value="Transportation Equipment (Motorcycle)">Transportation Equipment (Motorcycle)</option>
                      <option value="Furniture and Fixtures">Furniture and Fixtures</option>
                      <option value="Office Equipment">Office Equipment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Type of Purchase</label>
                    <select 
                      value={formData.typeOfPurchase}
                      onChange={(e) => setFormData({ ...formData, typeOfPurchase: e.target.value })}
                      className="capex-input"
                    >
                      <option value="Renewal">Renewal</option>
                      <option value="First-time">First-time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Date of Last Purchased (Year)</label>
                    <input 
                      type="text" 
                      value={formData.lastPurchased}
                      onChange={(e) => setFormData({ ...formData, lastPurchased: e.target.value })}
                      placeholder="e.g. 2019 or —"
                      className="capex-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Planning Staff Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.staffName}
                      onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                      placeholder="e.g. Dela Cruz, Juan A."
                      className="capex-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">ID Number (5 digits)</label>
                    <input 
                      type="text" 
                      required 
                      maxLength={5}
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      placeholder="12345"
                      className="capex-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Designation</label>
                    <select 
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="capex-input"
                    >
                      <option value="BH">BH</option>
                      <option value="ABH">ABH</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Target Purchase Month</label>
                    <select 
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="capex-input"
                    >
                      {Object.keys(MONTHS_REMAINING_LOOKUP).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Useful Life (Years)</label>
                    <input 
                      type="number" 
                      required 
                      min={1}
                      value={formData.usefulLife}
                      onChange={(e) => setFormData({ ...formData, usefulLife: e.target.value })}
                      className="capex-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Quantity</label>
                    <input 
                      type="number" 
                      required 
                      min={1}
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                      className="capex-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Unit Cost (₱)</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                      className="capex-input"
                    />
                  </div>
                </div>

              </div>

              <div className="capex-modal-footer">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
