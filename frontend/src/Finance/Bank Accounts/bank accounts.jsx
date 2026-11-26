import React, { useEffect, useMemo, useState } from 'react';
import TableActionMenu from '../../TableActionMenu';
import './bank accounts.css';
import { bankAccountService } from './bankAccountService';
import {
  LandmarkIcon,
  WalletIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ArrowLeftRightIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  FileTextIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  EyeIcon,
  EyeOffIcon,
  EditIcon,
  TrashIcon,
  RefreshIcon,
  PrinterIcon,
  ShieldCheckIcon,
} from './BankIcons';

// Account Types supported across agricultural operations
const ACCOUNT_TYPES = [
  'Current Account',
  'Savings Account',
  'Agricultural Business Account',
  'Cash Account',
  'Other',
];

// Common Banks
const COMMON_BANKS = [
  'HDFC Bank',
  'State Bank of India',
  'District Cooperative Central Bank (DCCB)',
  'Canara Bank',
  'ICICI Bank Rural',
  'Punjab National Bank',
  'Bank of Baroda',
  'Cash Account',
  'Other Bank',
];

// Transaction Categories for Direct Movements
const DEPOSIT_CATEGORIES = [
  'Direct Deposit',
  'Government Subsidy',
  'Capital Infusion',
  'Rental Income Deposit',
  'Other Deposit',
];

const WITHDRAWAL_CATEGORIES = [
  'Cash Withdrawal',
  'Petty Cash Replenishment',
  'Bank Service Charges',
  'Direct Farm Operating Expense',
  'Other Withdrawal',
];

const PAYMENT_MODES = [
  'Bank Transfer / NEFT / RTGS',
  'UPI / QR Code',
  'Cheque',
  'Cash / ATM',
  'Auto Debit / ECS',
  'Other',
];

export default function BankAccounts() {
  const [view, setView] = useState('accounts'); // 'accounts' | 'transactions' | 'transfers' | 'reconciliation' | 'reports'
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [toast, setToast] = useState('');

  // Primary Data State
  const [rawAccounts, setRawAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [farmers, setFarmers] = useState([]);

  // Filters for Accounts Registry
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [bankFilter, setBankFilter] = useState('All');
  const [revealedAccounts, setRevealedAccounts] = useState(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Filters for Transactions View
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('All');
  const [txnTypeFilter, setTxnTypeFilter] = useState('All');
  const [txnDirectionFilter, setTxnDirectionFilter] = useState('All');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Modals State
  const [accountModal, setAccountModal] = useState(null); // { isEdit: boolean, data: object }
  const [depositModal, setDepositModal] = useState(null); // { isOpen: boolean, data: object }
  const [withdrawalModal, setWithdrawalModal] = useState(null); // { isOpen: boolean, data: object }
  const [transferModal, setTransferModal] = useState(null); // { isOpen: boolean, data: object }
  const [detailModal, setDetailModal] = useState(null); // account object

  // Reconciliation State
  const [reconAccountNo, setReconAccountNo] = useState('');
  const [reconStatementDate, setReconStatementDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reconOpeningBal, setReconOpeningBal] = useState('0');
  const [reconClosingBal, setReconClosingBal] = useState('0');

  // Reports State
  const [reportType, setReportType] = useState('summary');
  const [reportAccountNo, setReportAccountNo] = useState('All');

  // Toast auto-clear
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load initial data from service & API
  const loadData = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const [accs, txns, fList] = await Promise.all([
        bankAccountService.getBankAccounts(),
        Promise.resolve(bankAccountService.getTransactions()),
        bankAccountService.getFarmers(),
      ]);

      setRawAccounts(accs);
      setTransactions(txns);
      setFarmers(fList);

      if (accs.length > 0 && !reconAccountNo) {
        setReconAccountNo(accs[0].accountNumber);
      }
    } catch (err) {
      console.error('[BankAccounts] Error loading accounts data:', err);
      setErrorBanner('Network error or API offline. Operating in resilient local workspace mode.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute actual balances for each account
  const accounts = useMemo(() => {
    return bankAccountService.computeAccountBalances(rawAccounts, transactions);
  }, [rawAccounts, transactions]);

  // Compute KPI Summary Metrics
  const summaryKpis = useMemo(() => {
    return bankAccountService.computeSummaryKpis(accounts, transactions);
  }, [accounts, transactions]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((acc) => {
      const matchText =
        !q ||
        acc.accountName.toLowerCase().includes(q) ||
        acc.bankName.toLowerCase().includes(q) ||
        acc.accountNumber.toLowerCase().includes(q) ||
        (acc.branch && acc.branch.toLowerCase().includes(q)) ||
        (acc.accountHolderName && acc.accountHolderName.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'All' || acc.status === statusFilter;
      const matchType = typeFilter === 'All' || acc.accountType === typeFilter;
      const matchBank = bankFilter === 'All' || acc.bankName === bankFilter;

      return matchText && matchStatus && matchType && matchBank;
    });
  }, [accounts, query, statusFilter, typeFilter, bankFilter]);

  // Pagination for Accounts Table
  const pageCount = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedAccounts = filteredAccounts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Toggle reveal account number
  const toggleRevealAccount = (accountNo) => {
    setRevealedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountNo)) next.delete(accountNo);
      else next.add(accountNo);
      return next;
    });
  };

  // Filtered Transactions & Running Balance
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (selectedAccountFilter !== 'All') {
      list = list.filter((t) => String(t.accountNumber) === selectedAccountFilter);
    }
    if (txnTypeFilter !== 'All') {
      list = list.filter((t) => t.type === txnTypeFilter);
    }
    if (txnDirectionFilter === 'Credit') {
      list = list.filter((t) => Number(t.credit) > 0);
    } else if (txnDirectionFilter === 'Debit') {
      list = list.filter((t) => Number(t.debit) > 0);
    }
    if (dateFromFilter) {
      list = list.filter((t) => t.date >= dateFromFilter);
    }
    if (dateToFilter) {
      list = list.filter((t) => t.date <= dateToFilter);
    }

    // Determine starting opening balance for selected account
    let opBal = 0;
    if (selectedAccountFilter !== 'All') {
      const found = accounts.find((a) => String(a.accountNumber) === selectedAccountFilter);
      if (found) opBal = found.openingBalance;
    } else {
      opBal = accounts.reduce((sum, a) => sum + (a.openingBalance || 0), 0);
    }

    return bankAccountService.computeRunningBalances(list, opBal);
  }, [transactions, selectedAccountFilter, txnTypeFilter, txnDirectionFilter, dateFromFilter, dateToFilter, accounts]);

  // Internal Transfers list
  const transferTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'Internal Transfer Out');
  }, [transactions]);

  // Active bank options for filters
  const distinctBanks = useMemo(() => {
    return [...new Set(accounts.map((a) => a.bankName).filter(Boolean))];
  }, [accounts]);

  // ── Handlers: Account CRUD ──────────────────────────────────────────────────

  const handleOpenAddAccount = () => {
    setAccountModal({
      isEdit: false,
      data: {
        accountName: '',
        bankName: 'HDFC Bank',
        accountType: 'Current Account',
        farmerId: farmers[0]?.id || 1,
        accountHolderName: farmers[0]?.farmerName || 'Primary Farm Owner',
        accountNumber: '',
        confirmAccountNumber: '',
        ifsc: '',
        branch: '',
        branchAddress: '',
        openingBalance: '0',
        openingBalanceDate: new Date().toISOString().slice(0, 10),
        minimumBalance: '0',
        status: 'Active',
        remarks: '',
      },
    });
  };

  const handleOpenEditAccount = (acc) => {
    setAccountModal({
      isEdit: true,
      data: {
        ...acc,
        confirmAccountNumber: acc.accountNumber,
        openingBalance: String(acc.openingBalance || 0),
        minimumBalance: String(acc.minimumBalance || 0),
      },
    });
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const accountName = String(formData.get('accountName') || '').trim();
    const bankName = String(formData.get('bankName') || '').trim();
    const accountType = String(formData.get('accountType') || 'Current Account').trim();
    const farmerId = Number(formData.get('farmerId')) || 1;
    const accountNumber = String(formData.get('accountNumber') || '').trim();
    const confirmAccountNumber = String(formData.get('confirmAccountNumber') || '').trim();
    const ifsc = String(formData.get('ifsc') || '').trim().toUpperCase();
    const branch = String(formData.get('branch') || '').trim();
    const branchAddress = String(formData.get('branchAddress') || '').trim();
    const openingBalance = bankAccountService.parseAmount(formData.get('openingBalance'));
    const openingBalanceDate = String(formData.get('openingBalanceDate') || '').trim();
    const minimumBalance = bankAccountService.parseAmount(formData.get('minimumBalance'));
    const status = String(formData.get('status') || 'Active').trim();
    const remarks = String(formData.get('remarks') || '').trim();

    // Validations
    if (!accountName) {
      alert('Please enter an Account Name.');
      return;
    }
    if (!bankName) {
      alert('Please select or specify a Bank Name.');
      return;
    }
    if (!accountNumber) {
      alert('Please enter an Account Number.');
      return;
    }
    if (!accountModal.isEdit && accountNumber !== confirmAccountNumber) {
      alert('Account Number and Confirm Account Number do not match.');
      return;
    }
    if (bankName !== 'Cash Account' && !ifsc) {
      alert('Please enter an IFSC code for bank accounts.');
      return;
    }

    // Check duplicate account number within organization
    if (!accountModal.isEdit) {
      const exists = accounts.some((a) => a.accountNumber.toLowerCase() === accountNumber.toLowerCase());
      if (exists) {
        alert(`An account with number ${accountNumber} already exists in this organization.`);
        return;
      }
    }

    const selectedFarmer = farmers.find((f) => f.id === farmerId);
    const accountHolderName = selectedFarmer ? selectedFarmer.farmerName : 'Primary Farm Owner';

    const payload = {
      farmerId,
      accountHolderName,
      accountName,
      bankName,
      accountType,
      accountNumber,
      ifsc: bankName === 'Cash Account' ? 'CASH0000001' : ifsc,
      branch: branch || (bankName === 'Cash Account' ? 'Main Office' : 'Main Branch'),
      branchAddress,
      openingBalance,
      openingBalanceDate,
      minimumBalance,
      status,
      remarks,
    };

    try {
      if (accountModal.isEdit) {
        await bankAccountService.updateBankAccount(accountModal.data.id, payload);
        setToast(`Bank account ${accountName} updated successfully.`);
      } else {
        await bankAccountService.createBankAccount(payload);
        setToast(`Bank account ${accountName} created successfully.`);
      }
      setAccountModal(null);
      await loadData();
    } catch (err) {
      console.error('[BankAccounts] Error saving account:', err);
      alert(`Failed to save account: ${err.message}`);
    }
  };

  const handleDeleteAccount = async (acc) => {
    if (acc.currentBalance !== 0) {
      const confirmed = window.confirm(
        `Account has a current balance of ${bankAccountService.formatCurrency(acc.currentBalance)}. Deleting or deactivating may affect financial balance continuity. Do you wish to proceed?`
      );
      if (!confirmed) return;
    } else {
      if (!window.confirm(`Are you sure you want to remove account "${acc.accountName}"?`)) return;
    }

    try {
      await bankAccountService.deleteBankAccount(acc.id);
      setToast(`Account "${acc.accountName}" removed.`);
      await loadData();
    } catch (err) {
      console.error('[BankAccounts] Delete failed:', err);
      alert(`Error deleting account: ${err.message}`);
    }
  };

  // ── Handlers: Deposits, Withdrawals & Transfers ─────────────────────────────

  const handleOpenDeposit = (acc = null) => {
    const defaultAcc = acc || accounts.find((a) => a.status === 'Active') || accounts[0];
    if (!defaultAcc) {
      alert('Please add an active bank account first.');
      return;
    }
    setDepositModal({
      isOpen: true,
      data: {
        accountId: defaultAcc.id,
        accountNumber: defaultAcc.accountNumber,
        bankName: defaultAcc.bankName,
        accountName: defaultAcc.accountName,
        depositDate: new Date().toISOString().slice(0, 10),
        amount: '',
        mode: 'Bank Transfer / NEFT / RTGS',
        referenceNo: '',
        category: 'Direct Deposit',
        description: 'Direct agricultural fund deposit',
        remarks: '',
      },
    });
  };

  const handleSaveDeposit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = bankAccountService.parseAmount(formData.get('amount'));
    if (amount <= 0) {
      alert('Please enter a valid deposit amount greater than ₹0.');
      return;
    }

    const accountId = Number(formData.get('accountId'));
    const targetAcc = accounts.find((a) => a.id === accountId);
    if (!targetAcc || targetAcc.status !== 'Active') {
      alert('Selected account is not active for deposits.');
      return;
    }

    try {
      bankAccountService.recordDeposit({
        accountId,
        accountNumber: targetAcc.accountNumber,
        bankName: targetAcc.bankName,
        depositDate: formData.get('depositDate'),
        amount,
        mode: formData.get('mode'),
        referenceNo: formData.get('referenceNo') || undefined,
        category: formData.get('category'),
        description: formData.get('description'),
        remarks: formData.get('remarks'),
      });
      setDepositModal(null);
      setToast(`Deposit of ${bankAccountService.formatCurrency(amount)} recorded successfully.`);
      loadData();
    } catch (err) {
      alert(`Deposit failed: ${err.message}`);
    }
  };

  const handleOpenWithdrawal = (acc = null) => {
    const defaultAcc = acc || accounts.find((a) => a.status === 'Active') || accounts[0];
    if (!defaultAcc) {
      alert('Please add an active bank account first.');
      return;
    }
    setWithdrawalModal({
      isOpen: true,
      data: {
        accountId: defaultAcc.id,
        accountNumber: defaultAcc.accountNumber,
        bankName: defaultAcc.bankName,
        accountName: defaultAcc.accountName,
        currentBalance: defaultAcc.currentBalance,
        withdrawalDate: new Date().toISOString().slice(0, 10),
        amount: '',
        mode: defaultAcc.bankName === 'Cash Account' ? 'Cash / ATM' : 'Cheque',
        referenceNo: '',
        category: 'Cash Withdrawal',
        description: 'Direct cash withdrawal for farm needs',
        remarks: '',
      },
    });
  };

  const handleSaveWithdrawal = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = bankAccountService.parseAmount(formData.get('amount'));
    if (amount <= 0) {
      alert('Please enter a valid withdrawal amount greater than ₹0.');
      return;
    }

    const accountId = Number(formData.get('accountId'));
    const targetAcc = accounts.find((a) => a.id === accountId);
    if (!targetAcc || targetAcc.status !== 'Active') {
      alert('Selected account is not active for withdrawals.');
      return;
    }

    if (amount > targetAcc.currentBalance) {
      const confirmOverdraft = window.confirm(
        `Withdrawal amount (${bankAccountService.formatCurrency(amount)}) exceeds available balance (${bankAccountService.formatCurrency(targetAcc.currentBalance)}). Proceed with overdraft?`
      );
      if (!confirmOverdraft) return;
    }

    try {
      bankAccountService.recordWithdrawal({
        accountId,
        accountNumber: targetAcc.accountNumber,
        bankName: targetAcc.bankName,
        withdrawalDate: formData.get('withdrawalDate'),
        amount,
        mode: formData.get('mode'),
        referenceNo: formData.get('referenceNo') || undefined,
        category: formData.get('category'),
        description: formData.get('description'),
        remarks: formData.get('remarks'),
      });
      setWithdrawalModal(null);
      setToast(`Withdrawal of ${bankAccountService.formatCurrency(amount)} recorded.`);
      loadData();
    } catch (err) {
      alert(`Withdrawal failed: ${err.message}`);
    }
  };

  const handleOpenTransfer = () => {
    const activeAccs = accounts.filter((a) => a.status === 'Active');
    if (activeAccs.length < 2) {
      alert('At least two active bank accounts are required to perform an internal transfer.');
      return;
    }
    setTransferModal({
      isOpen: true,
      data: {
        fromAccountId: activeAccs[0].id,
        toAccountId: activeAccs[1].id,
        transferDate: new Date().toISOString().slice(0, 10),
        amount: '',
        referenceNo: `TRF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        description: 'Fund movement between farm accounts',
      },
    });
  };

  const handleSaveTransfer = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = bankAccountService.parseAmount(formData.get('amount'));
    const fromAccountId = Number(formData.get('fromAccountId'));
    const toAccountId = Number(formData.get('toAccountId'));

    if (fromAccountId === toAccountId) {
      alert('Source and destination accounts must be different.');
      return;
    }
    if (amount <= 0) {
      alert('Please enter a valid transfer amount greater than ₹0.');
      return;
    }

    const sourceAcc = accounts.find((a) => a.id === fromAccountId);
    const destAcc = accounts.find((a) => a.id === toAccountId);

    if (amount > sourceAcc.currentBalance) {
      alert(`Insufficient funds in source account ${sourceAcc.accountName}. Available: ${bankAccountService.formatCurrency(sourceAcc.currentBalance)}`);
      return;
    }

    try {
      bankAccountService.recordTransfer({
        fromAccountId,
        fromAccountNumber: sourceAcc.accountNumber,
        fromBankName: sourceAcc.bankName,
        fromAccountName: sourceAcc.accountName,
        toAccountId,
        toAccountNumber: destAcc.accountNumber,
        toBankName: destAcc.bankName,
        toAccountName: destAcc.accountName,
        transferDate: formData.get('transferDate'),
        amount,
        referenceNo: formData.get('referenceNo'),
        description: formData.get('description'),
      });
      setTransferModal(null);
      setToast(`Internal transfer of ${bankAccountService.formatCurrency(amount)} completed.`);
      loadData();
    } catch (err) {
      alert(`Transfer failed: ${err.message}`);
    }
  };

  // ── Reconciliation Computation ──

  const reconSelectedAccount = useMemo(() => {
    return accounts.find((a) => a.accountNumber === reconAccountNo) || accounts[0];
  }, [accounts, reconAccountNo]);

  const reconTransactions = useMemo(() => {
    if (!reconSelectedAccount) return [];
    return transactions.filter(
      (t) => (t.accountId === reconSelectedAccount.id || String(t.accountNumber) === String(reconSelectedAccount.accountNumber)) && t.status !== 'Cancelled'
    );
  }, [transactions, reconSelectedAccount]);

  const reconMatchedCount = reconTransactions.filter((t) => t.reconciled).length;
  const reconUnmatchedCount = reconTransactions.length - reconMatchedCount;

  const reconSystemBalance = reconSelectedAccount ? reconSelectedAccount.currentBalance : 0;
  const reconStatementNum = bankAccountService.parseAmount(reconClosingBal);
  const reconDifference = reconSystemBalance - reconStatementNum;
  const isReconBalanced = Math.abs(reconDifference) < 0.01;

  const handleToggleReconcile = (txnId, currentVal) => {
    bankAccountService.reconcileTransaction(txnId, !currentVal);
    setTransactions(bankAccountService.getTransactions());
  };

  const handleSaveReconStatement = () => {
    if (!reconSelectedAccount) return;
    const reconRecord = bankAccountService.saveReconciliation({
      accountId: reconSelectedAccount.id,
      accountNumber: reconSelectedAccount.accountNumber,
      statementDate: reconStatementDate,
      statementOpeningBalance: reconOpeningBal,
      statementClosingBalance: reconClosingBal,
      reconciledBalance: reconSystemBalance,
      differenceAmount: reconDifference,
      matchedCount: reconMatchedCount,
      unmatchedCount: reconUnmatchedCount,
    });
    setToast(`Reconciliation saved: ${reconRecord.status}`);
  };

  // ── Export CSV for Reports ──

  const handleExportCSV = () => {
    let rows = [];
    let headers = [];
    let filename = `agriman-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'summary' || reportType === 'balance') {
      headers = ['Account Name', 'Bank Name', 'Account Number', 'Account Type', 'Branch', 'Opening Balance', 'Current Balance', 'Status'];
      rows = accounts.map((a) => [
        a.accountName,
        a.bankName,
        a.accountNumber,
        a.accountType,
        a.branch,
        a.openingBalance,
        a.currentBalance,
        a.status,
      ]);
    } else {
      headers = ['Date', 'Reference No', 'Description', 'Bank Account', 'Type', 'Money In (Credit)', 'Money Out (Debit)', 'Running Balance', 'Status'];
      rows = filteredTransactions.map((t) => [
        t.date,
        t.referenceNo,
        t.description,
        `${t.bankName} (${t.accountNumber})`,
        t.type,
        t.credit || 0,
        t.debit || 0,
        t.runningBalance || 0,
        t.status,
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setToast(`Report exported to ${filename}`);
  };

  return (
    <div className="users-page finance-screen">
      {/* 1. Module Header */}
      <div className="users-title-row">
        <div>
          <div className="users-eyebrow">
            FINANCE <span>/</span> BANK ACCOUNTS
          </div>
          <h1>Bank Accounts</h1>
          <p>
            Manage agricultural bank accounts, monitor balances, track deposits & withdrawals, view transaction history, and reconcile statements.
          </p>
        </div>

        <div className="bank-header-actions">
          <button className="bank-btn-primary" type="button" onClick={handleOpenAddAccount} disabled={loading}>
            <PlusIcon size={16} /> Add Bank Account
          </button>
          <button className="bank-btn-secondary" type="button" onClick={() => handleOpenDeposit()} disabled={loading || !accounts.length}>
            <ArrowDownLeftIcon size={16} /> Deposit
          </button>
          <button className="bank-btn-secondary" type="button" onClick={() => handleOpenWithdrawal()} disabled={loading || !accounts.length}>
            <ArrowUpRightIcon size={16} /> Withdrawal
          </button>
          <button className="bank-btn-secondary" type="button" onClick={handleOpenTransfer} disabled={loading || accounts.length < 2}>
            <ArrowLeftRightIcon size={16} /> Transfer
          </button>
          {view === 'reports' && (
            <button className="bank-btn-secondary" type="button" onClick={handleExportCSV}>
              <DownloadIcon size={15} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Offline / Tunnel Banner if needed */}
      {errorBanner && (
        <div className="bank-alert-banner">
          <div>
            <AlertCircleIcon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {errorBanner}
          </div>
          <button type="button" onClick={loadData}>
            <RefreshIcon size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Retry
          </button>
        </div>
      )}

      {/* 2. Top-Level Module Sub-Navigation Switch */}
      <div className="finance-view-switch">
        <button className={view === 'accounts' ? 'selected' : ''} type="button" onClick={() => setView('accounts')}>
          <LandmarkIcon size={15} />
          Bank Accounts Registry
          <span className="tab-count">{accounts.length}</span>
        </button>

        <button className={view === 'transactions' ? 'selected' : ''} type="button" onClick={() => setView('transactions')}>
          <FileTextIcon size={15} />
          Ledger & Transactions
          <span className="tab-count">{transactions.length}</span>
        </button>

        <button className={view === 'transfers' ? 'selected' : ''} type="button" onClick={() => setView('transfers')}>
          <ArrowLeftRightIcon size={15} />
          Internal Transfers
          <span className="tab-count">{transferTransactions.length}</span>
        </button>

        <button className={view === 'reconciliation' ? 'selected' : ''} type="button" onClick={() => setView('reconciliation')}>
          <ShieldCheckIcon size={15} />
          Bank Reconciliation
        </button>

        <button className={view === 'reports' ? 'selected' : ''} type="button" onClick={() => setView('reports')}>
          <DownloadIcon size={15} />
          Financial Reports
        </button>
      </div>

      {/* 3. Four Primary KPI Summary Cards */}
      <div className="bank-stats-grid">
        <div className="bank-stat-card">
          <div className="bank-stat-icon bank-icon-green">
            <LandmarkIcon size={20} />
          </div>
          <div className="bank-stat-info">
            <small>Total Bank Accounts</small>
            <strong>{summaryKpis.activeAccountsCount} Active</strong>
            <span>{summaryKpis.totalAccounts} total registered accounts</span>
          </div>
        </div>

        <div className="bank-stat-card">
          <div className="bank-stat-icon bank-icon-blue">
            <WalletIcon size={20} />
          </div>
          <div className="bank-stat-info">
            <small>Total Available Balance</small>
            <strong>{bankAccountService.formatCurrency(summaryKpis.totalAvailableBalance)}</strong>
            <span>Across all active bank & cash accounts</span>
          </div>
        </div>

        <div className="bank-stat-card">
          <div className="bank-stat-icon bank-icon-amber">
            <ArrowDownLeftIcon size={20} />
          </div>
          <div className="bank-stat-info">
            <small>Total Money Received</small>
            <strong>{bankAccountService.formatCurrency(summaryKpis.totalMoneyReceived)}</strong>
            <span>All confirmed collections & deposits</span>
          </div>
        </div>

        <div className="bank-stat-card">
          <div className="bank-stat-icon bank-icon-purple">
            <ArrowUpRightIcon size={20} />
          </div>
          <div className="bank-stat-info">
            <small>Total Money Paid</small>
            <strong>{bankAccountService.formatCurrency(summaryKpis.totalMoneyPaid)}</strong>
            <span>All confirmed payouts & disbursements</span>
          </div>
        </div>
      </div>

      {/* 4. MAIN PANEL CONTENT BY VIEW */}

      {/* VIEW A: BANK ACCOUNTS REGISTRY */}
      {view === 'accounts' && (
        <section className="users-panel">
          <div className="bank-toolbar">
            <div className="bank-search-wrap">
              <SearchIcon size={14} color="#6a7d6e" />
              <input
                aria-label="Search Bank Accounts"
                placeholder="Search by account name, bank, masked number, or holder..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select className="bank-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Closed">Closed</option>
            </select>

            <select className="bank-filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="All">All Account Types</option>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select className="bank-filter-select" value={bankFilter} onChange={(e) => { setBankFilter(e.target.value); setPage(1); }}>
              <option value="All">All Banks</option>
              {distinctBanks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <button
              className="bank-reset-btn"
              type="button"
              onClick={() => {
                setQuery('');
                setStatusFilter('All');
                setTypeFilter('All');
                setBankFilter('All');
                setPage(1);
              }}
            >
              <RefreshIcon size={12} /> Reset Filters
            </button>
          </div>

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ACCOUNT NAME</th>
                  <th>BANK NAME</th>
                  <th>ACCOUNT NUMBER</th>
                  <th>ACCOUNT TYPE</th>
                  <th>BRANCH / IFSC</th>
                  <th>OPENING BAL</th>
                  <th>CURRENT BALANCE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pagedAccounts.map((acc) => {
                  const isRevealed = revealedAccounts.has(acc.accountNumber);
                  return (
                    <tr key={acc.id || acc.accountNumber}>
                      <td className="user-id">
                        <strong>{acc.accountName}</strong>
                        <div style={{ fontSize: '11px', color: '#687b6d' }}>{acc.accountHolderName}</div>
                      </td>
                      <td>{acc.bankName}</td>
                      <td>
                        <div className="masked-acc-cell">
                          <span>{bankAccountService.maskAccountNumber(acc.accountNumber, isRevealed)}</span>
                          <button
                            type="button"
                            className="account-reveal-btn"
                            title={isRevealed ? 'Mask account number' : 'Reveal account number'}
                            onClick={() => toggleRevealAccount(acc.accountNumber)}
                          >
                            {isRevealed ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="account-type-badge">{acc.accountType}</span>
                      </td>
                      <td>
                        <div>{acc.branch || 'Main Branch'}</div>
                        <small style={{ color: '#7a8c7e', fontSize: '10px' }}>{acc.ifsc}</small>
                      </td>
                      <td>{bankAccountService.formatCurrency(acc.openingBalance)}</td>
                      <td>
                        <strong className="running-balance-cell" style={{ color: acc.currentBalance < 0 ? '#b02828' : '#1e6d30' }}>
                          {bankAccountService.formatCurrency(acc.currentBalance)}
                        </strong>
                      </td>
                      <td>
                        <span className={`status-badge ${acc.status.toLowerCase()}`}>{acc.status}</span>
                      </td>
                      <td>
                        <TableActionMenu
                          items={[
                            {
                              label: 'View Statement / Details',
                              icon: 'view',
                              onClick: () => setDetailModal(acc),
                            },
                            {
                              label: 'Record Deposit',
                              icon: 'add',
                              onClick: () => handleOpenDeposit(acc),
                            },
                            {
                              label: 'Record Withdrawal',
                              icon: 'transfer',
                              onClick: () => handleOpenWithdrawal(acc),
                            },
                            {
                              label: 'Edit Account Details',
                              icon: 'edit',
                              onClick: () => handleOpenEditAccount(acc),
                            },
                            {
                              label: 'Delete Account',
                              icon: 'delete',
                              danger: true,
                              onClick: () => handleDeleteAccount(acc),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}

                {pagedAccounts.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="users-empty">
                        <span>⌕</span>
                        <strong>No bank accounts found</strong>
                        <p>Adjust your search filters or register a new bank account.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="users-table-footer">
            <span>
              Showing <strong>{filteredAccounts.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredAccounts.length)}</strong> of <strong>{filteredAccounts.length}</strong> accounts
            </span>
            <div className="pagination">
              <button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, index) => (
                <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>
                  {index + 1}
                </button>
              ))}
              <button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                ›
              </button>
            </div>
          </div>
        </section>
      )}

      {/* VIEW B: LEDGER & TRANSACTIONS */}
      {view === 'transactions' && (
        <section className="users-panel">
          <div className="bank-toolbar">
            <select className="bank-filter-select" value={selectedAccountFilter} onChange={(e) => setSelectedAccountFilter(e.target.value)}>
              <option value="All">All Bank Accounts</option>
              {accounts.map((a) => (
                <option key={a.accountNumber} value={a.accountNumber}>
                  {a.bankName} - {a.accountName} ({bankAccountService.maskAccountNumber(a.accountNumber, false)})
                </option>
              ))}
            </select>

            <select className="bank-filter-select" value={txnTypeFilter} onChange={(e) => setTxnTypeFilter(e.target.value)}>
              <option value="All">All Transaction Types</option>
              <option value="Direct Deposit">Direct Deposit</option>
              <option value="Direct Withdrawal">Direct Withdrawal</option>
              <option value="Customer Receipt">Customer Receipt</option>
              <option value="Supplier Payment">Supplier Payment</option>
              <option value="Expense Settlement">Expense Settlement</option>
              <option value="Loan Disbursement">Loan Disbursement</option>
              <option value="Loan Repayment">Loan Repayment</option>
              <option value="Internal Transfer Out">Internal Transfer Out</option>
              <option value="Internal Transfer In">Internal Transfer In</option>
            </select>

            <select className="bank-filter-select" value={txnDirectionFilter} onChange={(e) => setTxnDirectionFilter(e.target.value)}>
              <option value="All">All Directions</option>
              <option value="Credit">Money In (Credits)</option>
              <option value="Debit">Money Out (Debits)</option>
            </select>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#55695a' }}>
              <span>From:</span>
              <input type="date" className="bank-filter-select" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
              <span>To:</span>
              <input type="date" className="bank-filter-select" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
            </div>

            <button
              className="bank-reset-btn"
              type="button"
              onClick={() => {
                setSelectedAccountFilter('All');
                setTxnTypeFilter('All');
                setTxnDirectionFilter('All');
                setDateFromFilter('');
                setDateToFilter('');
              }}
            >
              <RefreshIcon size={12} /> Reset
            </button>
          </div>

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>REF NO</th>
                  <th>DESCRIPTION & PARTICULARS</th>
                  <th>ACCOUNT / BANK</th>
                  <th>TYPE</th>
                  <th>MONEY IN (CREDIT)</th>
                  <th>MONEY OUT (DEBIT)</th>
                  <th>RUNNING BALANCE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{bankAccountService.formatDate(t.date)}</td>
                    <td className="user-id">
                      <strong>{t.referenceNo}</strong>
                      {t.linkedRef && <div style={{ fontSize: '10px', color: '#7a8c7e' }}>Link: {t.linkedRef}</div>}
                    </td>
                    <td>
                      <div>{t.description}</div>
                      <small style={{ color: '#728476', fontSize: '10.5px' }}>{t.category}</small>
                    </td>
                    <td>
                      <strong>{t.bankName}</strong>
                      <div style={{ fontSize: '10.5px', color: '#687b6d' }}>{bankAccountService.maskAccountNumber(t.accountNumber, false)}</div>
                    </td>
                    <td>
                      <span className="account-type-badge">{t.type}</span>
                    </td>
                    <td>
                      {Number(t.credit) > 0 ? (
                        <span className="money-in">+{bankAccountService.formatCurrency(t.credit)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {Number(t.debit) > 0 ? (
                        <span className="money-out">-{bankAccountService.formatCurrency(t.debit)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <strong className="running-balance-cell">{bankAccountService.formatCurrency(t.runningBalance)}</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="users-empty">
                        <span>⌕</span>
                        <strong>No transactions found</strong>
                        <p>No financial movements match the active criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* VIEW C: INTERNAL TRANSFERS */}
      {view === 'transfers' && (
        <section className="users-panel">
          <div className="bank-toolbar" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontSize: '12px', color: '#3a5040' }}>
              <strong>Internal Account Transfers</strong> — Moves funds between accounts without altering the overall cash position of the agricultural business.
            </div>
            <button className="bank-btn-primary" type="button" onClick={handleOpenTransfer} disabled={accounts.length < 2}>
              <PlusIcon size={15} /> New Internal Transfer
            </button>
          </div>

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>TRANSFER REF</th>
                  <th>DATE</th>
                  <th>SOURCE ACCOUNT (DEBITED)</th>
                  <th>DESTINATION ACCOUNT (CREDITED)</th>
                  <th>AMOUNT TRANSFERRED</th>
                  <th>DESCRIPTION</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {transferTransactions.map((t) => {
                  // Find paired incoming credit transaction
                  const paired = transactions.find(
                    (p) => p.type === 'Internal Transfer In' && p.referenceNo === t.referenceNo
                  );
                  return (
                    <tr key={t.id}>
                      <td className="user-id">
                        <strong>{t.referenceNo}</strong>
                      </td>
                      <td>{bankAccountService.formatDate(t.date)}</td>
                      <td>
                        <strong>{t.bankName}</strong>
                        <div style={{ fontSize: '11px', color: '#687b6d' }}>{bankAccountService.maskAccountNumber(t.accountNumber, false)}</div>
                      </td>
                      <td>
                        <strong>{paired ? paired.bankName : 'Destination Account'}</strong>
                        <div style={{ fontSize: '11px', color: '#687b6d' }}>{paired ? bankAccountService.maskAccountNumber(paired.accountNumber, false) : '—'}</div>
                      </td>
                      <td>
                        <strong className="running-balance-cell">{bankAccountService.formatCurrency(t.debit)}</strong>
                      </td>
                      <td>{t.description}</td>
                      <td>
                        <span className="status-badge active">Completed</span>
                      </td>
                    </tr>
                  );
                })}

                {transferTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="users-empty">
                        <span>⌕</span>
                        <strong>No internal transfers recorded</strong>
                        <p>Transfer funds between accounts to record capital reallocations or petty cash top-ups.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* VIEW D: BANK RECONCILIATION */}
      {view === 'reconciliation' && (
        <section className="users-panel" style={{ padding: '20px' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1f3022', margin: '0 0 6px' }}>
              Bank Statement Reconciliation
            </h2>
            <p style={{ fontSize: '12px', color: '#657768', margin: 0 }}>
              Compare system records against the official bank statement to verify that all deposits, withdrawals, and bank charges match.
            </p>
          </div>

          <div className="form-grid-3" style={{ marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4a5d4e', marginBottom: 4 }}>
                SELECT BANK ACCOUNT
              </label>
              <select
                className="bank-filter-select"
                style={{ width: '100%' }}
                value={reconAccountNo}
                onChange={(e) => setReconAccountNo(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.bankName} - {a.accountName} ({bankAccountService.maskAccountNumber(a.accountNumber, false)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4a5d4e', marginBottom: 4 }}>
                STATEMENT CUT-OFF DATE
              </label>
              <input
                type="date"
                className="bank-filter-select"
                style={{ width: '100%' }}
                value={reconStatementDate}
                onChange={(e) => setReconStatementDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4a5d4e', marginBottom: 4 }}>
                STATEMENT CLOSING BALANCE (₹)
              </label>
              <input
                type="number"
                step="any"
                className="bank-filter-select"
                style={{ width: '100%' }}
                placeholder="Enter bank statement balance"
                value={reconClosingBal}
                onChange={(e) => setReconClosingBal(e.target.value)}
              />
            </div>
          </div>

          {/* Reconciliation Balance Comparison Bar */}
          <div className="recon-summary-bar">
            <div className="recon-box">
              <small>SYSTEM BOOK BALANCE</small>
              <strong>{bankAccountService.formatCurrency(reconSystemBalance)}</strong>
            </div>

            <div className="recon-box">
              <small>STATEMENT CLOSING BALANCE</small>
              <strong>{bankAccountService.formatCurrency(reconStatementNum)}</strong>
            </div>

            <div className="recon-box">
              <small>DIFFERENCE AMOUNT</small>
              <strong className={isReconBalanced ? 'recon-diff-balanced' : 'recon-diff-warning'}>
                {bankAccountService.formatCurrency(reconDifference)}
              </strong>
            </div>

            <div className="recon-box">
              <small>MATCHED TRANSACTIONS</small>
              <strong>
                {reconMatchedCount} of {reconTransactions.length}
              </strong>
            </div>
          </div>

          {/* Transactions to Reconcile */}
          <div className="users-table-wrap" style={{ marginTop: 14 }}>
            <table className="users-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>RECON</th>
                  <th>DATE</th>
                  <th>REF NO</th>
                  <th>DESCRIPTION</th>
                  <th>MONEY IN</th>
                  <th>MONEY OUT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {reconTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={Boolean(t.reconciled)}
                        onChange={() => handleToggleReconcile(t.id, t.reconciled)}
                        style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                      />
                    </td>
                    <td>{bankAccountService.formatDate(t.date)}</td>
                    <td className="user-id">
                      <strong>{t.referenceNo}</strong>
                    </td>
                    <td>{t.description}</td>
                    <td>
                      {Number(t.credit) > 0 ? (
                        <span className="money-in">+{bankAccountService.formatCurrency(t.credit)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {Number(t.debit) > 0 ? (
                        <span className="money-out">-{bankAccountService.formatCurrency(t.debit)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${t.reconciled ? 'reconciled' : 'inactive'}`}>
                        {t.reconciled ? 'Reconciled' : 'Unmatched'}
                      </span>
                    </td>
                  </tr>
                ))}
                {reconTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="users-empty">
                        <span>✓</span>
                        <strong>No transactions found for this account</strong>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="bank-btn-primary" type="button" onClick={handleSaveReconStatement}>
              <CheckCircleIcon size={16} /> Finalize Reconciliation Session
            </button>
          </div>
        </section>
      )}

      {/* VIEW E: REPORTS & ANALYTICS */}
      {view === 'reports' && (
        <section className="users-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1d2e20', margin: '0 0 4px' }}>
                Bank & Cash Accounts Financial Reports
              </h2>
              <p style={{ fontSize: '12px', color: '#687b6d', margin: 0 }}>
                Comprehensive financial reporting and audit exports for farm bank accounts and liquidity.
              </p>
            </div>
            <button className="bank-btn-primary" type="button" onClick={handleExportCSV}>
              <DownloadIcon size={16} /> Download CSV Report
            </button>
          </div>

          <div className="form-grid-2" style={{ marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#445648', marginBottom: 4 }}>
                SELECT REPORT TYPE
              </label>
              <select className="bank-filter-select" style={{ width: '100%' }} value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="summary">1. Bank Account Summary</option>
                <option value="balance">2. Account-wise Balance Report</option>
                <option value="history">3. Complete Transaction History</option>
                <option value="deposits">4. Monthly Deposits Report</option>
                <option value="withdrawals">5. Monthly Withdrawals Report</option>
                <option value="moneyin">6. Incoming Transactions (Money In)</option>
                <option value="moneyout">7. Outgoing Transactions (Money Out)</option>
                <option value="transfers">8. Account Transfer History</option>
                <option value="reconciliation">9. Bank Reconciliation Report</option>
                <option value="statement">10. Account Statement</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#445648', marginBottom: 4 }}>
                TARGET ACCOUNT
              </label>
              <select className="bank-filter-select" style={{ width: '100%' }} value={reportAccountNo} onChange={(e) => setReportAccountNo(e.target.value)}>
                <option value="All">All Bank Accounts</option>
                {accounts.map((a) => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.bankName} - {a.accountName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Render Active Report Preview */}
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                {reportType === 'summary' || reportType === 'balance' ? (
                  <tr>
                    <th>ACCOUNT NAME</th>
                    <th>BANK</th>
                    <th>ACCOUNT NO</th>
                    <th>TYPE</th>
                    <th>OPENING BALANCE</th>
                    <th>TOTAL CREDITS</th>
                    <th>TOTAL DEBITS</th>
                    <th>NET CURRENT BALANCE</th>
                    <th>STATUS</th>
                  </tr>
                ) : (
                  <tr>
                    <th>DATE</th>
                    <th>REF NO</th>
                    <th>DESCRIPTION</th>
                    <th>BANK ACCOUNT</th>
                    <th>TYPE</th>
                    <th>MONEY IN</th>
                    <th>MONEY OUT</th>
                    <th>BALANCE</th>
                    <th>STATUS</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {reportType === 'summary' || reportType === 'balance'
                  ? accounts.map((a) => (
                      <tr key={a.id || a.accountNumber}>
                        <td>
                          <strong>{a.accountName}</strong>
                        </td>
                        <td>{a.bankName}</td>
                        <td>{bankAccountService.maskAccountNumber(a.accountNumber, false)}</td>
                        <td>{a.accountType}</td>
                        <td>{bankAccountService.formatCurrency(a.openingBalance)}</td>
                        <td>
                          <span className="money-in">+{bankAccountService.formatCurrency(a.totalCredits)}</span>
                        </td>
                        <td>
                          <span className="money-out">-{bankAccountService.formatCurrency(a.totalDebits)}</span>
                        </td>
                        <td>
                          <strong className="running-balance-cell">{bankAccountService.formatCurrency(a.currentBalance)}</strong>
                        </td>
                        <td>
                          <span className={`status-badge ${a.status.toLowerCase()}`}>{a.status}</span>
                        </td>
                      </tr>
                    ))
                  : filteredTransactions.map((t) => (
                      <tr key={t.id}>
                        <td>{bankAccountService.formatDate(t.date)}</td>
                        <td className="user-id">
                          <strong>{t.referenceNo}</strong>
                        </td>
                        <td>{t.description}</td>
                        <td>{t.bankName}</td>
                        <td>{t.type}</td>
                        <td>{Number(t.credit) > 0 ? `+${bankAccountService.formatCurrency(t.credit)}` : '—'}</td>
                        <td>{Number(t.debit) > 0 ? `-${bankAccountService.formatCurrency(t.debit)}` : '—'}</td>
                        <td>
                          <strong>{bankAccountService.formatCurrency(t.runningBalance)}</strong>
                        </td>
                        <td>
                          <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. MODALS & DIALOGS */}

      {/* Modal A: Add / Edit Bank Account */}
      {accountModal && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setAccountModal(null)}>
          <form className="user-modal bank-modal-wide" onSubmit={handleSaveAccount}>
            <header className="modal-header">
              <div>
                <span>FINANCE / BANK ACCOUNTS</span>
                <h2>{accountModal.isEdit ? 'Edit Bank Account' : 'Add New Bank Account'}</h2>
                <p>Register bank accounts, cash vaults, and credit facilities for your agricultural operations.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setAccountModal(null)}>
                ×
              </button>
            </header>

            <div className="modal-body">
              {/* Section A: Basic Account Information */}
              <div className="form-section-title">A. Basic Account Information</div>
              <div className="form-grid-2">
                <div>
                  <label>
                    Account Name *
                    <input
                      name="accountName"
                      required
                      defaultValue={accountModal.data.accountName}
                      placeholder="e.g. AGRIMAN Operational Account"
                    />
                  </label>
                </div>

                <div>
                  <label>
                    Bank Name *
                    <select name="bankName" defaultValue={accountModal.data.bankName}>
                      {COMMON_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Account Type *
                    <select name="accountType" defaultValue={accountModal.data.accountType}>
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Account Holder / Farmer Association *
                    <select name="farmerId" defaultValue={accountModal.data.farmerId}>
                      {farmers.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.farmerName} ({f.farmerCode || `ID #${f.id}`})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Account Number *
                    <input
                      name="accountNumber"
                      required
                      defaultValue={accountModal.data.accountNumber}
                      placeholder="e.g. 50100428912456"
                    />
                  </label>
                </div>

                <div>
                  <label>
                    Confirm Account Number *
                    <input
                      name="confirmAccountNumber"
                      required
                      defaultValue={accountModal.data.confirmAccountNumber}
                      placeholder="Re-enter account number"
                    />
                  </label>
                </div>
              </div>

              {/* Section B: Bank Details */}
              <div className="form-section-title">B. Bank Details</div>
              <div className="form-grid-2">
                <div>
                  <label>
                    IFSC Code *
                    <input
                      name="ifsc"
                      defaultValue={accountModal.data.ifsc}
                      placeholder="e.g. HDFC0001042"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </label>
                </div>

                <div>
                  <label>
                    Branch Name
                    <input
                      name="branch"
                      defaultValue={accountModal.data.branch}
                      placeholder="e.g. Vijayawada Rural Branch"
                    />
                  </label>
                </div>

                <div className="full-width-field">
                  <label>
                    Branch Address
                    <input
                      name="branchAddress"
                      defaultValue={accountModal.data.branchAddress}
                      placeholder="e.g. Benz Circle, Vijayawada, Andhra Pradesh"
                    />
                  </label>
                </div>
              </div>

              {/* Section C: Financial Information */}
              <div className="form-section-title">C. Financial Information</div>
              <div className="form-grid-3">
                <div>
                  <label>
                    Opening Balance (₹) *
                    <input
                      name="openingBalance"
                      type="number"
                      step="any"
                      required
                      defaultValue={accountModal.data.openingBalance}
                      placeholder="0.00"
                    />
                  </label>
                  <div className="form-notice">Starting funds at opening date</div>
                </div>

                <div>
                  <label>
                    Opening Balance Date *
                    <input
                      name="openingBalanceDate"
                      type="date"
                      required
                      defaultValue={accountModal.data.openingBalanceDate}
                    />
                  </label>
                </div>

                <div>
                  <label>
                    Minimum Balance (₹)
                    <input
                      name="minimumBalance"
                      type="number"
                      step="any"
                      defaultValue={accountModal.data.minimumBalance}
                      placeholder="0.00"
                    />
                  </label>
                </div>
              </div>

              {/* Section D: Account Status & Remarks */}
              <div className="form-section-title">D. Account Status & Remarks</div>
              <div className="form-grid-2">
                <div>
                  <label>
                    Account Status
                    <select name="status" defaultValue={accountModal.data.status}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </label>
                </div>

                <div className="full-width-field">
                  <label>
                    Remarks / Operational Notes
                    <input
                      name="remarks"
                      defaultValue={accountModal.data.remarks}
                      placeholder="e.g. Primary settlement account for crop sales"
                    />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>All account data is protected and masked across standard views.</span>
              <div>
                <button type="button" onClick={() => setAccountModal(null)}>
                  Cancel
                </button>
                <button className="save-button" type="submit">
                  {accountModal.isEdit ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* Modal B: Direct Deposit */}
      {depositModal && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDepositModal(null)}>
          <form className="user-modal" onSubmit={handleSaveDeposit}>
            <header className="modal-header">
              <div>
                <span>FINANCE / DIRECT DEPOSIT</span>
                <h2>Record Direct Deposit</h2>
                <p>Deposit funds directly into a bank account or farm cash vault.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setDepositModal(null)}>
                ×
              </button>
            </header>

            <div className="modal-body">
              <div className="form-grid-2">
                <div>
                  <label>
                    Deposit Into Account *
                    <select name="accountId" defaultValue={depositModal.data.accountId}>
                      {accounts.filter((a) => a.status === 'Active').map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.bankName} - {a.accountName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Deposit Date *
                    <input name="depositDate" type="date" required defaultValue={depositModal.data.depositDate} />
                  </label>
                </div>

                <div>
                  <label>
                    Deposit Amount (₹) *
                    <input name="amount" type="number" step="any" required placeholder="Enter amount" />
                  </label>
                </div>

                <div>
                  <label>
                    Deposit Mode *
                    <select name="mode" defaultValue={depositModal.data.mode}>
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Deposit Category *
                    <select name="category" defaultValue={depositModal.data.category}>
                      {DEPOSIT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Reference / Challan No
                    <input name="referenceNo" placeholder="e.g. CHN-998811 or UTR" />
                  </label>
                </div>

                <div className="full-width-field">
                  <label>
                    Description / Purpose *
                    <input name="description" required defaultValue={depositModal.data.description} />
                  </label>
                </div>

                <div className="full-width-field">
                  <label>
                    Remarks
                    <input name="remarks" placeholder="Optional notes" />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Deposits are recorded as confirmed credits in the account ledger.</span>
              <div>
                <button type="button" onClick={() => setDepositModal(null)}>
                  Cancel
                </button>
                <button className="save-button" type="submit">
                  Record Deposit
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* Modal C: Direct Withdrawal */}
      {withdrawalModal && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setWithdrawalModal(null)}>
          <form className="user-modal" onSubmit={handleSaveWithdrawal}>
            <header className="modal-header">
              <div>
                <span>FINANCE / DIRECT WITHDRAWAL</span>
                <h2>Record Direct Withdrawal</h2>
                <p>Withdraw cash or funds from a bank account.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setWithdrawalModal(null)}>
                ×
              </button>
            </header>

            <div className="modal-body">
              <div className="form-grid-2">
                <div>
                  <label>
                    Withdraw From Account *
                    <select name="accountId" defaultValue={withdrawalModal.data.accountId}>
                      {accounts.filter((a) => a.status === 'Active').map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.bankName} - {a.accountName} (Bal: {bankAccountService.formatCurrency(a.currentBalance)})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Withdrawal Date *
                    <input name="withdrawalDate" type="date" required defaultValue={withdrawalModal.data.withdrawalDate} />
                  </label>
                </div>

                <div>
                  <label>
                    Withdrawal Amount (₹) *
                    <input name="amount" type="number" step="any" required placeholder="Enter amount" />
                  </label>
                </div>

                <div>
                  <label>
                    Withdrawal Mode *
                    <select name="mode" defaultValue={withdrawalModal.data.mode}>
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Withdrawal Category *
                    <select name="category" defaultValue={withdrawalModal.data.category}>
                      {WITHDRAWAL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Cheque / Slip / ATM Reference
                    <input name="referenceNo" placeholder="e.g. CHQ-40012 or ATM-Slip" />
                  </label>
                </div>

                <div className="full-width-field">
                  <label>
                    Description / Purpose *
                    <input name="description" required defaultValue={withdrawalModal.data.description} />
                  </label>
                </div>

                <div className="full-width-field">
                  <label>
                    Remarks
                    <input name="remarks" placeholder="Optional notes" />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Withdrawals decrease the account balance and record an auditable debit.</span>
              <div>
                <button type="button" onClick={() => setWithdrawalModal(null)}>
                  Cancel
                </button>
                <button className="save-button" type="submit">
                  Record Withdrawal
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* Modal D: Internal Account Transfer */}
      {transferModal && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setTransferModal(null)}>
          <form className="user-modal" onSubmit={handleSaveTransfer}>
            <header className="modal-header">
              <div>
                <span>FINANCE / INTERNAL TRANSFER</span>
                <h2>Transfer Between Accounts</h2>
                <p>Transfer funds between your bank accounts without impacting overall farm profitability.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setTransferModal(null)}>
                ×
              </button>
            </header>

            <div className="modal-body">
              <div className="form-grid-2">
                <div>
                  <label>
                    Source Account (From) *
                    <select name="fromAccountId" defaultValue={transferModal.data.fromAccountId}>
                      {accounts.filter((a) => a.status === 'Active').map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.bankName} - {a.accountName} (Avail: {bankAccountService.formatCurrency(a.currentBalance)})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Destination Account (To) *
                    <select name="toAccountId" defaultValue={transferModal.data.toAccountId}>
                      {accounts.filter((a) => a.status === 'Active').map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.bankName} - {a.accountName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Transfer Date *
                    <input name="transferDate" type="date" required defaultValue={transferModal.data.transferDate} />
                  </label>
                </div>

                <div>
                  <label>
                    Transfer Amount (₹) *
                    <input name="amount" type="number" step="any" required placeholder="Enter amount" />
                  </label>
                </div>

                <div>
                  <label>
                    Transfer Reference *
                    <input name="referenceNo" required defaultValue={transferModal.data.referenceNo} />
                  </label>
                </div>

                <div className="full-width-field">
                  <label>
                    Description / Transfer Reason *
                    <input name="description" required defaultValue={transferModal.data.description} />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Transfers are cash-neutral and atomic across source and destination ledgers.</span>
              <div>
                <button type="button" onClick={() => setTransferModal(null)}>
                  Cancel
                </button>
                <button className="save-button" type="submit">
                  Execute Transfer
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* Modal E: Account Details & Statement View */}
      {detailModal && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDetailModal(null)}>
          <div className="user-modal bank-modal-wide">
            <header className="modal-header">
              <div>
                <span>ACCOUNT DETAILS & STATEMENT</span>
                <h2>{detailModal.accountName}</h2>
                <p>{detailModal.bankName} — {detailModal.accountType}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setDetailModal(null)}>
                ×
              </button>
            </header>

            <div className="modal-body">
              <div className="account-detail-card">
                <div className="account-detail-header">
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '17px', color: '#1a2e1d' }}>
                      {detailModal.accountName}
                    </h3>
                    <div style={{ color: '#687b6d', fontSize: '12px' }}>
                      Holder: <strong>{detailModal.accountHolderName}</strong>
                    </div>
                  </div>
                  <span className={`status-badge ${detailModal.status.toLowerCase()}`}>{detailModal.status}</span>
                </div>

                <div className="account-detail-meta">
                  <div className="account-detail-item">
                    <small>Account Number</small>
                    <strong>{detailModal.accountNumber}</strong>
                  </div>

                  <div className="account-detail-item">
                    <small>IFSC Code</small>
                    <strong>{detailModal.ifsc}</strong>
                  </div>

                  <div className="account-detail-item">
                    <small>Branch</small>
                    <strong>{detailModal.branch || 'Main Branch'}</strong>
                  </div>

                  <div className="account-detail-item">
                    <small>Opening Balance</small>
                    <strong>{bankAccountService.formatCurrency(detailModal.openingBalance)}</strong>
                  </div>

                  <div className="account-detail-item">
                    <small>Current Balance</small>
                    <strong style={{ color: '#1e6d30', fontSize: '15px' }}>
                      {bankAccountService.formatCurrency(detailModal.currentBalance)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Account Recent Statement */}
              <div style={{ margin: '14px 0 8px', fontWeight: 700, fontSize: '12px', color: '#273b2a' }}>
                Recent Account Statement Activity
              </div>
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>REF NO</th>
                      <th>DESCRIPTION</th>
                      <th>MONEY IN</th>
                      <th>MONEY OUT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter((t) => t.accountId === detailModal.id || String(t.accountNumber) === String(detailModal.accountNumber))
                      .slice(0, 5)
                      .map((t) => (
                        <tr key={t.id}>
                          <td>{bankAccountService.formatDate(t.date)}</td>
                          <td>{t.referenceNo}</td>
                          <td>{t.description}</td>
                          <td>{Number(t.credit) > 0 ? `+${bankAccountService.formatCurrency(t.credit)}` : '—'}</td>
                          <td>{Number(t.debit) > 0 ? `-${bankAccountService.formatCurrency(t.debit)}` : '—'}</td>
                          <td>
                            <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Account history is synchronized with the unified finance ledger.</span>
              <div>
                <button type="button" onClick={() => setDetailModal(null)}>
                  Close
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="user-toast" role="status">
          <span>✓</span>
          {toast}
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
