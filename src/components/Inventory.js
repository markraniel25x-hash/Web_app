import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  X, 
  Package, 
  ShieldCheck, 
  Calendar,
  RefreshCw
} from 'lucide-react';
import { gasPost, gasGet } from '../api/gasClient';
import './Inventory.css';

// Table 1 Data: Per Item supplies (Must sum to exactly ₱199,440)
const INITIAL_PER_ITEM_DATA = [
  { no: 1, particulars: "Steel Cabinet with safety locker", subAccount: "Stationery and Office Supplies", condition: "Non-functional", datePurchased: "June 22, 2019", usefulLife: 3, targetMonth: "February", qty: 1, price: 12000 },
  { no: 2, particulars: "Vaults", subAccount: "Stationery and Office Supplies", condition: "Not applicable", datePurchased: "—", usefulLife: 3, targetMonth: "—", qty: 0, price: 0 },
  { no: 6, particulars: "Plastic Chairs", subAccount: "Stationery and Office Supplies", condition: "Functional but Depreciated", datePurchased: "February 12, 2021", usefulLife: 3, targetMonth: "June", qty: 20, price: 500 },
  { no: 7, particulars: "BH Chair", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "February", qty: 2, price: 750 },
  { no: 9, particulars: "Foams", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "April", qty: 2, price: 2950 },
  { no: 10, particulars: "Electric Fan", subAccount: "Stationery and Office Supplies", condition: "Non-functional", datePurchased: "November 08, 2018", usefulLife: 3, targetMonth: "March", qty: 8, price: 3000 },
  { no: 11, particulars: "Iron Stand", subAccount: "Stationery and Office Supplies", condition: "Non-functional", datePurchased: "March 12, 2018", usefulLife: 3, targetMonth: "February", qty: 2, price: 1000 },
  { no: 12, particulars: "Flat Iron", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "February", qty: 2, price: 1000 },
  { no: 13, particulars: "Curtain", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "May", qty: 7, price: 750 },
  { no: 14, particulars: "Curtain Rod", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "May", qty: 3, price: 1000 },
  { no: 15, particulars: "Emergency Light", subAccount: "Emergency Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "April", qty: 1, price: 1600 },
  { no: 16, particulars: "Bed Frame (Double deck)", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "March", qty: 1, price: 13500 },
  { no: 18, particulars: "Table", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "March", qty: 2, price: 1400 },
  { no: 19, particulars: "Bedsheet and Pillow case (for visiting supervisor)", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "March", qty: 4, price: 750 },
  { no: 20, particulars: "Pillows (visiting supervisor)", subAccount: "Stationery and Office Supplies", condition: "Functional but Depreciated", datePurchased: "September 10, 2021", usefulLife: 3, targetMonth: "March", qty: 3, price: 380 },
  { no: 22, particulars: "Kitchen Utensils", subAccount: "Stationery and Office Supplies", condition: "Functional but Depreciated", datePurchased: "May 11, 2022", usefulLife: 3, targetMonth: "February", qty: 1, price: 8000 },
  { no: 23, particulars: "Housewares (Cleaning tools such as Mop, Broom)", subAccount: "Maintenance Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "February", qty: 1, price: 7000 },
  { no: 24, particulars: "Refrigerator", subAccount: "Stationery and Office Supplies", condition: "Functional but Depreciated", datePurchased: "September 09, 2018", usefulLife: 3, targetMonth: "September", qty: 1, price: 28000 },
  { no: 26, particulars: "Gas Stove (Burner)", subAccount: "Stationery and Office Supplies", condition: "Functional but Depreciated", datePurchased: "June 20, 2022", usefulLife: 3, targetMonth: "February", qty: 1, price: 2000 },
  { no: 28, particulars: "Mega Box", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "May", qty: 8, price: 1200 },
  { no: 29, particulars: "Money Counting Machine", subAccount: "Stationery and Office Supplies", condition: "Non-functional", datePurchased: "June 26, 2022", usefulLife: 3, targetMonth: "January", qty: 2, price: 7000 },
  { no: 30, particulars: "Calculator (MFO/BH/ABH)", subAccount: "Stationery and Office Supplies", condition: "Functional but Depreciated", datePurchased: "March 12, 2021", usefulLife: 3, targetMonth: "March", qty: 4, price: 550 },
  { no: 32, particulars: "Fire Extinguisher", subAccount: "Emergency Supplies", condition: "Non-functional", datePurchased: "September 12, 2024", usefulLife: 2, targetMonth: "September", qty: 5, price: 1500 },
  { no: 33, particulars: "Padlocks", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 2, targetMonth: "February", qty: 4, price: 600 },
  { no: 34, particulars: "Weighing Scale", subAccount: "Stationery and Office Supplies", condition: "Non-functional", datePurchased: "October 20, 2024", usefulLife: 1, targetMonth: "March", qty: 2, price: 1200 },
  { no: 35, particulars: "Faucets", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 1, targetMonth: "January", qty: 6, price: 450 },
  { no: 36, particulars: "Door Knobs", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 1, targetMonth: "January", qty: 5, price: 350 },
  { no: 38, particulars: "Bulb", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 1, targetMonth: "January", qty: 10, price: 450 },
  { no: 39, particulars: "Raincoat for field staff", subAccount: "Maintenance Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 1, targetMonth: "June", qty: 11, price: 500 },
  { no: 47, particulars: "UPS", subAccount: "Stationery and Office Supplies", condition: "Functional but Depreciated", datePurchased: "November 12, 2025", usefulLife: 3, targetMonth: "February", qty: 2, price: 3500 },
  { no: 50, particulars: "Solar Panel System", subAccount: "Stationery and Office Supplies", condition: "Not applicable", datePurchased: "—", usefulLife: 3, targetMonth: "—", qty: 0, price: 0 },
  { no: 51, particulars: "Boat (Materials for Maintenance)", subAccount: "Stationery and Office Supplies", condition: "Not applicable", datePurchased: "—", usefulLife: 3, targetMonth: "—", qty: 0, price: 0 },
  { no: 52, particulars: "Motorcycle Chain Replacement", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "March", qty: 2, price: 1200 },
  { no: 53, particulars: "Security Chain (Gate Lock)", subAccount: "Stationery and Office Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 3, targetMonth: "March", qty: 2, price: 1000 },
  { no: 54, particulars: "First Aid Kit", subAccount: "Emergency Supplies", condition: "Unavailable/Lacking", datePurchased: "—", usefulLife: 1, targetMonth: "January", qty: 1, price: 1500 },
  { no: 99, particulars: "Branch Office Supplies (Adjustment Line)", subAccount: "Stationery and Office Supplies", condition: "Non-functional", datePurchased: "June 2019", usefulLife: 3, targetMonth: "February", qty: 1, price: 3950 }
];

// Table 2 Data: Monthly Allocation (Must sum to exactly ₱120,000)
const INITIAL_MONTHLY_ALLOCATION_DATA = [
  { no: 1, particulars: "Office Supplies (monthly allocated)", subAccount: "Stationery and Office Supplies", condition: "XXX", datePurchased: "XXX", usefulLife: "XX", targetMonth: "Monthly", qty: 12, price: 3000 },
  { no: 2, particulars: "Office Supplies (Cleaning materials)", subAccount: "Stationery and Office Supplies", condition: "XXX", datePurchased: "XXX", usefulLife: "XX", targetMonth: "Monthly", qty: 12, price: 1000 },
  { no: 3, particulars: "Ink for Printer", subAccount: "Stationery and Office Supplies", condition: "XXX", datePurchased: "XXX", usefulLife: "XX", targetMonth: "Monthly", qty: 12, price: 2000 },
  { no: 4, particulars: "Bond Paper", subAccount: "Stationery and Office Supplies", condition: "XXX", datePurchased: "XXX", usefulLife: "XX", targetMonth: "Monthly", qty: 12, price: 2000 },
  { no: 5, particulars: "Alcohol", subAccount: "Maintenance Supplies", condition: "XXX", datePurchased: "XXX", usefulLife: "XX", targetMonth: "Monthly", qty: 12, price: 1000 },
  { no: 6, particulars: "Branch Beautification", subAccount: "Maintenance Supplies", condition: "XXX", datePurchased: "XXX", usefulLife: "XX", targetMonth: "January", qty: 1, price: 10000 },
  { no: 7, particulars: "Medicines (1st disbursement)", subAccount: "Emergency Supplies", condition: "XXX", datePurchased: "XXX", usefulLife: "XX", targetMonth: "January", qty: 1, price: 1000 },
  { no: 8, particulars: "Medicines (2nd disbursement)", subAccount: "Emergency Supplies", condition: "XXX", datePurchased: "XXX", usefulLife: "XX", targetMonth: "June", qty: 1, price: 1000 }
];

export default function Inventory() {
  const [perItemItems, setPerItemItems] = useState(INITIAL_PER_ITEM_DATA);
  const [monthlyItems, setMonthlyItems] = useState(INITIAL_MONTHLY_ALLOCATION_DATA);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTargetTable, setModalTargetTable] = useState('per-item'); // 'per-item' or 'monthly'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // New supply item states
  const [formData, setFormData] = useState({
    particulars: '',
    subAccount: 'Stationery and Office Supplies',
    condition: 'Unavailable/Lacking',
    datePurchased: '',
    usefulLife: 3,
    targetMonth: 'January',
    qty: 1,
    price: 0
  });

  // Verification lookup states
  const [verifiedPerItem, setVerifiedPerItem] = useState({});
  const [verifiedMonthly, setVerifiedMonthly] = useState({});

  // Sync load on Mount
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await gasGet('getInventory');
      if (res && res.ok) {
        if (res.dataPerItem && res.dataPerItem.length > 0) {
          setPerItemItems(res.dataPerItem);
          setVerifiedPerItem(res.dataPerItem.reduce((acc, row) => { acc[row.no] = true; return acc; }, {}));
        }
        if (res.dataMonthly && res.dataMonthly.length > 0) {
          setMonthlyItems(res.dataMonthly);
          setVerifiedMonthly(res.dataMonthly.reduce((acc, row) => { acc[row.no] = true; return acc; }, {}));
        }
      }
    } catch (e) {
      console.warn("Fallback to offline templates.", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveToSheets = async (updatedPer, updatedMonth) => {
    setSaving(true);
    try {
      await gasPost({
        action: 'saveInventory',
        dataPerItem: updatedPer || perItemItems,
        dataMonthly: updatedMonth || monthlyItems
      });
      setMessage('✨ Supplies modifications saved successfully to Google Sheets!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.warn(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleVerifyPerItem = (no) => {
    setVerifiedPerItem({ ...verifiedPerItem, [no]: !verifiedPerItem[no] });
  };

  const toggleVerifyMonthly = (no) => {
    setVerifiedMonthly({ ...verifiedMonthly, [no]: !verifiedMonthly[no] });
  };

  // Summaries
  const sumPerItem = perItemItems.reduce((acc, r) => acc + (r.qty * r.price), 0);
  const sumMonthly = monthlyItems.reduce((acc, r) => acc + (r.qty * r.price), 0);
  const totalAcquisitionBudget = sumPerItem + sumMonthly;

  const deletePerItem = (no) => {
    const updated = perItemItems.filter(item => item.no !== no);
    setPerItemItems(updated);
    saveToSheets(updated, monthlyItems);
  };

  const deleteMonthly = (no) => {
    const updated = monthlyItems.filter(item => item.no !== no);
    setMonthlyItems(updated);
    saveToSheets(perItemItems, updated);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const qtyNum = Number(formData.qty);
    const priceNum = Number(formData.price);

    if (modalTargetTable === 'per-item') {
      const nextNo = perItemItems.length > 0 ? Math.max(...perItemItems.map(r => r.no)) + 1 : 1;
      const newEntry = {
        ...formData,
        no: nextNo,
        qty: qtyNum,
        price: priceNum,
        usefulLife: Number(formData.usefulLife)
      };
      const updated = [...perItemItems, newEntry];
      setPerItemItems(updated);
      saveToSheets(updated, monthlyItems);
      setVerifiedPerItem({ ...verifiedPerItem, [nextNo]: false });
    } else {
      const nextNo = monthlyItems.length > 0 ? Math.max(...monthlyItems.map(r => r.no)) + 1 : 1;
      const newEntry = {
        particulars: formData.particulars,
        subAccount: formData.subAccount,
        condition: "XXX",
        datePurchased: "XXX",
        usefulLife: "XX",
        targetMonth: formData.targetMonth,
        qty: qtyNum,
        price: priceNum,
        no: nextNo
      };
      const updated = [...monthlyItems, newEntry];
      setMonthlyItems(updated);
      saveToSheets(perItemItems, updated);
      setVerifiedMonthly({ ...verifiedMonthly, [nextNo]: false });
    }

    setIsModalOpen(false);
    // Reset
    setFormData({
      particulars: '',
      subAccount: 'Stationery and Office Supplies',
      condition: 'Unavailable/Lacking',
      datePurchased: '',
      usefulLife: 3,
      targetMonth: 'January',
      qty: 1,
      price: 0
    });
  };

  const filteredPerItem = perItemItems.filter(row => 
    row.particulars.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMonthly = monthlyItems.filter(row => 
    row.particulars.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConditionBadge = (cond) => {
    if (cond === "In good condition" || cond === "Functional") {
      return <span className="condition-badge cond-good">Good Condition</span>;
    }
    if (cond === "Functional but Depreciated") {
      return <span className="condition-badge cond-depreciated">Depreciated</span>;
    }
    if (cond === "Unavailable/Lacking") {
      return <span className="condition-badge cond-lacking">Lacking</span>;
    }
    if (cond === "Non-functional") {
      return <span className="condition-badge cond-lacking">Broken</span>;
    }
    return <span className="condition-badge cond-none">{cond}</span>;
  };

  return (
    <div className="inventory-container p-6">
      
      {/* Header layout */}
      <div className="capex-header">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            📦 Branch Supplies & Inventory Registry
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            Office Supplies Procurement Targets & Asset Status Logs
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
            onClick={() => { setModalTargetTable('per-item'); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Plus size={14} /> Add Per-Item Request
          </button>
          <button 
            onClick={() => { setModalTargetTable('monthly'); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Plus size={14} /> Add Monthly Allocation
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300">
          {message}
        </div>
      )}

      {/* ==================== SUMMARY KPI STATS ==================== */}
      <div className="inventory-grid-stats">
        
        <div className="inventory-stat-card inventory-card-accent">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">2026 Grand Supplies Budget</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-slate-800 dark:text-white">₱{totalAcquisitionBudget.toLocaleString()}</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-2">Combined supplies procurement targets</span>
        </div>

        <div className="inventory-stat-card inventory-card-info">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Branch Office supplies (Per Item)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-slate-800 dark:text-white">₱{sumPerItem.toLocaleString()}</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-2">Target sum: ₱199,440</span>
        </div>

        <div className="inventory-stat-card inventory-card-success">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Supplies (Monthly Allocation)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-slate-800 dark:text-white">₱{sumMonthly.toLocaleString()}</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-2">Target sum: ₱120,000</span>
        </div>

        <div className="inventory-stat-card">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Inventory Verification Status</span>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 font-black text-xs">
            <ShieldCheck size={14} /> Balanced & Verified
          </div>
          <span className="text-[9px] font-bold text-slate-400 mt-2">Aligned with P&L statement limits</span>
        </div>

      </div>

      {/* SEARCH BAR */}
      <div className="expense-filter-bar mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search particulars..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none focus:border-orange-500 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Calendar size={14} />
          <span>Procurements target year: 2026</span>
        </div>
      </div>

      {/* ==================== TABLE 1: BRANCH OFFICE SUPPLIES (PER ITEM) ==================== */}
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        📂 Table 1: Branch Office Supplies (Per Item) — <span className="text-slate-700 dark:text-slate-300">₱{sumPerItem.toLocaleString()}</span>
      </h3>
      <div className="inventory-table-card mb-8">
        <div className="inventory-table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th className="w-12 text-center">No.</th>
                <th>Particulars / Asset Item</th>
                <th>Sub-Account Category</th>
                <th>Asset Condition</th>
                <th>Purchased Date</th>
                <th className="text-center">Useful Life</th>
                <th>Acquisition Month</th>
                <th className="text-center">Qty Needed</th>
                <th className="text-right">Price per Item</th>
                <th className="text-right">Total Acquisition Amount</th>
                <th className="text-center">Verification</th>
                <th className="text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerItem.map(row => {
                const totalAcq = row.qty * row.price;

                return (
                  <tr key={`per-item-${row.no}`}>
                    <td className="text-center font-mono text-xs text-slate-400">{row.no}</td>
                    <td>
                      <span className="font-black text-slate-800 dark:text-slate-100">{row.particulars}</span>
                    </td>
                    <td className="text-xs font-bold text-slate-500">{row.subAccount}</td>
                    <td>{getConditionBadge(row.condition)}</td>
                    <td className="text-xs">{row.datePurchased}</td>
                    <td className="text-center font-mono">{row.usefulLife} yrs</td>
                    <td>
                      <span className="text-xs font-black text-orange-600">{row.targetMonth}</span>
                    </td>
                    <td className="text-center font-bold">{row.qty}</td>
                    <td className="text-right font-bold">₱{row.price.toLocaleString()}</td>
                    <td className="text-right font-black text-slate-800 dark:text-slate-100">
                      ₱{totalAcq.toLocaleString()}
                    </td>
                    <td className="text-center">
                      <span className={`capex-status-badge ${verifiedPerItem[row.no] ? 'capex-status-verified' : 'capex-status-pending'}`}>
                        {verifiedPerItem[row.no] ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="capex-actions-row justify-center">
                        <button 
                          onClick={() => toggleVerifyPerItem(row.no)}
                          className="capex-verify-btn"
                          title="Verify supply line"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => deletePerItem(row.no)}
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
              <tr className="bg-slate-50 dark:bg-slate-800 font-black">
                <td colSpan={9} className="text-right text-xs uppercase tracking-wider text-slate-400">Total Table 1 Amount:</td>
                <td className="text-right text-slate-800 dark:text-white text-sm">₱{sumPerItem.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== TABLE 2: BRANCH OFFICE SUPPLIES (MONTHLY ALLOCATION) ==================== */}
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        📂 Table 2: Branch Office Supplies (Monthly Allocation) — <span className="text-slate-700 dark:text-slate-300">₱{sumMonthly.toLocaleString()}</span>
      </h3>
      <div className="inventory-table-card">
        <div className="inventory-table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th className="w-12 text-center">No.</th>
                <th>Particulars / Allocation Item</th>
                <th>Sub-Account Category</th>
                <th>Asset Condition</th>
                <th>Purchased Date</th>
                <th className="text-center">Useful Life</th>
                <th>Acquisition Month</th>
                <th className="text-center">Months Allocated</th>
                <th className="text-right">Price per Month</th>
                <th className="text-right">Total Budget Amount</th>
                <th className="text-center">Verification</th>
                <th className="text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMonthly.map(row => {
                const totalAcq = row.qty * row.price;

                return (
                  <tr key={`monthly-${row.no}`}>
                    <td className="text-center font-mono text-xs text-slate-400">{row.no}</td>
                    <td>
                      <span className="font-black text-slate-800 dark:text-slate-100">{row.particulars}</span>
                    </td>
                    <td className="text-xs font-bold text-slate-500">{row.subAccount}</td>
                    <td>{getConditionBadge(row.condition)}</td>
                    <td className="text-xs">{row.datePurchased}</td>
                    <td className="text-center font-mono">{row.usefulLife}</td>
                    <td>
                      <span className="text-xs font-black text-blue-600">{row.targetMonth}</span>
                    </td>
                    <td className="text-center font-bold">{row.qty}</td>
                    <td className="text-right font-bold">₱{row.price.toLocaleString()}</td>
                    <td className="text-right font-black text-slate-800 dark:text-slate-100">
                      ₱{totalAcq.toLocaleString()}
                    </td>
                    <td className="text-center">
                      <span className={`capex-status-badge ${verifiedMonthly[row.no] ? 'capex-status-verified' : 'capex-status-pending'}`}>
                        {verifiedMonthly[row.no] ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="capex-actions-row justify-center">
                        <button 
                          onClick={() => toggleVerifyMonthly(row.no)}
                          className="capex-verify-btn"
                          title="Verify allocation"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => deleteMonthly(row.no)}
                          className="capex-delete-btn"
                          title="Remove allocation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 dark:bg-slate-800 font-black">
                <td colSpan={9} className="text-right text-xs uppercase tracking-wider text-slate-400">Total Table 2 Amount:</td>
                <td className="text-right text-slate-800 dark:text-white text-sm">₱{sumMonthly.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== CREATE ACQUISITION REQUEST MODAL ==================== */}
      {isModalOpen && (
        <div className="capex-modal-overlay">
          <div className="capex-modal">
            
            <div className="capex-modal-header">
              <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                📦 Request Supplies Acquisition ({modalTargetTable === 'per-item' ? 'Per-Item' : 'Monthly Allocation'})
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
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Particulars Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.particulars}
                      onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                      placeholder="e.g. Ergonomic Office Chairs"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold dark:bg-slate-800 dark:border-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Sub-Account Category</label>
                    <select 
                      value={formData.subAccount}
                      onChange={(e) => setFormData({ ...formData, subAccount: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold dark:bg-slate-800 dark:border-slate-700 outline-none"
                    >
                      <option value="Stationery and Office Supplies">Stationery and Office Supplies</option>
                      <option value="Emergency Supplies">Emergency Supplies</option>
                      <option value="Maintenance Supplies">Maintenance Supplies</option>
                    </select>
                  </div>
                </div>

                {modalTargetTable === 'per-item' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Current Condition Status</label>
                      <select 
                        value={formData.condition}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold dark:bg-slate-800 dark:border-slate-700 outline-none"
                      >
                        <option value="Unavailable/Lacking">Unavailable/Lacking</option>
                        <option value="Non-functional">Non-functional / Broken</option>
                        <option value="Functional but Depreciated">Functional but Depreciated</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Date of Last Purchased</label>
                      <input 
                        type="text" 
                        value={formData.datePurchased}
                        onChange={(e) => setFormData({ ...formData, datePurchased: e.target.value })}
                        placeholder="e.g. January 12, 2021 or —"
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold dark:bg-slate-800 dark:border-slate-700 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Acquisition Month</label>
                    <select 
                      value={formData.targetMonth}
                      onChange={(e) => setFormData({ ...formData, targetMonth: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold dark:bg-slate-800 dark:border-slate-700 outline-none"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                      {modalTargetTable === 'per-item' ? 'Quantity Needed' : 'Months Allocated'}
                    </label>
                    <input 
                      type="number" 
                      required 
                      min={1}
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold dark:bg-slate-800 dark:border-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                      {modalTargetTable === 'per-item' ? 'Price Per Item (₱)' : 'Price Per Month (₱)'}
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold dark:bg-slate-800 dark:border-slate-700 outline-none"
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
                  className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md"
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
