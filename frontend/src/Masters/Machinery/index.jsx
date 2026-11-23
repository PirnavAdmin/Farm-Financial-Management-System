import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tractor,
  CircleCheck,
  Wrench,
  IndianRupee,
  Receipt,
  Fuel,
  Settings,
  X,
  ChevronDown,
  Search,
  Calendar,
  AlertTriangle,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Layers,
  CheckCircle2,
  HelpCircle
} from './MachineryIcons.jsx';
import {
  machineryService,
  normalizeMachine,
  normalizeRental,
  normalizeExpense,
  SEED_MACHINERY,
  SEED_RENTALS,
  SEED_EXPENSES,
  SEED_LOOKUPS,
  compareMachineCodes,
  SAMPLE_PHOTOS,
  USAGE_BASES,
  EXPENSE_TYPES,
  MACHINE_STATUSES
} from '../../services/machineryService.js';
import { farmerService } from '../../services/farmerService.js';
import { supplierService } from '../../services/supplierService.js';
import './machinery.css';

// ─── Formatters ─────────────────────────────────────────────────────────────
const formatINR = (val) => {
  const num = Number(val) || 0;
  return '₹\u00A0' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

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

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '—';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return String(dateTimeStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateTimeStr);
  }
};

const getNowISO = () => new Date().toISOString().slice(0, 16);
const getFutureISO = (hours = 8) => new Date(Date.now() + hours * 3600000).toISOString().slice(0, 16);

// ─── Empty Forms Initial State ──────────────────────────────────────────────
const EMPTY_MACHINE_FORM = {
  machineCode: '',
  machineName: '',
  machineType: 'Tractor',
  registrationNo: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  purchaseCost: '',
  currentValue: '',
  fuelType: 'Diesel',
  status: 'Available',
  photos: [],
  modelNumber: '',
  manufacturer: '',
  notes: ''
};

const EMPTY_RENTAL_FORM = {
  rentalCode: '',
  farmerId: '',
  farmerName: '',
  farmerContact: '',
  landArea: '',
  landUnit: 'Acres',
  machineryId: '',
  startDateTime: getNowISO(),
  endDateTime: getFutureISO(8),
  usageBasis: 'Hourly',
  hourlyDuration: 8,
  rate: 850,
  totalCharge: 6800,
  purpose: 'Field Ploughing & Land Preparation',
  photos: [],
  notes: '',
  status: 'Active'
};

const EMPTY_EXPENSE_FORM = {
  machineryId: '',
  expenseType: 'Fuel',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  quantity: '',
  unit: 'Litres',
  supplier: '',
  description: '',
  receiptPhoto: '',
  additionalPhotos: [],
  operator: '',
  notes: ''
};

export default function Machinery({ initialTab = 'hub', onNavigate: _onNavigate }) {
  // Navigation screen: 'hub' (First screen with 3 options) | 'rentals' | 'expenses' | 'details'
  const [currentScreen, setCurrentScreen] = useState(initialTab);

  // Lookups & Data State
  const [machineTypes, setMachineTypes] = useState(SEED_LOOKUPS.machineTypes);
  const [newCustomType, setNewCustomType] = useState('');
  const [showAddTypeInput, setShowAddTypeInput] = useState(false);

  // Machinery fleet state
  const [machineryList, setMachineryList] = useState([]);
  const [loadingMachinery, setLoadingMachinery] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [machineryPage, setMachineryPage] = useState(1);
  const machineryPageSize = 7;
  const [sortColumn, setSortColumn] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');

  // Rentals state
  const [rentalsList, setRentalsList] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(true);
  const [rentalSearchQuery, setRentalSearchQuery] = useState('');
  const [rentalStatusFilter, setRentalStatusFilter] = useState('All');
  const [rentalMachineFilter, setRentalMachineFilter] = useState('All');
  const [rentalPage, setRentalPage] = useState(1);
  const rentalPageSize = 7;

  // Expenses state
  const [expensesList, setExpensesList] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All');
  const [expenseMachineFilter, setExpenseMachineFilter] = useState('All');
  const [expensePage, setExpensePage] = useState(1);
  const expensePageSize = 8;

  // Registered Farmers & Suppliers for quick picking
  const [registeredFarmers, setRegisteredFarmers] = useState([]);
  const [registeredSuppliers, setRegisteredSuppliers] = useState([]);

  // Modals state
  const [isMachineFormOpen, setIsMachineFormOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineFormData, setMachineFormData] = useState(EMPTY_MACHINE_FORM);
  const [machineFormErrors, setMachineFormErrors] = useState({});
  const [viewingMachine, setViewingMachine] = useState(null);

  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState(null);
  const [rentalFormData, setRentalFormData] = useState(EMPTY_RENTAL_FORM);
  const [rentalFormErrors, setRentalFormErrors] = useState({});
  const [rentalConflictObj, setRentalConflictObj] = useState(null); // { available: false, conflictingRental, message }
  const [viewingRental, setViewingRental] = useState(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState(EMPTY_EXPENSE_FORM);
  const [expenseFormErrors, setExpenseFormErrors] = useState({});
  const [viewingExpense, setViewingExpense] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'machine' | 'rental' | 'expense', item }

  // Full-screen Image Lightbox
  const [lightboxImage, setLightboxImage] = useState(null);

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

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const fetchMachinery = useCallback(async () => {
    setLoadingMachinery(true);
    try {
      const data = await machineryService.getMachinery();
      const sorted = (Array.isArray(data) ? data : []).slice().sort((a, b) => compareMachineCodes(a, b, 'asc'));
      setMachineryList(sorted);
    } catch {
      setMachineryList(SEED_MACHINERY.map(normalizeMachine));
    } finally {
      setLoadingMachinery(false);
    }
  }, []);

  const fetchRentals = useCallback(async () => {
    setLoadingRentals(true);
    try {
      const data = await machineryService.getRentals();
      setRentalsList(Array.isArray(data) ? data : []);
    } catch {
      setRentalsList(SEED_RENTALS.map(normalizeRental));
    } finally {
      setLoadingRentals(false);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const res = await machineryService.getAllExpenses();
      setExpensesList(Array.isArray(res.items) ? res.items : []);
    } catch {
      setExpensesList(SEED_EXPENSES.map(normalizeExpense));
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const types = machineryService.getMachineTypes();
      setMachineTypes(types);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const fetchFarmersAndSuppliers = useCallback(async () => {
    try {
      const fList = await farmerService.getFarmers();
      if (Array.isArray(fList)) setRegisteredFarmers(fList);
    } catch {
      // ignore
    }
    try {
      const sList = await supplierService.getSuppliers();
      if (Array.isArray(sList)) setRegisteredSuppliers(sList);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchMachinery();
    fetchRentals();
    fetchExpenses();
    fetchLookups();
    fetchFarmersAndSuppliers();
  }, [fetchMachinery, fetchRentals, fetchExpenses, fetchLookups, fetchFarmersAndSuppliers]);

  // ─── Navigation Switch ────────────────────────────────────────────────────
  const navigateTo = (screenKey) => {
    setCurrentScreen(screenKey);
  };

  // ─── Machine Sort Handler ─────────────────────────────────────────────────
  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
    setMachineryPage(1);
  };

  // ─── Machinery Directory Filtering ────────────────────────────────────────
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
      if (typeFilter !== 'All' && m.machineType !== typeFilter) return false;
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      return true;
    });

    return list.slice().sort((a, b) => {
      if (sortColumn === 'code') return compareMachineCodes(a, b, sortDirection);
      if (sortColumn === 'name') {
        const diff = (a.machineName || '').localeCompare(b.machineName || '');
        return sortDirection === 'desc' ? -diff : diff;
      }
      if (sortColumn === 'cost') {
        const diff = (a.purchaseCost || 0) - (b.purchaseCost || 0);
        return sortDirection === 'desc' ? -diff : diff;
      }
      return compareMachineCodes(a, b, 'asc');
    });
  }, [machineryList, searchQuery, typeFilter, statusFilter, sortColumn, sortDirection]);

  const totalMachineryPages = Math.max(1, Math.ceil(filteredMachinery.length / machineryPageSize));
  const currentMachineryItems = useMemo(() => {
    const start = (machineryPage - 1) * machineryPageSize;
    return filteredMachinery.slice(start, start + machineryPageSize);
  }, [filteredMachinery, machineryPage, machineryPageSize]);

  // ─── Rentals Filtering ────────────────────────────────────────────────────
  const filteredRentals = useMemo(() => {
    return rentalsList.filter((r) => {
      if (rentalSearchQuery.trim()) {
        const q = rentalSearchQuery.toLowerCase().trim();
        const farmerMatch = (r.farmerName || '').toLowerCase().includes(q);
        const phoneMatch = (r.farmerContact || '').toLowerCase().includes(q);
        const machineMatch = (r.machineName || '').toLowerCase().includes(q);
        const codeMatch = (r.rentalCode || '').toLowerCase().includes(q);
        const purposeMatch = (r.purpose || '').toLowerCase().includes(q);
        if (!farmerMatch && !phoneMatch && !machineMatch && !codeMatch && !purposeMatch) return false;
      }
      if (rentalStatusFilter !== 'All' && r.status !== rentalStatusFilter) return false;
      if (rentalMachineFilter !== 'All' && String(r.machineryId) !== String(rentalMachineFilter)) return false;
      return true;
    });
  }, [rentalsList, rentalSearchQuery, rentalStatusFilter, rentalMachineFilter]);

  const totalRentalPages = Math.max(1, Math.ceil(filteredRentals.length / rentalPageSize));
  const currentRentalItems = useMemo(() => {
    const start = (rentalPage - 1) * rentalPageSize;
    return filteredRentals.slice(start, start + rentalPageSize);
  }, [filteredRentals, rentalPage, rentalPageSize]);

  // ─── Expenses Filtering ───────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    return expensesList.filter((e) => {
      if (expenseSearchQuery.trim()) {
        const q = expenseSearchQuery.toLowerCase().trim();
        const machineMatch = (e.machineName || '').toLowerCase().includes(q);
        const typeMatch = (e.expenseType || '').toLowerCase().includes(q);
        const supplierMatch = (e.supplier || '').toLowerCase().includes(q);
        const descMatch = (e.description || '').toLowerCase().includes(q);
        const codeMatch = (e.expenseCode || '').toLowerCase().includes(q);
        if (!machineMatch && !typeMatch && !supplierMatch && !descMatch && !codeMatch) return false;
      }
      if (expenseTypeFilter !== 'All' && e.expenseType !== expenseTypeFilter) return false;
      if (expenseMachineFilter !== 'All' && String(e.machineryId) !== String(expenseMachineFilter)) return false;
      return true;
    });
  }, [expensesList, expenseSearchQuery, expenseTypeFilter, expenseMachineFilter]);

  const totalExpensePages = Math.max(1, Math.ceil(filteredExpenses.length / expensePageSize));
  const currentExpenseItems = useMemo(() => {
    const start = (expensePage - 1) * expensePageSize;
    return filteredExpenses.slice(start, start + expensePageSize);
  }, [filteredExpenses, expensePage, expensePageSize]);

  // ─── Metrics Summary ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalMachines = machineryList.length;
    const available = machineryList.filter((m) => m.status === 'Available').length;
    const rented = machineryList.filter((m) => m.status === 'Rented/In Use').length;
    const underRepair = machineryList.filter((m) => m.status === 'Under Repair').length;
    const retired = machineryList.filter((m) => m.status === 'Retired').length;
    const totalAssetVal = machineryList.reduce((s, m) => s + (Number(m.currentValue) || 0), 0);

    const activeRentalsCount = rentalsList.filter((r) => r.status === 'Active').length;
    const scheduledRentalsCount = rentalsList.filter((r) => r.status === 'Scheduled').length;
    const totalRentalRevenue = rentalsList.reduce((s, r) => s + (Number(r.totalCharge) || 0), 0);

    const totalExpenseAmount = expensesList.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const fuelExpenseAmount = expensesList.filter((e) => e.expenseType === 'Fuel').reduce((s, e) => s + (Number(e.amount) || 0), 0);

    return {
      totalMachines,
      available,
      rented,
      underRepair,
      retired,
      totalAssetVal,
      activeRentalsCount,
      scheduledRentalsCount,
      totalRentalRevenue,
      totalExpenseAmount,
      fuelExpenseAmount,
      totalExpensesCount: expensesList.length
    };
  }, [machineryList, rentalsList, expensesList]);

  // ─── Availability Map for current Rental Form dates ───────────────────────
  const machineAvailabilityMap = useMemo(() => {
    if (!isRentalModalOpen || !rentalFormData.startDateTime || !rentalFormData.endDateTime) {
      return {};
    }
    return machineryService.getMachineAvailabilityMap(
      rentalFormData.startDateTime,
      rentalFormData.endDateTime,
      editingRental?.id
    );
  }, [isRentalModalOpen, rentalFormData.startDateTime, rentalFormData.endDateTime, editingRental]);

  // ─── Photo Upload Helper ──────────────────────────────────────────────────
  const handlePhotoUpload = (e, targetFormType) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Data = uploadEvent.target.result;
        if (targetFormType === 'machine') {
          setMachineFormData((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), base64Data]
          }));
        } else if (targetFormType === 'rental') {
          setRentalFormData((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), base64Data]
          }));
        } else if (targetFormType === 'expense-receipt') {
          setExpenseFormData((prev) => ({
            ...prev,
            receiptPhoto: base64Data
          }));
        } else if (targetFormType === 'expense-additional') {
          setExpenseFormData((prev) => ({
            ...prev,
            additionalPhotos: [...(prev.additionalPhotos || []), base64Data]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (index, targetFormType) => {
    if (targetFormType === 'machine') {
      setMachineFormData((prev) => ({
        ...prev,
        photos: (prev.photos || []).filter((_, i) => i !== index)
      }));
    } else if (targetFormType === 'rental') {
      setRentalFormData((prev) => ({
        ...prev,
        photos: (prev.photos || []).filter((_, i) => i !== index)
      }));
    } else if (targetFormType === 'expense-receipt') {
      setExpenseFormData((prev) => ({ ...prev, receiptPhoto: '' }));
    } else if (targetFormType === 'expense-additional') {
      setExpenseFormData((prev) => ({
        ...prev,
        additionalPhotos: (prev.additionalPhotos || []).filter((_, i) => i !== index)
      }));
    }
  };

  // ─── Machine Form Open & Submit ───────────────────────────────────────────
  const handleOpenAddMachine = () => {
    const nextCode = machineryService.generateMachineCode(machineryList);
    setMachineFormData({
      ...EMPTY_MACHINE_FORM,
      machineCode: nextCode,
      photos: [SAMPLE_PHOTOS.tractor]
    });
    setEditingMachine(null);
    setMachineFormErrors({});
    setIsMachineFormOpen(true);
  };

  const handleOpenEditMachine = (m) => {
    setEditingMachine(m);
    setMachineFormData({
      machineCode: m.machineCode || '',
      machineName: m.machineName || '',
      machineType: m.machineType || 'Tractor',
      registrationNo: m.registrationNo || '',
      purchaseDate: m.purchaseDate || '',
      purchaseCost: m.purchaseCost ?? '',
      currentValue: m.currentValue ?? '',
      fuelType: m.fuelType || 'Diesel',
      status: m.status || 'Available',
      photos: Array.isArray(m.photos) ? m.photos : [],
      modelNumber: m.modelNumber || '',
      manufacturer: m.manufacturer || '',
      notes: m.notes || ''
    });
    setMachineFormErrors({});
    setIsMachineFormOpen(true);
  };

  const handleAddCustomType = () => {
    if (!newCustomType.trim()) return;
    machineryService.addCustomMachineType(newCustomType);
    const updated = machineryService.getMachineTypes();
    setMachineTypes(updated);
    setMachineFormData((prev) => ({ ...prev, machineType: newCustomType.trim() }));
    setNewCustomType('');
    setShowAddTypeInput(false);
    showToast(`Added custom machine type "${newCustomType.trim()}"`);
  };

  const handleSaveMachine = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!machineFormData.machineName?.trim() || machineFormData.machineName.trim().length < 2) {
      errors.machineName = 'Machine name is required (min 2 characters)';
    }
    if (!machineFormData.machineType?.trim()) errors.machineType = 'Machine type is required';
    if (!machineFormData.purchaseDate) {
      errors.purchaseDate = 'Purchase date is required';
    } else if (new Date(machineFormData.purchaseDate) > new Date()) {
      errors.purchaseDate = 'Purchase date cannot be in the future';
    }
    if (machineFormData.purchaseCost === '' || isNaN(Number(machineFormData.purchaseCost)) || Number(machineFormData.purchaseCost) < 0) {
      errors.purchaseCost = 'Valid purchase cost (≥ 0) is required';
    }
    if (machineFormData.currentValue !== '' && (isNaN(Number(machineFormData.currentValue)) || Number(machineFormData.currentValue) < 0)) {
      errors.currentValue = 'Current value cannot be negative';
    }

    if (Object.keys(errors).length > 0) {
      setMachineFormErrors(errors);
      return;
    }

    try {
      if (editingMachine) {
        await machineryService.updateMachine(editingMachine.id, machineFormData);
        showToast(`Machine ${machineFormData.machineName} updated successfully`);
      } else {
        await machineryService.createMachine(machineFormData);
        showToast(`Machine ${machineFormData.machineName} added to directory`);
      }
      setIsMachineFormOpen(false);
      fetchMachinery();
      fetchLookups();
    } catch (err) {
      showToast(err.message || 'Error saving machine', 'error');
    }
  };

  // ─── Rental Form Open & Calculations ──────────────────────────────────────
  const handleOpenAddRental = (preselectedMachineId = null) => {
    const startDT = getNowISO();
    const endDT = getFutureISO(8);

    let selectedMachId = preselectedMachineId;
    if (!selectedMachId && machineryList.length > 0) {
      // Find first machine that is Available and not currently in conflict for the initial slot
      const freeMachine = machineryList.find((m) => {
        if (m.status === 'Under Repair' || m.status === 'Retired') return false;
        const chk = machineryService.checkMachineAvailability(m.id, startDT, endDT, null);
        return chk.available;
      });
      selectedMachId = freeMachine ? freeMachine.id : (machineryList[0]?.id || '');
    }

    const init = {
      ...EMPTY_RENTAL_FORM,
      machineryId: selectedMachId || '',
      startDateTime: startDT,
      endDateTime: endDT,
      usageBasis: 'Hourly',
      hourlyDuration: 8,
      rate: 850,
      totalCharge: 6800,
      photos: [SAMPLE_PHOTOS.rentalHandover]
    };

    setRentalFormData(init);
    setEditingRental(null);
    setRentalFormErrors({});
    setIsRentalModalOpen(true);

    // Live conflict check
    if (selectedMachId) {
      checkRentalConflict(selectedMachId, init.startDateTime, init.endDateTime, null);
    } else {
      setRentalConflictObj(null);
    }
  };

  const handleOpenEditRental = (rental) => {
    setEditingRental(rental);
    setRentalFormData({
      rentalCode: rental.rentalCode || '',
      farmerId: rental.farmerId || '',
      farmerName: rental.farmerName || '',
      farmerContact: rental.farmerContact || '',
      landArea: rental.landArea || '',
      landUnit: rental.landUnit || 'Acres',
      machineryId: rental.machineryId || '',
      startDateTime: rental.startDateTime || getNowISO(),
      endDateTime: rental.endDateTime || getFutureISO(6),
      usageBasis: rental.usageBasis || 'Hourly',
      hourlyDuration: rental.hourlyDuration || 0,
      rate: rental.rate || 0,
      totalCharge: rental.totalCharge || 0,
      purpose: rental.purpose || '',
      photos: Array.isArray(rental.photos) ? rental.photos : [],
      notes: rental.notes || '',
      status: rental.status || 'Active'
    });
    setRentalFormErrors({});
    setIsRentalModalOpen(true);

    checkRentalConflict(rental.machineryId, rental.startDateTime, rental.endDateTime, rental.id);
  };

  const checkRentalConflict = (mId, start, end, excludeId) => {
    if (!mId || !start || !end) {
      setRentalConflictObj(null);
      return;
    }
    const res = machineryService.checkMachineAvailability(mId, start, end, excludeId);
    if (!res.available) {
      setRentalConflictObj(res);
    } else {
      setRentalConflictObj(null);
    }
  };

  // Dynamic Rental Calculation on field changes
  const handleRentalFieldChange = (field, value) => {
    setRentalFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // If farmer selected from registered farmers list
      if (field === 'farmerId' && value) {
        const foundFarmer = registeredFarmers.find((f) => String(f.id || f.farmerCode) === String(value));
        if (foundFarmer) {
          updated.farmerName = foundFarmer.farmerName || foundFarmer.name || '';
          updated.farmerContact = foundFarmer.mobile || foundFarmer.contactNumber || '';
          if (foundFarmer.totalLand) updated.landArea = foundFarmer.totalLand;
        }
      }

      // Check date / machine conflict
      const machineToCheck = field === 'machineryId' ? value : updated.machineryId;
      const startToCheck = field === 'startDateTime' ? value : updated.startDateTime;
      const endToCheck = field === 'endDateTime' ? value : updated.endDateTime;

      if (['machineryId', 'startDateTime', 'endDateTime'].includes(field)) {
        checkRentalConflict(machineToCheck, startToCheck, endToCheck, editingRental?.id);
      }

      // Recalculate duration & charges
      if (['startDateTime', 'endDateTime', 'usageBasis', 'rate', 'landArea', 'hourlyDuration'].includes(field)) {
        const calc = machineryService.calculateRentalCharge({
          usageBasis: updated.usageBasis,
          startDateTime: updated.startDateTime,
          endDateTime: updated.endDateTime,
          hourlyDuration: field === 'hourlyDuration' ? value : undefined,
          landArea: updated.landArea,
          rate: updated.rate
        });

        if (field !== 'hourlyDuration' && updated.usageBasis === 'Hourly') {
          updated.hourlyDuration = calc.hourlyDuration;
        }
        updated.totalCharge = calc.totalCharge;
      }

      return updated;
    });

    // Clear field-specific error as user types / corrects
    setRentalFormErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[field];

      // If startDateTime or endDateTime changed, re-check cross-date validity
      if (field === 'startDateTime' || field === 'endDateTime') {
        delete nextErrors.startDateTime;
        delete nextErrors.endDateTime;
      }
      return nextErrors;
    });
  };

  const handleSaveRental = async (e) => {
    e.preventDefault();
    const errors = {};

    // 1. Machine selection & operational status check
    if (!rentalFormData.machineryId) {
      errors.machineryId = 'Please select an agricultural machine from Machinery Details';
    } else {
      const selectedMachine = machineryList.find((m) => String(m.id) === String(rentalFormData.machineryId));
      if (selectedMachine?.status === 'Under Repair') {
        errors.machineryId = 'Selected machine is Under Repair and cannot be booked for rentals';
      } else if (selectedMachine?.status === 'Retired') {
        errors.machineryId = 'Selected machine is Retired and cannot be rented';
      }
    }

    // 2. Farmer Name
    if (!rentalFormData.farmerName?.trim() || rentalFormData.farmerName.trim().length < 2) {
      errors.farmerName = 'Farmer name is required (min 2 characters)';
    } else if (!/^[a-zA-Z\s.-]+$/.test(rentalFormData.farmerName.trim())) {
      errors.farmerName = 'Farmer name should only contain letters, spaces, and hyphens';
    }

    // 3. Farmer Contact Number (10 digits)
    if (!rentalFormData.farmerContact?.trim()) {
      errors.farmerContact = 'Farmer contact number is required';
    } else {
      const cleanPhone = rentalFormData.farmerContact.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        errors.farmerContact = 'Please enter a valid 10-digit mobile number';
      }
    }

    // 4. Start & End Date Times
    if (!rentalFormData.startDateTime) {
      errors.startDateTime = 'Start date and time is required';
    }
    if (!rentalFormData.endDateTime) {
      errors.endDateTime = 'End date and time is required';
    }
    if (rentalFormData.startDateTime && rentalFormData.endDateTime) {
      const startMs = new Date(rentalFormData.startDateTime).getTime();
      const endMs = new Date(rentalFormData.endDateTime).getTime();
      if (isNaN(startMs)) {
        errors.startDateTime = 'Please enter a valid start date and time';
      }
      if (isNaN(endMs)) {
        errors.endDateTime = 'Please enter a valid end date and time';
      }
      if (!isNaN(startMs) && !isNaN(endMs)) {
        if (endMs <= startMs) {
          errors.endDateTime = 'End date and time must be later than start date and time';
        } else if (endMs - startMs < 15 * 60 * 1000) {
          errors.endDateTime = 'Rental duration must be at least 15 minutes';
        }
      }
    }

    // 5. Land Area & Usage Basis
    if (rentalFormData.usageBasis === 'Acreage-based') {
      if (rentalFormData.landArea === '' || rentalFormData.landArea === null || isNaN(Number(rentalFormData.landArea)) || Number(rentalFormData.landArea) <= 0) {
        errors.landArea = 'Land area is required for acreage-based rentals (e.g. 2.5)';
      }
    } else if (rentalFormData.landArea !== '' && rentalFormData.landArea !== null && (isNaN(Number(rentalFormData.landArea)) || Number(rentalFormData.landArea) <= 0)) {
      errors.landArea = 'Land area must be a positive number';
    }

    // 6. Hourly Duration
    if (rentalFormData.usageBasis === 'Hourly') {
      if (rentalFormData.hourlyDuration === '' || isNaN(Number(rentalFormData.hourlyDuration)) || Number(rentalFormData.hourlyDuration) <= 0) {
        errors.hourlyDuration = 'Hourly duration must be greater than 0';
      }
    }

    // 7. Rate
    if (rentalFormData.rate === '' || rentalFormData.rate === null || isNaN(Number(rentalFormData.rate)) || Number(rentalFormData.rate) <= 0) {
      errors.rate = 'Rental rate is required and must be greater than ₹0';
    }

    // 8. Purpose / Reason
    if (!rentalFormData.purpose?.trim() || rentalFormData.purpose.trim().length < 3) {
      errors.purpose = 'Reason / purpose for rental is required (min 3 characters)';
    }

    if (Object.keys(errors).length > 0) {
      setRentalFormErrors(errors);
      showToast('Please correct the highlighted form errors before saving', 'error');
      return;
    }

    // Overlap conflict check: DO NOT ALLOW overlapping dates!
    const conflictCheck = machineryService.checkMachineAvailability(
      rentalFormData.machineryId,
      rentalFormData.startDateTime,
      rentalFormData.endDateTime,
      editingRental?.id
    );

    if (!conflictCheck.available) {
      setRentalConflictObj(conflictCheck);
      showToast(conflictCheck.message, 'error');
      return;
    }

    // Attach machine details
    const targetMachine = machineryList.find((m) => String(m.id) === String(rentalFormData.machineryId));
    const payload = {
      ...rentalFormData,
      machineCode: targetMachine?.machineCode || `MCH-${rentalFormData.machineryId}`,
      machineName: targetMachine?.machineName || 'Machine',
      machineType: targetMachine?.machineType || 'Tractor'
    };

    try {
      if (editingRental) {
        await machineryService.updateRental(editingRental.id, payload);
        showToast(`Rental ${payload.rentalCode} updated successfully`);
      } else {
        await machineryService.createRental(payload);
        showToast(`Rental ${payload.rentalCode || ''} booked successfully`);
      }
      setIsRentalModalOpen(false);
      fetchRentals();
      fetchMachinery();
    } catch (err) {
      showToast(err.message || 'Error booking rental', 'error');
    }
  };

  // ─── Expense Form Open & Submit ───────────────────────────────────────────
  const handleOpenAddExpense = (preselectedMachineId = null) => {
    const selectedMachId = preselectedMachineId || (machineryList[0]?.id || '');
    setExpenseFormData({
      ...EMPTY_EXPENSE_FORM,
      machineryId: selectedMachId,
      receiptPhoto: SAMPLE_PHOTOS.receipt
    });
    setEditingExpense(null);
    setExpenseFormErrors({});
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      machineryId: expense.machineryId || '',
      expenseType: expense.expenseType || 'Fuel',
      date: expense.date || new Date().toISOString().split('T')[0],
      amount: expense.amount ?? '',
      quantity: expense.quantity ?? '',
      unit: expense.unit || '',
      supplier: expense.supplier || '',
      description: expense.description || '',
      receiptPhoto: expense.receiptPhoto || '',
      additionalPhotos: Array.isArray(expense.additionalPhotos) ? expense.additionalPhotos : [],
      operator: expense.operator || '',
      notes: expense.notes || ''
    });
    setExpenseFormErrors({});
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!expenseFormData.machineryId) errors.machineryId = 'Please select a machine';
    if (!expenseFormData.expenseType) errors.expenseType = 'Expense type is required';
    if (!expenseFormData.date) errors.date = 'Expense date is required';
    if (expenseFormData.amount === '' || isNaN(Number(expenseFormData.amount)) || Number(expenseFormData.amount) <= 0) {
      errors.amount = 'Valid positive expense amount is required';
    }
    if (expenseFormData.quantity !== '' && (isNaN(Number(expenseFormData.quantity)) || Number(expenseFormData.quantity) <= 0)) {
      errors.quantity = 'Quantity must be positive';
    }
    if (!expenseFormData.description?.trim() || expenseFormData.description.trim().length < 3) {
      errors.description = 'Description / reason is required (min 3 characters)';
    }

    if (Object.keys(errors).length > 0) {
      setExpenseFormErrors(errors);
      return;
    }

    const targetMachine = machineryList.find((m) => String(m.id) === String(expenseFormData.machineryId));
    const payload = {
      ...expenseFormData,
      machineCode: targetMachine?.machineCode || `MCH-${expenseFormData.machineryId}`,
      machineName: targetMachine?.machineName || 'Machine'
    };

    try {
      if (editingExpense) {
        await machineryService.updateExpense(editingExpense.id, payload);
        showToast('Machinery expense voucher updated');
      } else {
        await machineryService.createExpense(payload);
        showToast('Machinery operating expense recorded');
      }
      setIsExpenseModalOpen(false);
      fetchExpenses();
      fetchMachinery();
    } catch (err) {
      showToast(err.message || 'Error recording expense', 'error');
    }
  };

  // ─── Delete Actions ───────────────────────────────────────────────────────
  const handleDeleteItem = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'machine') {
        await machineryService.deleteMachine(deleteConfirm.item.id);
        showToast(`Machine ${deleteConfirm.item.machineName} deleted`);
        fetchMachinery();
      } else if (deleteConfirm.type === 'rental') {
        await machineryService.deleteRental(deleteConfirm.item.id);
        showToast(`Rental ${deleteConfirm.item.rentalCode} deleted`);
        fetchRentals();
        fetchMachinery();
      } else if (deleteConfirm.type === 'expense') {
        await machineryService.deleteExpense(deleteConfirm.item.id);
        showToast('Expense record deleted');
        fetchExpenses();
        fetchMachinery();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete record', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ─── CSV Export Handlers ──────────────────────────────────────────────────
  const handleExportMachineryCSV = () => {
    const headers = ['Machine Code', 'Machine Name', 'Type', 'Registration No', 'Purchase Date', 'Purchase Cost', 'Current Value', 'Fuel Type', 'Status'];
    const rows = filteredMachinery.map((m) => [
      m.machineCode,
      `"${m.machineName}"`,
      m.machineType,
      m.registrationNo || '',
      m.purchaseDate,
      m.purchaseCost,
      m.currentValue,
      m.fuelType,
      m.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Agriculture_Machinery_Fleet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRentalsCSV = () => {
    const headers = ['Rental Code', 'Farmer Name', 'Contact', 'Machine', 'Start Time', 'End Time', 'Usage Basis', 'Rate', 'Total Charge', 'Status'];
    const rows = filteredRentals.map((r) => [
      r.rentalCode,
      `"${r.farmerName}"`,
      r.farmerContact,
      `"${r.machineName}"`,
      r.startDateTime,
      r.endDateTime,
      r.usageBasis,
      r.rate,
      r.totalCharge,
      r.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Farmer_Machinery_Rentals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExpensesCSV = () => {
    const headers = ['Voucher Code', 'Date', 'Machine', 'Expense Type', 'Supplier', 'Quantity', 'Unit', 'Amount', 'Description'];
    const rows = filteredExpenses.map((e) => [
      e.expenseCode,
      e.date,
      `"${e.machineName}"`,
      e.expenseType,
      `"${e.supplier || ''}"`,
      e.quantity ?? '',
      e.unit || '',
      e.amount,
      `"${e.description || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Machinery_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mch-page">
      {/* ── Toast Notifications ────────────────────────────────────────────── */}
      {toast && (
        <div className={`mch-toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" className="mch-toast-close" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="mch-page-head">
        <div>
          {currentScreen !== 'hub' && (
            <button
              type="button"
              className="mch-back-btn"
              onClick={() => navigateTo('hub')}
            >
              <ArrowLeft size={14} /> Back to Machinery Options
            </button>
          )}
          <div className="mch-eyebrow">
            WORKSPACE <span>/</span> AGRICULTURE <span>/</span> MACHINERY MODULE
          </div>
          <h1 className="mch-title">
            {currentScreen === 'hub' && 'Agriculture Machinery'}
            {currentScreen === 'rentals' && 'Farmer Machinery Rental'}
            {currentScreen === 'expenses' && 'Machinery Expenses'}
            {currentScreen === 'details' && 'Machinery Details'}
          </h1>
          <p className="mch-subtitle">
            {currentScreen === 'hub' && 'Manage farmer machinery rentals, operating expenses, and agricultural equipment fleet details.'}
            {currentScreen === 'rentals' && 'Schedule, book, and audit farmer equipment assignments, land acreage, rates, and conflict checks.'}
            {currentScreen === 'expenses' && 'Track fuel refills, servicing, breakdown repairs, workshop bills, and machinery maintenance.'}
            {currentScreen === 'details' && 'Add, view, audit, and maintain farm equipment specifications, valuation, photos, and operational status.'}
          </p>
        </div>

        <div className="mch-head-actions">
          {currentScreen === 'hub' && (
            <>
              <button className="mch-btn-secondary" type="button" onClick={() => navigateTo('details')}>
                <span>⚙</span> View Fleet ({metrics.totalMachines})
              </button>
              <button className="mch-btn-primary" type="button" onClick={() => handleOpenAddRental()}>
                <Plus size={15} /> Book Rental
              </button>
            </>
          )}

          {currentScreen === 'rentals' && (
            <>
              <button className="mch-btn-secondary" type="button" onClick={handleExportRentalsCSV}>
                <Download size={14} /> Export Rentals
              </button>
              <button className="mch-btn-primary" type="button" onClick={() => handleOpenAddRental()}>
                <Plus size={15} /> Book New Rental
              </button>
            </>
          )}

          {currentScreen === 'expenses' && (
            <>
              <button className="mch-btn-secondary" type="button" onClick={handleExportExpensesCSV}>
                <Download size={14} /> Export Expenses
              </button>
              <button className="mch-btn-primary" type="button" onClick={() => handleOpenAddExpense()}>
                <Plus size={15} /> Record Expense
              </button>
            </>
          )}

          {currentScreen === 'details' && (
            <>
              <button className="mch-btn-secondary" type="button" onClick={handleExportMachineryCSV}>
                <Download size={14} /> Export Fleet
              </button>
              <button className="mch-btn-primary" type="button" onClick={handleOpenAddMachine}>
                <Plus size={15} /> Add Machinery
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="mch-tabs-nav" role="tablist">
        <button
          className={`mch-tab-btn ${currentScreen === 'hub' ? 'active' : ''}`}
          type="button"
          onClick={() => navigateTo('hub')}
        >
          <Layers size={15} style={{ marginRight: 6 }} />
          <span>Machinery Options</span>
          <span className="mch-tab-badge">Hub</span>
        </button>

        <button
          className={`mch-tab-btn ${currentScreen === 'rentals' ? 'active' : ''}`}
          type="button"
          onClick={() => navigateTo('rentals')}
        >
          <Calendar size={15} style={{ marginRight: 6 }} />
          <span>Farmer Machinery Rental</span>
          <span className="mch-tab-badge">{rentalsList.length}</span>
        </button>

        <button
          className={`mch-tab-btn ${currentScreen === 'expenses' ? 'active' : ''}`}
          type="button"
          onClick={() => navigateTo('expenses')}
        >
          <Receipt size={15} style={{ marginRight: 6 }} />
          <span>Machinery Expenses</span>
          <span className="mch-tab-badge">{expensesList.length}</span>
        </button>

        <button
          className={`mch-tab-btn ${currentScreen === 'details' ? 'active' : ''}`}
          type="button"
          onClick={() => navigateTo('details')}
        >
          <Tractor size={15} style={{ marginRight: 6 }} />
          <span>Machinery Details</span>
          <span className="mch-tab-badge">{machineryList.length}</span>
        </button>
      </div>

      {/* ── Summary KPI Cards ──────────────────────────────────────────────── */}
      <div className="mch-stats-grid">
        <div className="mch-stat-card" onClick={() => navigateTo('details')} style={{ cursor: 'pointer' }}>
          <div className="mch-stat-icon total">
            <Tractor size={22} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label">Total Machinery</span>
            <span className="mch-stat-val">{metrics.totalMachines}</span>
            <span className="mch-stat-hint">{metrics.available} Available • {metrics.rented} In Use</span>
          </div>
        </div>

        <div className="mch-stat-card" onClick={() => navigateTo('rentals')} style={{ cursor: 'pointer' }}>
          <div className="mch-stat-icon active">
            <CircleCheck size={22} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label">Active Rentals</span>
            <span className="mch-stat-val">{metrics.activeRentalsCount}</span>
            <span className="mch-stat-hint">{metrics.scheduledRentalsCount} Upcoming Scheduled</span>
          </div>
        </div>

        <div className="mch-stat-card" onClick={() => navigateTo('rentals')} style={{ cursor: 'pointer' }}>
          <div className="mch-stat-icon info">
            <IndianRupee size={22} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label">Rental Revenue</span>
            <span className="mch-stat-val">{formatINR(metrics.totalRentalRevenue)}</span>
            <span className="mch-stat-hint">{rentalsList.length} total rental bookings</span>
          </div>
        </div>

        <div className="mch-stat-card" onClick={() => navigateTo('expenses')} style={{ cursor: 'pointer' }}>
          <div className="mch-stat-icon expense">
            <Receipt size={22} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label">Machinery Expenses</span>
            <span className="mch-stat-val">{formatINR(metrics.totalExpenseAmount)}</span>
            <span className="mch-stat-hint">{metrics.totalExpensesCount} vouchers recorded</span>
          </div>
        </div>

        <div className="mch-stat-card" onClick={() => navigateTo('details')} style={{ cursor: 'pointer' }}>
          <div className="mch-stat-icon warning">
            <Wrench size={22} strokeWidth={1.8} />
          </div>
          <div className="mch-stat-info">
            <span className="mch-stat-label">Under Repair</span>
            <span className="mch-stat-val">{metrics.underRepair}</span>
            <span className="mch-stat-hint">{metrics.retired} retired equipment</span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── FIRST SCREEN: AGRICULTURE MACHINERY HUB (3 OPTIONS) ───────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {currentScreen === 'hub' && (
        <div className="mch-hub-container">
          <div className="mch-hub-intro">
            <div className="mch-hub-intro-text">
              <h2>Select an Agriculture Machinery Option</h2>
              <p>
                Choose one of the three core workflows below to manage farmer equipment rental bookings, track maintenance and operating costs, or update machinery master profiles and valuation.
              </p>
            </div>
            <button className="mch-btn-primary" type="button" onClick={() => handleOpenAddRental()}>
              <Plus size={15} /> Quick Rental Booking
            </button>
          </div>

          <div className="mch-hub-grid">
            {/* OPTION 1: Farmer Machinery Rental */}
            <div className="mch-hub-card" onClick={() => navigateTo('rentals')}>
              <div className="mch-hub-card-header">
                <div className="mch-hub-icon-wrap rentals">
                  <Calendar size={26} />
                </div>
                <span className="mch-hub-badge">Option 1</span>
              </div>
              <h3 className="mch-hub-card-title">Farmer Machinery Rental</h3>
              <p className="mch-hub-card-desc">
                Create and manage equipment assignments, rental schedules, land acreage, hourly or daily rates, and date overlap prevention.
              </p>
              <ul className="mch-hub-features">
                <li><CheckCircle2 size={14} /> Farmer ID, Name & Contact linkage</li>
                <li><CheckCircle2 size={14} /> Hourly, daily, acreage & fixed pricing</li>
                <li><CheckCircle2 size={14} /> Automated duration & total charge calculation</li>
                <li><CheckCircle2 size={14} /> Overlapping date conflict validation</li>
              </ul>
              <div className="mch-hub-stats-row">
                <div className="mch-hub-stat-item">
                  <strong>{metrics.activeRentalsCount}</strong>
                  <span>Active Rentals</span>
                </div>
                <div className="mch-hub-stat-item">
                  <strong>{formatINR(metrics.totalRentalRevenue)}</strong>
                  <span>Total Revenue</span>
                </div>
              </div>
              <div className="mch-hub-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="mch-hub-btn-open"
                  onClick={() => navigateTo('rentals')}
                >
                  Open Rentals <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="mch-hub-btn-quick"
                  onClick={() => handleOpenAddRental()}
                  title="Book new rental immediately"
                >
                  <Plus size={14} /> Book
                </button>
              </div>
            </div>

            {/* OPTION 2: Machinery Expenses */}
            <div className="mch-hub-card" onClick={() => navigateTo('expenses')}>
              <div className="mch-hub-card-header">
                <div className="mch-hub-icon-wrap expenses">
                  <Receipt size={26} />
                </div>
                <span className="mch-hub-badge">Option 2</span>
              </div>
              <h3 className="mch-hub-card-title">Machinery Expenses</h3>
              <p className="mch-hub-card-desc">
                Record and audit machine-specific operational costs, fuel refills, servicing, workshop repairs, and spare parts bills.
              </p>
              <ul className="mch-hub-features">
                <li><CheckCircle2 size={14} /> Fuel, Repair, Service, Maintenance & Other</li>
                <li><CheckCircle2 size={14} /> Quantity & unit tracking (e.g. litres, sets)</li>
                <li><CheckCircle2 size={14} /> Supplier & service provider logs</li>
                <li><CheckCircle2 size={14} /> Bill / receipt photo uploads & audit trail</li>
              </ul>
              <div className="mch-hub-stats-row">
                <div className="mch-hub-stat-item">
                  <strong>{metrics.totalExpensesCount}</strong>
                  <span>Vouchers Logged</span>
                </div>
                <div className="mch-hub-stat-item">
                  <strong>{formatINR(metrics.totalExpenseAmount)}</strong>
                  <span>Total Expense</span>
                </div>
              </div>
              <div className="mch-hub-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="mch-hub-btn-open"
                  onClick={() => navigateTo('expenses')}
                >
                  Open Expenses <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="mch-hub-btn-quick"
                  onClick={() => handleOpenAddExpense()}
                  title="Record expense immediately"
                >
                  <Plus size={14} /> Record
                </button>
              </div>
            </div>

            {/* OPTION 3: Machinery Details */}
            <div className="mch-hub-card" onClick={() => navigateTo('details')}>
              <div className="mch-hub-card-header">
                <div className="mch-hub-icon-wrap details">
                  <Tractor size={26} />
                </div>
                <span className="mch-hub-badge">Option 3</span>
              </div>
              <h3 className="mch-hub-card-title">Machinery Details</h3>
              <p className="mch-hub-card-desc">
                Add, view, and edit machinery master records with technical specs, fuel type, asset valuation, status, and photos.
              </p>
              <ul className="mch-hub-features">
                <li><CheckCircle2 size={14} /> 20+ Agricultural equipment types + custom</li>
                <li><CheckCircle2 size={14} /> Status: Available, Rented, Under Repair, Retired</li>
                <li><CheckCircle2 size={14} /> Purchase cost & book valuation tracking</li>
                <li><CheckCircle2 size={14} /> Multi-photo galleries and service history</li>
              </ul>
              <div className="mch-hub-stats-row">
                <div className="mch-hub-stat-item">
                  <strong>{metrics.totalMachines}</strong>
                  <span>Total Fleet</span>
                </div>
                <div className="mch-hub-stat-item">
                  <strong>{formatINR(metrics.totalAssetVal)}</strong>
                  <span>Book Value</span>
                </div>
              </div>
              <div className="mch-hub-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="mch-hub-btn-open"
                  onClick={() => navigateTo('details')}
                >
                  Open Details <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="mch-hub-btn-quick"
                  onClick={handleOpenAddMachine}
                  title="Add new machine immediately"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── SCREEN 1: FARMER MACHINERY RENTAL ─────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {currentScreen === 'rentals' && (
        <section className="mch-panel">
          <div className="mch-toolbar">
            <div className="mch-search-box">
              <Search size={16} className="mch-search-icon" />
              <input
                type="text"
                placeholder="Search rentals by farmer name, contact, machine, code, purpose..."
                value={rentalSearchQuery}
                onChange={(e) => {
                  setRentalSearchQuery(e.target.value);
                  setRentalPage(1);
                }}
              />
              {rentalSearchQuery && (
                <button type="button" className="mch-search-clear" onClick={() => setRentalSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="mch-filters-wrap">
              <div className="mch-select-wrap">
                <select
                  className="mch-select mch-select-filter"
                  value={rentalStatusFilter}
                  onChange={(e) => {
                    setRentalStatusFilter(e.target.value);
                    setRentalPage(1);
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown size={14} className="mch-select-arrow" />
              </div>

              <div className="mch-select-wrap">
                <select
                  className="mch-select mch-select-filter"
                  value={rentalMachineFilter}
                  onChange={(e) => {
                    setRentalMachineFilter(e.target.value);
                    setRentalPage(1);
                  }}
                >
                  <option value="All">All Machinery</option>
                  {machineryList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.machineCode} - {m.machineName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="mch-select-arrow" />
              </div>

              {(rentalSearchQuery || rentalStatusFilter !== 'All' || rentalMachineFilter !== 'All') && (
                <button
                  type="button"
                  className="mch-btn-reset-filters"
                  onClick={() => {
                    setRentalSearchQuery('');
                    setRentalStatusFilter('All');
                    setRentalMachineFilter('All');
                    setRentalPage(1);
                  }}
                  title="Reset search and filters"
                >
                  <X size={14} /> Reset Filters
                </button>
              )}
            </div>
          </div>

          <div className="mch-table-responsive">
            <table className="mch-table mch-rentals-table">
              <thead>
                <tr>
                  <th style={{ width: '105px', textAlign: 'center' }}>Rental ID</th>
                  <th style={{ width: '220px', textAlign: 'left' }}>Farmer</th>
                  <th style={{ width: '220px', textAlign: 'left' }}>Machine</th>
                  <th style={{ width: '220px', textAlign: 'left' }}>Rental Schedule</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Land Area</th>
                  <th style={{ width: '170px', textAlign: 'center' }}>Usage Basis & Rate</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Total Charge</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingRentals ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px' }}>
                      Loading farmer machinery rentals...
                    </td>
                  </tr>
                ) : currentRentalItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="mch-empty-state">
                      <div className="mch-empty-icon">
                        <Calendar size={36} />
                      </div>
                      <h3>No rental records found</h3>
                      <p>No machinery rental assignments match your search or filter criteria.</p>
                      <button className="mch-btn-primary" type="button" onClick={() => handleOpenAddRental()}>
                        <Plus size={14} /> Book Farmer Rental
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentRentalItems.map((r) => (
                    <tr key={r.id}>
                      {/* 1. Rental Code */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="mch-rental-id-badge">{r.rentalCode}</span>
                      </td>

                      {/* 2. Farmer */}
                      <td style={{ textAlign: 'left' }}>
                        <div className="mch-farmer-cell">
                          <span className="mch-farmer-name">{r.farmerName}</span>
                          <span className="mch-farmer-sub">
                            ID: {r.farmerId} • {r.farmerContact || 'No contact'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Machine */}
                      <td style={{ textAlign: 'left' }}>
                        <div className="mch-machine-cell">
                          {r.photos?.[0] && (
                            <img
                              src={r.photos[0]}
                              alt=""
                              className="mch-machine-thumb"
                              onClick={() => setLightboxImage(r.photos[0])}
                              title="Click to view full photo"
                            />
                          )}
                          <div className="mch-machine-info">
                            <span className="mch-machine-name" title={r.machineName}>{r.machineName}</span>
                            <span className="mch-machine-sub">
                              {r.machineCode} • {r.machineType}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Schedule */}
                      <td style={{ textAlign: 'left' }}>
                        <div className="mch-schedule-cell">
                          <div className="mch-schedule-row">
                            <span className="mch-schedule-tag from">From</span>
                            <span>{formatDateTime(r.startDateTime)}</span>
                          </div>
                          <div className="mch-schedule-row">
                            <span className="mch-schedule-tag to">To</span>
                            <span>{formatDateTime(r.endDateTime)}</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Land Area */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="mch-land-pill">
                          {r.landArea || '—'} {r.landUnit}
                        </span>
                      </td>

                      {/* 6. Usage Basis & Rate */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="mch-basis-cell">
                          <span className="mch-basis-tag">{r.usageBasis}</span>
                          <span className="mch-rate-sub">
                            {formatINR(r.rate)}
                            {r.usageBasis === 'Hourly' && ` / hr (${r.hourlyDuration || 0} hrs)`}
                            {r.usageBasis === 'Daily' && ' / day'}
                            {r.usageBasis === 'Acreage-based' && ' / acre'}
                          </span>
                        </div>
                      </td>

                      {/* 7. Total Charge */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="mch-total-charge-cell">
                          {formatINR(r.totalCharge)}
                        </span>
                      </td>

                      {/* 8. Status */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`mch-status-pill ${r.status.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                          {r.status}
                        </span>
                      </td>

                      {/* 9. Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="mch-actions-wrap">
                          <button
                            type="button"
                            className="mch-action-btn"
                            title="View Agreement"
                            onClick={() => setViewingRental(r)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="mch-action-btn"
                            title="Edit Rental"
                            onClick={() => handleOpenEditRental(r)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="mch-action-btn danger"
                            title="Delete Rental"
                            onClick={() => setDeleteConfirm({ type: 'rental', item: r })}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Rental Pagination */}
          <div className="mch-table-footer">
            <span className="mch-pagination-info">
              Showing {filteredRentals.length === 0 ? 0 : (rentalPage - 1) * rentalPageSize + 1} to{' '}
              {Math.min(rentalPage * rentalPageSize, filteredRentals.length)} of {filteredRentals.length} rentals
            </span>
            <div className="mch-pagination-btns">
              <button
                type="button"
                className="mch-page-btn"
                disabled={rentalPage <= 1}
                onClick={() => setRentalPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="mch-page-indicator">
                {rentalPage} of {totalRentalPages}
              </span>
              <button
                type="button"
                className="mch-page-btn"
                disabled={rentalPage >= totalRentalPages}
                onClick={() => setRentalPage((p) => Math.min(totalRentalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── SCREEN 2: MACHINERY EXPENSES ──────────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {currentScreen === 'expenses' && (
        <section className="mch-panel">
          <div className="mch-toolbar">
            <div className="mch-search-box">
              <Search size={16} className="mch-search-icon" />
              <input
                type="text"
                placeholder="Search expenses by machine, supplier, expense type, description, voucher..."
                value={expenseSearchQuery}
                onChange={(e) => {
                  setExpenseSearchQuery(e.target.value);
                  setExpensePage(1);
                }}
              />
              {expenseSearchQuery && (
                <button type="button" className="mch-search-clear" onClick={() => setExpenseSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="mch-filters-wrap">
              <div className="mch-select-wrap">
                <select
                  className="mch-select mch-select-filter"
                  value={expenseTypeFilter}
                  onChange={(e) => {
                    setExpenseTypeFilter(e.target.value);
                    setExpensePage(1);
                  }}
                >
                  <option value="All">All Expense Types</option>
                  {EXPENSE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="mch-select-arrow" />
              </div>

              <div className="mch-select-wrap">
                <select
                  className="mch-select mch-select-filter"
                  value={expenseMachineFilter}
                  onChange={(e) => {
                    setExpenseMachineFilter(e.target.value);
                    setExpensePage(1);
                  }}
                >
                  <option value="All">All Machinery</option>
                  {machineryList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.machineCode} - {m.machineName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="mch-select-arrow" />
              </div>
            </div>
          </div>

          <div className="mch-table-responsive">
            <table className="mch-table">
              <thead>
                <tr>
                  <th style={{ width: '110px', textAlign: 'center' }}>Voucher ID</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Date</th>
                  <th style={{ width: '220px', textAlign: 'left' }}>Machine</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Expense Type</th>
                  <th style={{ width: '200px', textAlign: 'left' }}>Supplier / Provider</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Quantity & Unit</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Receipt</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingExpenses ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px' }}>
                      Loading machinery operating expenses...
                    </td>
                  </tr>
                ) : currentExpenseItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="mch-empty-state">
                      <div className="mch-empty-icon">
                        <Receipt size={36} />
                      </div>
                      <h3>No expense vouchers found</h3>
                      <p>No machinery expense records match your search query or filter options.</p>
                      <button className="mch-btn-primary" type="button" onClick={() => handleOpenAddExpense()}>
                        <Plus size={14} /> Record Operating Expense
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentExpenseItems.map((e) => (
                    <tr key={e.id}>
                      {/* 1. Code */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="mch-code-pill">{e.expenseCode}</span>
                      </td>

                      {/* 2. Date */}
                      <td style={{ textAlign: 'center', fontSize: '12px' }}>
                        {formatDate(e.date)}
                      </td>

                      {/* 3. Machine */}
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#1e3325' }}>{e.machineName}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{e.machineCode}</span>
                        </div>
                      </td>

                      {/* 4. Expense Type */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="mch-fuel-badge">
                          {e.expenseType === 'Fuel' && <Fuel size={12} />}
                          {e.expenseType === 'Repair' && <Wrench size={12} />}
                          {e.expenseType === 'Service' && <Settings size={12} />}
                          {e.expenseType === 'Maintenance' && <Wrench size={12} />}
                          {e.expenseType}
                        </span>
                      </td>

                      {/* 5. Supplier */}
                      <td style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '12.5px', color: '#334155' }}>
                          {e.supplier || e.operator || 'General Farm Supplier'}
                        </span>
                      </td>

                      {/* 6. Quantity & Unit */}
                      <td style={{ textAlign: 'center', fontSize: '12px' }}>
                        {e.quantity ? `${e.quantity} ${e.unit || ''}` : '—'}
                      </td>

                      {/* 7. Amount */}
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#b91c1c', fontSize: '13.5px' }}>
                        {formatINR(e.amount)}
                      </td>

                      {/* 8. Receipt */}
                      <td style={{ textAlign: 'center' }}>
                        {e.receiptPhoto ? (
                          <img
                            src={e.receiptPhoto}
                            alt="Receipt"
                            className="mch-thumb-preview"
                            onClick={() => setLightboxImage(e.receiptPhoto)}
                            title="Click to view receipt bill"
                          />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>None</span>
                        )}
                      </td>

                      {/* 9. Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="mch-actions-wrap">
                          <button
                            type="button"
                            className="mch-action-btn"
                            title="View Voucher"
                            onClick={() => setViewingExpense(e)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="mch-action-btn"
                            title="Edit Expense"
                            onClick={() => handleOpenEditExpense(e)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="mch-action-btn danger"
                            title="Delete Expense"
                            onClick={() => setDeleteConfirm({ type: 'expense', item: e })}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Expense Pagination */}
          <div className="mch-table-footer">
            <span className="mch-pagination-info">
              Showing {filteredExpenses.length === 0 ? 0 : (expensePage - 1) * expensePageSize + 1} to{' '}
              {Math.min(expensePage * expensePageSize, filteredExpenses.length)} of {filteredExpenses.length} vouchers
            </span>
            <div className="mch-pagination-btns">
              <button
                type="button"
                className="mch-page-btn"
                disabled={expensePage <= 1}
                onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="mch-page-indicator">
                {expensePage} of {totalExpensePages}
              </span>
              <button
                type="button"
                className="mch-page-btn"
                disabled={expensePage >= totalExpensePages}
                onClick={() => setExpensePage((p) => Math.min(totalExpensePages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── SCREEN 3: MACHINERY DETAILS (FLEET DIRECTORY) ─────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {currentScreen === 'details' && (
        <section className="mch-panel">
          <div className="mch-toolbar">
            <div className="mch-search-box">
              <Search size={16} className="mch-search-icon" />
              <input
                type="text"
                placeholder="Search machinery by name, registration number, type, model..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setMachineryPage(1);
                }}
              />
              {searchQuery && (
                <button type="button" className="mch-search-clear" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="mch-filters-wrap">
              <div className="mch-select-wrap">
                <select
                  className="mch-select mch-select-filter"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setMachineryPage(1);
                  }}
                >
                  <option value="All">All Machine Types</option>
                  {machineTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="mch-select-arrow" />
              </div>

              <div className="mch-select-wrap">
                <select
                  className="mch-select mch-select-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setMachineryPage(1);
                  }}
                >
                  <option value="All">All Statuses</option>
                  {MACHINE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="mch-select-arrow" />
              </div>
            </div>
          </div>

          <div className="mch-table-responsive">
            <table className="mch-table">
              <thead>
                <tr>
                  <th style={{ width: '110px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('code')}>
                    Code {sortColumn === 'code' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ width: '250px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Machine Name {sortColumn === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Type</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Registration No</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Purchase Date</th>
                  <th style={{ width: '140px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('cost')}>
                    Purchase Cost {sortColumn === 'cost' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Current Value</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Fuel Type</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingMachinery ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '36px' }}>
                      Loading machinery directory...
                    </td>
                  </tr>
                ) : currentMachineryItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="mch-empty-state">
                      <div className="mch-empty-icon">
                        <Tractor size={36} />
                      </div>
                      <h3>No machinery records found</h3>
                      <p>No agricultural machinery matches your search criteria.</p>
                      <button className="mch-btn-primary" type="button" onClick={handleOpenAddMachine}>
                        <Plus size={14} /> Add Machinery Record
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentMachineryItems.map((m) => (
                    <tr key={m.id}>
                      {/* 1. Code */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="mch-code-pill">{m.machineCode}</span>
                      </td>

                      {/* 2. Name & Avatar */}
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={m.photos?.[0] || SAMPLE_PHOTOS.tractor}
                            alt=""
                            className="mch-thumb-preview"
                            onClick={() => setLightboxImage(m.photos?.[0] || SAMPLE_PHOTOS.tractor)}
                            title="Click to view machine photo"
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#1e3325' }}>{m.machineName}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {m.manufacturer || m.modelNumber || 'Agricultural Asset'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Type */}
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{m.machineType}</td>

                      {/* 4. Registration No */}
                      <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '12px' }}>
                        {m.registrationNo || '—'}
                      </td>

                      {/* 5. Purchase Date */}
                      <td style={{ textAlign: 'center', fontSize: '12px' }}>{formatDate(m.purchaseDate)}</td>

                      {/* 6. Purchase Cost */}
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(m.purchaseCost)}</td>

                      {/* 7. Current Value */}
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#166534' }}>{formatINR(m.currentValue)}</td>

                      {/* 8. Fuel Type */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="mch-fuel-badge">
                          <Fuel size={12} />
                          {m.fuelType}
                        </span>
                      </td>

                      {/* 9. Status */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`mch-status-pill ${m.status.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                          {m.status}
                        </span>
                      </td>

                      {/* 10. Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="mch-actions-wrap">
                          <button
                            type="button"
                            className="mch-action-btn"
                            title="View Details"
                            onClick={() => setViewingMachine(m)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="mch-action-btn"
                            title="Edit Record"
                            onClick={() => handleOpenEditMachine(m)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="mch-action-btn danger"
                            title="Delete Machinery"
                            onClick={() => setDeleteConfirm({ type: 'machine', item: m })}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Machinery Pagination */}
          <div className="mch-table-footer">
            <span className="mch-pagination-info">
              Showing {filteredMachinery.length === 0 ? 0 : (machineryPage - 1) * machineryPageSize + 1} to{' '}
              {Math.min(machineryPage * machineryPageSize, filteredMachinery.length)} of {filteredMachinery.length} machines
            </span>
            <div className="mch-pagination-btns">
              <button
                type="button"
                className="mch-page-btn"
                disabled={machineryPage <= 1}
                onClick={() => setMachineryPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="mch-page-indicator">
                {machineryPage} of {totalMachineryPages}
              </span>
              <button
                type="button"
                className="mch-page-btn"
                disabled={machineryPage >= totalMachineryPages}
                onClick={() => setMachineryPage((p) => Math.min(totalMachineryPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 1: ADD / EDIT MACHINERY RECORD ──────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {isMachineFormOpen && (
        <div className="mch-modal-backdrop">
          <div className="mch-modal" style={{ maxWidth: '740px' }}>
            <div className="mch-modal-header">
              <h3>{editingMachine ? 'Edit Machinery Record' : 'Add New Agricultural Machinery'}</h3>
              <button type="button" className="mch-modal-close" onClick={() => setIsMachineFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="mch-form" onSubmit={handleSaveMachine}>
              <div className="mch-modal-body">
                <div className="mch-form-grid">
                  {/* Machine Name */}
                  <div className="mch-field">
                    <label className="mch-label">Machine Name <span className="mch-req">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Mahindra 575 DI Tractor"
                      value={machineFormData.machineName}
                      onChange={(e) => {
                        setMachineFormData({ ...machineFormData, machineName: e.target.value });
                        if (machineFormErrors.machineName) setMachineFormErrors((p) => ({ ...p, machineName: null }));
                      }}
                      className={`mch-input ${machineFormErrors.machineName ? 'mch-input-invalid' : ''}`}
                    />
                    {machineFormErrors.machineName ? (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {machineFormErrors.machineName}</span>
                    ) : (
                      <span className="mch-field-hint">Unique farm asset name or model</span>
                    )}
                  </div>

                  {/* Machine Type */}
                  <div className="mch-field">
                    <div className="mch-label-row">
                      <label className="mch-label">Machine Type <span className="mch-req">*</span></label>
                      <button
                        type="button"
                        className="mch-link-btn"
                        onClick={() => setShowAddTypeInput(!showAddTypeInput)}
                      >
                        {showAddTypeInput ? 'Cancel' : '+ Add Custom Type'}
                      </button>
                    </div>

                    {!showAddTypeInput ? (
                      <div className="mch-select-wrap">
                        <select
                          className="mch-select"
                          value={machineFormData.machineType}
                          onChange={(e) => setMachineFormData({ ...machineFormData, machineType: e.target.value })}
                        >
                          {machineTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="mch-select-arrow" />
                      </div>
                    ) : (
                      <div className="mch-custom-type-row">
                        <input
                          type="text"
                          className="mch-input"
                          placeholder="e.g. Laser Land Leveler"
                          value={newCustomType}
                          onChange={(e) => setNewCustomType(e.target.value)}
                          autoFocus
                        />
                        <button type="button" className="mch-btn-primary" onClick={handleAddCustomType} style={{ padding: '0 14px', height: '42px', whiteSpace: 'nowrap' }}>
                          Add
                        </button>
                      </div>
                    )}
                    <span className="mch-field-hint">Select agriculture machinery category</span>
                  </div>

                  {/* Registration Number */}
                  <div className="mch-field">
                    <label className="mch-label">Registration Number</label>
                    <input
                      type="text"
                      className="mch-input"
                      placeholder="e.g. AP 16 CZ 4521"
                      value={machineFormData.registrationNo}
                      onChange={(e) => setMachineFormData({ ...machineFormData, registrationNo: e.target.value.toUpperCase() })}
                    />
                    <span className="mch-field-hint">RTO registration or internal code</span>
                  </div>

                  {/* Status */}
                  <div className="mch-field">
                    <label className="mch-label">Operational Status <span className="mch-req">*</span></label>
                    <div className="mch-select-wrap">
                      <select
                        className="mch-select"
                        value={machineFormData.status}
                        onChange={(e) => setMachineFormData({ ...machineFormData, status: e.target.value })}
                      >
                        {MACHINE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="mch-select-arrow" />
                    </div>
                    <span className="mch-field-hint">Current equipment operational availability</span>
                  </div>

                  {/* Purchase Date */}
                  <div className="mch-field">
                    <label className="mch-label">Purchase Date <span className="mch-req">*</span></label>
                    <input
                      type="date"
                      value={machineFormData.purchaseDate}
                      onChange={(e) => {
                        setMachineFormData({ ...machineFormData, purchaseDate: e.target.value });
                        if (machineFormErrors.purchaseDate) setMachineFormErrors((p) => ({ ...p, purchaseDate: null }));
                      }}
                      className={`mch-input ${machineFormErrors.purchaseDate ? 'mch-input-invalid' : ''}`}
                    />
                    {machineFormErrors.purchaseDate && <span className="mch-field-error"><AlertTriangle size={12} /> {machineFormErrors.purchaseDate}</span>}
                  </div>

                  {/* Fuel Type */}
                  <div className="mch-field">
                    <label className="mch-label">Fuel / Power Source</label>
                    <div className="mch-select-wrap">
                      <select
                        className="mch-select"
                        value={machineFormData.fuelType}
                        onChange={(e) => setMachineFormData({ ...machineFormData, fuelType: e.target.value })}
                      >
                        {SEED_LOOKUPS.fuelTypes.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="mch-select-arrow" />
                    </div>
                    <span className="mch-field-hint">Diesel, Petrol, Electric, PTO, Manual</span>
                  </div>

                  {/* Purchase Cost */}
                  <div className="mch-field">
                    <label className="mch-label">Purchase Cost (₹) <span className="mch-req">*</span></label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={machineFormData.purchaseCost}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMachineFormData({
                          ...machineFormData,
                          purchaseCost: val,
                          currentValue: machineFormData.currentValue === '' ? val : machineFormData.currentValue
                        });
                        if (machineFormErrors.purchaseCost) setMachineFormErrors((p) => ({ ...p, purchaseCost: null }));
                      }}
                      className={`mch-input ${machineFormErrors.purchaseCost ? 'mch-input-invalid' : ''}`}
                    />
                    {machineFormErrors.purchaseCost && <span className="mch-field-error"><AlertTriangle size={12} /> {machineFormErrors.purchaseCost}</span>}
                  </div>

                  {/* Current Value */}
                  <div className="mch-field">
                    <label className="mch-label">Current Book Value (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={machineFormData.currentValue}
                      onChange={(e) => setMachineFormData({ ...machineFormData, currentValue: e.target.value })}
                      className={`mch-input ${machineFormErrors.currentValue ? 'mch-input-invalid' : ''}`}
                    />
                    {machineFormErrors.currentValue && <span className="mch-field-error"><AlertTriangle size={12} /> {machineFormErrors.currentValue}</span>}
                  </div>

                  {/* Model Number */}
                  <div className="mch-field">
                    <label className="mch-label">Model Number / Spec</label>
                    <input
                      type="text"
                      className="mch-input"
                      placeholder="e.g. 575 DI (45 HP)"
                      value={machineFormData.modelNumber}
                      onChange={(e) => setMachineFormData({ ...machineFormData, modelNumber: e.target.value })}
                    />
                    <span className="mch-field-hint">Engine horsepower or implement model</span>
                  </div>

                  {/* Manufacturer */}
                  <div className="mch-field">
                    <label className="mch-label">Manufacturer / Brand</label>
                    <input
                      type="text"
                      className="mch-input"
                      placeholder="e.g. Mahindra & Mahindra"
                      value={machineFormData.manufacturer}
                      onChange={(e) => setMachineFormData({ ...machineFormData, manufacturer: e.target.value })}
                    />
                    <span className="mch-field-hint">OEM manufacturer or brand</span>
                  </div>

                  {/* Machine Photos */}
                  <div className="mch-field full">
                    <label className="mch-label">Machine Photos</label>
                    <div className="mch-photo-upload-container">
                      <div className="mch-photo-upload-btn-wrap">
                        <label className="mch-photo-upload-label">
                          <Plus size={14} /> Upload Photos
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="mch-photo-file-input"
                            onChange={(e) => handlePhotoUpload(e, 'machine')}
                          />
                        </label>
                        <span className="mch-field-hint">
                          Upload front, side, or implement photos (JPEG, PNG, WebP)
                        </span>
                      </div>

                      {machineFormData.photos?.length > 0 && (
                        <div className="mch-photo-grid">
                          {machineFormData.photos.map((src, idx) => (
                            <div key={idx} className="mch-photo-item">
                              <img src={src} alt="" onClick={() => setLightboxImage(src)} />
                              <button
                                type="button"
                                className="mch-photo-remove"
                                onClick={() => removePhoto(idx, 'machine')}
                                title="Remove photo"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mch-field full">
                    <label className="mch-label">Notes & Maintenance Guidelines</label>
                    <textarea
                      rows="3"
                      className="mch-textarea"
                      placeholder="Operational instructions, implement compatibility, service schedule..."
                      value={machineFormData.notes}
                      onChange={(e) => setMachineFormData({ ...machineFormData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="mch-modal-footer">
                <button type="button" className="mch-btn-secondary" onClick={() => setIsMachineFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="mch-btn-primary">
                  {editingMachine ? 'Save Changes' : 'Create Machinery Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 2: ADD / EDIT FARMER MACHINERY RENTAL ───────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {isRentalModalOpen && (
        <div className="mch-modal-backdrop">
          <div className="mch-modal" style={{ maxWidth: '800px' }}>
            <div className="mch-modal-header">
              <h3>{editingRental ? 'Edit Rental Assignment' : 'Farmer Machinery Rental Assignment'}</h3>
              <button type="button" className="mch-modal-close" onClick={() => setIsRentalModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="mch-form" onSubmit={handleSaveRental}>
              <div className="mch-modal-body">
                {/* ── Visual Conflict Card if an Overlap exists ──────────── */}
                {rentalConflictObj && (
                  <div className="mch-conflict-card">
                    <div className="mch-conflict-head">
                      <AlertTriangle size={18} />
                      <span>Schedule Conflict Detected: Equipment Already Booked</span>
                    </div>

                    <div className="mch-conflict-details-grid">
                      <div className="mch-conflict-box">
                        <span className="mch-conflict-box-title">Existing Conflicting Booking</span>
                        {rentalConflictObj.conflictingRental ? (
                          <>
                            <span className="mch-conflict-box-val">
                              Farmer: <strong>{rentalConflictObj.conflictingRental.farmerName}</strong>
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              Booking ID: {rentalConflictObj.conflictingRental.rentalCode} • Contact: {rentalConflictObj.conflictingRental.farmerContact || '—'}
                            </span>
                            <span className="mch-conflict-box-time" style={{ marginTop: '4px' }}>
                              Period: {formatDateTime(rentalConflictObj.conflictingRental.startDateTime)} → {formatDateTime(rentalConflictObj.conflictingRental.endDateTime)}
                            </span>
                          </>
                        ) : (
                          <span className="mch-conflict-box-val">{rentalConflictObj.message}</span>
                        )}
                      </div>

                      <div className="mch-conflict-box">
                        <span className="mch-conflict-box-title">Your Requested Slot</span>
                        <span className="mch-conflict-box-val">
                          Farmer: {rentalFormData.farmerName || 'Current Booking'}
                        </span>
                        <span className="mch-conflict-box-time" style={{ marginTop: '4px' }}>
                          Period: {formatDateTime(rentalFormData.startDateTime)} → {formatDateTime(rentalFormData.endDateTime)}
                        </span>
                        <span style={{ fontSize: '11px', color: '#b91c1c', marginTop: '4px' }}>
                          ⚠️ Overlapping rental dates are strictly prevented to protect farm operations.
                        </span>
                      </div>
                    </div>

                    <p className="mch-conflict-footer-msg">
                      <strong>Resolution:</strong> Please select a different available machine from the dropdown or change your rental start/end dates to an unbooked timeslot.
                    </p>
                  </div>
                )}

                {/* ── Success Availability Confirmation Banner ───────────── */}
                {!rentalConflictObj && rentalFormData.machineryId && rentalFormData.startDateTime && rentalFormData.endDateTime && (
                  <div className="mch-avail-banner">
                    <CheckCircle2 size={16} />
                    <span>
                      Machine is 100% available and ready for assignment from {formatDateTime(rentalFormData.startDateTime)} to {formatDateTime(rentalFormData.endDateTime)}.
                    </span>
                  </div>
                )}

                <div className="mch-form-grid">
                  {/* Start Date & Time */}
                  <div className="mch-field">
                    <label className="mch-label">Start Date and Time <span className="mch-req">*</span></label>
                    <input
                      type="datetime-local"
                      value={rentalFormData.startDateTime}
                      onChange={(e) => handleRentalFieldChange('startDateTime', e.target.value)}
                      className={`mch-input ${rentalFormErrors.startDateTime ? 'mch-input-invalid' : ''}`}
                    />
                    {rentalFormErrors.startDateTime && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {rentalFormErrors.startDateTime}</span>
                    )}
                  </div>

                  {/* End Date & Time */}
                  <div className="mch-field">
                    <label className="mch-label">End Date and Time <span className="mch-req">*</span></label>
                    <input
                      type="datetime-local"
                      value={rentalFormData.endDateTime}
                      onChange={(e) => handleRentalFieldChange('endDateTime', e.target.value)}
                      className={`mch-input ${rentalFormErrors.endDateTime ? 'mch-input-invalid' : ''}`}
                    />
                    {rentalFormErrors.endDateTime && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {rentalFormErrors.endDateTime}</span>
                    )}
                  </div>

                  {/* Select Machine from Machinery Details */}
                  <div className="mch-field full">
                    <label className="mch-label">Machine Selected from Machinery Details <span className="mch-req">*</span></label>
                    <div className="mch-select-wrap">
                      <select
                        className={`mch-select ${rentalFormErrors.machineryId ? 'mch-input-invalid' : ''}`}
                        value={rentalFormData.machineryId}
                        onChange={(e) => handleRentalFieldChange('machineryId', e.target.value)}
                      >
                        <option value="">-- Choose Agricultural Machine --</option>
                        {machineryList.map((m) => {
                          const avail = machineAvailabilityMap[m.id];
                          let tag = '✓ Available';
                          if (avail && !avail.available) {
                            tag = avail.isMaintenance
                              ? '⛔ UNDER REPAIR'
                              : avail.isRetired
                              ? '⛔ RETIRED'
                              : '⚠️ BOOKED (CONFLICT)';
                          }
                          return (
                            <option key={m.id} value={m.id}>
                              [{m.machineCode}] {m.machineName} ({m.machineType}) — {tag}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown size={14} className="mch-select-arrow" />
                    </div>
                    {rentalFormErrors.machineryId ? (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {rentalFormErrors.machineryId}</span>
                    ) : (
                      <span className="mch-field-hint">
                        <HelpCircle size={11} /> Only non-conflicting available equipment can be booked for this timeframe.
                      </span>
                    )}
                  </div>

                  {/* Quick Select Farmer */}
                  <div className="mch-field">
                    <label className="mch-label">Select Registered Farmer (Optional)</label>
                    <div className="mch-select-wrap">
                      <select
                        className="mch-select"
                        value={rentalFormData.farmerId}
                        onChange={(e) => handleRentalFieldChange('farmerId', e.target.value)}
                      >
                        <option value="">-- Select or enter manually below --</option>
                        {registeredFarmers.map((f) => (
                          <option key={f.id || f.farmerCode} value={f.id || f.farmerCode}>
                            {f.farmerCode ? `[${f.farmerCode}] ` : ''}{f.farmerName || f.name} • {f.mobile || f.contactNumber}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="mch-select-arrow" />
                    </div>
                    <span className="mch-field-hint">Auto-fills Farmer ID, Name & Contact</span>
                  </div>

                  {/* Farmer ID */}
                  <div className="mch-field">
                    <label className="mch-label">Farmer ID</label>
                    <input
                      type="text"
                      className="mch-input"
                      placeholder="e.g. FMR-001"
                      value={rentalFormData.farmerId}
                      onChange={(e) => handleRentalFieldChange('farmerId', e.target.value)}
                    />
                    <span className="mch-field-hint">Farmer master identifier</span>
                  </div>

                  {/* Farmer Name */}
                  <div className="mch-field">
                    <label className="mch-label">Farmer Name <span className="mch-req">*</span></label>
                    <input
                      type="text"
                      className={`mch-input ${rentalFormErrors.farmerName ? 'mch-input-invalid' : ''}`}
                      placeholder="Full name of farmer"
                      value={rentalFormData.farmerName}
                      onChange={(e) => handleRentalFieldChange('farmerName', e.target.value)}
                    />
                    {rentalFormErrors.farmerName && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {rentalFormErrors.farmerName}</span>
                    )}
                  </div>

                  {/* Farmer Contact Number */}
                  <div className="mch-field">
                    <label className="mch-label">Farmer Contact Number <span className="mch-req">*</span></label>
                    <input
                      type="text"
                      className={`mch-input ${rentalFormErrors.farmerContact ? 'mch-input-invalid' : ''}`}
                      placeholder="e.g. 9848022338"
                      value={rentalFormData.farmerContact}
                      onChange={(e) => handleRentalFieldChange('farmerContact', e.target.value)}
                    />
                    {rentalFormErrors.farmerContact ? (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {rentalFormErrors.farmerContact}</span>
                    ) : (
                      <span className="mch-field-hint">10-digit mobile number</span>
                    )}
                  </div>

                  {/* Land Area */}
                  <div className="mch-field">
                    <label className="mch-label">
                      Land Area {rentalFormData.usageBasis === 'Acreage-based' && <span className="mch-req">*</span>}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className={`mch-input ${rentalFormErrors.landArea ? 'mch-input-invalid' : ''}`}
                      placeholder="e.g. 4.5"
                      value={rentalFormData.landArea}
                      onChange={(e) => handleRentalFieldChange('landArea', e.target.value)}
                    />
                    {rentalFormErrors.landArea && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {rentalFormErrors.landArea}</span>
                    )}
                  </div>

                  {/* Land Unit */}
                  <div className="mch-field">
                    <label className="mch-label">Land Area Unit</label>
                    <div className="mch-select-wrap">
                      <select
                        className="mch-select"
                        value={rentalFormData.landUnit}
                        onChange={(e) => handleRentalFieldChange('landUnit', e.target.value)}
                      >
                        <option value="Acres">Acres</option>
                        <option value="Hectares">Hectares</option>
                        <option value="Bighas">Bighas</option>
                        <option value="Gunthas">Gunthas</option>
                        <option value="Cents">Cents</option>
                      </select>
                      <ChevronDown size={14} className="mch-select-arrow" />
                    </div>
                  </div>

                  {/* Usage Basis */}
                  <div className="mch-field">
                    <label className="mch-label">Usage Basis <span className="mch-req">*</span></label>
                    <div className="mch-select-wrap">
                      <select
                        className="mch-select"
                        value={rentalFormData.usageBasis}
                        onChange={(e) => handleRentalFieldChange('usageBasis', e.target.value)}
                      >
                        {USAGE_BASES.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="mch-select-arrow" />
                    </div>
                  </div>

                  {/* Hourly Duration (when hourly basis selected) */}
                  {rentalFormData.usageBasis === 'Hourly' && (
                    <div className="mch-field">
                      <label className="mch-label">Hourly Usage Duration (Hours) <span className="mch-req">*</span></label>
                      <input
                        type="number"
                        step="0.5"
                        className={`mch-input ${rentalFormErrors.hourlyDuration ? 'mch-input-invalid' : ''}`}
                        placeholder="e.g. 8.0"
                        value={rentalFormData.hourlyDuration}
                        onChange={(e) => handleRentalFieldChange('hourlyDuration', e.target.value)}
                      />
                      {rentalFormErrors.hourlyDuration ? (
                        <span className="mch-field-error"><AlertTriangle size={12} /> {rentalFormErrors.hourlyDuration}</span>
                      ) : (
                        <span className="mch-field-hint">Auto-calculated from start & end (editable)</span>
                      )}
                    </div>
                  )}

                  {/* Rate */}
                  <div className="mch-field">
                    <label className="mch-label">
                      Rate (₹) <span className="mch-req">*</span>
                      {rentalFormData.usageBasis === 'Hourly' && ' per hour'}
                      {rentalFormData.usageBasis === 'Daily' && ' per day'}
                      {rentalFormData.usageBasis === 'Acreage-based' && ' per acre'}
                      {rentalFormData.usageBasis === 'Fixed charge' && ' flat rate'}
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={rentalFormData.rate}
                      onChange={(e) => handleRentalFieldChange('rate', e.target.value)}
                      className={`mch-input ${rentalFormErrors.rate ? 'mch-input-invalid' : ''}`}
                    />
                    {rentalFormErrors.rate && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {rentalFormErrors.rate}</span>
                    )}
                  </div>

                  {/* Total Charge */}
                  <div className="mch-field">
                    <label className="mch-label">Total Charge (₹)</label>
                    <input
                      type="number"
                      className="mch-input"
                      value={rentalFormData.totalCharge}
                      onChange={(e) => setRentalFormData({ ...rentalFormData, totalCharge: e.target.value })}
                    />
                    <span className="mch-field-hint">Calculated automatically (override if needed)</span>
                  </div>

                  {/* Live Calculation Display Box */}
                  <div className="mch-calc-summary-box full">
                    <div className="mch-calc-item">
                      <span className="mch-calc-label">Pricing Basis</span>
                      <span className="mch-calc-val">{rentalFormData.usageBasis}</span>
                    </div>
                    {rentalFormData.usageBasis === 'Hourly' && (
                      <div className="mch-calc-item">
                        <span className="mch-calc-label">Duration</span>
                        <span className="mch-calc-val">{rentalFormData.hourlyDuration || 0} Hours</span>
                      </div>
                    )}
                    {rentalFormData.usageBasis === 'Acreage-based' && (
                      <div className="mch-calc-item">
                        <span className="mch-calc-label">Area</span>
                        <span className="mch-calc-val">{rentalFormData.landArea || 0} {rentalFormData.landUnit}</span>
                      </div>
                    )}
                    <div className="mch-calc-item">
                      <span className="mch-calc-label">Rate Applied</span>
                      <span className="mch-calc-val">{formatINR(rentalFormData.rate)}</span>
                    </div>
                    <div className="mch-calc-item">
                      <span className="mch-calc-label">Total Calculated Charge</span>
                      <span className="mch-calc-val" style={{ color: '#15803d', fontSize: '18px' }}>
                        {formatINR(rentalFormData.totalCharge)}
                      </span>
                    </div>
                  </div>

                  {/* Purpose / Reason */}
                  <div className="mch-field full">
                    <label className="mch-label">Reason or Purpose for the Rental <span className="mch-req">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Deep ploughing, rotavating, paddy harvesting, or spraying"
                      value={rentalFormData.purpose}
                      onChange={(e) => handleRentalFieldChange('purpose', e.target.value)}
                      className={`mch-input ${rentalFormErrors.purpose ? 'mch-input-invalid' : ''}`}
                    />
                    {rentalFormErrors.purpose && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {rentalFormErrors.purpose}</span>
                    )}
                  </div>

                  {/* Rental Photos */}
                  <div className="mch-field full">
                    <label className="mch-label">Rental & Handover Condition Photos</label>
                    <div className="mch-photo-upload-container">
                      <div className="mch-photo-upload-btn-wrap">
                        <label className="mch-photo-upload-label">
                          <Plus size={14} /> Upload Condition Photos
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="mch-photo-file-input"
                            onChange={(e) => handlePhotoUpload(e, 'rental')}
                          />
                        </label>
                        <span className="mch-field-hint">
                          Upload hour meter reading, machine dispatch, or field handover photos
                        </span>
                      </div>

                      {rentalFormData.photos?.length > 0 && (
                        <div className="mch-photo-grid">
                          {rentalFormData.photos.map((src, idx) => (
                            <div key={idx} className="mch-photo-item">
                              <img src={src} alt="" onClick={() => setLightboxImage(src)} />
                              <button
                                type="button"
                                className="mch-photo-remove"
                                onClick={() => removePhoto(idx, 'rental')}
                                title="Remove photo"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mch-field">
                    <label className="mch-label">Rental Status</label>
                    <div className="mch-select-wrap">
                      <select
                        className="mch-select"
                        value={rentalFormData.status}
                        onChange={(e) => setRentalFormData({ ...rentalFormData, status: e.target.value })}
                      >
                        <option value="Active">Active (Currently deployed in field)</option>
                        <option value="Scheduled">Scheduled (Upcoming reservation)</option>
                        <option value="Completed">Completed (Returned & Settled)</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <ChevronDown size={14} className="mch-select-arrow" />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mch-field">
                    <label className="mch-label">Notes & Handover Terms</label>
                    <input
                      type="text"
                      className="mch-input"
                      placeholder="Operator details, diesel policy, advance received..."
                      value={rentalFormData.notes}
                      onChange={(e) => setRentalFormData({ ...rentalFormData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="mch-modal-footer">
                <button type="button" className="mch-btn-secondary" onClick={() => setIsRentalModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mch-btn-primary"
                  disabled={Boolean(rentalConflictObj)}
                  style={{ opacity: rentalConflictObj ? 0.5 : 1, cursor: rentalConflictObj ? 'not-allowed' : 'pointer' }}
                >
                  {rentalConflictObj ? 'Cannot Save: Schedule Conflict' : (editingRental ? 'Update Rental' : 'Confirm & Save Rental')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 3: ADD / EDIT MACHINERY EXPENSES ────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {isExpenseModalOpen && (
        <div className="mch-modal-backdrop">
          <div className="mch-modal" style={{ maxWidth: '740px' }}>
            <div className="mch-modal-header">
              <h3>{editingExpense ? 'Edit Machinery Expense Voucher' : 'Record Machinery Operating Expense'}</h3>
              <button type="button" className="mch-modal-close" onClick={() => setIsExpenseModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="mch-form" onSubmit={handleSaveExpense}>
              <div className="mch-modal-body">
                <div className="mch-form-grid">
                  {/* Machine */}
                  <div className="mch-field full">
                    <label className="mch-label">Machine Linked <span className="mch-req">*</span></label>
                    <div className="mch-select-wrap">
                      <select
                        className="mch-select"
                        value={expenseFormData.machineryId}
                        onChange={(e) => {
                          setExpenseFormData({ ...expenseFormData, machineryId: e.target.value });
                          if (expenseFormErrors.machineryId) setExpenseFormErrors((p) => ({ ...p, machineryId: null }));
                        }}
                      >
                        <option value="">-- Choose Machine --</option>
                        {machineryList.map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.machineCode}] {m.machineName} ({m.machineType})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="mch-select-arrow" />
                    </div>
                    {expenseFormErrors.machineryId && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {expenseFormErrors.machineryId}</span>
                    )}
                  </div>

                  {/* Expense Type */}
                  <div className="mch-field">
                    <label className="mch-label">Expense Type <span className="mch-req">*</span></label>
                    <div className="mch-select-wrap">
                      <select
                        className="mch-select"
                        value={expenseFormData.expenseType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExpenseFormData({
                            ...expenseFormData,
                            expenseType: val,
                            unit: val === 'Fuel' ? 'Litres' : expenseFormData.unit
                          });
                        }}
                      >
                        {EXPENSE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="mch-select-arrow" />
                    </div>
                  </div>

                  {/* Expense Date */}
                  <div className="mch-field">
                    <label className="mch-label">Expense Date <span className="mch-req">*</span></label>
                    <input
                      type="date"
                      value={expenseFormData.date}
                      onChange={(e) => {
                        setExpenseFormData({ ...expenseFormData, date: e.target.value });
                        if (expenseFormErrors.date) setExpenseFormErrors((p) => ({ ...p, date: null }));
                      }}
                      className={`mch-input ${expenseFormErrors.date ? 'mch-input-invalid' : ''}`}
                    />
                    {expenseFormErrors.date && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {expenseFormErrors.date}</span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="mch-field">
                    <label className="mch-label">Amount (₹) <span className="mch-req">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expenseFormData.amount}
                      onChange={(e) => {
                        setExpenseFormData({ ...expenseFormData, amount: e.target.value });
                        if (expenseFormErrors.amount) setExpenseFormErrors((p) => ({ ...p, amount: null }));
                      }}
                      className={`mch-input ${expenseFormErrors.amount ? 'mch-input-invalid' : ''}`}
                    />
                    {expenseFormErrors.amount && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {expenseFormErrors.amount}</span>
                    )}
                  </div>

                  {/* Quantity & Unit in clean grouped control */}
                  <div className="mch-field">
                    <label className="mch-label">Quantity & Unit (When relevant)</label>
                    <div className="mch-input-group">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Quantity"
                        value={expenseFormData.quantity}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, quantity: e.target.value })}
                      />
                      <div className="mch-input-group-divider" />
                      <input
                        type="text"
                        placeholder="Unit (Litres, Sets, Pcs)"
                        value={expenseFormData.unit}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, unit: e.target.value })}
                      />
                    </div>
                    {expenseFormErrors.quantity && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {expenseFormErrors.quantity}</span>
                    )}
                  </div>

                  {/* Supplier or Service Provider */}
                  <div className="mch-field">
                    <label className="mch-label">Supplier or Service Provider</label>
                    <input
                      type="text"
                      list="supplier-options"
                      className="mch-input"
                      placeholder="e.g. HPCL Petrol Pump, Srinivas Workshop"
                      value={expenseFormData.supplier}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, supplier: e.target.value })}
                    />
                    <datalist id="supplier-options">
                      {registeredSuppliers.map((s) => (
                        <option key={s.id || s.supplierCode} value={s.supplierName || s.name} />
                      ))}
                    </datalist>
                    <span className="mch-field-hint">Service center, workshop, or fuel station</span>
                  </div>

                  {/* Description or Reason */}
                  <div className="mch-field">
                    <label className="mch-label">Description or Reason <span className="mch-req">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. 40L Diesel refill for paddy field ploughing"
                      value={expenseFormData.description}
                      onChange={(e) => {
                        setExpenseFormData({ ...expenseFormData, description: e.target.value });
                        if (expenseFormErrors.description) setExpenseFormErrors((p) => ({ ...p, description: null }));
                      }}
                      className={`mch-input ${expenseFormErrors.description ? 'mch-input-invalid' : ''}`}
                    />
                    {expenseFormErrors.description && (
                      <span className="mch-field-error"><AlertTriangle size={12} /> {expenseFormErrors.description}</span>
                    )}
                  </div>

                  {/* Receipt or Bill Photo */}
                  <div className="mch-field">
                    <label className="mch-label">Receipt or Bill Photo</label>
                    <div className="mch-photo-upload-container">
                      <label className="mch-photo-upload-label">
                        <Plus size={14} /> Upload Receipt Bill
                        <input
                          type="file"
                          accept="image/*"
                          className="mch-photo-file-input"
                          onChange={(e) => handlePhotoUpload(e, 'expense-receipt')}
                        />
                      </label>
                      {expenseFormData.receiptPhoto && (
                        <div className="mch-photo-item">
                          <img
                            src={expenseFormData.receiptPhoto}
                            alt="Receipt"
                            onClick={() => setLightboxImage(expenseFormData.receiptPhoto)}
                          />
                          <button
                            type="button"
                            className="mch-photo-remove"
                            onClick={() => removePhoto(0, 'expense-receipt')}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Photos */}
                  <div className="mch-field">
                    <label className="mch-label">Additional Photos (Replaced parts, etc.)</label>
                    <div className="mch-photo-upload-container">
                      <label className="mch-photo-upload-label">
                        <Plus size={14} /> Add Part Photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="mch-photo-file-input"
                          onChange={(e) => handlePhotoUpload(e, 'expense-additional')}
                        />
                      </label>
                      {expenseFormData.additionalPhotos?.length > 0 && (
                        <div className="mch-photo-grid">
                          {expenseFormData.additionalPhotos.map((src, idx) => (
                            <div key={idx} className="mch-photo-item">
                              <img src={src} alt="" onClick={() => setLightboxImage(src)} />
                              <button
                                type="button"
                                className="mch-photo-remove"
                                onClick={() => removePhoto(idx, 'expense-additional')}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mch-field full">
                    <label className="mch-label">Notes & Invoice Reference</label>
                    <textarea
                      rows="3"
                      className="mch-textarea"
                      placeholder="Invoice #, warranty terms, technician contact number..."
                      value={expenseFormData.notes}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="mch-modal-footer">
                <button type="button" className="mch-btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="mch-btn-primary">
                  {editingExpense ? 'Save Voucher' : 'Record Operating Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 4: VIEW MACHINE DETAILS & HISTORY ───────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {viewingMachine && (
        <div className="mch-modal-backdrop">
          <div className="mch-modal" style={{ maxWidth: '780px' }}>
            <div className="mch-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="mch-code-pill">{viewingMachine.machineCode}</span>
                <h3 style={{ margin: 0 }}>{viewingMachine.machineName}</h3>
                <span className={`mch-status-pill ${viewingMachine.status.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {viewingMachine.status}
                </span>
              </div>
              <button type="button" className="mch-modal-close" onClick={() => setViewingMachine(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="mch-modal-body">
              {/* Photo Showcase */}
              {viewingMachine.photos?.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Machine Photos
                  </label>
                  <div className="mch-photo-grid" style={{ marginTop: '6px' }}>
                    {viewingMachine.photos.map((p, idx) => (
                      <div key={idx} className="mch-photo-item" style={{ width: '84px', height: '84px' }}>
                        <img src={p} alt="" onClick={() => setLightboxImage(p)} title="Click to enlarge" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spec Grid */}
              <div className="mch-detail-grid">
                <div>
                  <span className="mch-detail-label">Machine Type</span>
                  <span className="mch-detail-val">{viewingMachine.machineType}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Registration Number</span>
                  <span className="mch-detail-val">{viewingMachine.registrationNo || 'Unregistered'}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Fuel / Power</span>
                  <span className="mch-detail-val">{viewingMachine.fuelType}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Purchase Date</span>
                  <span className="mch-detail-val">{formatDate(viewingMachine.purchaseDate)}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Purchase Cost</span>
                  <span className="mch-detail-val">{formatINR(viewingMachine.purchaseCost)}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Current Book Value</span>
                  <span className="mch-detail-val" style={{ color: '#166534', fontWeight: 700 }}>
                    {formatINR(viewingMachine.currentValue)}
                  </span>
                </div>
                <div>
                  <span className="mch-detail-label">Model Number</span>
                  <span className="mch-detail-val">{viewingMachine.modelNumber || 'Standard'}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Manufacturer</span>
                  <span className="mch-detail-val">{viewingMachine.manufacturer || 'OEM'}</span>
                </div>
              </div>

              {viewingMachine.notes && (
                <div style={{ marginTop: '16px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', fontSize: '12.5px' }}>
                  <strong>Notes & Specifications:</strong>
                  <p style={{ margin: '4px 0 0', color: '#475569' }}>{viewingMachine.notes}</p>
                </div>
              )}

              {/* Quick Actions inside View Modal */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="mch-btn-secondary"
                  onClick={() => {
                    setViewingMachine(null);
                    handleOpenAddRental(viewingMachine.id);
                  }}
                >
                  <Calendar size={14} /> Book Rental For This Machine
                </button>
                <button
                  type="button"
                  className="mch-btn-secondary"
                  onClick={() => {
                    setViewingMachine(null);
                    handleOpenAddExpense(viewingMachine.id);
                  }}
                >
                  <Receipt size={14} /> Log Operating Expense
                </button>
              </div>
            </div>

            <div className="mch-modal-footer">
              <button
                type="button"
                className="mch-btn-secondary"
                onClick={() => {
                  setViewingMachine(null);
                  handleOpenEditMachine(viewingMachine);
                }}
              >
                <Pencil size={14} /> Edit Machine
              </button>
              <button type="button" className="mch-btn-primary" onClick={() => setViewingMachine(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 5: VIEW RENTAL DETAILS & AGREEMENT ──────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {viewingRental && (
        <div className="mch-modal-backdrop">
          <div className="mch-modal" style={{ maxWidth: '720px' }}>
            <div className="mch-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="mch-code-pill">{viewingRental.rentalCode}</span>
                <h3 style={{ margin: 0 }}>Rental Details & Agreement</h3>
                <span className={`mch-status-pill ${viewingRental.status.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {viewingRental.status}
                </span>
              </div>
              <button type="button" className="mch-modal-close" onClick={() => setViewingRental(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="mch-modal-body">
              <div className="mch-detail-grid">
                <div>
                  <span className="mch-detail-label">Farmer Name</span>
                  <span className="mch-detail-val">{viewingRental.farmerName}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Farmer Contact</span>
                  <span className="mch-detail-val">{viewingRental.farmerContact || '—'}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Machine Assigned</span>
                  <span className="mch-detail-val">
                    {viewingRental.machineName} ({viewingRental.machineCode})
                  </span>
                </div>
                <div>
                  <span className="mch-detail-label">Land Area</span>
                  <span className="mch-detail-val">{viewingRental.landArea || '—'} {viewingRental.landUnit}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Start Date & Time</span>
                  <span className="mch-detail-val">{formatDateTime(viewingRental.startDateTime)}</span>
                </div>
                <div>
                  <span className="mch-detail-label">End Date & Time</span>
                  <span className="mch-detail-val">{formatDateTime(viewingRental.endDateTime)}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Usage Basis</span>
                  <span className="mch-detail-val">{viewingRental.usageBasis}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Rate Applied</span>
                  <span className="mch-detail-val">{formatINR(viewingRental.rate)}</span>
                </div>
              </div>

              {/* Billing Summary */}
              <div className="mch-calc-summary-box" style={{ marginTop: '16px' }}>
                <div className="mch-calc-item">
                  <span className="mch-calc-label">Usage Duration</span>
                  <span className="mch-calc-val">
                    {viewingRental.usageBasis === 'Hourly' ? `${viewingRental.hourlyDuration || 0} Hours` : viewingRental.usageBasis}
                  </span>
                </div>
                <div className="mch-calc-item">
                  <span className="mch-calc-label">Total Rental Charge</span>
                  <span className="mch-calc-val" style={{ color: '#15803d', fontSize: '19px' }}>
                    {formatINR(viewingRental.totalCharge)}
                  </span>
                </div>
              </div>

              {viewingRental.purpose && (
                <div style={{ marginTop: '12px', fontSize: '12.5px' }}>
                  <strong>Rental Purpose:</strong> {viewingRental.purpose}
                </div>
              )}

              {viewingRental.notes && (
                <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#475569' }}>
                  <strong>Notes & Terms:</strong> {viewingRental.notes}
                </div>
              )}

              {/* Handover photos */}
              {viewingRental.photos?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Condition & Handover Photos
                  </label>
                  <div className="mch-photo-grid" style={{ marginTop: '6px' }}>
                    {viewingRental.photos.map((p, idx) => (
                      <div key={idx} className="mch-photo-item" style={{ width: '80px', height: '80px' }}>
                        <img src={p} alt="" onClick={() => setLightboxImage(p)} title="Click to view full photo" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mch-modal-footer">
              <button
                type="button"
                className="mch-btn-secondary"
                onClick={() => {
                  setViewingRental(null);
                  handleOpenEditRental(viewingRental);
                }}
              >
                <Pencil size={14} /> Edit Rental
              </button>
              <button type="button" className="mch-btn-primary" onClick={() => setViewingRental(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 6: VIEW EXPENSE VOUCHER ─────────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {viewingExpense && (
        <div className="mch-modal-backdrop">
          <div className="mch-modal" style={{ maxWidth: '640px' }}>
            <div className="mch-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="mch-code-pill">{viewingExpense.expenseCode}</span>
                <h3 style={{ margin: 0 }}>Machinery Expense Voucher</h3>
              </div>
              <button type="button" className="mch-modal-close" onClick={() => setViewingExpense(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="mch-modal-body">
              <div className="mch-detail-grid">
                <div>
                  <span className="mch-detail-label">Machine</span>
                  <span className="mch-detail-val">{viewingExpense.machineName} ({viewingExpense.machineCode})</span>
                </div>
                <div>
                  <span className="mch-detail-label">Expense Type</span>
                  <span className="mch-detail-val">{viewingExpense.expenseType}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Date</span>
                  <span className="mch-detail-val">{formatDate(viewingExpense.date)}</span>
                </div>
                <div>
                  <span className="mch-detail-label">Amount</span>
                  <span className="mch-detail-val" style={{ color: '#b91c1c', fontWeight: 700, fontSize: '16px' }}>
                    {formatINR(viewingExpense.amount)}
                  </span>
                </div>
                <div>
                  <span className="mch-detail-label">Quantity & Unit</span>
                  <span className="mch-detail-val">
                    {viewingExpense.quantity ? `${viewingExpense.quantity} ${viewingExpense.unit || ''}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="mch-detail-label">Supplier / Provider</span>
                  <span className="mch-detail-val">{viewingExpense.supplier || '—'}</span>
                </div>
              </div>

              <div style={{ marginTop: '14px', fontSize: '13px' }}>
                <strong>Description / Reason:</strong>
                <p style={{ margin: '4px 0 0', color: '#334155' }}>{viewingExpense.description || '—'}</p>
              </div>

              {viewingExpense.notes && (
                <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#64748b' }}>
                  <strong>Notes:</strong> {viewingExpense.notes}
                </div>
              )}

              {/* Receipt Preview */}
              {viewingExpense.receiptPhoto && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Receipt / Bill Photo
                  </label>
                  <div style={{ marginTop: '6px' }}>
                    <img
                      src={viewingExpense.receiptPhoto}
                      alt="Bill"
                      style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                      onClick={() => setLightboxImage(viewingExpense.receiptPhoto)}
                      title="Click to zoom in"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mch-modal-footer">
              <button
                type="button"
                className="mch-btn-secondary"
                onClick={() => {
                  setViewingExpense(null);
                  handleOpenEditExpense(viewingExpense);
                }}
              >
                <Pencil size={14} /> Edit Voucher
              </button>
              <button type="button" className="mch-btn-primary" onClick={() => setViewingExpense(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 7: DELETE CONFIRMATION ──────────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="mch-modal-backdrop">
          <div className="mch-modal" style={{ maxWidth: '440px' }}>
            <div className="mch-modal-header">
              <h2>Confirm Deletion</h2>
              <button type="button" className="mch-modal-close" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="mch-modal-body">
              <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
                Are you sure you want to delete this {deleteConfirm.type === 'machine' ? 'machinery' : deleteConfirm.type} record?
                This action cannot be undone.
              </p>
            </div>
            <div className="mch-modal-footer">
              <button type="button" className="mch-btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="mch-btn-primary"
                style={{ background: '#dc2626' }}
                onClick={handleDeleteItem}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── FULL-SCREEN IMAGE LIGHTBOX ────────────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {lightboxImage && (
        <div className="mch-lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="mch-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="mch-lightbox-close"
              onClick={() => setLightboxImage(null)}
              title="Close image preview"
            >
              <X size={18} />
            </button>
            <img src={lightboxImage} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
