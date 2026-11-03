import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { labourService } from '../../services/labourService';
import './labour.css';

// Currency formatter for Indian Rupees
const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return '₹ ' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function Labour({ initialTab = 'labourers', onNavigate }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'labourers' | 'attendance' | 'workTypes' | 'payments' | 'balances'

  // Data states
  const [laboursList, setLaboursList] = useState([]);
  const [workTypesList, setWorkTypesList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [labourFilter, setLabourFilter] = useState('All');

  // Modals
  const [modalType, setModalType] = useState(null); // 'labour' | 'attendance' | 'workType' | 'payment' | null
  const [editingItem, setEditingItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, item }

  // Forms
  const [labourForm, setLabourForm] = useState({
    labourCode: '',
    labourName: '',
    mobile: '',
    gender: 'Male',
    village: '',
    dailyRate: 400,
    status: 'Active',
    photo: '',
    notes: ''
  });

  const [attendanceForm, setAttendanceForm] = useState(() => ({
    attendanceCode: '',
    date: getTodayDate(),
    labourId: '',
    farmName: 'Farm 1 (South Block)',
    cropName: 'Paddy (Rice)',
    workType: 'Land Preparation',
    workBasis: 'Days',
    unitsWorked: 1,
    rate: 450,
    amount: 450,
    notes: ''
  }));

  const [workTypeForm, setWorkTypeForm] = useState({
    code: '',
    workTypeName: '',
    defaultRate: 450,
    unit: 'Day',
    description: '',
    status: 'Active'
  });

  const [paymentForm, setPaymentForm] = useState(() => ({
    paymentCode: '',
    paymentDate: getTodayDate(),
    labourId: '',
    amountPaid: '',
    paymentMode: 'Cash',
    referenceNo: '',
    periodStart: '',
    periodEnd: '',
    notes: ''
  }));

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Camera & Photo Identity state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' | 'environment'
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Stop camera stream tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Close camera modal
  const handleCloseCamera = useCallback(() => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraLoading(false);
    setCapturedPhoto(null);
    setCameraError(null);
  }, [stopCameraStream]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Request camera stream helper
  const startCameraStream = async (facing = 'user') => {
    setCameraLoading(true);
    setCameraError(null);
    setCapturedPhoto(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraLoading(false);
      const msg = 'Camera access is not supported by your browser. Please choose an image file from your device.';
      setCameraError(msg);
      showToast(msg, 'error');
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        fileInputRef.current?.click();
      }
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (constraintErr) {
        console.warn('Constrained camera request failed, attempting fallback to basic video:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Video playback warning:', e);
        }
      }

      setCameraLoading(false);
    } catch (err) {
      console.warn('Camera stream error:', err);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraLoading(false);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const errMsg = isDenied
        ? 'Camera permission was blocked. Please allow camera access in your browser address bar settings.'
        : 'Could not connect to device camera hardware. Please check your camera or select an existing photo.';
      setCameraError(errMsg);
      showToast(errMsg, 'error');
    }
  };

  // Start device camera
  const handleStartCamera = () => {
    setCameraError(null);
    setCapturedPhoto(null);
    setIsCameraOpen(true);
    startCameraStream(cameraFacing);
  };

  // Switch between front/selfie and back/environment camera
  const handleSwitchCamera = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCameraStream(nextFacing);
  };

  // Retake photo and reopen camera stream
  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    startCameraStream(cameraFacing);
  };

  // Capture snapshot from video stream
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      setCapturedPhoto(dataUrl);
    }
  };

  // Confirm and attach captured photo to labourer form
  const handleAcceptCapturedPhoto = () => {
    if (!capturedPhoto) return;
    setLabourForm((prev) => ({ ...prev, photo: capturedPhoto }));
    showToast('Photo captured and attached successfully');
    handleCloseCamera();
  };

  // Ensure video element gets stream attached whenever modal or loading state updates
  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current && !capturedPhoto) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOpen, cameraLoading, capturedPhoto]);

  // Optimize and process uploaded photo file
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB. Please choose a smaller photo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result;
      if (!rawUrl) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL('image/jpeg', 0.82);
          setLabourForm((prev) => ({ ...prev, photo: optimized }));
        } else {
          setLabourForm((prev) => ({ ...prev, photo: rawUrl }));
        }
        showToast('Photo uploaded successfully');
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setLabourForm((prev) => ({ ...prev, photo: '' }));
    showToast('Photo removed');
  };

  // Sync initial tab when changed from props
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Load all module data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [labours, workTypes, attendance, payments] = await Promise.all([
        labourService.getLabours(),
        labourService.getWorkTypes(),
        labourService.getAttendance(),
        labourService.getPayments()
      ]);
      setLaboursList(labours || []);
      setWorkTypesList(workTypes || []);
      setAttendanceList(attendance || []);
      setPaymentsList(payments || []);
    } catch (err) {
      console.error('[Labour] Error loading data:', err);
      showToast('Error loading labour data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate Balances & Metrics
  const labourBalances = useMemo(() => {
    return labourService.calculateLabourBalances(laboursList, attendanceList, paymentsList);
  }, [laboursList, attendanceList, paymentsList]);

  const metrics = useMemo(() => {
    return labourService.getSummaryMetrics(laboursList, attendanceList, paymentsList);
  }, [laboursList, attendanceList, paymentsList]);

  // Active labourers list for dropdowns
  const activeLabourers = useMemo(() => {
    return laboursList.filter((l) => l.status === 'Active');
  }, [laboursList]);

  // Active work types list for dropdowns
  const activeWorkTypes = useMemo(() => {
    return workTypesList.filter((w) => w.status === 'Active');
  }, [workTypesList]);

  // Handle Attendance Form Auto-Calculation
  const handleAttendanceChange = (field, value) => {
    setAttendanceForm((prev) => {
      const updated = { ...prev, [field]: value };

      // If labourer changes, auto-set default rate if not manually customized
      if (field === 'labourId') {
        const found = laboursList.find((l) => String(l.id) === String(value));
        if (found && found.dailyRate) {
          updated.rate = found.dailyRate;
        }
      }

      // If work type changes and worker has no special rate, can update rate
      if (field === 'workType') {
        const foundWT = workTypesList.find((w) => w.workTypeName === value);
        if (foundWT && foundWT.defaultRate && !prev.labourId) {
          updated.rate = foundWT.defaultRate;
        }
      }

      // Recalculate amount if unitsWorked or rate changed
      if (field === 'unitsWorked' || field === 'rate' || field === 'labourId') {
        const units = Math.max(0, Number(updated.unitsWorked) || 0);
        const rate = Math.max(0, Number(updated.rate) || 0);
        updated.amount = Math.round(units * rate * 100) / 100;
      }

      return updated;
    });
  };

  // ── Open Modals ─────────────────────────────────────────────────────────────
  const openAddModal = () => {
    if (activeTab === 'labourers') {
      const nextId = laboursList.reduce((max, l) => Math.max(max, Number(l.id) || 0), 0) + 1;
      setEditingItem(null);
      setCameraError(null);
      setLabourForm({
        labourCode: `LBR-${String(nextId).padStart(3, '0')}`,
        labourName: '',
        mobile: '',
        gender: 'Male',
        village: '',
        dailyRate: 400,
        status: 'Active',
        photo: '',
        notes: ''
      });
      setModalType('labour');
    } else if (activeTab === 'attendance') {
      const nextId = attendanceList.reduce((max, a) => Math.max(max, Number(a.id) || 0), 0) + 1;
      const defaultLabour = activeLabourers[0] || laboursList[0];
      const defaultRate = defaultLabour?.dailyRate || 450;
      setEditingItem(null);
      setAttendanceForm({
        attendanceCode: `ATT-${String(nextId).padStart(3, '0')}`,
        date: getTodayDate(),
        labourId: defaultLabour ? String(defaultLabour.id) : '',
        farmName: 'Farm 1 (South Block)',
        cropName: 'Paddy (Rice)',
        workType: activeWorkTypes[0]?.workTypeName || 'Land Preparation',
        workBasis: 'Days',
        unitsWorked: 1,
        rate: defaultRate,
        amount: defaultRate,
        notes: ''
      });
      setModalType('attendance');
    } else if (activeTab === 'workTypes') {
      const nextId = workTypesList.reduce((max, w) => Math.max(max, Number(w.id) || 0), 0) + 1;
      setEditingItem(null);
      setWorkTypeForm({
        code: `LWT-${String(nextId).padStart(3, '0')}`,
        workTypeName: '',
        defaultRate: 450,
        unit: 'Day',
        description: '',
        status: 'Active'
      });
      setModalType('workType');
    } else if (activeTab === 'payments' || activeTab === 'balances') {
      const nextId = paymentsList.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
      const defaultLabour = activeLabourers[0] || laboursList[0];
      const balanceObj = labourBalances.find((b) => String(b.id) === String(defaultLabour?.id));
      const suggestedAmount = balanceObj && balanceObj.outstandingBalance > 0 ? balanceObj.outstandingBalance : '';

      setEditingItem(null);
      setPaymentForm({
        paymentCode: `LPY-${String(nextId).padStart(3, '0')}`,
        paymentDate: getTodayDate(),
        labourId: defaultLabour ? String(defaultLabour.id) : '',
        amountPaid: suggestedAmount,
        paymentMode: 'Cash',
        referenceNo: '',
        periodStart: '',
        periodEnd: '',
        notes: ''
      });
      setModalType('payment');
    }
  };

  const openPayForLabour = (labour) => {
    const nextId = paymentsList.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
    const balanceObj = labourBalances.find((b) => String(b.id) === String(labour.id));
    const suggestedAmount = balanceObj && balanceObj.outstandingBalance > 0 ? balanceObj.outstandingBalance : labour.dailyRate;

    setEditingItem(null);
    setPaymentForm({
      paymentCode: `LPY-${String(nextId).padStart(3, '0')}`,
      paymentDate: getTodayDate(),
      labourId: String(labour.id),
      amountPaid: suggestedAmount,
      paymentMode: 'Cash',
      referenceNo: '',
      periodStart: '',
      periodEnd: '',
      notes: `Wage payment for ${labour.labourName}`
    });
    setModalType('payment');
  };

  const openEdit = (type, item) => {
    setEditingItem(item);
    setCameraError(null);
    if (type === 'labour') {
      setLabourForm({
        labourCode: item.labourCode,
        labourName: item.labourName,
        mobile: item.mobile,
        gender: item.gender || 'Male',
        village: item.village,
        dailyRate: item.dailyRate,
        status: item.status,
        photo: item.photo || '',
        notes: item.notes || ''
      });
      setModalType('labour');
    } else if (type === 'attendance') {
      setAttendanceForm({
        attendanceCode: item.attendanceCode,
        date: item.date,
        labourId: String(item.labourId),
        farmName: item.farmName,
        cropName: item.cropName,
        workType: item.workType,
        workBasis: item.workBasis || 'Days',
        unitsWorked: item.unitsWorked,
        rate: item.rate,
        amount: item.amount,
        notes: item.notes || ''
      });
      setModalType('attendance');
    } else if (type === 'workType') {
      setWorkTypeForm({
        code: item.code,
        workTypeName: item.workTypeName,
        defaultRate: item.defaultRate,
        unit: item.unit,
        description: item.description || '',
        status: item.status
      });
      setModalType('workType');
    } else if (type === 'payment') {
      setPaymentForm({
        paymentCode: item.paymentCode,
        paymentDate: item.paymentDate,
        labourId: String(item.labourId),
        amountPaid: item.amountPaid,
        paymentMode: item.paymentMode,
        referenceNo: item.referenceNo || '',
        periodStart: item.periodStart || '',
        periodEnd: item.periodEnd || '',
        notes: item.notes || ''
      });
      setModalType('payment');
    }
  };

  // ── Save Form Handlers ──────────────────────────────────────────────────────
  const handleSaveLabour = async (e) => {
    e.preventDefault();
    if (!labourForm.labourName.trim()) {
      showToast('Labourer name is required', 'error');
      return;
    }
    if (!labourForm.mobile.trim() || !/^\d{10}$/.test(labourForm.mobile.trim())) {
      showToast('Enter a valid 10-digit mobile number', 'error');
      return;
    }
    if (!labourForm.village.trim()) {
      showToast('Village is required', 'error');
      return;
    }
    if (Number(labourForm.dailyRate) <= 0) {
      showToast('Daily rate must be greater than zero', 'error');
      return;
    }

    try {
      if (editingItem) {
        await labourService.updateLabour(editingItem.id, labourForm);
        showToast('Labourer updated successfully');
      } else {
        await labourService.createLabour(labourForm);
        showToast('Labourer registered successfully');
      }
      setModalType(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error saving labourer', 'error');
    }
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!attendanceForm.labourId) {
      showToast('Please select a labourer', 'error');
      return;
    }
    if (Number(attendanceForm.unitsWorked) <= 0) {
      showToast('Hours or Days worked must be greater than zero', 'error');
      return;
    }
    if (Number(attendanceForm.rate) <= 0) {
      showToast('Rate must be greater than zero', 'error');
      return;
    }

    const worker = laboursList.find((l) => String(l.id) === String(attendanceForm.labourId));
    const payload = {
      ...attendanceForm,
      labourName: worker ? worker.labourName : 'Unknown Labourer'
    };

    try {
      if (editingItem) {
        await labourService.updateAttendance(editingItem.id, payload);
        showToast('Attendance updated successfully');
      } else {
        await labourService.createAttendance(payload);
        showToast('Attendance recorded successfully');
      }
      setModalType(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error saving attendance', 'error');
    }
  };

  const handleSaveWorkType = async (e) => {
    e.preventDefault();
    if (!workTypeForm.workTypeName.trim()) {
      showToast('Work type name is required', 'error');
      return;
    }
    if (Number(workTypeForm.defaultRate) <= 0) {
      showToast('Default rate must be greater than zero', 'error');
      return;
    }

    try {
      if (editingItem) {
        await labourService.updateWorkType(editingItem.id, workTypeForm);
        showToast('Work type updated successfully');
      } else {
        await labourService.createWorkType(workTypeForm);
        showToast('Work type added successfully');
      }
      setModalType(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error saving work type', 'error');
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.labourId) {
      showToast('Please select a labourer', 'error');
      return;
    }
    if (Number(paymentForm.amountPaid) <= 0) {
      showToast('Payment amount must be greater than zero', 'error');
      return;
    }

    const worker = laboursList.find((l) => String(l.id) === String(paymentForm.labourId));
    const payload = {
      ...paymentForm,
      labourName: worker ? worker.labourName : 'Unknown Labourer'
    };

    try {
      if (editingItem) {
        await labourService.updatePayment(editingItem.id, payload);
        showToast('Payment updated successfully');
      } else {
        await labourService.createPayment(payload);
        showToast('Payment recorded successfully');
      }
      setModalType(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error recording payment', 'error');
    }
  };

  // ── Toggle Status Handlers ──────────────────────────────────────────────────
  const toggleLabourStatus = async (labour) => {
    try {
      await labourService.toggleLabourStatus(labour.id);
      const newStatus = labour.status === 'Active' ? 'Inactive' : 'Active';
      showToast(`${labour.labourName} marked as ${newStatus}`);
      loadData();
    } catch {
      showToast('Failed to toggle status', 'error');
    }
  };

  const toggleWorkTypeStatus = async (wt) => {
    try {
      await labourService.toggleWorkTypeStatus(wt.id);
      const newStatus = wt.status === 'Active' ? 'Inactive' : 'Active';
      showToast(`${wt.workTypeName} set to ${newStatus}`);
      loadData();
    } catch {
      showToast('Failed to toggle status', 'error');
    }
  };

  // ── Delete Confirmation ────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, item } = deleteTarget;
    try {
      if (type === 'labour') {
        await labourService.deleteLabour(item.id);
        showToast(`Labourer ${item.labourName} removed`);
      } else if (type === 'attendance') {
        await labourService.deleteAttendance(item.id);
        showToast('Attendance entry deleted');
      } else if (type === 'workType') {
        await labourService.deleteWorkType(item.id);
        showToast('Work type deleted');
      } else if (type === 'payment') {
        await labourService.deletePayment(item.id);
        showToast('Payment voucher deleted');
      }
      setDeleteTarget(null);
      loadData();
    } catch {
      showToast('Delete operation failed', 'error');
    }
  };

  // ── Filtered Lists ──────────────────────────────────────────────────────────
  const filteredLabours = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return laboursList.filter((l) => {
      const matchSearch =
        !q ||
        l.labourName.toLowerCase().includes(q) ||
        l.labourCode.toLowerCase().includes(q) ||
        l.mobile.toLowerCase().includes(q) ||
        l.village.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [laboursList, searchQuery, statusFilter]);

  const filteredAttendance = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return attendanceList.filter((a) => {
      const matchSearch =
        !q ||
        a.attendanceCode.toLowerCase().includes(q) ||
        a.labourName.toLowerCase().includes(q) ||
        a.farmName.toLowerCase().includes(q) ||
        a.cropName.toLowerCase().includes(q) ||
        a.workType.toLowerCase().includes(q);
      const matchWorker = labourFilter === 'All' || String(a.labourId) === labourFilter;
      return matchSearch && matchWorker;
    });
  }, [attendanceList, searchQuery, labourFilter]);

  const filteredWorkTypes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return workTypesList.filter((w) => {
      const matchSearch =
        !q ||
        w.workTypeName.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'All' || w.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [workTypesList, searchQuery, statusFilter]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return paymentsList.filter((p) => {
      const matchSearch =
        !q ||
        p.paymentCode.toLowerCase().includes(q) ||
        p.labourName.toLowerCase().includes(q) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
        (p.paymentMode && p.paymentMode.toLowerCase().includes(q));
      const matchWorker = labourFilter === 'All' || String(p.labourId) === labourFilter;
      return matchSearch && matchWorker;
    });
  }, [paymentsList, searchQuery, labourFilter]);

  const filteredBalances = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return labourBalances.filter((b) => {
      const matchSearch =
        !q ||
        b.labourName.toLowerCase().includes(q) ||
        b.labourCode.toLowerCase().includes(q) ||
        b.village.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [labourBalances, searchQuery, statusFilter]);

  // Selected worker details in payment modal
  const selectedPaymentWorker = useMemo(() => {
    if (!paymentForm.labourId) return null;
    return labourBalances.find((b) => String(b.id) === String(paymentForm.labourId));
  }, [paymentForm.labourId, labourBalances]);

  return (
    <div className="lb-page">
      {/* Toast Feedback */}
      {toast && (
        <div className={`lb-toast lb-toast-${toast.type}`} role="status">
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="lb-page-head">
        <div>
          <div className="lb-eyebrow">AGRICULTURE & OPERATIONS</div>
          <h1 className="lb-title">Labour Management</h1>
          <p className="lb-subtitle">
            Manage agricultural workers, daily attendance, work types, and wage settlements
          </p>
        </div>
        <button className="lb-btn-primary" type="button" onClick={openAddModal}>
          <span>+</span>
          {activeTab === 'labourers'
            ? 'Add Labourer'
            : activeTab === 'attendance'
            ? 'Record Attendance'
            : activeTab === 'workTypes'
            ? 'Add Work Type'
            : 'Record Payment'}
        </button>
      </div>

      {/* Top KPI Stats Row */}
      <div className="lb-stats-grid">
        <div className="lb-stat-card">
          <div className="lb-stat-icon lb-stat-icon-blue">👥</div>
          <div className="lb-stat-info">
            <span className="lb-stat-label">Total Labourers</span>
            <span className="lb-stat-value">{metrics.totalLabourers}</span>
            <span className="lb-stat-sub">{metrics.activeLabourers} Active in Farm</span>
          </div>
        </div>

        <div className="lb-stat-card">
          <div className="lb-stat-icon lb-stat-icon-green">📋</div>
          <div className="lb-stat-info">
            <span className="lb-stat-label">Days Worked</span>
            <span className="lb-stat-value">{metrics.totalDaysWorked.toFixed(1)}</span>
            <span className="lb-stat-sub">{metrics.totalAttendanceEntries} Attendance Entries</span>
          </div>
        </div>

        <div className="lb-stat-card">
          <div className="lb-stat-icon lb-stat-icon-amber">₹</div>
          <div className="lb-stat-info">
            <span className="lb-stat-label">Total Labour Cost</span>
            <span className="lb-stat-value">{formatCurrency(metrics.totalLabourCost)}</span>
            <span className="lb-stat-sub">Cumulative Wage Earned</span>
          </div>
        </div>

        <div className="lb-stat-card">
          <div className="lb-stat-icon lb-stat-icon-green">💳</div>
          <div className="lb-stat-info">
            <span className="lb-stat-label">Total Wages Paid</span>
            <span className="lb-stat-value">{formatCurrency(metrics.totalPaidAmount)}</span>
            <span className="lb-stat-sub">{paymentsList.length} Disbursed Vouchers</span>
          </div>
        </div>

        <div className="lb-stat-card">
          <div className="lb-stat-icon lb-stat-icon-red">⏳</div>
          <div className="lb-stat-info">
            <span className="lb-stat-label">Outstanding Balance</span>
            <span className="lb-stat-value" style={{ color: metrics.totalOutstandingBalance > 0 ? '#dc2626' : '#15803d' }}>
              {formatCurrency(metrics.totalOutstandingBalance)}
            </span>
            <span className="lb-stat-sub">{metrics.totalOutstandingBalance > 0 ? 'Pending Wages' : 'All Settled'}</span>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="lb-tabs-bar">
        <button
          type="button"
          className={`lb-tab-btn ${activeTab === 'labourers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('labourers'); setSearchQuery(''); setStatusFilter('All'); }}
        >
          <span>👥</span> Labour Master
          <span className="lb-tab-badge">{laboursList.length}</span>
        </button>

        <button
          type="button"
          className={`lb-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => { setActiveTab('attendance'); setSearchQuery(''); setLabourFilter('All'); }}
        >
          <span>📋</span> Labour Attendance
          <span className="lb-tab-badge">{attendanceList.length}</span>
        </button>

        <button
          type="button"
          className={`lb-tab-btn ${activeTab === 'workTypes' ? 'active' : ''}`}
          onClick={() => { setActiveTab('workTypes'); setSearchQuery(''); setStatusFilter('All'); }}
        >
          <span>💼</span> Work Types
          <span className="lb-tab-badge">{workTypesList.length}</span>
        </button>

        <button
          type="button"
          className={`lb-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => { setActiveTab('payments'); setSearchQuery(''); setLabourFilter('All'); }}
        >
          <span>💳</span> Labour Payments
          <span className="lb-tab-badge">{paymentsList.length}</span>
        </button>

        <button
          type="button"
          className={`lb-tab-btn ${activeTab === 'balances' ? 'active' : ''}`}
          onClick={() => { setActiveTab('balances'); setSearchQuery(''); setStatusFilter('All'); }}
        >
          <span>📊</span> Balances & Statements
          <span className="lb-tab-badge">{labourBalances.length}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="lb-toolbar">
        <div className="lb-search-wrap">
          <span className="lb-search-icon">⌕</span>
          <input
            className="lb-search"
            placeholder={
              activeTab === 'labourers'
                ? 'Search by name, code, mobile, village...'
                : activeTab === 'attendance'
                ? 'Search by attendance code, worker, farm, crop, work...'
                : activeTab === 'workTypes'
                ? 'Search work types, description...'
                : activeTab === 'payments'
                ? 'Search by voucher code, worker, payment mode...'
                : 'Search worker statement by name, village...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="lb-clear-search" type="button" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="lb-filter-group">
          {(activeTab === 'labourers' || activeTab === 'workTypes' || activeTab === 'balances') && (
            ['All', 'Active', 'Inactive'].map((s) => (
              <button
                key={s}
                type="button"
                className={`lb-filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))
          )}

          {(activeTab === 'attendance' || activeTab === 'payments') && (
            <select
              className="lb-search"
              style={{ width: 'auto', padding: '7px 12px' }}
              value={labourFilter}
              onChange={(e) => setLabourFilter(e.target.value)}
            >
              <option value="All">All Labourers</option>
              {laboursList.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.labourName} ({l.labourCode})
                </option>
              ))}
            </select>
          )}

          <button className="lb-refresh-btn" type="button" onClick={loadData} title="Refresh records">
            ↻
          </button>
        </div>
      </div>

      {/* ── Tab Content: 1. Labour Master ────────────────────────────────────── */}
      {activeTab === 'labourers' && (
        <div className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th>Labour Code</th>
                <th>Labourer Name</th>
                <th>Mobile</th>
                <th>Gender</th>
                <th>Village</th>
                <th>Daily Rate</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="lb-state-cell">
                    <div className="lb-loading-state">
                      <div className="lb-spinner"></div>
                      <span>Loading labourers directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLabours.length === 0 ? (
                <tr>
                  <td colSpan={8} className="lb-state-cell">
                    <div className="lb-empty-state">
                      <div className="lb-empty-icon">👥</div>
                      <p>No labour records found</p>
                      <span>Try adjusting your search query or status filter</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLabours.map((l) => (
                  <tr key={l.id}>
                    <td><span className="lb-code-badge">{l.labourCode}</span></td>
                    <td>
                      <div className="lb-item-cell">
                        {l.photo ? (
                          <img src={l.photo} alt={l.labourName} className="lb-avatar-img" />
                        ) : (
                          <div className="lb-avatar">{l.labourName.charAt(0)}</div>
                        )}
                        <div className="lb-item-info">
                          <strong>{l.labourName}</strong>
                          {l.notes && <span>{l.notes}</span>}
                        </div>
                      </div>
                    </td>
                    <td>{l.mobile}</td>
                    <td>{l.gender}</td>
                    <td>{l.village}</td>
                    <td><strong>{formatCurrency(l.dailyRate)}</strong> / day</td>
                    <td>
                      <button
                        type="button"
                        className={`lb-status-pill lb-status-${l.status.toLowerCase()}`}
                        onClick={() => toggleLabourStatus(l)}
                        title={`Click to set ${l.status === 'Active' ? 'Inactive' : 'Active'}`}
                      >
                        <span className="lb-status-dot"></span>
                        {l.status}
                      </button>
                    </td>
                    <td>
                      <div className="lb-actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="lb-action-btn lb-view"
                          type="button"
                          title="View Details"
                          onClick={() => setViewItem({ type: 'labour', data: l })}
                        >
                          👁
                        </button>
                        <button
                          className="lb-action-btn lb-edit"
                          type="button"
                          title="Edit"
                          onClick={() => openEdit('labour', l)}
                        >
                          ✎
                        </button>
                        <button
                          className="lb-action-btn lb-delete"
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteTarget({ type: 'labour', item: l })}
                        >
                          ⛌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="lb-table-footer">
            <span>
              Showing <strong>{filteredLabours.length}</strong> of <strong>{laboursList.length}</strong> registered labourers
            </span>
          </div>
        </div>
      )}

      {/* ── Tab Content: 2. Labour Attendance ────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Date</th>
                <th>Labourer</th>
                <th>Farm</th>
                <th>Crop</th>
                <th>Work Type</th>
                <th>Work Basis</th>
                <th>Units Worked</th>
                <th>Rate</th>
                <th>Payable Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="lb-state-cell">
                    <div className="lb-loading-state">
                      <div className="lb-spinner"></div>
                      <span>Loading attendance records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={11} className="lb-state-cell">
                    <div className="lb-empty-state">
                      <div className="lb-empty-icon">📋</div>
                      <p>No attendance entries found</p>
                      <span>Click "+ Record Attendance" to record daily labour work</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a) => (
                  <tr key={a.id}>
                    <td><span className="lb-code-badge">{a.attendanceCode}</span></td>
                    <td>{a.date}</td>
                    <td>
                      <div className="lb-item-cell">
                        <div className="lb-avatar">{a.labourName?.charAt(0) || 'L'}</div>
                        <div className="lb-item-info">
                          <strong>{a.labourName}</strong>
                          {a.notes && <span>{a.notes}</span>}
                        </div>
                      </div>
                    </td>
                    <td>{a.farmName}</td>
                    <td>{a.cropName}</td>
                    <td><strong>{a.workType}</strong></td>
                    <td>{a.workBasis}</td>
                    <td>{a.unitsWorked} {a.workBasis?.toLowerCase()}</td>
                    <td>{formatCurrency(a.rate)}</td>
                    <td>
                      <strong className="lb-amount-earned">{formatCurrency(a.amount)}</strong>
                      {a.amount !== a.calculatedAmount && (
                        <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>
                          adj. from {formatCurrency(a.calculatedAmount)}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="lb-actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="lb-action-btn lb-view"
                          type="button"
                          title="View Details"
                          onClick={() => setViewItem({ type: 'attendance', data: a })}
                        >
                          👁
                        </button>
                        <button
                          className="lb-action-btn lb-edit"
                          type="button"
                          title="Edit"
                          onClick={() => openEdit('attendance', a)}
                        >
                          ✎
                        </button>
                        <button
                          className="lb-action-btn lb-delete"
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteTarget({ type: 'attendance', item: a })}
                        >
                          ⛌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="lb-table-footer">
            <span>
              Showing <strong>{filteredAttendance.length}</strong> of <strong>{attendanceList.length}</strong> attendance entries
            </span>
            <span>
              Total Labour Expenditure: <strong>{formatCurrency(filteredAttendance.reduce((s, a) => s + (Number(a.amount) || 0), 0))}</strong>
            </span>
          </div>
        </div>
      )}

      {/* ── Tab Content: 3. Work Types ───────────────────────────────────────── */}
      {activeTab === 'workTypes' && (
        <div className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Work Type Name</th>
                <th>Default Rate</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="lb-state-cell">
                    <div className="lb-loading-state">
                      <div className="lb-spinner"></div>
                      <span>Loading work types...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredWorkTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="lb-state-cell">
                    <div className="lb-empty-state">
                      <div className="lb-empty-icon">💼</div>
                      <p>No work types found</p>
                      <span>Click "+ Add Work Type" to configure new agricultural operations</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkTypes.map((w) => (
                  <tr key={w.id}>
                    <td><span className="lb-code-badge">{w.code}</span></td>
                    <td><strong>{w.workTypeName}</strong></td>
                    <td><strong>{formatCurrency(w.defaultRate)}</strong></td>
                    <td>per {w.unit}</td>
                    <td style={{ color: '#64748b' }}>{w.description || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={`lb-status-pill lb-status-${w.status.toLowerCase()}`}
                        onClick={() => toggleWorkTypeStatus(w)}
                        title={`Click to set ${w.status === 'Active' ? 'Inactive' : 'Active'}`}
                      >
                        <span className="lb-status-dot"></span>
                        {w.status}
                      </button>
                    </td>
                    <td>
                      <div className="lb-actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="lb-action-btn lb-edit"
                          type="button"
                          title="Edit"
                          onClick={() => openEdit('workType', w)}
                        >
                          ✎
                        </button>
                        <button
                          className="lb-action-btn lb-delete"
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteTarget({ type: 'workType', item: w })}
                        >
                          ⛌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="lb-table-footer">
            <span>
              Configured Work Types: <strong>{filteredWorkTypes.length}</strong> (Default activities: Land Prep, Planting, Weeding, Spraying, Harvesting, Loading, Unloading)
            </span>
          </div>
        </div>
      )}

      {/* ── Tab Content: 4. Labour Payments ──────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th>Voucher Code</th>
                <th>Payment Date</th>
                <th>Labourer</th>
                <th>Amount Paid</th>
                <th>Payment Mode</th>
                <th>Ref / Cheque No</th>
                <th>Period Settlement</th>
                <th>Remarks</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="lb-state-cell">
                    <div className="lb-loading-state">
                      <div className="lb-spinner"></div>
                      <span>Loading payment records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="lb-state-cell">
                    <div className="lb-empty-state">
                      <div className="lb-empty-icon">💳</div>
                      <p>No payment records found</p>
                      <span>Click "+ Record Payment" to disburse wages to farm labourers</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td><span className="lb-code-badge">{p.paymentCode}</span></td>
                    <td>{p.paymentDate}</td>
                    <td>
                      <div className="lb-item-cell">
                        <div className="lb-avatar">{p.labourName?.charAt(0) || 'L'}</div>
                        <div className="lb-item-info">
                          <strong>{p.labourName}</strong>
                        </div>
                      </div>
                    </td>
                    <td><strong className="lb-amount-paid">{formatCurrency(p.amountPaid)}</strong></td>
                    <td>
                      <span className="lb-filter-count" style={{ padding: '3px 8px', fontSize: '11px' }}>
                        {p.paymentMode}
                      </span>
                    </td>
                    <td>{p.referenceNo || '—'}</td>
                    <td>{p.periodStart ? `${p.periodStart} to ${p.periodEnd || p.periodStart}` : 'Wage Settlement'}</td>
                    <td style={{ color: '#64748b' }}>{p.notes || '—'}</td>
                    <td>
                      <div className="lb-actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="lb-action-btn lb-view"
                          type="button"
                          title="View"
                          onClick={() => setViewItem({ type: 'payment', data: p })}
                        >
                          👁
                        </button>
                        <button
                          className="lb-action-btn lb-edit"
                          type="button"
                          title="Edit"
                          onClick={() => openEdit('payment', p)}
                        >
                          ✎
                        </button>
                        <button
                          className="lb-action-btn lb-delete"
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteTarget({ type: 'payment', item: p })}
                        >
                          ⛌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="lb-table-footer">
            <span>Showing <strong>{filteredPayments.length}</strong> wage payment disbursements</span>
            <span>Total Disbursed: <strong>{formatCurrency(filteredPayments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0))}</strong></span>
          </div>
        </div>
      )}

      {/* ── Tab Content: 5. Labour Balances & Statement ──────────────────────── */}
      {activeTab === 'balances' && (
        <div className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Labourer</th>
                <th>Village</th>
                <th>Days Worked</th>
                <th>Total Earned</th>
                <th>Total Paid</th>
                <th>Outstanding Balance</th>
                <th>Last Worked</th>
                <th style={{ textAlign: 'center' }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="lb-state-cell">
                    <div className="lb-loading-state">
                      <div className="lb-spinner"></div>
                      <span>Computing financial statement...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="lb-state-cell">
                    <div className="lb-empty-state">
                      <div className="lb-empty-icon">📊</div>
                      <p>No worker balances found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBalances.map((b) => (
                  <tr key={b.id}>
                    <td><span className="lb-code-badge">{b.labourCode}</span></td>
                    <td>
                      <div className="lb-item-cell">
                        <div className="lb-avatar">{b.labourName.charAt(0)}</div>
                        <div className="lb-item-info">
                          <strong>{b.labourName}</strong>
                          <span>{b.mobile}</span>
                        </div>
                      </div>
                    </td>
                    <td>{b.village}</td>
                    <td><strong>{b.totalDaysWorked.toFixed(1)}</strong> days ({b.attendanceCount} records)</td>
                    <td><strong className="lb-amount-earned">{formatCurrency(b.totalEarned)}</strong></td>
                    <td><strong className="lb-amount-paid">{formatCurrency(b.totalPaid)}</strong></td>
                    <td>
                      {b.outstandingBalance > 0 ? (
                        <span className="lb-amount-due">{formatCurrency(b.outstandingBalance)} Due</span>
                      ) : b.outstandingBalance < 0 ? (
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>{formatCurrency(Math.abs(b.outstandingBalance))} Advance</span>
                      ) : (
                        <span className="lb-amount-cleared">✓ Fully Settled</span>
                      )}
                    </td>
                    <td>{b.lastWorkedDate}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="lb-btn-primary"
                        style={{ padding: '5px 12px', fontSize: '11.5px' }}
                        type="button"
                        onClick={() => openPayForLabour(b)}
                      >
                        {b.outstandingBalance > 0 ? `Pay ${formatCurrency(b.outstandingBalance)}` : 'Pay Wage'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="lb-table-footer">
            <span>Total Earned: <strong>{formatCurrency(metrics.totalLabourCost)}</strong></span>
            <span>Total Paid: <strong>{formatCurrency(metrics.totalPaidAmount)}</strong></span>
            <span>Net Outstanding: <strong style={{ color: metrics.totalOutstandingBalance > 0 ? '#dc2626' : '#15803d' }}>{formatCurrency(metrics.totalOutstandingBalance)}</strong></span>
          </div>
        </div>
      )}

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}

      {/* Modal 1: Add / Edit Labourer */}
      {modalType === 'labour' && (
        <div className="lb-overlay" onClick={() => setModalType(null)}>
          <div className="lb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lb-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Labourer' : 'Register New Labourer'}</h2>
                <p>Enter labour directory details, contact, and base wage rate</p>
              </div>
              <button className="lb-close" type="button" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveLabour}>
              <div className="lb-form-body">
                {/* Labourer Photo Identity & Proof Section */}
                <div className="lb-photo-card">
                  <div className="lb-photo-left">
                    <div className="lb-photo-preview-wrap">
                      {labourForm.photo ? (
                        <img
                          src={labourForm.photo}
                          alt="Labourer Identity Preview"
                          className="lb-photo-preview"
                        />
                      ) : (
                        <div className="lb-photo-placeholder">
                          <span className="lb-photo-placeholder-icon">👤</span>
                          <span className="lb-photo-placeholder-text">No Photo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lb-photo-right">
                    <div className="lb-photo-title-wrap">
                      <label className="lb-photo-title">Labourer Photo / Identity Proof</label>
                      <span className="lb-photo-desc">
                        Take a photo using device camera or choose an image file from device
                      </span>
                    </div>

                    <div className="lb-photo-actions-row">
                      <button
                        type="button"
                        className="lb-btn-photo-action lb-btn-camera"
                        onClick={handleStartCamera}
                      >
                        📷 Take Photo
                      </button>
                      <button
                        type="button"
                        className="lb-btn-photo-action lb-btn-upload"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📁 Choose File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                      {labourForm.photo && (
                        <button
                          type="button"
                          className="lb-btn-photo-action lb-btn-remove-photo"
                          onClick={handleRemovePhoto}
                        >
                          ✕ Remove Photo
                        </button>
                      )}
                    </div>

                    {cameraError && (
                      <div className="lb-camera-inline-error">
                        ⚠️ {cameraError}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lb-row">
                  <div className="lb-field">
                    <label>Labour Code</label>
                    <input value={labourForm.labourCode} disabled />
                  </div>
                  <div className="lb-field">
                    <label>Status</label>
                    <select
                      value={labourForm.status}
                      onChange={(e) => setLabourForm({ ...labourForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="lb-field">
                  <label>Labourer Name *</label>
                  <input
                    placeholder="e.g. Mallaiah Goud"
                    value={labourForm.labourName}
                    onChange={(e) => setLabourForm({ ...labourForm, labourName: e.target.value })}
                    required
                  />
                </div>

                <div className="lb-row">
                  <div className="lb-field">
                    <label>Mobile Number *</label>
                    <input
                      placeholder="10-digit mobile"
                      maxLength={10}
                      value={labourForm.mobile}
                      onChange={(e) => setLabourForm({ ...labourForm, mobile: e.target.value.replace(/\D/g, '') })}
                      required
                    />
                  </div>
                  <div className="lb-field">
                    <label>Gender</label>
                    <select
                      value={labourForm.gender}
                      onChange={(e) => setLabourForm({ ...labourForm, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="lb-row">
                  <div className="lb-field">
                    <label>Village / Native Place *</label>
                    <input
                      placeholder="e.g. Kankipadu"
                      value={labourForm.village}
                      onChange={(e) => setLabourForm({ ...labourForm, village: e.target.value })}
                      required
                    />
                  </div>
                  <div className="lb-field">
                    <label>Daily Wage Rate (₹) *</label>
                    <input
                      type="number"
                      min="1"
                      step="10"
                      value={labourForm.dailyRate}
                      onChange={(e) => setLabourForm({ ...labourForm, dailyRate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="lb-field">
                  <label>Skills / Operational Remarks</label>
                  <textarea
                    placeholder="e.g. Expert in spraying, nursery seedling transplanting..."
                    value={labourForm.notes}
                    onChange={(e) => setLabourForm({ ...labourForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="lb-modal-foot">
                <button className="lb-btn-secondary" type="button" onClick={() => setModalType(null)}>
                  Cancel
                </button>
                <button className="lb-btn-primary" type="submit">
                  Save Labourer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Record / Edit Attendance */}
      {modalType === 'attendance' && (
        <div className="lb-overlay" onClick={() => setModalType(null)}>
          <div className="lb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lb-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Labour Attendance' : 'Record Labour Attendance'}</h2>
                <p>Record daily hours/days worked, farm plot, crop, and payable wage amount</p>
              </div>
              <button className="lb-close" type="button" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveAttendance}>
              <div className="lb-form-body">
                <div className="lb-row">
                  <div className="lb-field">
                    <label>Attendance Code</label>
                    <input value={attendanceForm.attendanceCode} disabled />
                  </div>
                  <div className="lb-field">
                    <label>Work Date *</label>
                    <input
                      type="date"
                      value={attendanceForm.date}
                      onChange={(e) => handleAttendanceChange('date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="lb-field">
                  <label>Labourer *</label>
                  <select
                    value={attendanceForm.labourId}
                    onChange={(e) => handleAttendanceChange('labourId', e.target.value)}
                    required
                  >
                    <option value="">-- Select Labourer --</option>
                    {activeLabourers.map((l) => (
                      <option key={l.id} value={String(l.id)}>
                        {l.labourName} ({l.labourCode}) — Daily Rate: ₹{l.dailyRate} ({l.village})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lb-row">
                  <div className="lb-field">
                    <label>Farm Block / Plot</label>
                    <select
                      value={attendanceForm.farmName}
                      onChange={(e) => handleAttendanceChange('farmName', e.target.value)}
                    >
                      <option value="Farm 1 (South Block)">Farm 1 (South Block)</option>
                      <option value="Farm 2 (East Canal Plot)">Farm 2 (East Canal Plot)</option>
                      <option value="Main Field">Main Field</option>
                      <option value="Hillside Plot">Hillside Plot</option>
                      <option value="Greenhouse / Nursery">Greenhouse / Nursery</option>
                    </select>
                  </div>
                  <div className="lb-field">
                    <label>Crop</label>
                    <select
                      value={attendanceForm.cropName}
                      onChange={(e) => handleAttendanceChange('cropName', e.target.value)}
                    >
                      <option value="Paddy (Rice)">Paddy (Rice)</option>
                      <option value="Tomato">Tomato</option>
                      <option value="Chilli">Chilli</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Sugarcane">Sugarcane</option>
                      <option value="Maize">Maize</option>
                      <option value="Groundnut">Groundnut</option>
                      <option value="General Farm Work">General Farm Work</option>
                    </select>
                  </div>
                </div>

                <div className="lb-row">
                  <div className="lb-field">
                    <label>Labour Work Type *</label>
                    <select
                      value={attendanceForm.workType}
                      onChange={(e) => handleAttendanceChange('workType', e.target.value)}
                      required
                    >
                      {workTypesList.map((w) => (
                        <option key={w.id} value={w.workTypeName}>
                          {w.workTypeName} (Default: ₹{w.defaultRate}/{w.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lb-field">
                    <label>Work Basis</label>
                    <select
                      value={attendanceForm.workBasis}
                      onChange={(e) => handleAttendanceChange('workBasis', e.target.value)}
                    >
                      <option value="Days">Days (e.g. 1.0 = Full day, 0.5 = Half day)</option>
                      <option value="Hours">Hours (e.g. 8 hrs)</option>
                    </select>
                  </div>
                </div>

                <div className="lb-row-3">
                  <div className="lb-field">
                    <label>{attendanceForm.workBasis === 'Days' ? 'Days Worked *' : 'Hours Worked *'}</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={attendanceForm.unitsWorked}
                      onChange={(e) => handleAttendanceChange('unitsWorked', e.target.value)}
                      required
                    />
                  </div>
                  <div className="lb-field">
                    <label>Applicable Rate (₹) *</label>
                    <input
                      type="number"
                      min="1"
                      step="10"
                      value={attendanceForm.rate}
                      onChange={(e) => handleAttendanceChange('rate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="lb-field">
                    <label>Payable Amount (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={attendanceForm.amount}
                      onChange={(e) => handleAttendanceChange('amount', e.target.value)}
                      required
                    />
                    <span className="lb-field-hint">Auto-calculated; editable if required</span>
                  </div>
                </div>

                <div className="lb-highlight-box">
                  <div>
                    <label>Calculated Payable Amount</label>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {attendanceForm.unitsWorked} {attendanceForm.workBasis} × ₹{attendanceForm.rate} = ₹{Math.round(attendanceForm.unitsWorked * attendanceForm.rate)}
                    </div>
                  </div>
                  <div className="lb-highlight-val">
                    {formatCurrency(attendanceForm.amount)}
                  </div>
                </div>

                <div className="lb-field">
                  <label>Field Notes / Task Completed</label>
                  <textarea
                    placeholder="e.g. Weeded ridge lines along 2 acres..."
                    value={attendanceForm.notes}
                    onChange={(e) => handleAttendanceChange('notes', e.target.value)}
                  />
                </div>
              </div>

              <div className="lb-modal-foot">
                <button className="lb-btn-secondary" type="button" onClick={() => setModalType(null)}>
                  Cancel
                </button>
                <button className="lb-btn-primary" type="submit">
                  {editingItem ? 'Update Attendance' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Work Type */}
      {modalType === 'workType' && (
        <div className="lb-overlay" onClick={() => setModalType(null)}>
          <div className="lb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lb-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Labour Work Type' : 'Add Labour Work Type'}</h2>
                <p>Configure agricultural work activities and standard wage benchmarks</p>
              </div>
              <button className="lb-close" type="button" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveWorkType}>
              <div className="lb-form-body">
                <div className="lb-row">
                  <div className="lb-field">
                    <label>Work Type Code</label>
                    <input value={workTypeForm.code} disabled />
                  </div>
                  <div className="lb-field">
                    <label>Status</label>
                    <select
                      value={workTypeForm.status}
                      onChange={(e) => setWorkTypeForm({ ...workTypeForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="lb-field">
                  <label>Work Type Name *</label>
                  <input
                    placeholder="e.g. Land Preparation, Harvesting, Weeding..."
                    value={workTypeForm.workTypeName}
                    onChange={(e) => setWorkTypeForm({ ...workTypeForm, workTypeName: e.target.value })}
                    required
                  />
                </div>

                <div className="lb-row">
                  <div className="lb-field">
                    <label>Default Wage Rate (₹) *</label>
                    <input
                      type="number"
                      min="1"
                      step="10"
                      value={workTypeForm.defaultRate}
                      onChange={(e) => setWorkTypeForm({ ...workTypeForm, defaultRate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="lb-field">
                    <label>Unit of Work</label>
                    <select
                      value={workTypeForm.unit}
                      onChange={(e) => setWorkTypeForm({ ...workTypeForm, unit: e.target.value })}
                    >
                      <option value="Day">Day</option>
                      <option value="Hour">Hour</option>
                      <option value="Acre">Acre</option>
                      <option value="Bag">Bag / Quintal</option>
                    </select>
                  </div>
                </div>

                <div className="lb-field">
                  <label>Operation Description</label>
                  <textarea
                    placeholder="Describe specific field activities, equipment used, or benchmarks..."
                    value={workTypeForm.description}
                    onChange={(e) => setWorkTypeForm({ ...workTypeForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="lb-modal-foot">
                <button className="lb-btn-secondary" type="button" onClick={() => setModalType(null)}>
                  Cancel
                </button>
                <button className="lb-btn-primary" type="submit">
                  {editingItem ? 'Update Work Type' : 'Save Work Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Record / Edit Payment */}
      {modalType === 'payment' && (
        <div className="lb-overlay" onClick={() => setModalType(null)}>
          <div className="lb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lb-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Labour Payment Voucher' : 'Record Labour Wage Payment'}</h2>
                <p>Disburse wage settlements, record payment mode, and clear outstanding balances</p>
              </div>
              <button className="lb-close" type="button" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleSavePayment}>
              <div className="lb-form-body">
                <div className="lb-row">
                  <div className="lb-field">
                    <label>Voucher Code</label>
                    <input value={paymentForm.paymentCode} disabled />
                  </div>
                  <div className="lb-field">
                    <label>Payment Date *</label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="lb-field">
                  <label>Labourer *</label>
                  <select
                    value={paymentForm.labourId}
                    onChange={(e) => {
                      const lId = e.target.value;
                      const balObj = labourBalances.find((b) => String(b.id) === String(lId));
                      setPaymentForm({
                        ...paymentForm,
                        labourId: lId,
                        amountPaid: balObj && balObj.outstandingBalance > 0 ? balObj.outstandingBalance : paymentForm.amountPaid
                      });
                    }}
                    required
                  >
                    <option value="">-- Select Labourer --</option>
                    {laboursList.map((l) => {
                      const bal = labourBalances.find((b) => String(b.id) === String(l.id));
                      return (
                        <option key={l.id} value={String(l.id)}>
                          {l.labourName} ({l.labourCode}) — Balance Due: ₹{bal?.outstandingBalance || 0}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedPaymentWorker && (
                  <div className="lb-highlight-box" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 650 }}>
                        Worker Statement
                      </span>
                      <div style={{ fontSize: '12px', color: '#1e293b', marginTop: '2px' }}>
                        Total Earned: <strong>{formatCurrency(selectedPaymentWorker.totalEarned)}</strong> ({selectedPaymentWorker.totalDaysWorked} days)
                        &nbsp;·&nbsp; Already Paid: <strong>{formatCurrency(selectedPaymentWorker.totalPaid)}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 650 }}>
                        Pending Balance
                      </span>
                      <div style={{ fontSize: '16px', fontWeight: 750, color: selectedPaymentWorker.outstandingBalance > 0 ? '#dc2626' : '#15803d' }}>
                        {formatCurrency(selectedPaymentWorker.outstandingBalance)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="lb-row">
                  <div className="lb-field">
                    <label>Amount Paid (₹) *</label>
                    <input
                      type="number"
                      min="1"
                      step="10"
                      placeholder="e.g. 500"
                      value={paymentForm.amountPaid}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                      required
                    />
                  </div>
                  <div className="lb-field">
                    <label>Payment Mode</label>
                    <select
                      value={paymentForm.paymentMode}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="lb-row">
                  <div className="lb-field">
                    <label>Reference / Cheque / UTR No.</label>
                    <input
                      placeholder="e.g. UPI Ref / Cash Voucher #102"
                      value={paymentForm.referenceNo}
                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                    />
                  </div>
                  <div className="lb-field">
                    <label>Settlement Period</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="date"
                        title="Start Date"
                        value={paymentForm.periodStart}
                        onChange={(e) => setPaymentForm({ ...paymentForm, periodStart: e.target.value })}
                      />
                      <input
                        type="date"
                        title="End Date"
                        value={paymentForm.periodEnd}
                        onChange={(e) => setPaymentForm({ ...paymentForm, periodEnd: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="lb-field">
                  <label>Remarks / Supervisor Note</label>
                  <textarea
                    placeholder="e.g. Weekly settlement cleared in presence of supervisor..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="lb-modal-foot">
                <button className="lb-btn-secondary" type="button" onClick={() => setModalType(null)}>
                  Cancel
                </button>
                <button className="lb-btn-primary" type="submit">
                  {editingItem ? 'Update Payment' : 'Confirm & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: View Details Modal */}
      {viewItem && (
        <div className="lb-overlay" onClick={() => setViewItem(null)}>
          <div className="lb-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="lb-modal-head">
              <div>
                <h2>
                  {viewItem.type === 'labour'
                    ? `Labourer: ${viewItem.data.labourName}`
                    : viewItem.type === 'attendance'
                    ? `Attendance: ${viewItem.data.attendanceCode}`
                    : `Payment: ${viewItem.data.paymentCode}`}
                </h2>
                <p>Detailed farm record information</p>
              </div>
              <button className="lb-close" type="button" onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div className="lb-form-body">
              <div className="lb-view-grid">
                {viewItem.type === 'labour' && (
                  <>
                    <div className="lb-view-header-card">
                      <div className="lb-view-photo-container">
                        {viewItem.data.photo ? (
                          <img
                            src={viewItem.data.photo}
                            alt={viewItem.data.labourName}
                            className="lb-view-photo"
                          />
                        ) : (
                          <div className="lb-view-avatar-fallback">
                            {viewItem.data.labourName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="lb-view-header-details">
                        <h3>{viewItem.data.labourName}</h3>
                        <div className="lb-view-header-pills">
                          <span className="lb-code-badge">{viewItem.data.labourCode}</span>
                          <span className={`lb-status-pill lb-status-${(viewItem.data.status || 'Active').toLowerCase()}`}>
                            <span className="lb-status-dot"></span>
                            {viewItem.data.status || 'Active'}
                          </span>
                          {viewItem.data.photo ? (
                            <span className="lb-verified-badge">✓ Photo Verified</span>
                          ) : (
                            <span className="lb-unverified-badge">No Photo Uploaded</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lb-view-row">
                      <span className="lb-view-label">Labour Code</span>
                      <span className="lb-view-value">{viewItem.data.labourCode}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Full Name</span>
                      <span className="lb-view-value">{viewItem.data.labourName}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Mobile</span>
                      <span className="lb-view-value">{viewItem.data.mobile}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Gender</span>
                      <span className="lb-view-value">{viewItem.data.gender}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Village / Native Place</span>
                      <span className="lb-view-value">{viewItem.data.village}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Standard Daily Rate</span>
                      <span className="lb-view-value">{formatCurrency(viewItem.data.dailyRate)}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Status</span>
                      <span className="lb-view-value">{viewItem.data.status}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Identity Photo</span>
                      <span className="lb-view-value">{viewItem.data.photo ? 'Available (Stored on record)' : 'Not Uploaded'}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Notes</span>
                      <span className="lb-view-value">{viewItem.data.notes || '—'}</span>
                    </div>
                  </>
                )}

                {viewItem.type === 'attendance' && (
                  <>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Attendance Code</span>
                      <span className="lb-view-value">{viewItem.data.attendanceCode}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Date</span>
                      <span className="lb-view-value">{viewItem.data.date}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Labourer Name</span>
                      <span className="lb-view-value">{viewItem.data.labourName}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Farm Plot</span>
                      <span className="lb-view-value">{viewItem.data.farmName}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Crop</span>
                      <span className="lb-view-value">{viewItem.data.cropName}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Work Type</span>
                      <span className="lb-view-value">{viewItem.data.workType}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Work Basis</span>
                      <span className="lb-view-value">{viewItem.data.workBasis}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Units Worked</span>
                      <span className="lb-view-value">{viewItem.data.unitsWorked} {viewItem.data.workBasis}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Rate</span>
                      <span className="lb-view-value">{formatCurrency(viewItem.data.rate)}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Payable Amount</span>
                      <span className="lb-view-value" style={{ color: '#15803d', fontWeight: 700 }}>
                        {formatCurrency(viewItem.data.amount)}
                      </span>
                    </div>
                    <div className="lb-view-row" style={{ gridColumn: '1 / -1' }}>
                      <span className="lb-view-label">Field Notes</span>
                      <span className="lb-view-value">{viewItem.data.notes || '—'}</span>
                    </div>
                  </>
                )}

                {viewItem.type === 'payment' && (
                  <>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Voucher Code</span>
                      <span className="lb-view-value">{viewItem.data.paymentCode}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Payment Date</span>
                      <span className="lb-view-value">{viewItem.data.paymentDate}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Labourer</span>
                      <span className="lb-view-value">{viewItem.data.labourName}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Amount Paid</span>
                      <span className="lb-view-value" style={{ color: '#15803d', fontWeight: 700 }}>
                        {formatCurrency(viewItem.data.amountPaid)}
                      </span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Payment Mode</span>
                      <span className="lb-view-value">{viewItem.data.paymentMode}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Reference No</span>
                      <span className="lb-view-value">{viewItem.data.referenceNo || '—'}</span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Settlement Period</span>
                      <span className="lb-view-value">
                        {viewItem.data.periodStart ? `${viewItem.data.periodStart} to ${viewItem.data.periodEnd || viewItem.data.periodStart}` : 'Wage Settlement'}
                      </span>
                    </div>
                    <div className="lb-view-row">
                      <span className="lb-view-label">Remarks</span>
                      <span className="lb-view-value">{viewItem.data.notes || '—'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="lb-modal-foot">
              <button className="lb-btn-secondary" type="button" onClick={() => setViewItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Delete Confirmation */}
      {deleteTarget && (
        <div className="lb-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="lb-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="lb-confirm-icon">⚠</div>
            <h3>Delete Record?</h3>
            <p>
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <div className="lb-confirm-btns">
              <button className="lb-btn-secondary" type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="lb-btn-danger" type="button" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Live Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="lb-overlay lb-camera-overlay" onClick={handleCloseCamera}>
          <div className="lb-camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lb-modal-head">
              <div>
                <h2>Take Labourer Photo</h2>
                <p>
                  {capturedPhoto
                    ? 'Review photo. Click "Save Photo" to confirm or "Retake" to capture again'
                    : 'Align face inside the guide frame and press capture'}
                </p>
              </div>
              <button className="lb-close" type="button" onClick={handleCloseCamera}>✕</button>
            </div>
            <div className="lb-camera-body">
              {cameraError ? (
                <div className="lb-camera-error-box">
                  <div style={{ fontSize: '30px', marginBottom: '8px' }}>⚠️</div>
                  <h4 style={{ margin: '0 0 8px', color: '#dc2626' }}>Camera Access Required</h4>
                  <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                    {cameraError}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="lb-btn-primary"
                      onClick={() => {
                        handleCloseCamera();
                        fileInputRef.current?.click();
                      }}
                    >
                      📁 Choose from Device Files
                    </button>
                    <button
                      type="button"
                      className="lb-btn-secondary"
                      onClick={handleCloseCamera}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : capturedPhoto ? (
                <div className="lb-captured-preview-wrap">
                  <img
                    src={capturedPhoto}
                    alt="Captured Labourer Snapshot"
                    className="lb-captured-preview-img"
                  />
                  <div className="lb-captured-preview-badge">Captured Preview</div>
                </div>
              ) : (
                <div className="lb-video-wrapper">
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={(e) => {
                      e.target.play().catch(() => {});
                    }}
                    className="lb-camera-video"
                  />
                  <div className="lb-camera-guide-oval"></div>
                  {cameraLoading && (
                    <div className="lb-camera-loading-overlay">
                      <div className="lb-spinner"></div>
                      <span>Connecting to camera...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="lb-modal-foot">
              {capturedPhoto ? (
                <>
                  <button
                    type="button"
                    className="lb-btn-secondary"
                    onClick={handleRetakePhoto}
                  >
                    🔄 Retake Photo
                  </button>
                  <button
                    type="button"
                    className="lb-btn-primary lb-btn-capture"
                    onClick={handleAcceptCapturedPhoto}
                  >
                    ✓ Save Photo
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="lb-btn-secondary"
                    onClick={handleCloseCamera}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="lb-btn-secondary"
                    onClick={handleSwitchCamera}
                    title="Switch front and back camera"
                    disabled={cameraLoading}
                  >
                    🔄 Switch Camera
                  </button>
                  <button
                    type="button"
                    className="lb-btn-primary lb-btn-capture"
                    onClick={handleCaptureSnapshot}
                    disabled={cameraLoading || !!cameraError}
                  >
                    📸 Capture Photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      </div>
  );
}
