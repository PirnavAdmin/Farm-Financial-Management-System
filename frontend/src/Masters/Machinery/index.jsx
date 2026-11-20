import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tractor,
  CircleCheck,
  Wrench,
  IndianRupee,
  Receipt,
  SprayCan,
  Cog,
  BatteryCharging,
  Fuel,
  Settings,
  EllipsisVertical,
  X,
  ChevronDown,
  Search
} from 'lucide-react';
import {
  machineryService,
  normalizeMachine,
  normalizeExpense,
  SEED_MACHINERY,
  SEED_EXPENSES,
  SEED_LOOKUPS,
  compareMachineCodes,
  extractMachineCodeNumber
} from '../../services/machineryService.js';
import './machinery.css';

// Currency formatter for Indian Rupees (₹)
const formatINR = (val) => {
  const num = Number(val) || 0;
  return '₹\u00A0' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

// Safe date formatter (e.g. "15 Apr 2026")
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
};

const EMPTY_MACHINE_FORM = {
  machineCode: '',
  machineName: '',
  machineType: 'Tractor',
  registrationNo: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  purchaseCost: '',
  currentValue: '',
  fuelType: 'Diesel',
  status: 'Active',
  modelNumber: '',
  manufacturer: '',
  notes: ''
};

const EMPTY_EXPENSE_FORM = {
  machineryId: '',
  machineName: '',
  expenseType: 'Fuel',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  operator: '',
  remarks: ''
};

export default function Machinery({ onNavigate }) {
  // Navigation tabs: 'fleet' (Directory) | 'expenses' (Operating Expenses) | 'roi' (Fleet ROI & Health)
  const [activeTab, setActiveTab] = useState('fleet');

  // Lookups state from GET /api/Machinery/lookups
  const [lookups, setLookups] = useState(SEED_LOOKUPS);

  // Machinery fleet state
  const [machineryList, setMachineryList] = useState([]);
  const [loadingMachinery, setLoadingMachinery] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [machineryPage, setMachineryPage] = useState(1);
  const machineryPageSize = 7;

  // Sorting state: default is ascending by numeric Machine Code (MCH-001 -> MCH-002 -> ...)
  const [sortColumn, setSortColumn] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
    setMachineryPage(1);
  };

  // Summary state from GET /api/Machinery/summary
  const [summaryData, setSummaryData] = useState(null);

  // Operating expenses state from GET /api/machinery-expenses
  const [expensesList, setExpensesList] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All');
  const [expenseMachineFilter, setExpenseMachineFilter] = useState('All');
  const [expensePage, setExpensePage] = useState(1);
  const expensePageSize = 8;

  // Fleet ROI analytics state from GET /api/Machinery/roi
  const [roiList, setRoiList] = useState([]);
  const [loadingRoi, setLoadingRoi] = useState(false);

  // Machine Add/Edit Form Modal State
  const [isMachineFormOpen, setIsMachineFormOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineFormData, setMachineFormData] = useState(EMPTY_MACHINE_FORM);
  const [machineFormErrors, setMachineFormErrors] = useState({});

  // View Machine Details Modal State (loads GET /api/Machinery/{id} and GET /api/Machinery/{id}/expenses)
  const [viewingMachine, setViewingMachine] = useState(null);
  const [machineExpensesHistory, setMachineExpensesHistory] = useState([]);
  const [loadingMachineExpenses, setLoadingMachineExpenses] = useState(false);

  // Expense Add/Edit Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState(EMPTY_EXPENSE_FORM);
  const [expenseFormErrors, setExpenseFormErrors] = useState({});

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'machine' | 'expense', item }

  // Three-dot action dropdown row ID
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Click outside listener for the 3-dot dropdown menu
  useEffect(() => {
    if (!openActionMenuId) return;
    const handleClickOutside = () => setOpenActionMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openActionMenuId]);

  // ───────────────────────────────────────────────────────────────────────────
  // Initial Data Fetching: Machinery, Lookups, Summary
  // ─────────────────────────────────────────────────────────────────────────
  const fetchMachinery = useCallback(async () => {
    setLoadingMachinery(true);
    try {
      const data = await machineryService.getMachinery();
      const sorted = (Array.isArray(data) ? data : []).slice().sort((a, b) => compareMachineCodes(a, b, 'asc'));
      setMachineryList(sorted);
    } catch (err) {
      console.error('[Machinery] Error fetching machinery list:', err);
      showToast('Offline or fallback mode: Loaded local machinery records.', 'error');
      const sorted = SEED_MACHINERY.map(normalizeMachine).sort((a, b) => compareMachineCodes(a, b, 'asc'));
      setMachineryList(sorted);
    } finally {
      setLoadingMachinery(false);
    }
  }, [showToast]);

  const fetchSummary = useCallback(async () => {
    try {
      const summary = await machineryService.getMachinerySummary();
      setSummaryData(summary);
    } catch (err) {
      console.error('[Machinery] Error fetching summary:', err);
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const lk = await machineryService.getMachineryLookups();
      if (lk) setLookups(lk);
    } catch (err) {
      console.error('[Machinery] Error fetching lookups:', err);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const res = await machineryService.getAllExpenses();
      setExpensesList(res.items || []);
    } catch (err) {
      console.error('[Machinery] Error fetching expenses:', err);
      setExpensesList(SEED_EXPENSES.map(normalizeExpense));
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  const fetchRoi = useCallback(async () => {
    setLoadingRoi(true);
    try {
      const data = await machineryService.getFleetRoi();
      setRoiList(data || []);
    } catch (err) {
      console.error('[Machinery] Error fetching ROI:', err);
    } finally {
      setLoadingRoi(false);
    }
  }, []);

  useEffect(() => {
    fetchMachinery();
    fetchSummary();
    fetchLookups();
  }, [fetchMachinery, fetchSummary, fetchLookups]);

  // Switch tabs and lazily fetch expenses or ROI
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'expenses' && expensesList.length === 0) {
      fetchExpenses();
    } else if (tab === 'roi' && roiList.length === 0) {
      fetchRoi();
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Filtered Machinery Directory List
  // ─────────────────────────────────────────────────────────────────────────
  const filteredMachinery = useMemo(() => {
    const list = machineryList.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (m.machineName || '').toLowerCase().includes(q);
        const regMatch = (m.registrationNo || '').toLowerCase().includes(q);
        const codeMatch = (m.machineCode || '').toLowerCase().includes(q);
        const typeMatch = (m.machineType || '').toLowerCase().includes(q);
        if (!nameMatch && !regMatch && !codeMatch && !typeMatch) return false;
      }

      if (typeFilter !== 'All' && m.machineType !== typeFilter) {
        return false;
      }

      if (statusFilter !== 'All' && m.status !== statusFilter) {
        return false;
      }

      return true;
    });

    // Default sorting: Ascending order by numeric Machine Code (MCH-001 -> MCH-002 -> ...)
    return list.slice().sort((a, b) => {
      if (sortColumn === 'code') {
        return compareMachineCodes(a, b, sortDirection);
      }
      return compareMachineCodes(a, b, 'asc');
    });
  }, [machineryList, searchQuery, typeFilter, statusFilter, sortColumn, sortDirection]);

  const totalMachineryPages = Math.max(1, Math.ceil(filteredMachinery.length / machineryPageSize));
  const currentMachineryPageItems = useMemo(() => {
    const start = (machineryPage - 1) * machineryPageSize;
    return filteredMachinery.slice(start, start + machineryPageSize);
  }, [filteredMachinery, machineryPage, machineryPageSize]);

  // ───────────────────────────────────────────────────────────────────────────
  // Filtered Expenses List
  // ─────────────────────────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    return expensesList.filter((e) => {
      if (expenseSearchQuery.trim()) {
        const q = expenseSearchQuery.toLowerCase().trim();
        const machineMatch = (e.machineName || '').toLowerCase().includes(q);
        const typeMatch = (e.expenseType || '').toLowerCase().includes(q);
        const operatorMatch = (e.operator || '').toLowerCase().includes(q);
        const remarksMatch = (e.remarks || '').toLowerCase().includes(q);
        if (!machineMatch && !typeMatch && !operatorMatch && !remarksMatch) return false;
      }

      if (expenseTypeFilter !== 'All' && e.expenseType !== expenseTypeFilter) {
        return false;
      }

      if (expenseMachineFilter !== 'All' && String(e.machineryId) !== String(expenseMachineFilter) && e.machineName !== expenseMachineFilter) {
        return false;
      }

      return true;
    });
  }, [expensesList, expenseSearchQuery, expenseTypeFilter, expenseMachineFilter]);

  const totalExpensePages = Math.max(1, Math.ceil(filteredExpenses.length / expensePageSize));
  const currentExpensePageItems = useMemo(() => {
    const start = (expensePage - 1) * expensePageSize;
    return filteredExpenses.slice(start, start + expensePageSize);
  }, [filteredExpenses, expensePage, expensePageSize]);

  // Dynamic KPI Metrics
  const metrics = useMemo(() => {
    if (summaryData) {
      return {
        total: summaryData.totalMachines,
        active: summaryData.activeMachines,
        maintenance: summaryData.underMaintenanceMachines,
        totalCurrentValue: summaryData.totalCurrentValue,
        totalPurchaseCost: summaryData.totalPurchaseCost,
        totalExpenseRecords: summaryData.totalExpenseRecords,
        totalExpenseAmount: summaryData.totalExpenseAmount
      };
    }
    const local = machineryService.computeMachineryMetrics(machineryList);
    return {
      ...local,
      totalExpenseRecords: expensesList.length,
      totalExpenseAmount: expensesList.reduce((s, x) => s + (Number(x.amount) || 0), 0)
    };
  }, [summaryData, machineryList, expensesList]);

  // ───────────────────────────────────────────────────────────────────────────
  // Machine Add / Edit Handlers (POST /api/Machinery & PUT /api/Machinery/{id})
  // ─────────────────────────────────────────────────────────────────────────
  const validateMachineForm = () => {
    const errors = {};

    if (!machineFormData.machineName || !machineFormData.machineName.trim()) {
      errors.machineName = 'Machine Name is required';
    }

    if (!machineFormData.machineType) {
      errors.machineType = 'Please select a Machine Type';
    }

    if (!machineFormData.purchaseDate) {
      errors.purchaseDate = 'Purchase Date is required';
    } else {
      const d = new Date(machineFormData.purchaseDate);
      if (isNaN(d.getTime())) {
        errors.purchaseDate = 'Please enter a valid date';
      }
    }

    if (machineFormData.purchaseCost === '' || machineFormData.purchaseCost === null || machineFormData.purchaseCost === undefined) {
      errors.purchaseCost = 'Purchase Cost is required';
    } else {
      const cost = Number(machineFormData.purchaseCost);
      if (isNaN(cost) || cost < 0) {
        errors.purchaseCost = 'Purchase Cost must be a positive number';
      }
    }

    if (machineFormData.currentValue === '' || machineFormData.currentValue === null || machineFormData.currentValue === undefined) {
      errors.currentValue = 'Current Value is required';
    } else {
      const val = Number(machineFormData.currentValue);
      if (isNaN(val) || val < 0) {
        errors.currentValue = 'Current Value must be a positive number';
      }
    }

    if (!machineFormData.fuelType) {
      errors.fuelType = 'Please select a Fuel / Power Type';
    }

    if (!machineFormData.status) {
      errors.status = 'Please select a Status';
    }

    setMachineFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddMachine = () => {
    const nextCode = machineryService.generateMachineCode(machineryList);
    setEditingMachine(null);
    setMachineFormData({
      ...EMPTY_MACHINE_FORM,
      machineCode: nextCode,
      machineType: lookups.machineTypes[0] || 'Tractor',
      fuelType: lookups.fuelTypes[0] || 'Diesel',
      status: 'Active',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
    setMachineFormErrors({});
    setIsMachineFormOpen(true);
  };

  const handleOpenEditMachine = async (machine) => {
    setEditingMachine(machine);
    try {
      // Fetch fresh individual machinery details from GET /api/Machinery/{id}
      const fresh = await machineryService.getMachineById(machine.id);
      const m = fresh || machine;
      setMachineFormData({
        machineCode: m.machineCode || '',
        machineName: m.machineName || '',
        machineType: m.machineType || 'Tractor',
        registrationNo: m.registrationNo || '',
        purchaseDate: m.purchaseDate || new Date().toISOString().split('T')[0],
        purchaseCost: m.purchaseCost !== undefined ? m.purchaseCost : '',
        currentValue: m.currentValue !== undefined ? m.currentValue : '',
        fuelType: m.fuelType || 'Diesel',
        status: m.status || 'Active',
        modelNumber: m.modelNumber || '',
        manufacturer: m.manufacturer || '',
        notes: m.notes || ''
      });
    } catch {
      setMachineFormData({
        machineCode: machine.machineCode || '',
        machineName: machine.machineName || '',
        machineType: machine.machineType || 'Tractor',
        registrationNo: machine.registrationNo || '',
        purchaseDate: machine.purchaseDate || new Date().toISOString().split('T')[0],
        purchaseCost: machine.purchaseCost !== undefined ? machine.purchaseCost : '',
        currentValue: machine.currentValue !== undefined ? machine.currentValue : '',
        fuelType: machine.fuelType || 'Diesel',
        status: machine.status || 'Active',
        modelNumber: machine.modelNumber || '',
        manufacturer: machine.manufacturer || '',
        notes: machine.notes || ''
      });
    }
    setMachineFormErrors({});
    setIsMachineFormOpen(true);
  };

  const handleSubmitMachineForm = async (e) => {
    e.preventDefault();
    if (!validateMachineForm()) return;

    try {
      if (editingMachine) {
        const updated = await machineryService.updateMachine(editingMachine.id, machineFormData);
        setMachineryList((prev) =>
          prev.map((m) => (String(m.id) === String(editingMachine.id) ? updated : m)).sort((a, b) => compareMachineCodes(a, b, 'asc'))
        );
        showToast(`Machinery "${updated.machineName}" updated successfully.`);
      } else {
        const created = await machineryService.createMachine(machineFormData);
        setMachineryList((prev) => [...prev, created].sort((a, b) => compareMachineCodes(a, b, 'asc')));
        showToast(`Machinery "${created.machineName}" registered successfully.`);
      }
      setIsMachineFormOpen(false);
      setEditingMachine(null);
      fetchSummary();
    } catch (err) {
      console.error('[Machinery] Submit error:', err);
      showToast(err.message || 'Error saving machinery record.', 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // View Machine Details & Associated Expenses (GET /api/Machinery/{id}/expenses)
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenViewMachine = async (machine) => {
    setViewingMachine(machine);
    setLoadingMachineExpenses(true);
    setMachineExpensesHistory([]);
    try {
      const res = await machineryService.getExpensesForMachine(machine.id);
      setMachineExpensesHistory(res.items || []);
    } catch (err) {
      console.error('[Machinery] Error fetching machine expenses history:', err);
    } finally {
      setLoadingMachineExpenses(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Quick Status Toggle (Active → Under Maintenance → Inactive)
  // ─────────────────────────────────────────────────────────────────────────
  const handleCycleStatus = async (machine, e) => {
    e.stopPropagation();
    let nextStatus = 'Active';
    if (machine.status === 'Active') nextStatus = 'Under Maintenance';
    else if (machine.status === 'Under Maintenance') nextStatus = 'Inactive';
    else nextStatus = 'Active';

    try {
      const updated = await machineryService.updateMachine(machine.id, { status: nextStatus });
      setMachineryList((prev) =>
        prev.map((m) => (String(m.id) === String(machine.id) ? updated : m))
      );
      showToast(`Status updated to "${nextStatus}" for ${machine.machineName}`);
      fetchSummary();
    } catch (err) {
      console.error('[Machinery] Status toggle error:', err);
      showToast('Failed to update status', 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Expense Form Handlers (POST /api/machinery-expenses & POST /api/Machinery/{id}/expenses)
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenAddExpense = (preselectedMachine = null) => {
    setEditingExpense(null);
    const targetMachine = preselectedMachine || (machineryList.length > 0 ? machineryList[0] : null);
    setExpenseFormData({
      ...EMPTY_EXPENSE_FORM,
      machineryId: targetMachine ? targetMachine.id : '',
      machineName: targetMachine ? targetMachine.machineName : '',
      expenseType: lookups.expenseTypes[0]?.name || 'Fuel',
      date: new Date().toISOString().split('T')[0]
    });
    setExpenseFormErrors({});
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      machineryId: expense.machineryId || '',
      machineName: expense.machineName || '',
      expenseType: expense.expenseType || 'Fuel',
      date: expense.date || new Date().toISOString().split('T')[0],
      amount: expense.amount !== undefined ? expense.amount : '',
      operator: expense.operator || '',
      remarks: expense.remarks || ''
    });
    setExpenseFormErrors({});
    setIsExpenseModalOpen(true);
  };

  const validateExpenseForm = () => {
    const errors = {};
    if (!expenseFormData.machineName && !expenseFormData.machineryId) {
      errors.machineryId = 'Please select a Machine';
    }
    if (!expenseFormData.expenseType) {
      errors.expenseType = 'Please select an Expense Type';
    }
    if (!expenseFormData.date) {
      errors.date = 'Expense Date is required';
    }
    if (!expenseFormData.amount || Number(expenseFormData.amount) <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
    setExpenseFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitExpenseForm = async (e) => {
    e.preventDefault();
    if (!validateExpenseForm()) return;

    try {
      if (editingExpense) {
        const updated = await machineryService.updateExpense(editingExpense.id, expenseFormData);
        setExpensesList((prev) =>
          prev.map((item) => (String(item.id) === String(editingExpense.id) ? updated : item))
        );
        showToast(`Expense voucher updated successfully.`);
      } else {
        let created;
        if (expenseFormData.machineryId) {
          // POST /api/Machinery/{machineryId}/expenses
          created = await machineryService.addExpenseForMachine(expenseFormData.machineryId, expenseFormData);
        } else {
          // POST /api/machinery-expenses
          created = await machineryService.createExpense(expenseFormData);
        }
        setExpensesList((prev) => [created, ...prev]);
        if (viewingMachine && String(viewingMachine.id) === String(expenseFormData.machineryId)) {
          setMachineExpensesHistory((prev) => [created, ...prev]);
        }
        showToast(`Expense of ${formatINR(created.amount)} recorded successfully.`);
      }
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      fetchSummary();
      fetchMachinery();
    } catch (err) {
      console.error('[Machinery] Expense submit error:', err);
      showToast(err.message || 'Error recording machinery expense.', 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Unified Delete Handlers (DELETE /api/Machinery/{id} & DELETE /api/machinery-expenses/{id})
  // ─────────────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'machine') {
        await machineryService.deleteMachine(deleteConfirm.item.id);
        setMachineryList((prev) => prev.filter((m) => String(m.id) !== String(deleteConfirm.item.id)));
        showToast(`Machinery "${deleteConfirm.item.machineName}" was deleted.`);
        if (viewingMachine && String(viewingMachine.id) === String(deleteConfirm.item.id)) {
          setViewingMachine(null);
        }
      } else if (deleteConfirm.type === 'expense') {
        await machineryService.deleteExpense(deleteConfirm.item.id);
        setExpensesList((prev) => prev.filter((e) => String(e.id) !== String(deleteConfirm.item.id)));
        if (viewingMachine) {
          setMachineExpensesHistory((prev) => prev.filter((e) => String(e.id) !== String(deleteConfirm.item.id)));
        }
        showToast('Machinery expense record deleted.');
      }
      setDeleteConfirm(null);
      fetchSummary();
    } catch (err) {
      console.error('[Machinery] Delete error:', err);
      showToast('Error executing delete operation.', 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // CSV Exports
  // ─────────────────────────────────────────────────────────────────────────
  const handleExportMachineryCSV = () => {
    if (machineryList.length === 0) {
      showToast('No machinery records to export.', 'error');
      return;
    }
    const headers = ['Code', 'Machine Name', 'Type', 'Reg No', 'Purchase Date', 'Purchase Cost (INR)', 'Current Value (INR)', 'Fuel', 'Status', 'Model', 'Manufacturer', 'Notes'];
    const sorted = machineryList.slice().sort((a, b) => compareMachineCodes(a, b, 'asc'));
    const rows = sorted.map((m) => [
      `"${m.machineCode || ''}"`,
      `"${(m.machineName || '').replace(/"/g, '""')}"`,
      `"${m.machineType || ''}"`,
      `"${m.registrationNo || ''}"`,
      `"${m.purchaseDate || ''}"`,
      m.purchaseCost || 0,
      m.currentValue || 0,
      `"${m.fuelType || ''}"`,
      `"${m.status || ''}"`,
      `"${(m.modelNumber || '').replace(/"/g, '""')}"`,
      `"${(m.manufacturer || '').replace(/"/g, '""')}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `agriman_machinery_fleet_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Machinery fleet exported to CSV.');
  };

  const handleExportExpensesCSV = () => {
    if (expensesList.length === 0) {
      showToast('No operating expenses to export.', 'error');
      return;
    }
    const headers = ['Expense ID', 'Machine Name', 'Expense Type', 'Date', 'Amount (INR)', 'Operator', 'Remarks'];
    const rows = expensesList.map((e) => [
      `"EXP-${e.id}"`,
      `"${(e.machineName || '').replace(/"/g, '""')}"`,
      `"${e.expenseType || ''}"`,
      `"${e.date || ''}"`,
      e.amount || 0,
      `"${(e.operator || '').replace(/"/g, '""')}"`,
      `"${(e.remarks || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `agriman_machinery_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Operating expenses exported to CSV.');
  };

  const getMachineIcon = (type, size = 20) => {
    switch (type) {
      case 'Tractor':
      case 'Power Tiller':
        return <Tractor size={size} strokeWidth={1.8} />;
      case 'Sprayer':
        return <SprayCan size={size} strokeWidth={1.8} />;
      case 'Rotavator':
      case 'Cultivator':
      case 'Power Weeder':
      case 'Harvester':
      case 'Baler':
      case 'Digger':
      case 'Thresher':
        return <Cog size={size} strokeWidth={1.8} />;
      default:
        return <Wrench size={size} strokeWidth={1.8} />;
    }
  };

  const getFuelIcon = (fuel) => {
    if (!fuel) return <Fuel size={14} strokeWidth={1.8} className="mch-fuel-lucide" />;
    const lower = fuel.toLowerCase();
    if (lower.includes('electric') || lower.includes('battery')) {
      return <BatteryCharging size={14} strokeWidth={1.8} className="mch-fuel-lucide" />;
    }
    if (lower.includes('pto')) {
      return <Settings size={14} strokeWidth={1.8} className="mch-fuel-lucide" />;
    }
    return <Fuel size={14} strokeWidth={1.8} className="mch-fuel-lucide" />;
  };

  return (
    <div className="mch-page">
      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <div className={`mch-toast ${toast.type === 'error' ? 'error' : ''}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
          <button type="button" className="mch-toast-close" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="mch-page-head">
        <div>
          <div className="mch-eyebrow">
            WORKSPACE <span>/</span> MASTERS <span>/</span> MACHINERY & EQUIPMENT
          </div>
          <h1 className="mch-title">Machinery & Equipment</h1>
          <p className="mch-subtitle">
            Maintain and audit agricultural machinery records, operating expenses, fuel logs, and fleet ROI analytics.
          </p>
        </div>

        <div className="mch-head-actions">
          {activeTab === 'fleet' && (
            <>
              <button className="mch-btn-secondary" type="button" onClick={handleExportMachineryCSV} title="Export to CSV">
                <span>↓</span> Export Fleet
              </button>
              <button className="mch-btn-primary" type="button" onClick={handleOpenAddMachine}>
                <span>＋</span> Add Machinery
              </button>
            </>
          )}

          {activeTab === 'expenses' && (
            <>
              <button className="mch-btn-secondary" type="button" onClick={handleExportExpensesCSV} title="Export expenses">
                <span>↓</span> Export Expenses
              </button>
              <button className="mch-btn-primary" type="button" onClick={() => handleOpenAddExpense()}>
                <span>＋</span> Record Expense
              </button>
            </>
          )}

          {activeTab === 'roi' && (
            <button className="mch-btn-secondary" type="button" onClick={fetchRoi}>
              <span>↻</span> Refresh ROI Analytics
            </button>
          )}
        </div>
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
      <div className="mch-tabs-nav" role="tablist">
        <button
          className={`mch-tab-btn ${activeTab === 'fleet' ? 'active' : ''}`}
          type="button"
          onClick={() => handleTabChange('fleet')}
        >
          <span>Machinery Directory</span>
          <span className="mch-tab-badge">{machineryList.length}</span>
        </button>

        <button
          className={`mch-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          type="button"
          onClick={() => handleTabChange('expenses')}
        >
          <span>Operating Expenses</span>
          <span className="mch-tab-badge">{expensesList.length}</span>
        </button>

        <button
          className={`mch-tab-btn ${activeTab === 'roi' ? 'active' : ''}`}
          type="button"
          onClick={() => handleTabChange('roi')}
        >
          <span>Fleet ROI & Health</span>
          <span className="mch-tab-badge">Analytics</span>
        </button>
      </div>

      {/* ── Summary KPI Cards ─────────────────────────────────────────────── */}
      <div className="mch-stats-grid">
        <div className="mch-stat-card">
          <div className="mch-stat-icon total">
            <Tractor size={24} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label" title="Total Machinery">Total Machinery</span>
            <span className="mch-stat-val">{metrics.total}</span>
            <span className="mch-stat-hint" title="Registered farm assets">Registered farm assets</span>
          </div>
        </div>

        <div className="mch-stat-card">
          <div className="mch-stat-icon active">
            <CircleCheck size={24} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label" title="Active / Operational">Active / Operational</span>
            <span className="mch-stat-val">{metrics.active}</span>
            <span className="mch-stat-hint" title="Available for field work">Available for field work</span>
          </div>
        </div>

        <div className="mch-stat-card">
          <div className="mch-stat-icon warning">
            <Wrench size={24} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label" title="Under Maintenance">Under Maintenance</span>
            <span className="mch-stat-val">{metrics.maintenance}</span>
            <span className="mch-stat-hint" title="Service & repair work">Service & repair work</span>
          </div>
        </div>

        <div className="mch-stat-card">
          <div className="mch-stat-icon info">
            <IndianRupee size={24} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label" title="Total Asset Value">Total Asset Value</span>
            <span className="mch-stat-val">{formatINR(metrics.totalCurrentValue)}</span>
            <span className="mch-stat-hint" title={`Cost: ${formatINR(metrics.totalPurchaseCost)}`}>
              Cost: {formatINR(metrics.totalPurchaseCost)}
            </span>
          </div>
        </div>

        <div className="mch-stat-card">
          <div className="mch-stat-icon expense">
            <Receipt size={24} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label" title="Operating Expenses">Operating Expenses</span>
            <span className="mch-stat-val">{formatINR(metrics.totalExpenseAmount)}</span>
            <span className="mch-stat-hint" title={`${metrics.totalExpenseRecords} recorded vouchers`}>
              {metrics.totalExpenseRecords} recorded vouchers
            </span>
          </div>
        </div>
      </div>

      {/* ── TAB 1: MACHINERY DIRECTORY ─────────────────────────────────────── */}
      {activeTab === 'fleet' && (
        <section className="mch-panel">
          <div className="mch-toolbar">
            <div className="mch-search-box">
              <span className="mch-search-icon">
                <Search size={18} strokeWidth={2} />
              </span>
              <input
                className="mch-search-input"
                placeholder="Search by Machine Name, Registration No, or Code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setMachineryPage(1);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mch-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setMachineryPage(1);
                  }}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="mch-toolbar-filters">
              <select
                className="mch-select-filter mch-filter-type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setMachineryPage(1);
                }}
              >
                <option value="All">All Machine Types</option>
                {lookups.machineTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                className="mch-select-filter mch-filter-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setMachineryPage(1);
                }}
              >
                <option value="All">All Statuses</option>
                {lookups.statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {(searchQuery || typeFilter !== 'All' || statusFilter !== 'All') && (
                <button
                  className="mch-reset-btn"
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('All');
                    setStatusFilter('All');
                    setMachineryPage(1);
                  }}
                >
                  ↻ Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="mch-table-wrap">
            <table className="mch-table mch-fleet-table">
              <colgroup>
                <col style={{ width: '120px' }} />
                <col style={{ width: '280px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '90px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th
                    className="mch-th-code"
                    onClick={() => handleSort('code')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title={`Sorted by Machine Code (${sortDirection === 'asc' ? 'Ascending' : 'Descending'}). Click to toggle.`}
                  >
                    CODE
                  </th>
                  <th className="mch-th-name">MACHINE NAME</th>
                  <th className="mch-th-type">MACHINE TYPE</th>
                  <th className="mch-th-reg">REGISTRATION NO</th>
                  <th className="mch-th-date">PURCHASE DATE</th>
                  <th className="mch-th-cost">PURCHASE COST</th>
                  <th className="mch-th-val">CURRENT VALUE</th>
                  <th className="mch-th-fuel">FUEL / POWER</th>
                  <th className="mch-th-status">STATUS</th>
                  <th className="mch-th-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loadingMachinery ? (
                  <tr>
                    <td colSpan="10" className="mch-empty-state">
                      <div className="mch-empty-icon">⏳</div>
                      <strong>Loading machinery records...</strong>
                      <p>Connecting to backend API endpoints...</p>
                    </td>
                  </tr>
                ) : currentMachineryPageItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="mch-empty-state">
                      <div className="mch-empty-icon">🔍</div>
                      <strong>No machinery records found</strong>
                      <p>Try clearing or modifying your search and filter criteria.</p>
                      <button className="mch-btn-primary" type="button" onClick={handleOpenAddMachine} style={{ marginTop: '8px' }}>
                        + Add Machinery
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentMachineryPageItems.map((m, index) => {
                    const icon = getMachineIcon(m.machineType);
                    const isNearBottom = index >= currentMachineryPageItems.length - 2 && currentMachineryPageItems.length > 2;

                    return (
                      <tr key={m.id}>
                        {/* 1. CODE - Left aligned */}
                        <td className="mch-td-code">
                          <span className="mch-code-badge">{m.machineCode || `MCH-${m.id}`}</span>
                        </td>

                        {/* 2. MACHINE NAME - Left aligned with 44x44px icon */}
                        <td className="mch-td-name">
                          <div className="mch-name-cell">
                            <div className="mch-avatar">{icon}</div>
                            <div className="mch-name-info">
                              <strong title={m.machineName}>{m.machineName}</strong>
                              {m.modelNumber ? (
                                <span className="mch-name-sub">{m.modelNumber}</span>
                              ) : m.manufacturer ? (
                                <span className="mch-name-sub">{m.manufacturer}</span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* 3. MACHINE TYPE - Centered */}
                        <td className="mch-td-type">
                          <span className="mch-type-tag">{m.machineType || 'Tractor'}</span>
                        </td>

                        {/* 4. REGISTRATION NO - Left aligned, clean plain text */}
                        <td className="mch-td-reg">
                          {m.registrationNo ? (
                            <span className="mch-reg-text">{m.registrationNo}</span>
                          ) : (
                            <span className="mch-unregistered">Unregistered</span>
                          )}
                        </td>

                        {/* 5. PURCHASE DATE - Centered */}
                        <td className="mch-td-date">
                          <span>{formatDate(m.purchaseDate)}</span>
                        </td>

                        {/* 6. PURCHASE COST - Right aligned */}
                        <td className="mch-td-cost">
                          <span className="mch-amount">{formatINR(m.purchaseCost)}</span>
                        </td>

                        {/* 7. CURRENT VALUE - Right aligned */}
                        <td className="mch-td-val">
                          <span className="mch-amount depreciated">{formatINR(m.currentValue)}</span>
                        </td>

                        {/* 8. FUEL / POWER - Centered */}
                        <td className="mch-td-fuel">
                          <span className="mch-fuel-tag">
                            {getFuelIcon(m.fuelType)}
                            <span>{m.fuelType || 'Diesel'}</span>
                          </span>
                        </td>

                        {/* 9. STATUS - Centered */}
                        <td className="mch-td-status">
                          <button
                            className={`mch-status-pill ${
                              m.status === 'Active'
                                ? 'active'
                                : m.status === 'Under Maintenance'
                                ? 'maintenance'
                                : 'inactive'
                            }`}
                            type="button"
                            title="Click to cycle status"
                            onClick={(e) => handleCycleStatus(m, e)}
                          >
                            <span className="mch-status-dot" />
                            {m.status || 'Active'}
                          </button>
                        </td>

                        {/* 10. ACTIONS - Centered with Lucide EllipsisVertical */}
                        <td className="mch-td-actions">
                          <div className="mch-actions">
                            <button
                              className={`mch-action-btn mch-menu-trigger ${openActionMenuId === m.id ? 'active' : ''}`}
                              type="button"
                              title="Actions"
                              aria-label={`Actions for ${m.machineName}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === m.id ? null : m.id);
                              }}
                            >
                              <EllipsisVertical size={16} strokeWidth={2} />
                            </button>

                            {openActionMenuId === m.id && (
                              <div
                                className={`mch-action-dropdown ${isNearBottom ? 'drop-up' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="mch-action-menu-item"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenViewMachine(m);
                                  }}
                                >
                                  <span className="mch-menu-item-icon">👁</span> View Details
                                </button>
                                <button
                                  type="button"
                                  className="mch-action-menu-item"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenAddExpense(m);
                                  }}
                                >
                                  <span className="mch-menu-item-icon">⛽</span> Add Expense
                                </button>
                                <button
                                  type="button"
                                  className="mch-action-menu-item"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenEditMachine(m);
                                  }}
                                >
                                  <span className="mch-menu-item-icon">✎</span> Edit
                                </button>
                                <button
                                  type="button"
                                  className="mch-action-menu-item delete"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setDeleteConfirm({ type: 'machine', item: m });
                                  }}
                                >
                                  <span className="mch-menu-item-icon">⛌</span> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mch-table-footer">
            <div>
              Showing {filteredMachinery.length === 0 ? 0 : (machineryPage - 1) * machineryPageSize + 1} to{' '}
              {Math.min(machineryPage * machineryPageSize, filteredMachinery.length)} of {filteredMachinery.length} records
            </div>

            {totalMachineryPages > 1 && (
              <div className="mch-pagination">
                <button
                  className="mch-pg-btn"
                  type="button"
                  disabled={machineryPage === 1}
                  onClick={() => setMachineryPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: totalMachineryPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`mch-pg-btn ${machineryPage === p ? 'active' : ''}`}
                    type="button"
                    onClick={() => setMachineryPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="mch-pg-btn"
                  type="button"
                  disabled={machineryPage === totalMachineryPages}
                  onClick={() => setMachineryPage((p) => Math.min(totalMachineryPages, p + 1))}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── TAB 2: OPERATING EXPENSES (/api/machinery-expenses) ──────────────── */}
      {activeTab === 'expenses' && (
        <section className="mch-panel">
          <div className="mch-toolbar">
            <div className="mch-search-box">
              <span className="mch-search-icon">
                <Search size={18} strokeWidth={2} />
              </span>
              <input
                className="mch-search-input"
                placeholder="Search expenses by Machine, Expense Type, Operator, Remarks..."
                value={expenseSearchQuery}
                onChange={(e) => {
                  setExpenseSearchQuery(e.target.value);
                  setExpensePage(1);
                }}
              />
              {expenseSearchQuery && (
                <button
                  type="button"
                  className="mch-search-clear"
                  onClick={() => {
                    setExpenseSearchQuery('');
                    setExpensePage(1);
                  }}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="mch-toolbar-filters">
              <select
                className="mch-select-filter"
                value={expenseTypeFilter}
                onChange={(e) => {
                  setExpenseTypeFilter(e.target.value);
                  setExpensePage(1);
                }}
              >
                <option value="All">All Expense Types</option>
                {lookups.expenseTypes.map((t) => (
                  <option key={t.id || t.code || t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                className="mch-select-filter"
                value={expenseMachineFilter}
                onChange={(e) => {
                  setExpenseMachineFilter(e.target.value);
                  setExpensePage(1);
                }}
              >
                <option value="All">All Machines</option>
                {machineryList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.machineName} ({m.machineCode})
                  </option>
                ))}
              </select>

              {(expenseSearchQuery || expenseTypeFilter !== 'All' || expenseMachineFilter !== 'All') && (
                <button
                  className="mch-reset-btn"
                  type="button"
                  onClick={() => {
                    setExpenseSearchQuery('');
                    setExpenseTypeFilter('All');
                    setExpenseMachineFilter('All');
                    setExpensePage(1);
                  }}
                >
                  ↻ Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="mch-table-wrap">
            <table className="mch-table mch-expenses-table">
              <colgroup>
                <col style={{ width: '120px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '260px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '310px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="mch-exp-th-id">ID</th>
                  <th className="mch-exp-th-date">EXPENSE DATE</th>
                  <th className="mch-exp-th-name">MACHINE NAME</th>
                  <th className="mch-exp-th-type">EXPENSE TYPE</th>
                  <th className="mch-exp-th-amount">AMOUNT</th>
                  <th className="mch-exp-th-operator">OPERATOR / WORKSHOP</th>
                  <th className="mch-exp-th-remarks">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {loadingExpenses ? (
                  <tr>
                    <td colSpan="7" className="mch-empty-state">
                      <div className="mch-empty-icon">⏳</div>
                      <strong>Loading operating expenses...</strong>
                      <p>Fetching from /api/machinery-expenses...</p>
                    </td>
                  </tr>
                ) : currentExpensePageItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="mch-empty-state">
                      <div className="mch-empty-icon">⛽</div>
                      <strong>No operating expenses found</strong>
                      <p>Record fuel, servicing, repairs, or operator wages for your machinery.</p>
                      <button className="mch-btn-primary" type="button" onClick={() => handleOpenAddExpense()} style={{ marginTop: '8px' }}>
                        + Record First Expense
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentExpensePageItems.map((e) => (
                    <tr
                      key={e.id}
                      className="mch-exp-row"
                      onClick={() => handleOpenEditExpense(e)}
                      title="Click to view/edit expense"
                    >
                      <td className="mch-exp-td-id">
                        <span className="mch-code-badge mch-expense-id-badge">
                          EXP-{e.id}
                        </span>
                      </td>

                      <td className="mch-exp-td-date">
                        <span className="mch-exp-date-text">{formatDate(e.date)}</span>
                      </td>

                      <td className="mch-exp-td-name">
                        <span className="mch-exp-machine-name" title={e.machineName}>
                          {e.machineName}
                        </span>
                      </td>

                      <td className="mch-exp-td-type">
                        <span className="mch-type-tag mch-exp-type-tag">
                          {e.expenseType}
                        </span>
                      </td>

                      <td className="mch-exp-td-amount">
                        <span className="mch-exp-amount">
                          {formatINR(e.amount)}
                        </span>
                      </td>

                      <td className="mch-exp-td-operator">
                        <span className="mch-exp-operator" title={e.operator || ''}>
                          {e.operator || '—'}
                        </span>
                      </td>

                      <td className="mch-exp-td-remarks">
                        <span className="mch-exp-remarks" title={e.remarks || ''}>
                          {e.remarks || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mch-table-footer">
            <div>
              Showing {filteredExpenses.length === 0 ? 0 : (expensePage - 1) * expensePageSize + 1} to{' '}
              {Math.min(expensePage * expensePageSize, filteredExpenses.length)} of {filteredExpenses.length} records
            </div>

            {totalExpensePages > 1 && (
              <div className="mch-pagination">
                <button
                  className="mch-pg-btn"
                  type="button"
                  disabled={expensePage === 1}
                  onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: totalExpensePages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`mch-pg-btn ${expensePage === p ? 'active' : ''}`}
                    type="button"
                    onClick={() => setExpensePage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="mch-pg-btn"
                  type="button"
                  disabled={expensePage === totalExpensePages}
                  onClick={() => setExpensePage((p) => Math.min(totalExpensePages, p + 1))}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── TAB 3: FLEET ROI & HEALTH (/api/Machinery/roi) ───────────────────── */}
      {activeTab === 'roi' && (
        <section className="mch-panel">
          <div className="mch-toolbar" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>
              Fleet ROI, Maintenance-to-Purchase cost ratio, and Net Asset Value analysis from <code>/api/Machinery/roi</code>
            </div>
            <button className="mch-btn-secondary" type="button" onClick={fetchRoi}>
              <span>↻</span> Refresh Analysis
            </button>
          </div>

          <div className="mch-table-wrap">
            <table className="mch-table mch-roi-table">
              <colgroup>
                <col style={{ width: '130px' }} />
                <col style={{ width: '280px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '170px' }} />
                <col style={{ width: '190px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '170px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="mch-roi-th-code">CODE</th>
                  <th className="mch-roi-th-name">MACHINE NAME</th>
                  <th className="mch-roi-th-type">MACHINE TYPE</th>
                  <th className="mch-roi-th-pcost">PURCHASE COST</th>
                  <th className="mch-roi-th-cval">CURRENT BOOK VALUE</th>
                  <th className="mch-roi-th-mcost">MAINTENANCE COST</th>
                  <th className="mch-roi-th-logs">EXPENSE LOGS</th>
                  <th className="mch-roi-th-ratio">MAINT. COST RATIO</th>
                </tr>
              </thead>
              <tbody>
                {loadingRoi ? (
                  <tr>
                    <td colSpan="8" className="mch-empty-state">
                      <div className="mch-empty-icon">⏳</div>
                      <strong>Calculating fleet ROI analytics...</strong>
                      <p>Querying /api/Machinery/roi endpoint...</p>
                    </td>
                  </tr>
                ) : roiList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="mch-empty-state">
                      <div className="mch-empty-icon">📊</div>
                      <strong>No ROI data available</strong>
                      <p>Register machinery and record operating expenses to generate health metrics.</p>
                    </td>
                  </tr>
                ) : (
                  roiList.map((r) => {
                    const ratio = Number(r.maintenanceToCostRatio) || 0;
                    const ratioColor = ratio > 25 ? '#dc2626' : ratio > 10 ? '#b45309' : '#15803d';
                    const ratioBg = ratio > 25 ? '#fee2e2' : ratio > 10 ? '#fef3c7' : '#dcfce7';

                    return (
                      <tr key={r.id}>
                        <td className="mch-roi-td-code">
                          <span className="mch-code-badge">{r.machineCode}</span>
                        </td>
                        <td className="mch-roi-td-name">
                          <span className="mch-roi-machine-name" title={r.machineName}>
                            {r.machineName}
                          </span>
                        </td>
                        <td className="mch-roi-td-type">
                          <span className="mch-type-tag">{r.machineType}</span>
                        </td>
                        <td className="mch-roi-td-pcost">
                          <span className="mch-amount mch-amount-purchase">{formatINR(r.purchaseCost)}</span>
                        </td>
                        <td className="mch-roi-td-cval">
                          <span className="mch-amount mch-amount-depreciated">{formatINR(r.currentValue)}</span>
                        </td>
                        <td className="mch-roi-td-mcost">
                          <span className="mch-amount mch-amount-maint">
                            {formatINR(r.totalMaintenanceCost)}
                          </span>
                        </td>
                        <td className="mch-roi-td-logs">
                          <span className="mch-roi-logs-text">{r.expenseCount} vouchers</span>
                        </td>
                        <td className="mch-roi-td-ratio">
                          <span
                            className="mch-roi-ratio-badge"
                            style={{
                              color: ratioColor,
                              background: ratioBg
                            }}
                          >
                            {ratio}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── MODAL 1: ADD / EDIT MACHINERY (POST / PUT /api/Machinery) ───────── */}
      {isMachineFormOpen && (
        <div className="mch-modal-backdrop" onClick={() => setIsMachineFormOpen(false)}>
          <div
            className="mch-modal wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="machinery-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mch-modal-header">
              <div>
                <h3 id="machinery-form-title">
                  {editingMachine ? 'Edit Machinery Record' : 'Add New Machinery & Equipment'}
                </h3>
                <p>
                  {editingMachine
                    ? `Update specifications and valuation for ${editingMachine.machineName}`
                    : 'Register farm machinery, implement, or equipment into AgriMaan database.'}
                </p>
              </div>
              <button
                type="button"
                className="mch-modal-close"
                onClick={() => setIsMachineFormOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmitMachineForm} className="mch-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="mch-modal-body">
                {/* Section 1: Machine Identification */}
                <div className="mch-form-section">
                  <h4 className="mch-section-title">1. MACHINE IDENTIFICATION</h4>
                  <div className="mch-form-grid">
                    <div className="mch-field">
                      <label className="mch-label">
                        Machine Code <span className="mch-auto-tag">(Auto-generated)</span>
                      </label>
                      <input
                        className="mch-input mch-readonly-field"
                        value={machineFormData.machineCode}
                        readOnly
                        placeholder="e.g. MCH-008"
                      />
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Machine Name <em>*</em>
                      </label>
                      <input
                        className={`mch-input ${machineFormErrors.machineName ? 'error' : ''}`}
                        value={machineFormData.machineName}
                        onChange={(e) => {
                          setMachineFormData({ ...machineFormData, machineName: e.target.value });
                          if (machineFormErrors.machineName) {
                            setMachineFormErrors({ ...machineFormErrors, machineName: null });
                          }
                        }}
                        placeholder="e.g. Mahindra 575 DI Tractor"
                      />
                      {machineFormErrors.machineName && (
                        <span className="mch-field-error">{machineFormErrors.machineName}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Machine Type <em>*</em>
                      </label>
                      <div className="mch-select-wrap">
                        <select
                          className={`mch-select ${machineFormErrors.machineType ? 'error' : ''}`}
                          value={machineFormData.machineType}
                          onChange={(e) => {
                            setMachineFormData({ ...machineFormData, machineType: e.target.value });
                            if (machineFormErrors.machineType) {
                              setMachineFormErrors({ ...machineFormErrors, machineType: null });
                            }
                          }}
                        >
                          {lookups.machineTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="mch-select-arrow" size={16} strokeWidth={2} />
                      </div>
                      {machineFormErrors.machineType && (
                        <span className="mch-field-error">{machineFormErrors.machineType}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">Registration No</label>
                      <input
                        className="mch-input"
                        value={machineFormData.registrationNo}
                        onChange={(e) => setMachineFormData({ ...machineFormData, registrationNo: e.target.value.toUpperCase() })}
                        placeholder="e.g. AP 16 CZ 4521"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Purchase & Valuation */}
                <div className="mch-form-section">
                  <h4 className="mch-section-title">2. PURCHASE & VALUATION</h4>
                  <div className="mch-form-grid three-col">
                    <div className="mch-field">
                      <label className="mch-label">
                        Purchase Date <em>*</em>
                      </label>
                      <input
                        type="date"
                        className={`mch-input ${machineFormErrors.purchaseDate ? 'error' : ''}`}
                        value={machineFormData.purchaseDate}
                        onChange={(e) => {
                          setMachineFormData({ ...machineFormData, purchaseDate: e.target.value });
                          if (machineFormErrors.purchaseDate) {
                            setMachineFormErrors({ ...machineFormErrors, purchaseDate: null });
                          }
                        }}
                      />
                      {machineFormErrors.purchaseDate && (
                        <span className="mch-field-error">{machineFormErrors.purchaseDate}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Purchase Cost (₹) <em>*</em>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={`mch-input ${machineFormErrors.purchaseCost ? 'error' : ''}`}
                        value={machineFormData.purchaseCost}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMachineFormData({
                            ...machineFormData,
                            purchaseCost: val,
                            currentValue: machineFormData.currentValue === '' || machineFormData.currentValue === machineFormData.purchaseCost ? val : machineFormData.currentValue
                          });
                          if (machineFormErrors.purchaseCost) {
                            setMachineFormErrors({ ...machineFormErrors, purchaseCost: null });
                          }
                        }}
                        placeholder="e.g. 750000"
                      />
                      {machineFormErrors.purchaseCost && (
                        <span className="mch-field-error">{machineFormErrors.purchaseCost}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Current Value (₹) <em>*</em>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={`mch-input ${machineFormErrors.currentValue ? 'error' : ''}`}
                        value={machineFormData.currentValue}
                        onChange={(e) => {
                          setMachineFormData({ ...machineFormData, currentValue: e.target.value });
                          if (machineFormErrors.currentValue) {
                            setMachineFormErrors({ ...machineFormErrors, currentValue: null });
                          }
                        }}
                        placeholder="e.g. 610000"
                      />
                      {machineFormErrors.currentValue && (
                        <span className="mch-field-error">{machineFormErrors.currentValue}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Specifications & Status */}
                <div className="mch-form-section">
                  <h4 className="mch-section-title">3. SPECIFICATIONS & STATUS</h4>
                  <div className="mch-form-grid">
                    <div className="mch-field">
                      <label className="mch-label">
                        Fuel / Power Type <em>*</em>
                      </label>
                      <div className="mch-select-wrap">
                        <select
                          className={`mch-select ${machineFormErrors.fuelType ? 'error' : ''}`}
                          value={machineFormData.fuelType}
                          onChange={(e) => {
                            setMachineFormData({ ...machineFormData, fuelType: e.target.value });
                            if (machineFormErrors.fuelType) {
                              setMachineFormErrors({ ...machineFormErrors, fuelType: null });
                            }
                          }}
                        >
                          {lookups.fuelTypes.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="mch-select-arrow" size={16} strokeWidth={2} />
                      </div>
                      {machineFormErrors.fuelType && (
                        <span className="mch-field-error">{machineFormErrors.fuelType}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Status <em>*</em>
                      </label>
                      <div className="mch-select-wrap">
                        <select
                          className={`mch-select ${machineFormErrors.status ? 'error' : ''}`}
                          value={machineFormData.status}
                          onChange={(e) => {
                            setMachineFormData({ ...machineFormData, status: e.target.value });
                            if (machineFormErrors.status) {
                              setMachineFormErrors({ ...machineFormErrors, status: null });
                            }
                          }}
                        >
                          {lookups.statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="mch-select-arrow" size={16} strokeWidth={2} />
                      </div>
                      {machineFormErrors.status && (
                        <span className="mch-field-error">{machineFormErrors.status}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">Manufacturer / Brand</label>
                      <input
                        className="mch-input"
                        value={machineFormData.manufacturer}
                        onChange={(e) => setMachineFormData({ ...machineFormData, manufacturer: e.target.value })}
                        placeholder="e.g. Mahindra, VST, John Deere"
                      />
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">Model Number / Horsepower</label>
                      <input
                        className="mch-input"
                        value={machineFormData.modelNumber}
                        onChange={(e) => setMachineFormData({ ...machineFormData, modelNumber: e.target.value })}
                        placeholder="e.g. 575 DI (45 HP)"
                      />
                    </div>

                    <div className="mch-field full">
                      <label className="mch-label">Notes & Maintenance Details</label>
                      <textarea
                        className="mch-textarea"
                        value={machineFormData.notes}
                        onChange={(e) => setMachineFormData({ ...machineFormData, notes: e.target.value })}
                        placeholder="Usage notes, attachments supported, warranty or scheduled maintenance tasks..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mch-modal-footer">
                <button type="button" className="mch-btn-secondary" onClick={() => setIsMachineFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="mch-btn-primary">
                  {editingMachine ? 'Save Changes' : 'Register Machinery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: VIEW MACHINERY DETAILS + ASSOCIATED EXPENSES ─────────── */}
      {viewingMachine && (
        <div className="mch-modal-backdrop" onClick={() => setViewingMachine(null)}>
          <div
            className="mch-modal wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-machine-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mch-modal-header">
              <div>
                <h3 id="view-machine-title">Machinery Profile</h3>
                <p>Complete asset profile, specifications, and operating expenses history</p>
              </div>
              <button
                type="button"
                className="mch-modal-close"
                onClick={() => setViewingMachine(null)}
                aria-label="Close dialog"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="mch-modal-body">
              <div className="mch-view-header-card">
                <div className="mch-view-avatar">
                  {getMachineIcon(viewingMachine.machineType)}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#1e3325' }}>
                    {viewingMachine.machineName}
                  </h2>
                  <div className="mch-view-tags">
                    <span className="mch-code-badge">{viewingMachine.machineCode}</span>
                    <span className="mch-type-tag">{viewingMachine.machineType}</span>
                    <span
                      className={`mch-status-pill ${
                        viewingMachine.status === 'Active'
                          ? 'active'
                          : viewingMachine.status === 'Under Maintenance'
                          ? 'maintenance'
                          : 'inactive'
                      }`}
                    >
                      <span className="mch-status-dot" />
                      {viewingMachine.status}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="mch-btn-primary"
                  style={{ padding: '7px 12px', fontSize: '11px' }}
                  onClick={() => handleOpenAddExpense(viewingMachine)}
                >
                  <span>＋</span> Add Expense
                </button>
              </div>

              <div className="mch-view-metrics-grid">
                <div className="mch-view-metric-box">
                  <small>Purchase Cost</small>
                  <strong>{formatINR(viewingMachine.purchaseCost)}</strong>
                </div>
                <div className="mch-view-metric-box">
                  <small>Current Book Value</small>
                  <strong style={{ color: '#0369a1' }}>{formatINR(viewingMachine.currentValue)}</strong>
                </div>
                <div className="mch-view-metric-box">
                  <small>Estimated Depreciation</small>
                  <strong style={{ color: Number(viewingMachine.purchaseCost) - Number(viewingMachine.currentValue) > 0 ? '#b45309' : '#15803d' }}>
                    {formatINR(Math.max(0, Number(viewingMachine.purchaseCost) - Number(viewingMachine.currentValue)))}
                  </strong>
                </div>
              </div>

              <div className="mch-detail-grid">
                <div className="mch-detail-card">
                  <h4>
                    <span>⚙</span> Machine Specifications
                  </h4>
                  <div className="mch-detail-list">
                    <div className="mch-detail-row">
                      <span>Machine Type:</span>
                      <strong>{viewingMachine.machineType}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Registration No:</span>
                      <strong>
                        {viewingMachine.registrationNo ? (
                          <span className="mch-reg-badge">{viewingMachine.registrationNo}</span>
                        ) : (
                          'None'
                        )}
                      </strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Fuel / Power:</span>
                      <strong>{viewingMachine.fuelType}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Manufacturer:</span>
                      <strong>{viewingMachine.manufacturer || '—'}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Model / HP:</span>
                      <strong>{viewingMachine.modelNumber || '—'}</strong>
                    </div>
                  </div>
                </div>

                <div className="mch-detail-card">
                  <h4>
                    <span>📅</span> Purchase & Operations
                  </h4>
                  <div className="mch-detail-list">
                    <div className="mch-detail-row">
                      <span>Purchase Date:</span>
                      <strong>{formatDate(viewingMachine.purchaseDate)}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Operational Status:</span>
                      <strong>{viewingMachine.status}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Asset Code:</span>
                      <strong>{viewingMachine.machineCode}</strong>
                    </div>
                  </div>

                  {viewingMachine.notes && (
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                        Notes / Maintenance Log
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                        {viewingMachine.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Associated Expenses Table (/api/Machinery/{machineryId}/expenses) */}
              <div style={{ marginTop: '10px' }}>
                <h4 className="mch-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>4. Operating & Maintenance Expenses ({machineExpensesHistory.length})</span>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'none', fontWeight: 500 }}>
                    Total: {formatINR(machineExpensesHistory.reduce((s, x) => s + (Number(x.amount) || 0), 0))}
                  </span>
                </h4>

                {loadingMachineExpenses ? (
                  <p style={{ fontSize: '11.5px', color: '#64748b' }}>Loading expense history from API...</p>
                ) : machineExpensesHistory.length === 0 ? (
                  <p style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No operating expenses recorded yet for this machine.
                  </p>
                ) : (
                  <div className="mch-table-wrap">
                    <table className="mch-table" style={{ minWidth: '600px' }}>
                      <thead>
                        <tr>
                          <th>DATE</th>
                          <th>EXPENSE TYPE</th>
                          <th>AMOUNT</th>
                          <th>OPERATOR</th>
                          <th>REMARKS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {machineExpensesHistory.map((ex) => (
                          <tr key={ex.id}>
                            <td>{formatDate(ex.date)}</td>
                            <td>
                              <span className="mch-type-tag">{ex.expenseType}</span>
                            </td>
                            <td>
                              <strong style={{ color: '#b91c1c' }}>{formatINR(ex.amount)}</strong>
                            </td>
                            <td>{ex.operator || '—'}</td>
                            <td>
                              <small style={{ color: '#64748b' }}>{ex.remarks || '—'}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="mch-modal-footer">
              <button
                type="button"
                className="mch-btn-secondary"
                onClick={() => {
                  const m = viewingMachine;
                  setViewingMachine(null);
                  handleOpenEditMachine(m);
                }}
              >
                ✎ Edit Machine
              </button>
              <button type="button" className="mch-btn-primary" onClick={() => setViewingMachine(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: RECORD / EDIT OPERATING EXPENSE ───────────────────────── */}
      {isExpenseModalOpen && (
        <div className="mch-modal-backdrop" onClick={() => setIsExpenseModalOpen(false)}>
          <div
            className="mch-modal mch-expense-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mch-modal-header">
              <div>
                <h3 id="expense-form-title">
                  {editingExpense ? 'Edit Machinery Expense' : 'Record Machinery Expense'}
                </h3>
                <p>Record fuel refill, routine servicing, repairs, or operator wages.</p>
              </div>
              <button
                type="button"
                className="mch-modal-close"
                onClick={() => setIsExpenseModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmitExpenseForm} className="mch-form">
              <div className="mch-modal-body mch-expense-modal-body">
                {/* Row 1: Select Machine (Full Width) */}
                <div className="mch-field">
                  <label className="mch-label">
                    Select Machine <span className="mch-req">*</span>
                  </label>
                  <div className="mch-select-wrap">
                    <select
                      className={`mch-select ${expenseFormErrors.machineryId ? 'error' : ''}`}
                      value={expenseFormData.machineryId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        const matched = machineryList.find((m) => String(m.id) === String(selId));
                        setExpenseFormData({
                          ...expenseFormData,
                          machineryId: selId,
                          machineName: matched ? matched.machineName : ''
                        });
                        if (expenseFormErrors.machineryId) {
                          setExpenseFormErrors({ ...expenseFormErrors, machineryId: null });
                        }
                      }}
                    >
                      <option value="">-- Choose Machine --</option>
                      {machineryList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.machineName} ({m.machineCode})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="mch-select-arrow" aria-hidden="true" />
                  </div>
                  {expenseFormErrors.machineryId && (
                    <span className="mch-field-error">{expenseFormErrors.machineryId}</span>
                  )}
                </div>

                {/* Row 2: Expense Type | Expense Date (2-column grid) */}
                <div className="mch-form-grid">
                  <div className="mch-field">
                    <label className="mch-label">
                      Expense Type <span className="mch-req">*</span>
                    </label>
                    <div className="mch-select-wrap">
                      <select
                        className={`mch-select ${expenseFormErrors.expenseType ? 'error' : ''}`}
                        value={expenseFormData.expenseType}
                        onChange={(e) => {
                          setExpenseFormData({ ...expenseFormData, expenseType: e.target.value });
                          if (expenseFormErrors.expenseType) {
                            setExpenseFormErrors({ ...expenseFormErrors, expenseType: null });
                          }
                        }}
                      >
                        {lookups.expenseTypes.map((t) => (
                          <option key={t.id || t.code || t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="mch-select-arrow" aria-hidden="true" />
                    </div>
                    {expenseFormErrors.expenseType && (
                      <span className="mch-field-error">{expenseFormErrors.expenseType}</span>
                    )}
                  </div>

                  <div className="mch-field">
                    <label className="mch-label">
                      Expense Date <span className="mch-req">*</span>
                    </label>
                    <input
                      type="date"
                      className={`mch-input ${expenseFormErrors.date ? 'error' : ''}`}
                      value={expenseFormData.date}
                      onChange={(e) => {
                        setExpenseFormData({ ...expenseFormData, date: e.target.value });
                        if (expenseFormErrors.date) {
                          setExpenseFormErrors({ ...expenseFormErrors, date: null });
                        }
                      }}
                    />
                    {expenseFormErrors.date && (
                      <span className="mch-field-error">{expenseFormErrors.date}</span>
                    )}
                  </div>
                </div>

                {/* Row 3: Amount (₹) | Operator / Workshop (2-column grid) */}
                <div className="mch-form-grid">
                  <div className="mch-field">
                    <label className="mch-label">
                      Amount (₹) <span className="mch-req">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      className={`mch-input ${expenseFormErrors.amount ? 'error' : ''}`}
                      value={expenseFormData.amount}
                      onChange={(e) => {
                        setExpenseFormData({ ...expenseFormData, amount: e.target.value });
                        if (expenseFormErrors.amount) {
                          setExpenseFormErrors({ ...expenseFormErrors, amount: null });
                        }
                      }}
                      placeholder="e.g. 2500"
                    />
                    {expenseFormErrors.amount && (
                      <span className="mch-field-error">{expenseFormErrors.amount}</span>
                    )}
                  </div>

                  <div className="mch-field">
                    <label className="mch-label">Operator / Workshop</label>
                    <input
                      className="mch-input"
                      value={expenseFormData.operator}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, operator: e.target.value })}
                      placeholder="e.g. Ramesh, Workshop A"
                    />
                  </div>
                </div>

                {/* Row 4: Remarks / Notes (Full Width) */}
                <div className="mch-field">
                  <label className="mch-label">Remarks / Notes</label>
                  <textarea
                    className="mch-textarea"
                    value={expenseFormData.remarks}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, remarks: e.target.value })}
                    placeholder="Details: Fuel quantity, replacement spare parts, service description..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="mch-modal-footer">
                {editingExpense && (
                  <button
                    type="button"
                    className="mch-btn-danger"
                    style={{
                      marginRight: 'auto',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '0 16px',
                      height: '42px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onClick={() => {
                      const itemToDelete = editingExpense;
                      setIsExpenseModalOpen(false);
                      setEditingExpense(null);
                      setDeleteConfirm({ type: 'expense', item: itemToDelete });
                    }}
                  >
                    Delete Expense
                  </button>
                )}
                <button type="button" className="mch-btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="mch-btn-primary">
                  {editingExpense ? 'Update Expense' : 'Save Expense Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: DELETE CONFIRMATION ──────────────────────────────────── */}
      {deleteConfirm && (
        <div className="mch-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div
            className="mch-modal compact"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mch-modal-header">
              <div>
                <h3 id="delete-dialog-title" style={{ color: '#b91c1c' }}>
                  Confirm Deletion
                </h3>
                <p>Are you sure you want to remove this record?</p>
              </div>
              <button
                type="button"
                className="mch-modal-close"
                onClick={() => setDeleteConfirm(null)}
                aria-label="Close dialog"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="mch-modal-body">
              {deleteConfirm.type === 'machine' ? (
                <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
                  You are about to delete machinery{' '}
                  <strong>{deleteConfirm.item.machineName}</strong> (
                  <span className="mch-code-badge">{deleteConfirm.item.machineCode}</span>
                  {deleteConfirm.item.registrationNo ? ` • ${deleteConfirm.item.registrationNo}` : ''}).
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
                  You are about to delete expense voucher{' '}
                  <strong>EXP-{deleteConfirm.item.id}</strong> (
                  <span style={{ fontWeight: 600 }}>{deleteConfirm.item.expenseType}</span> •{' '}
                  <span style={{ color: '#b91c1c', fontWeight: 600 }}>{formatINR(deleteConfirm.item.amount)}</span> for{' '}
                  {deleteConfirm.item.machineName}).
                </p>
              )}
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '11px',
                  color: '#991b1b',
                  marginTop: '10px'
                }}
              >
                ⚠️ <strong>Warning:</strong> This action cannot be undone and will update your farm asset and financial records.
              </div>
            </div>

            <div className="mch-modal-footer">
              <button type="button" className="mch-btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button type="button" className="mch-btn-danger" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
