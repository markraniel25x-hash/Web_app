import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gasPost, gasGet } from '../api/gasClient';
import { Check, X, Eye, Lock, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import './DrivenFactor.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const METRICS = [
  { id: 'clients', label: 'Clients' },
  { id: 'savings', label: 'Savings' },
  { id: 'disbursement', label: 'Loan Disbursement' },
  { id: 'collection', label: 'Loan Collection' },
  { id: 'portfolio', label: 'Loan Portfolio' },
  { id: 'gross_revenue', label: 'Gross Revenue' },
  { id: 'rebates', label: 'Rebates' },
  { id: 'net_gross', label: 'Net Gross Revenue', readonly: true },
];

export default function DrivenFactor() {
  const { user } = useAuth();
  const [consolidatedData, setConsolidatedData] = useState({});
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Time navigation state
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(0); // 0-indexed month

  const isBM = user?.role === 'BM';
  const roleUpper = user?.role?.toUpperCase();

  // Selected Branch for Timeline on main page
  const [selectedBranchCode, setSelectedBranchCode] = useState(null);

  // Track reviewed metrics for each branch code to enforce checklist completion
  const [reviewedMetrics, setReviewedMetrics] = useState({}); // { [branchCode]: { [metricId]: true } }

  // Modal State for target view/edit
  const [activeModal, setActiveModal] = useState(null); // { branchCode, branchName, metricId, metricLabel, tempMetricData, approvals }
  const [savingModal, setSavingModal] = useState(false);
  const [scriptWarning, setScriptWarning] = useState(false);

  // Hierarchy Filters States
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('All');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('All');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('All');
  const [aggregateLevel, setAggregateLevel] = useState('branch');

  // Dynamic available levels based on role
  const getAvailableAggregateLevels = () => {
    if (isBM) return [];
    if (roleUpper === 'AA') return [];
    if (roleUpper === 'RA') return ['area', 'branch'];
    if (roleUpper === 'AVP') return ['region', 'area', 'branch'];
    if (roleUpper === 'SVP') return ['division', 'region', 'area', 'branch'];
    if (roleUpper === 'ADMIN') return ['operation', 'division', 'region', 'area', 'branch'];
    return [];
  };

  const availableLevels = getAvailableAggregateLevels();

  // Auto-set the aggregate level based on supervisor roles when user loaded
  useEffect(() => {
    if (!user?.role) return;
    const r = user.role.toUpperCase();
    if (r === 'BM' || r === 'AA') setAggregateLevel('branch');
    else if (r === 'RA') setAggregateLevel('area');
    else if (r === 'AVP') setAggregateLevel('region');
    else if (r === 'SVP') setAggregateLevel('division');
    else if (r === 'ADMIN') setAggregateLevel('operation');
  }, [user]);

  // Auto-reset sub-filters when parent filters change
  useEffect(() => {
    setSelectedRegionFilter('All');
    setSelectedAreaFilter('All');
  }, [selectedDivisionFilter]);

  useEffect(() => {
    setSelectedAreaFilter('All');
  }, [selectedRegionFilter]);
  
  // Supervisor Quick approval loading state
  const [approvingDirect, setApprovingDirect] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await gasPost({ action: 'getDrivenFactor' });
      if (result.ok) {
        setConsolidatedData(result.data || {});
        setBranches(result.branches || []);
        setScriptWarning(!result.branches);
        
        if (result.branches && result.branches.length > 0) {
          // Set selectedBranchCode if not yet set or not present in new list
          setSelectedBranchCode(prev => {
            if (prev && result.branches.some(b => b.code === prev)) return prev;
            return result.branches[0].code;
          });
        }

        // Auto-select latest active month with actual data
        if (result.data) {
          const latestIdx = getLatestActiveMonthIndex(result.data);
          setSelectedMonth(latestIdx);
        }
      }
    } catch (err) {
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkFeatures = async () => {
      try {
        const featResult = await gasGet('features');
        if (featResult.ok && featResult.features) {
          const supportsReopen = featResult.features.includes('reopenBranchTarget') && featResult.features.includes('requestReopenBranchTarget');
          setScriptWarning(!supportsReopen);
        } else {
          setScriptWarning(true);
        }
      } catch (e) {
        setScriptWarning(true);
      }
    };
    
    fetchData();
    checkFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLatestActiveMonthIndex = (dataObj) => {
    if (!dataObj) return 0;
    for (let i = 11; i >= 0; i--) {
      const hasData = Object.keys(dataObj).some(metricId => {
        const actuals = dataObj[metricId]?.actuals;
        return actuals && actuals[i] > 0;
      });
      if (hasData) return i;
    }
    return 0;
  };

  const calculateTotal = (arr) => (arr || []).reduce((a, b) => a + b, 0);

  // High Performance Modal Target Changes (Saves locally inside Subcomponent, no lag!)
  const handleSaveTargets = async (localTargets) => {
    if (!activeModal) return;

    // Local validation inside modal to prevent blanks
    const hasBlankInModal = localTargets.some(
      tgt => tgt === '' || tgt === null || tgt === undefined || tgt === 0
    );
    if (hasBlankInModal && activeModal.metricId !== 'net_gross') {
      alert('Validation Error: Target values for all 12 months must be encoded and cannot be blank or zero.');
      return;
    }

    setSavingModal(true);
    try {
      const branchRecord = branches.find(b => b.code === activeModal.branchCode);
      if (!branchRecord) return;

      const updatedBranchMetrics = { ...branchRecord.metrics };
      // Sanitize input to ensure clean number storage
      const sanitizedTargets = localTargets.map(t => parseFloat(t) || 0);
      const sanitizedMetricData = {
        ...activeModal.tempMetricData,
        targets: sanitizedTargets
      };
      
      updatedBranchMetrics[activeModal.metricId] = sanitizedMetricData;

      // Recalculate net gross for branch if gross or rebates was edited
      if (activeModal.metricId === 'gross_revenue' || activeModal.metricId === 'rebates') {
        const gross = updatedBranchMetrics.gross_revenue || { targets: new Array(12).fill(0), actuals: new Array(12).fill(0) };
        const rebates = updatedBranchMetrics.rebates || { targets: new Array(12).fill(0), actuals: new Array(12).fill(0) };
        const netTgt = new Array(12).fill(0);
        const netAct = new Array(12).fill(0);
        for (let i = 0; i < 12; i++) {
          netTgt[i] = (parseFloat(gross.targets[i]) || 0) - (parseFloat(rebates.targets[i]) || 0);
          netAct[i] = (parseFloat(gross.actuals[i]) || 0) - (parseFloat(rebates.actuals[i]) || 0);
        }
        updatedBranchMetrics.net_gross = { targets: netTgt, actuals: netAct };
      }

      const result = await gasPost({
        action: 'saveDrivenFactor',
        targetBranchCode: activeModal.branchCode,
        data: updatedBranchMetrics
      });

      if (result.ok) {
        alert('Data saved and approved successfully!');
        setActiveModal(null);
        fetchData(); // Reload listings
      } else {
        alert('Approval failed: ' + result.error);
      }
    } catch (e) {
      alert('Network Error');
    } finally {
      setSavingModal(false);
    }
  };

  const openModal = (branch, metric) => {
    // If it's an aggregated row (area, region, division), open in read-only mode!
    const isReadOnly = branch.type !== 'branch';

    if (!isReadOnly) {
      // Mark this metric as reviewed for this branch code
      setReviewedMetrics(prev => {
        const branchReviews = prev[branch.code] || {};
        return {
          ...prev,
          [branch.code]: {
            ...branchReviews,
            [metric.id]: true
          }
        };
      });
    }

    const branchMetricData = branch.metrics[metric.id] || { targets: new Array(12).fill(0), actuals: new Array(12).fill(0) };
    setActiveModal({
      branchCode: branch.code,
      branchName: branch.type === 'branch' ? branch.name : `${branch.branchesCount} Branches Rollup`,
      metricId: metric.id,
      metricLabel: metric.label,
      approvals: branch.approvals || {},
      isReadOnly: isReadOnly,
      tempMetricData: JSON.parse(JSON.stringify(branchMetricData)) // deep clone
    });
  };

  // Compute dynamic hierarchy selector options based on fetched branches list
  const uniqueDivisions = ['All', ...new Set(branches.map(b => b.division).filter(Boolean))].sort();
  const uniqueRegions = ['All', ...new Set(
    branches
      .filter(b => selectedDivisionFilter === 'All' || b.division === selectedDivisionFilter)
      .map(b => b.region)
      .filter(Boolean)
  )].sort();
  const uniqueAreas = ['All', ...new Set(
    branches
      .filter(b => selectedDivisionFilter === 'All' || b.division === selectedDivisionFilter)
      .filter(b => selectedRegionFilter === 'All' || b.region === selectedRegionFilter)
      .map(b => b.area)
      .filter(Boolean)
  )].sort();

  const showDivisionDropdown = roleUpper === 'ADMIN' || roleUpper === 'SVP';
  const showRegionDropdown = roleUpper === 'ADMIN' || roleUpper === 'SVP' || roleUpper === 'AVP';
  const showAreaDropdown = roleUpper === 'ADMIN' || roleUpper === 'SVP' || roleUpper === 'AVP' || roleUpper === 'RA';

  // 1. First apply BM lock filtering if applicable
  let filteredBranches = branches;
  if (isBM && user?.scopeCode) {
    const scopeBranchCode = user.scopeCode.split(' - ')[0].trim().toLowerCase();
    filteredBranches = branches.filter(b => b.code.toLowerCase() === scopeBranchCode);
  } else {
    // 2. Otherwise apply hierarchy dropdown selections
    if (selectedDivisionFilter !== 'All') {
      filteredBranches = filteredBranches.filter(b => b.division === selectedDivisionFilter);
    }
    if (selectedRegionFilter !== 'All') {
      filteredBranches = filteredBranches.filter(b => b.region === selectedRegionFilter);
    }
    if (selectedAreaFilter !== 'All') {
      filteredBranches = filteredBranches.filter(b => b.area === selectedAreaFilter);
    }
  }

  const displayedBranches = filteredBranches;

  const displayLevel = aggregateLevel;

  const getAggregatedRows = () => {
    // Start with all branches matching base constraints (BM filter)
    let base = branches;
    if (isBM && user?.scopeCode) {
      const scopeBranchCode = user.scopeCode.split(' - ')[0].trim().toLowerCase();
      base = branches.filter(b => b.code.toLowerCase() === scopeBranchCode);
    }

    if (displayLevel === 'branch') {
      // Filter branches standardly by selectors
      let filtered = base;
      if (selectedDivisionFilter !== 'All') filtered = filtered.filter(b => b.division === selectedDivisionFilter);
      if (selectedRegionFilter !== 'All') filtered = filtered.filter(b => b.region === selectedRegionFilter);
      if (selectedAreaFilter !== 'All') filtered = filtered.filter(b => b.area === selectedAreaFilter);
      return filtered.map(b => ({
        type: 'branch',
        id: b.code,
        code: b.code,
        name: b.name,
        area: b.area,
        region: b.region,
        division: b.division,
        group: b.group,
        approvals: b.approvals || {},
        metrics: b.metrics
      }));
    }

    // Otherwise, we group by target level (area, region, division, operation)
    let parentFiltered = base;
    if (displayLevel === 'area') {
      if (selectedDivisionFilter !== 'All') parentFiltered = parentFiltered.filter(b => b.division === selectedDivisionFilter);
      if (selectedRegionFilter !== 'All') parentFiltered = parentFiltered.filter(b => b.region === selectedRegionFilter);
    } else if (displayLevel === 'region') {
      if (selectedDivisionFilter !== 'All') parentFiltered = parentFiltered.filter(b => b.division === selectedDivisionFilter);
    }

    const groups = {};
    parentFiltered.forEach(b => {
      let groupKey = '';
      if (displayLevel === 'area') groupKey = b.area;
      else if (displayLevel === 'region') groupKey = b.region;
      else if (displayLevel === 'division') groupKey = b.division;
      else if (displayLevel === 'operation') groupKey = b.group;

      if (!groupKey) return;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          type: displayLevel,
          id: groupKey,
          code: groupKey,
          name: groupKey,
          branchesCount: 0,
          rawApprovals: { aa: [], ra: [], avp: [], svp: [], reopenRequested: [] },
          metrics: {}
        };
        METRICS.forEach(m => {
          groups[groupKey].metrics[m.id] = {
            targets: new Array(12).fill(0),
            actuals: new Array(12).fill(0)
          };
        });
      }

      const g = groups[groupKey];
      g.branchesCount++;

      // Track individual branch approvals
      if (b.approvals) {
        g.rawApprovals.aa.push(b.approvals.aa);
        g.rawApprovals.ra.push(b.approvals.ra);
        g.rawApprovals.avp.push(b.approvals.avp);
        g.rawApprovals.svp.push(b.approvals.svp);
        g.rawApprovals.reopenRequested.push(b.approvals.reopenRequested);
      }
      
      // Sum metrics
      METRICS.forEach(m => {
        const bMetric = b.metrics[m.id];
        if (bMetric) {
          for (let i = 0; i < 12; i++) {
            g.metrics[m.id].targets[i] += parseFloat(bMetric.targets[i]) || 0;
            g.metrics[m.id].actuals[i] += parseFloat(bMetric.actuals[i]) || 0;
          }
        }
      });
    });

    // Aggregate approvals: a group is approved if ALL branches under it are approved
    Object.values(groups).forEach(g => {
      g.approvals = {
        aa: g.rawApprovals.aa.every(Boolean) ? (g.rawApprovals.aa[0] || "Approved") : "",
        ra: g.rawApprovals.ra.every(Boolean) ? (g.rawApprovals.ra[0] || "Approved") : "",
        avp: g.rawApprovals.avp.every(Boolean) ? (g.rawApprovals.avp[0] || "Approved") : "",
        svp: g.rawApprovals.svp.every(Boolean) ? (g.rawApprovals.svp[0] || "Approved") : "",
        reopenRequested: g.rawApprovals.reopenRequested.some(Boolean) ? "Requested" : ""
      };
      delete g.rawApprovals;
    });

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  };

  const gridRows = getAggregatedRows();

  const selectedBranchObj = displayedBranches.find(b => b.code === selectedBranchCode) || displayedBranches[0];
  const timelineApprovals = selectedBranchObj?.approvals || {};

  // Check if supervisor's role is pending approval for the currently monitored branch
  const userRoleLower = user?.role?.toLowerCase();
  const isSupervisor = ['aa', 'ra', 'avp', 'svp'].includes(userRoleLower);
  const showDirectApproveBtn = selectedBranchObj && isSupervisor && !timelineApprovals[userRoleLower];

  // Target encoding validation check: check if any months are blank/zero for non-calculated metrics
  const checkBlankTargets = (branch) => {
    if (!branch || !branch.metrics) return { hasBlank: true, missingCount: 12 * 7 };
    let missingCount = 0;
    METRICS.forEach(metric => {
      if (metric.id === 'net_gross') return; // skip net_gross (it's calculated)
      const mData = branch.metrics[metric.id];
      if (!mData || !mData.targets) {
        missingCount += 12;
        return;
      }
      for (let i = 0; i < 12; i++) {
        const tgt = mData.targets[i];
        if (tgt === '' || tgt === null || tgt === undefined || tgt === 0) {
          missingCount++;
        }
      }
    });
    return {
      hasBlank: missingCount > 0,
      missingCount
    };
  };

  const targetValidation = checkBlankTargets(selectedBranchObj);
  const isTargetFullyEncoded = !targetValidation.hasBlank;

  // Checklist verification calculations
  const branchReviews = reviewedMetrics[selectedBranchObj?.code] || {};
  const reviewedCount = METRICS.filter(m => branchReviews[m.id]).length;
  const allMetricsReviewed = reviewedCount === METRICS.length;

  // Fully ready to approve only if:
  // 1. All metrics are reviewed
  // 2. All target fields are fully encoded (no months blank or zero)
  const isReadyToApprove = allMetricsReviewed && isTargetFullyEncoded;

  const handleDirectApprove = async () => {
    if (!selectedBranchObj) return;
    if (!isReadyToApprove) {
      if (!allMetricsReviewed) {
        alert(`Please review all ${METRICS.length} KPI metrics (click the Eye 👁️ button for each) before signing off.`);
      } else {
        alert(`Validation Error: This branch has ${targetValidation.missingCount} target cells that are blank or zero. All target values must be encoded for all 12 months before approving.`);
      }
      return;
    }
    
    setApprovingDirect(true);
    try {
      const result = await gasPost({
        action: 'saveDrivenFactor',
        targetBranchCode: selectedBranchObj.code,
        data: selectedBranchObj.metrics // Keep current targets/actuals exactly as they are, just trigger approval stamp
      });
      if (result.ok) {
        alert(`Successfully reviewed and approved branch budget as ${user.role}!`);
        fetchData();
      } else {
        alert('Approval signature failed: ' + result.error);
      }
    } catch (err) {
      alert('Network Error');
    } finally {
      setApprovingDirect(false);
    }
  };

  // Row-level inline Action handlers for "Approve" and "Re-open"
  const handleRowApprove = async (branch) => {
    if (branch.type === 'branch') {
      const rowValidation = checkBlankTargets(branch);
      if (rowValidation.hasBlank) {
        alert(`Validation Error: ${branch.name} has ${rowValidation.missingCount} blank or zero target cells. All months must be encoded first!`);
        return;
      }
    }

    const levelLabel = branch.type === 'branch' ? 'branch' : branch.type.toUpperCase();
    if (!window.confirm(`Are you sure you want to approve the budget targets for ${levelLabel} "${branch.name}" as ${user.role}?`)) return;

    setLoading(true);
    try {
      const result = await gasPost({
        action: 'saveDrivenFactor',
        targetBranchCode: branch.code,
        level: branch.type,
        data: branch.type === 'branch' ? branch.metrics : null
      });
      if (result.ok) {
        alert(`Successfully signed off and approved ${levelLabel} "${branch.name}"!`);
        fetchData();
      } else {
        alert('Approval failed: ' + result.error);
      }
    } catch (e) {
      alert('Network Error');
    } finally {
      setLoading(false);
    }
  };

  const handleRowReopen = async (branch) => {
    const levelLabel = branch.type === 'branch' ? 'branch' : branch.type.toUpperCase();
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to RE-OPEN / RE-TARGET ${levelLabel} "${branch.name}"?\n\nThis will keep all target numbers completely intact, but will reset and clear all supervisor approvals (AA, RA, AVP, SVP) so targets can be edited or reviewed again.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await gasPost({
        action: 'reopenBranchTarget',
        targetBranchCode: branch.code,
        level: branch.type
      });
      if (result.ok) {
        alert(`Successfully re-opened ${levelLabel} "${branch.name}" for target modifications!`);
        fetchData();
      } else {
        alert('Re-open failed: ' + result.error);
      }
    } catch (e) {
      alert('Network Error');
    } finally {
      setLoading(false);
    }
  };

  const handleBMRequestReopen = async (branch) => {
    if (!window.confirm(`Are you sure you want to request a target re-open for ${branch.name}?\n\nThis will send a notification to your Area Accountant (AA) to clear the approvals so you can edit targets again.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await gasPost({
        action: 'requestReopenBranchTarget',
        targetBranchCode: branch.code
      });
      if (result.ok) {
        alert('Re-open request successfully submitted to your Area Accountant (AA)!');
        fetchData();
      } else {
        alert('Request failed: ' + result.error);
      }
    } catch (e) {
      alert('Network Error');
    } finally {
      setLoading(false);
    }
  };

  const canIActionThisRow = (branch) => {
    if (roleUpper === 'ADMIN') return true;
    
    const branchType = branch.type; // 'branch', 'area', 'region', 'division', 'operation'
    
    if (roleUpper === 'SVP') {
      return ['division', 'region', 'area', 'branch'].includes(branchType);
    }
    if (roleUpper === 'AVP') {
      return ['region', 'area', 'branch'].includes(branchType);
    }
    if (roleUpper === 'RA') {
      return ['area', 'branch'].includes(branchType);
    }
    if (roleUpper === 'AA') {
      return ['branch'].includes(branchType);
    }
    return false;
  };

  const showActionsCol = (isSupervisor || isBM || roleUpper === 'ADMIN');

  // Calculate sum of actuals and differences for the bottom Total row
  const getMetricTotalValues = (metricId) => {
    let totalAct = 0;
    let totalTgt = 0;
    const isSnapshot = ['clients', 'savings', 'portfolio'].includes(metricId);

    displayedBranches.forEach(branch => {
      const mData = branch.metrics[metricId] || { targets: [], actuals: [] };
      if (viewMode === 'monthly') {
        totalAct += mData.actuals[selectedMonth] || 0;
        totalTgt += mData.targets[selectedMonth] || 0;
      } else {
        if (isSnapshot) {
          const latestIdx = getLatestActiveMonthIndex(consolidatedData);
          totalAct += mData.actuals[latestIdx] || 0;
          totalTgt += mData.targets[latestIdx] || 0;
        } else {
          totalAct += calculateTotal(mData.actuals);
          totalTgt += calculateTotal(mData.targets);
        }
      }
    });

    return {
      act: totalAct,
      diff: totalAct - totalTgt
    };
  };

  return (
    <div className="driven-factor-container">
      {/* HEADER SECTION */}
      <div className="tab-header">
        <div className="header-titles">
          <h2>{isBM ? 'Branch Target & Performance Entry' : 'Enterprise Performance Monitor'}</h2>
          <p>{isBM ? 'Your Branch Allocation & Targets' : `Supervising Scope: ${user?.role} — ${user?.scopeCode}`}</p>
        </div>
        
        {/* VIEW PERIOD DROPDOWNS */}
        <div className="view-selector-panel">
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            className="premium-select"
          >
            <option value="monthly">Monthly Breakdowns</option>
            <option value="yearly">Yearly Summary</option>
          </select>

          {viewMode === 'monthly' && (
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="premium-select month-select"
            >
              {MONTHS_FULL.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* HIERARCHY SCOPE FILTER BAR */}
      {!isBM && (showDivisionDropdown || showRegionDropdown || showAreaDropdown) && (
        <div className="hierarchy-filter-bar">
          <div className="filter-bar-title">
            <span className="filter-badge">Scope Filters</span>
            <p className="filter-desc">Filter branch views down through your hierarchy layers:</p>
          </div>
          <div className="filter-selectors-group">
            {availableLevels.length > 0 && (
              <div className="filter-select-wrapper">
                <label className="select-label">Viewing Level</label>
                <select
                  value={aggregateLevel}
                  onChange={(e) => setAggregateLevel(e.target.value)}
                  className="hierarchy-premium-select aggregate-select"
                  style={{ borderLeft: '3px solid #7c3aed' }}
                >
                  {availableLevels.map(lvl => {
                    let label = lvl;
                    if (lvl === 'operation') label = 'Operation (Group)';
                    else if (lvl === 'division') label = 'Division';
                    else if (lvl === 'region') label = 'Region';
                    else if (lvl === 'area') label = 'Area';
                    else if (lvl === 'branch') label = 'Branch';
                    return (
                      <option key={lvl} value={lvl}>{label}</option>
                    );
                  })}
                </select>
              </div>
            )}

            {showDivisionDropdown && (
              <div className="filter-select-wrapper">
                <label className="select-label">Division</label>
                <select
                  value={selectedDivisionFilter}
                  onChange={(e) => setSelectedDivisionFilter(e.target.value)}
                  className="hierarchy-premium-select"
                >
                  {uniqueDivisions.map(div => (
                    <option key={div} value={div}>{div === 'All' ? 'All Divisions' : div}</option>
                  ))}
                </select>
              </div>
            )}

            {showRegionDropdown && (
              <div className="filter-select-wrapper">
                <label className="select-label">Region</label>
                <select
                  value={selectedRegionFilter}
                  onChange={(e) => setSelectedRegionFilter(e.target.value)}
                  className="hierarchy-premium-select"
                >
                  {uniqueRegions.map(reg => (
                    <option key={reg} value={reg}>{reg === 'All' ? 'All Regions' : reg}</option>
                  ))}
                </select>
              </div>
            )}

            {showAreaDropdown && (
              <div className="filter-select-wrapper">
                <label className="select-label">Area</label>
                <select
                  value={selectedAreaFilter}
                  onChange={(e) => setSelectedAreaFilter(e.target.value)}
                  className="hierarchy-premium-select"
                >
                  {uniqueAreas.map(area => (
                    <option key={area} value={area}>{area === 'All' ? 'All Areas' : area}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VERSION ALERT */}
      {scriptWarning && (
        <div className="script-warning-alert">
          <p><strong>⚠️ ACTION REQUIRED:</strong> Your Google Apps Script Web App needs to be redeployed. Please copy the latest <strong>Code.gs</strong> and deploy it as an Edit update inside Apps Script.</p>
        </div>
      )}

      {/* INTERACTION DESCRIPTION */}
      <div className="rbac-notice">
        {isBM ? (
          <p><strong>Branch Manager Access:</strong> Review your branch difference performance. Click the <strong>Eye (👁️)</strong> icon beside any metric cell below to open the monthly targets popup, adjust values, and save.</p>
        ) : (
          <p><strong>Supervisor Access:</strong> Viewing performance differences across branches. Click the <strong>Eye (👁️)</strong> icon beside any metric cell below to review monthly target breakdowns and approve budgets.</p>
        )}
      </div>

      {/* ────────────────── PROMINENT MAIN PAGE TIMELINE MONITOR ────────────────── */}
      {selectedBranchObj && displayLevel === 'branch' && (
        <div className="main-stepper-card">
          <div className="main-stepper-header-row">
            <div className="main-stepper-header-left">
              <h4>Approval Progress Timeline</h4>
              <span className="selected-branch-label">
                Currently Monitoring: <strong>{selectedBranchObj.code} - {selectedBranchObj.name}</strong>
              </span>
            </div>
            
            {/* DIRECT ACTION BUTTON FOR SUPERVISOR TO APPROVE THE ENTIRE ROW */}
            {showDirectApproveBtn && (
              <div className="approval-control-wrapper">
                {/* Live progress indicator */}
                <span className={`review-checklist-badge ${isReadyToApprove ? 'fully-reviewed' : !allMetricsReviewed ? 'pending-review' : 'invalid-targets'}`}>
                  {isReadyToApprove ? (
                    <>🎯 Ready to Approve ({reviewedCount}/{METRICS.length} KPIs + Targets Encoded)</>
                  ) : !allMetricsReviewed ? (
                    <>🔒 Review all metrics first ({reviewedCount}/{METRICS.length} KPIs)</>
                  ) : (
                    <>
                      <AlertTriangle size={13} style={{ marginRight: '4px' }} />
                      ⚠️ Encode Targets ({targetValidation.missingCount} months are blank/zero)
                    </>
                  )}
                </span>
                
                <button 
                  className={`direct-approve-badge-btn ${isReadyToApprove ? 'animate-pulse' : 'locked-btn'}`}
                  onClick={handleDirectApprove}
                  disabled={approvingDirect || !isReadyToApprove}
                  title={isReadyToApprove ? 'Click to sign off and approve branch budget' : !allMetricsReviewed ? `Please click the Eye 👁️ icon for all ${METRICS.length} metrics to review before approving.` : `This branch has target cells that are blank or zero. All months must be encoded.`}
                >
                  {approvingDirect ? (
                    'Saving Approval...'
                  ) : isReadyToApprove ? (
                    <>
                      <Check size={16} style={{ marginRight: '6px' }} />
                      Approve Forecast Target
                    </>
                  ) : (
                    <>
                      <Lock size={14} style={{ marginRight: '6px' }} />
                      Approve (Locked)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="modal-stepper-container" style={{ borderBottom: 'none' }}>
            <div className="stepper-track-line"></div>
            
            <div className="step-item completed">
              <div className="step-badge">
                <Check size={14} />
              </div>
              <div className="step-label">PREPARATION</div>
              <div className="step-meta">BM Saved</div>
            </div>

            <div className={`step-item ${timelineApprovals.aa ? 'completed' : 'pending'}`}>
              <div className="step-badge">
                {timelineApprovals.aa ? <Check size={14} /> : <span className="dot"></span>}
              </div>
              <div className="step-label">AREA REVIEW</div>
              <div className="step-meta" title={timelineApprovals.aa}>
                {timelineApprovals.aa ? timelineApprovals.aa.split(' ')[0] : 'Pending'}
              </div>
            </div>

            <div className={`step-item ${timelineApprovals.ra ? 'completed' : 'pending'}`}>
              <div className="step-badge">
                {timelineApprovals.ra ? <Check size={14} /> : <span className="dot"></span>}
              </div>
              <div className="step-label">REGIONAL REVIEW</div>
              <div className="step-meta" title={timelineApprovals.ra}>
                {timelineApprovals.ra ? timelineApprovals.ra.split(' ')[0] : 'Pending'}
              </div>
            </div>

            <div className={`step-item ${timelineApprovals.avp ? 'completed' : 'pending'}`}>
              <div className="step-badge">
                {timelineApprovals.avp ? <Check size={14} /> : <span className="dot"></span>}
              </div>
              <div className="step-label">DIVISIONAL REVIEW</div>
              <div className="step-meta" title={timelineApprovals.avp}>
                {timelineApprovals.avp ? timelineApprovals.avp.split(' ')[0] : 'Pending'}
              </div>
            </div>

            <div className={`step-item ${timelineApprovals.svp ? 'completed' : 'pending'}`}>
              <div className="step-badge">
                {timelineApprovals.svp ? <Check size={14} /> : <span className="dot"></span>}
              </div>
              <div className="step-label">FINAL APPROVAL</div>
              <div className="step-meta" title={timelineApprovals.svp}>
                {timelineApprovals.svp ? timelineApprovals.svp.split(' ')[0] : 'Pending'}
              </div>
            </div>
          </div>
          {!isBM && (
            <p className="stepper-tip-text">💡 Click anywhere on any branch row below to instantly switch the timeline monitor above.</p>
          )}
        </div>
      )}

      {/* ────────────────── UNIFIED SINGLE GRID LAYOUT ────────────────── */}
      <div className="grid-scroll-container">
        <table className="supervisor-monitor-table">
          <thead>
            <tr>
              <th rowSpan="2" className="sticky-col-num">#</th>
              <th rowSpan="2" className="sticky-col">Branch & Approval Stage</th>
              {showActionsCol && <th rowSpan="2" className="sticky-col-actions">Actions</th>}
              {METRICS.map(metric => (
                <th key={metric.id} colSpan="3" className="metric-group-header">
                  {metric.label}
                </th>
              ))}
            </tr>
            <tr>
              {METRICS.map(metric => (
                <React.Fragment key={metric.id + '-sub'}>
                  <th className="sub-header actual">ACTUAL</th>
                  <th className="sub-header diff">DIFF</th>
                  <th className="sub-header view">VIEW</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={METRICS.length * 3 + (showActionsCol ? 3 : 2)} className="empty-branches-cell loading-cell">
                  <div className="table-loading-spinner-container">
                    <div className="table-loading-spinner"></div>
                  </div>
                </td>
              </tr>
            ) : gridRows.length === 0 ? (
              <tr>
                <td colSpan={METRICS.length * 3 + (showActionsCol ? 3 : 2)} className="empty-branches-cell">
                  No hierarchy levels found under your current scope.
                </td>
              </tr>
            ) : (
              <>
                {gridRows.map((branch, branchIdx) => {
                  const app = branch.approvals || {};
                  const isSelected = selectedBranchCode === branch.code;
                  const branchReviews = reviewedMetrics[branch.code] || {};
                  
                  // For this row, check if the current supervisor is approved
                  const isRowApprovedByMe = isSupervisor && app[userRoleLower];

                  return (
                    <tr 
                      key={branch.id}
                      className={`branch-row-tr ${branch.type !== 'branch' ? 'aggregate-row' : ''} ${isSelected ? 'selected-row' : ''}`}
                      onClick={() => {
                        if (branch.type === 'branch') {
                          setSelectedBranchCode(branch.code);
                        }
                      }}
                    >
                      {/* COLUMN 0: ROW COUNTER STICKY */}
                      <td className="sticky-col-num row-index-cell">
                        {branchIdx + 1}
                      </td>

                      {/* COLUMN 1: HIERARCHY INFO */}
                      <td className="sticky-col branch-title-cell">
                        <div className="branch-meta-box">
                          {branch.type === 'branch' ? (
                            <>
                              <span className="branch-primary-title">
                                {branch.code} - {branch.name}
                                {isSelected && !isBM && <span className="active-monitor-badge">MONITORING</span>}
                              </span>
                              
                              <div className="branch-approvals-row">
                                <span className="approval-row-title">Approved by:</span>
                                <span className={`app-row-badge ${app.aa ? 'done' : 'pending'}`} title={app.aa || 'Pending Area Review'}>
                                  AA
                                </span>
                                <span className={`app-row-badge ${app.ra ? 'done' : 'pending'}`} title={app.ra || 'Pending Region Review'}>
                                  RA
                                </span>
                                <span className={`app-row-badge ${app.avp ? 'done' : 'pending'}`} title={app.avp || 'Pending Division Review'}>
                                  AVP
                                </span>
                                <span className={`app-row-badge ${app.svp ? 'done' : 'pending'}`} title={app.svp || 'Pending Final Operation Approval'}>
                                  SVP
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="branch-primary-title aggregate-rollup-title">
                                {branch.type === 'operation' && '🌐 '}
                                {branch.type === 'division' && '🏢 '}
                                {branch.type === 'region' && '🗺️ '}
                                {branch.type === 'area' && '📁 '}
                                {branch.type.charAt(0).toUpperCase() + branch.type.slice(1)}: {branch.name}
                              </span>
                              <div className="branch-approvals-row">
                                <span className="aggregate-count-tag">{branch.branchesCount} Branches Rollup</span>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* COLUMN 2: SEPARATE ACTIONS COLUMN */}
                      {showActionsCol && (
                        <td className="sticky-col-actions actions-cell">
                          <div className="branch-row-action-buttons">
                            {isSupervisor || roleUpper === 'ADMIN' ? (
                              canIActionThisRow(branch) ? (
                                <>
                                  {!isRowApprovedByMe ? (
                                    <button
                                      className="row-action-btn row-approve-btn-icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRowApprove(branch);
                                      }}
                                      title={`Approve ${branch.type.toUpperCase()} Forecast Target`}
                                    >
                                      <Check size={14} />
                                    </button>
                                  ) : (
                                    <span className="row-action-badge-icon" title="Approved / Signed Off">
                                      ✓
                                    </span>
                                  )}

                                  {/* RE-OPEN BRANCH TARGETS BUTTON (Visible if any approval exists) */}
                                  {(app.aa || app.ra || app.avp || app.svp) && (
                                    <button
                                      className={`row-action-btn row-reopen-btn-icon ${app.reopenRequested ? 'has-reopen-request' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRowReopen(branch);
                                      }}
                                      title={app.reopenRequested ? "Re-Target (Branch Requested Re-open! 🔔)" : "Re-Target"}
                                      style={{ position: 'relative' }}
                                    >
                                      <RotateCcw size={14} />
                                      {app.reopenRequested && <span className="reopen-request-ping-dot"></span>}
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="row-no-action-placeholder">-</span>
                              )
                            ) : isBM && branch.type === 'branch' ? (
                              <>
                                {/* BM actions */}
                                {(app.aa || app.ra || app.avp || app.svp) ? (
                                  app.reopenRequested ? (
                                    <span 
                                      className="bm-reopen-badge pending" 
                                      title={`Re-open Request Submitted: ${app.reopenRequested}. Waiting for AA to reset targets.`}
                                    >
                                      <Clock size={13} style={{ marginRight: '4px' }} />
                                      Pending Re-open
                                    </span>
                                  ) : (
                                    <button
                                      className="row-action-btn bm-request-reopen-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBMRequestReopen(branch);
                                      }}
                                      title="Request target re-open"
                                    >
                                      <RotateCcw size={13} style={{ marginRight: '4px' }} />
                                      Request Re-open
                                    </button>
                                  )
                                ) : (
                                  <span className="bm-reopen-badge active" title="Targets Open & Editable">
                                    <Check size={13} style={{ marginRight: '4px' }} />
                                    Open
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="row-no-action-placeholder">-</span>
                            )}
                          </div>
                        </td>
                      )}

                      {METRICS.map(metric => {
                        const mData = branch.metrics[metric.id] || { targets: [], actuals: [] };
                        const isSnapshot = ['clients', 'savings', 'portfolio'].includes(metric.id);
                        
                        let actVal = 0;
                        let tgtVal = 0;

                        if (viewMode === 'monthly') {
                          actVal = mData.actuals[selectedMonth] || 0;
                          tgtVal = mData.targets[selectedMonth] || 0;
                        } else {
                          // Yearly mode
                          if (isSnapshot) {
                            const latestIdx = getLatestActiveMonthIndex(consolidatedData);
                            actVal = mData.actuals[latestIdx] || 0;
                            tgtVal = mData.targets[latestIdx] || 0;
                          } else {
                            actVal = calculateTotal(mData.actuals);
                            tgtVal = calculateTotal(mData.targets);
                          }
                        }

                        const diffVal = actVal - tgtVal;
                        const hasReviewedThisMetric = branchReviews[metric.id];

                        return (
                          <React.Fragment key={metric.id}>
                            <td className="cell-actual">
                              {actVal.toLocaleString()}
                            </td>
                            <td className={`cell-diff ${diffVal < 0 ? 'neg' : 'pos'}`}>
                              {diffVal.toLocaleString()}
                            </td>
                            <td className="cell-view-icon">
                              <button 
                                className={`eye-btn animate-eye ${hasReviewedThisMetric ? 'metric-reviewed-glow' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation(); // prevent row click triggers
                                  openModal(branch, metric);
                                }}
                                title={hasReviewedThisMetric ? `KPI metric reviewed! Click to view/edit again.` : `Click to review monthly targets for ${metric.label}`}
                              >
                                <Eye size={13} />
                              </button>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* ────────────────── GORGEOUS TOTAL BOTTOM ROW ────────────────── */}
                <tr className="totals-row-tr">
                  {/* Column 0: sticky total # */}
                  <td className="sticky-col-num total-label-cell">Σ</td>
                  
                  {/* Column 1: sticky total title */}
                  <td className="sticky-col total-title-cell">
                    <strong>TOTALS</strong>
                  </td>

                  {/* Column 2: sticky total actions blank */}
                  {showActionsCol && (
                    <td className="sticky-col-actions actions-cell total-actions-blank-cell"></td>
                  )}

                  {/* Sum values for each metric */}
                  {METRICS.map(metric => {
                    const totalVal = getMetricTotalValues(metric.id);
                    return (
                      <React.Fragment key={metric.id + '-total'}>
                        <td className="cell-actual total-act-cell">
                          <strong>{totalVal.act.toLocaleString()}</strong>
                        </td>
                        <td className={`cell-diff total-diff-cell ${totalVal.diff < 0 ? 'neg' : 'pos'}`}>
                          <strong>{totalVal.diff.toLocaleString()}</strong>
                        </td>
                        <td className="cell-view-icon total-view-blank-cell"></td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ────────────────── CLEAN TARGET BREAKDOWN EDIT MODAL (NO STEPPER INSIDE) ────────────────── */}
      {activeModal && (
        <TargetEditModal
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveTargets}
          saving={savingModal}
          isBM={isBM}
        />
      )}
    </div>
  );
}

/* ────────────────── HIGH PERFORMANCE SUBCOMPONENT EDIT MODAL (ZERO INPUT LAG!) ────────────────── */
function TargetEditModal({ activeModal, onClose, onSave, saving, isBM }) {
  const [localTargets, setLocalTargets] = React.useState(
    activeModal.tempMetricData.targets.map(t => t === '' ? '' : t)
  );

  const handleLocalChange = (idx, val) => {
    const next = [...localTargets];
    next[idx] = val === '' ? '' : val;
    setLocalTargets(next);
  };

  return (
    <div className="premium-modal-backdrop">
      <div className="premium-modal-content">
        <div className="modal-header">
          <div>
            <h3>{activeModal.isReadOnly ? 'Review Rollup Summary' : 'Review & Adjust Targets'}</h3>
            <p className="subtitle">{activeModal.isReadOnly ? activeModal.branchName : `${activeModal.branchCode} - ${activeModal.branchName}`}</p>
            <p className="metric-tag">{activeModal.metricLabel}</p>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* MONTHLY TARGET LISTING */}
        <div className="modal-body">
          <table className="modal-forecast-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Actual Value</th>
                <th>Target Value</th>
                <th>Calculated Difference</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((month, idx) => {
                const act = activeModal.tempMetricData.actuals[idx] || 0;
                const tgt = localTargets[idx];
                const diff = act - (parseFloat(tgt) || 0);

                return (
                  <tr key={month}>
                    <td className="month-col">{MONTHS_FULL[idx]}</td>
                    <td className="value-col act">{act.toLocaleString()}</td>
                    <td className="value-col tgt">
                      {activeModal.isReadOnly || activeModal.metricId === 'net_gross' ? (
                        <span className="readonly-span">{(parseFloat(tgt) || 0).toLocaleString()}</span>
                      ) : (
                        <input
                          type="number"
                          className="modal-input"
                          value={tgt}
                          onChange={(e) => handleLocalChange(idx, e.target.value)}
                          placeholder="Enter target"
                        />
                      )}
                    </td>
                    <td className={`value-col diff ${diff < 0 ? 'neg' : 'pos'}`}>
                      {diff.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ACTIONS FOOTER */}
        <div className="modal-footer">
          {activeModal.isReadOnly ? (
            <button className="approve-modal-btn" onClick={onClose}>
              Close Rollup View
            </button>
          ) : (
            <>
              <button 
                className="cancel-modal-btn" 
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="approve-modal-btn"
                onClick={() => onSave(localTargets)}
                disabled={saving}
              >
                {saving ? 'Saving...' : isBM ? 'Save Changes' : 'Approve Target & Save'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
