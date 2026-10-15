import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  initialFarmers,
  initialFarms,
  initialCrops,
  initialCropSeasons,
  initialCropProfitSummary,
  initialMonthlyCashflow,
  initialRecentTransactions,
  initialUpcomingPayments,
  initialLowStockItems,
  initialSuppliers,
  initialBuyers,
  initialLabour,
  initialMachinery,
  initialLoans,
  initialNotifications
} from '../data/initialData';

const FarmContext = createContext(null);

function getPersisted(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error reading ${key}:`, err);
    return fallback;
  }
}

function setPersisted(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing ${key}:`, err);
  }
}

const BASE_METRICS = {
  totalIncome: 1250000,
  totalExpense: 780000,
  netProfit: 470000,
  totalFarmArea: 52, // Acres
  activeCropsCount: 6,
  totalSales: 920000,
  totalPurchases: 210000,
  outstandingReceivables: 145000,
  outstandingPayables: 85000,
  labourCost: 185000,
  inputCost: 265000,
  machineryCost: 120000
};

export function FarmProvider({ children }) {
  const [farmers, setFarmers] = useState(() => getPersisted('agriman_farmers', initialFarmers));
  const [farms, setFarms] = useState(() => getPersisted('agriman_farms', initialFarms));
  const [crops, setCrops] = useState(() => getPersisted('agriman_crops', initialCrops));
  const [cropSeasons, setCropSeasons] = useState(() => getPersisted('agriman_crop_seasons', initialCropSeasons));
  const [cropProfitSummary] = useState(initialCropProfitSummary);
  const [monthlyCashflow] = useState(initialMonthlyCashflow);
  const [recentTransactions, setRecentTransactions] = useState(() => getPersisted('agriman_recent_transactions', initialRecentTransactions));
  const [upcomingPayments, setUpcomingPayments] = useState(() => getPersisted('agriman_upcoming_payments', initialUpcomingPayments));
  const [lowStockItems, setLowStockItems] = useState(() => getPersisted('agriman_low_stock_items', initialLowStockItems));
  const [suppliers] = useState(initialSuppliers);
  const [buyers] = useState(initialBuyers);
  const [labour] = useState(initialLabour);
  const [machinery] = useState(initialMachinery);
  const [loans] = useState(initialLoans);
  const [notifications, setNotifications] = useState(() => getPersisted('agriman_notifications', initialNotifications));

  // Filters & Academic Year
  const [academicYear, setAcademicYear] = useState(() => {
    return localStorage.getItem('agriman_academic_year') || '2025-2026';
  });
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedFarm, setSelectedFarm] = useState('All');

  // Base financial widget metrics as stated in PDF Page 2 & 3
  const [metricDeltas, setMetricDeltas] = useState(() => getPersisted('agriman_metric_deltas', {
    incomeDelta: 0,
    expenseDelta: 0,
    salesDelta: 0,
    purchaseDelta: 0,
    receivableDelta: 0,
    payableDelta: 0,
    labourCostDelta: 0,
    inputCostDelta: 0,
    machineryCostDelta: 0
  }));

  // Sync state changes to localStorage
  useEffect(() => { setPersisted('agriman_farmers', farmers); }, [farmers]);
  useEffect(() => { setPersisted('agriman_farms', farms); }, [farms]);
  useEffect(() => { setPersisted('agriman_crops', crops); }, [crops]);
  useEffect(() => { setPersisted('agriman_crop_seasons', cropSeasons); }, [cropSeasons]);
  useEffect(() => { setPersisted('agriman_recent_transactions', recentTransactions); }, [recentTransactions]);
  useEffect(() => { setPersisted('agriman_upcoming_payments', upcomingPayments); }, [upcomingPayments]);
  useEffect(() => { setPersisted('agriman_low_stock_items', lowStockItems); }, [lowStockItems]);
  useEffect(() => { setPersisted('agriman_notifications', notifications); }, [notifications]);
  useEffect(() => {
    try {
      localStorage.setItem('agriman_academic_year', academicYear);
    } catch (e) {
      console.warn(e);
    }
  }, [academicYear]);
  useEffect(() => { setPersisted('agriman_metric_deltas', metricDeltas); }, [metricDeltas]);

  const currentMetrics = useMemo(() => {
    const inc = BASE_METRICS.totalIncome + metricDeltas.incomeDelta;
    const exp = BASE_METRICS.totalExpense + metricDeltas.expenseDelta;
    const profit = inc - exp;
    const area = farms.reduce((acc, f) => acc + (Number(f.landArea) || 0), 0);
    const activeCropsCount = crops.filter((c) => c.status === 'Active').length;
    const costPerAcre = area > 0 ? Math.round(exp / area) : 0;
    const incomePerAcre = area > 0 ? Math.round(inc / area) : 0;
    const profitPerAcre = area > 0 ? Math.round(profit / area) : 0;
    const roi = exp > 0 ? ((profit / exp) * 100).toFixed(1) : 0;

    return {
      totalIncome: inc,
      totalExpense: exp,
      netProfit: profit,
      totalFarmArea: area,
      activeCropsCount,
      totalSales: BASE_METRICS.totalSales + metricDeltas.salesDelta,
      totalPurchases: BASE_METRICS.totalPurchases + metricDeltas.purchaseDelta,
      outstandingReceivables: BASE_METRICS.outstandingReceivables + metricDeltas.receivableDelta,
      outstandingPayables: BASE_METRICS.outstandingPayables + metricDeltas.payableDelta,
      labourCost: BASE_METRICS.labourCost + metricDeltas.labourCostDelta,
      inputCost: BASE_METRICS.inputCost + metricDeltas.inputCostDelta,
      machineryCost: BASE_METRICS.machineryCost + metricDeltas.machineryCostDelta,
      costPerAcre,
      incomePerAcre,
      profitPerAcre,
      roi
    };
  }, [metricDeltas, farms, crops]);

  // Handler: Add Income
  const addIncome = (incomeData) => {
    const amt = Number(incomeData.amount) || 0;
    const newTx = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      date: incomeData.date || new Date().toISOString().split('T')[0],
      type: 'Income',
      category: incomeData.incomeType || 'Crop Sales',
      party: incomeData.buyer || incomeData.farmer || 'Market Buyer',
      farm: incomeData.farm || 'Farm 1 (South Block)',
      amount: amt,
      mode: incomeData.paymentMode || 'Bank Transfer',
      refNo: incomeData.referenceNumber || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Completed'
    };

    setRecentTransactions((prev) => [newTx, ...prev]);

    setMetricDeltas((prev) => ({
      ...prev,
      incomeDelta: prev.incomeDelta + amt,
      salesDelta: incomeData.incomeType?.includes('Sale') ? prev.salesDelta + amt : prev.salesDelta
    }));

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: 'Income Recorded',
        message: `₹${amt.toLocaleString('en-IN')} recorded for ${incomeData.crop || incomeData.incomeType || 'farm operations'}.`,
        time: 'Just now',
        type: 'success',
        read: false
      },
      ...prev
    ]);
  };

  // Handler: Add Expense
  const addExpense = (expenseData) => {
    const amt = Number(expenseData.amount) || 0;
    const newTx = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      type: 'Expense',
      category: expenseData.category || 'General Expense',
      party: expenseData.supplier || 'Farm Service',
      farm: expenseData.farm || 'Farm 1 (South Block)',
      amount: amt,
      mode: expenseData.paymentMode || 'Cash',
      refNo: expenseData.referenceNumber || `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Completed'
    };

    setRecentTransactions((prev) => [newTx, ...prev]);

    const cat = (expenseData.category || '').toLowerCase();
    const isLabour = cat.includes('labour');
    const isMachinery = cat.includes('machinery') || cat.includes('diesel');
    const isInput = cat.includes('seed') || cat.includes('fertilizer') || cat.includes('pesticide');

    setMetricDeltas((prev) => ({
      ...prev,
      expenseDelta: prev.expenseDelta + amt,
      labourCostDelta: isLabour ? prev.labourCostDelta + amt : prev.labourCostDelta,
      machineryCostDelta: isMachinery ? prev.machineryCostDelta + amt : prev.machineryCostDelta,
      inputCostDelta: isInput ? prev.inputCostDelta + amt : prev.inputCostDelta
    }));

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: 'Expense Logged',
        message: `₹${amt.toLocaleString('en-IN')} logged under ${expenseData.category || 'Expenditure'}.`,
        time: 'Just now',
        type: 'info',
        read: false
      },
      ...prev
    ]);
  };

  // Handler: Pay upcoming payment
  const payUpcomingPayment = (paymentId) => {
    const payment = upcomingPayments.find((p) => p.id === paymentId);
    if (!payment) return;

    setUpcomingPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: 'Completed', paidAt: new Date().toISOString().split('T')[0] } : p))
    );

    const amt = payment.amount;
    const newTx = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Expense',
      category: payment.type,
      party: payment.party,
      farm: 'Headquarters / All Farms',
      amount: amt,
      mode: payment.mode,
      refNo: `PAY-SETTLE-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Completed'
    };

    setRecentTransactions((prev) => [newTx, ...prev]);

    setMetricDeltas((prev) => ({
      ...prev,
      expenseDelta: prev.expenseDelta + amt,
      payableDelta: prev.payableDelta - amt
    }));

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: 'Payment Completed',
        message: `Payment of ₹${amt.toLocaleString('en-IN')} settled successfully for ${payment.party}.`,
        time: 'Just now',
        type: 'success',
        read: false
      },
      ...prev
    ]);
  };

  // Handler: Reorder Low Stock Item
  const reorderStock = (productId, quantity = 20) => {
    const item = lowStockItems.find((p) => p.id === productId);
    if (!item) return;

    const totalCost = quantity * item.unitCost;

    setLowStockItems((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              currentStock: p.currentStock + quantity,
              status: p.currentStock + quantity >= p.reorderLevel ? 'In Stock (Replenished)' : 'Low Stock'
            }
          : p
      )
    );

    setMetricDeltas((prev) => ({
      ...prev,
      purchaseDelta: prev.purchaseDelta + totalCost,
      expenseDelta: prev.expenseDelta + totalCost,
      inputCostDelta: prev.inputCostDelta + totalCost
    }));

    setRecentTransactions((prev) => [
      {
        id: `TX-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        type: 'Purchase',
        category: `Input Restock (${item.category})`,
        party: item.supplier,
        farm: 'Warehouse Central',
        amount: totalCost,
        mode: 'Supplier Credit / Invoice',
        refNo: `PO-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'Completed'
      },
      ...prev
    ]);

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: 'Stock Replenished',
        message: `Purchased ${quantity} ${item.unit} of ${item.productName} for ₹${totalCost.toLocaleString('en-IN')}. Stock updated!`,
        time: 'Just now',
        type: 'success',
        read: false
      },
      ...prev
    ]);
  };

  // Farmers CRUD
  const addFarmer = (newFarmer) => {
    const item = {
      ...newFarmer,
      id: `FARMER-${Date.now().toString().slice(-3)}`,
      code: `FMR-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Active'
    };
    setFarmers((prev) => [item, ...prev]);
    setNotifications((prev) => [
      {
        id: Date.now(),
        title: 'Farmer Registered',
        message: `${newFarmer.name} registered successfully.`,
        time: 'Just now',
        type: 'success',
        read: false
      },
      ...prev
    ]);
  };

  // Farms CRUD
  const addFarm = (newFarm) => {
    const item = {
      ...newFarm,
      id: `FARM-${Date.now().toString().slice(-3)}`,
      status: 'Active'
    };
    setFarms((prev) => [item, ...prev]);
  };

  // Crops CRUD
  const addCrop = (newCrop) => {
    const cropId = `CROP-${Date.now().toString().slice(-3)}`;
    const varietyName = newCrop.varieties
      ? (Array.isArray(newCrop.varieties) ? newCrop.varieties[0] : newCrop.varieties.split(',')[0].trim())
      : 'Hybrid Standard';

    const item = {
      ...newCrop,
      id: cropId,
      status: 'Active',
      varieties: newCrop.varieties
        ? (Array.isArray(newCrop.varieties) ? newCrop.varieties : newCrop.varieties.split(',').map((v) => v.trim()))
        : ['Hybrid Standard']
    };

    setCrops((prev) => [item, ...prev]);

    // Check if cultivation details were provided by user
    const hasCultivation = Boolean(newCrop.farmName || newCrop.sowingDate || newCrop.expectedHarvestDate || newCrop.area);

    const seasonEntry = {
      id: `CS-${Date.now().toString().slice(-4)}`,
      farmId: farms.find((f) => f.farmName === newCrop.farmName)?.id || (newCrop.farmName ? 'FARM-CUSTOM' : null),
      farmName: newCrop.farmName || 'Unassigned',
      cropId: cropId,
      cropName: item.name,
      variety: varietyName || 'Standard Variety',
      season: 'Kharif 2025-26',
      sowingDate: newCrop.sowingDate || null,
      expectedHarvestDate: newCrop.expectedHarvestDate || null,
      actualHarvestDate: null,
      area: newCrop.area ? Number(newCrop.area) : null,
      areaUnit: 'Acres',
      expectedYield: newCrop.area ? `${Number(newCrop.area) * 10} ${item.defaultUnit || 'Quintal'}` : null,
      actualYield: null,
      expectedRevenue: newCrop.expectedRevenue ? Number(newCrop.expectedRevenue) : null,
      totalExpenses: newCrop.expectedRevenue ? Math.round(Number(newCrop.expectedRevenue) * 0.35) : null,
      netProfit: newCrop.expectedRevenue ? Math.round(Number(newCrop.expectedRevenue) * 0.65) : null,
      status: hasCultivation ? 'In Progress' : 'Registered'
    };

    setCropSeasons((prev) => [seasonEntry, ...prev]);

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: 'Crop Registered',
        message: `${item.name} (${item.category || 'Crop'}) registered and added to active farm operations.`,
        time: 'Just now',
        type: 'success',
        read: false
      },
      ...prev
    ]);
  };

  // Mark notification read
  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const value = {
    farmers,
    addFarmer,
    farms,
    addFarm,
    crops,
    addCrop,
    cropSeasons,
    setCropSeasons,
    cropProfitSummary,
    monthlyCashflow,
    recentTransactions,
    upcomingPayments,
    payUpcomingPayment,
    lowStockItems,
    reorderStock,
    suppliers,
    buyers,
    labour,
    machinery,
    loans,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    academicYear,
    setAcademicYear,
    selectedSeason,
    setSelectedSeason,
    selectedFarm,
    setSelectedFarm,
    metrics: currentMetrics,
    addIncome,
    addExpense
  };

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}
