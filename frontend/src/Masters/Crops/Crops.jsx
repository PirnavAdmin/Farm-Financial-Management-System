import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cropService } from '../../services/cropService';
import { labourService } from '../../services/labourService';
import './crops.css';

/* ─── Crop Activity File & Photo Upload Utilities ─── */
const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

const formatUploadDate = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatUploadTime = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');
  return `${strHours}:${minutes} ${ampm}`;
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const getFileInfo = (file) => {
  const name = file.name || 'unnamed-file';
  const ext = name.slice(((name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();

  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) || file.type?.startsWith('image/')) {
    return {
      category: 'image',
      displayType: `${(ext || 'IMG').toUpperCase()} Image`,
      iconColor: '#059669',
      iconBadge: 'IMG'
    };
  }
  if (ext === 'pdf' || file.type === 'application/pdf') {
    return {
      category: 'pdf',
      displayType: 'PDF Document',
      iconColor: '#dc2626',
      iconBadge: 'PDF'
    };
  }
  if (['doc', 'docx'].includes(ext) || file.type?.includes('word')) {
    return {
      category: 'word',
      displayType: 'Word Document',
      iconColor: '#2563eb',
      iconBadge: 'DOC'
    };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || file.type?.includes('sheet') || file.type?.includes('excel')) {
    return {
      category: 'excel',
      displayType: 'Excel Spreadsheet',
      iconColor: '#16a34a',
      iconBadge: 'XLS'
    };
  }
  return {
    category: 'doc',
    displayType: 'Document',
    iconColor: '#64748b',
    iconBadge: 'DOC'
  };
};


function CropsInner({ initialTab = 'crop-management', onNavigate }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab === 'crops' || initialTab === 'varieties') return 'crop-management';
    return initialTab || 'crop-management';
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cropTypeFilter, setCropTypeFilter] = useState('All');
  const [seasonFilter, setSeasonFilter] = useState('All');

  // Unified Filters Dropdown State for Crop Management
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const handleOutsideClick = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isFilterOpen]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (cropTypeFilter !== 'All') count++;
    if (seasonFilter !== 'All') count++;
    if (statusFilter !== 'All') count++;
    return count;
  }, [cropTypeFilter, seasonFilter, statusFilter]);

  const handleClearFilters = () => {
    setCropTypeFilter('All');
    setSeasonFilter('All');
    setStatusFilter('All');
  };

  // Crop Management Combined Form State
  const [cropMgmtForm, setCropMgmtForm] = useState({
    cropName: '',
    cropType: '',
    varietyName: '',
    durationDays: '',
    season: 'Kharif',
    status: 'Active'
  });

  // Data states
  const [cropsList, setCropsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [varietiesList, setVarietiesList] = useState([]);
  const [seasonsList, setSeasonsList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Action Menu Dropdown (Three Dots)
  const [activeActionMenu, setActiveActionMenu] = useState(null); // { id, type, item }
  const [actionMenuPos, setActionMenuPos] = useState(null);

  useEffect(() => {
    if (!activeActionMenu) return undefined;
    const handleClose = () => {
      setActiveActionMenu(null);
      setActionMenuPos(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('resize', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [activeActionMenu]);

  const toggleActionMenu = (event, id, type, item) => {
    event.stopPropagation();
    if (activeActionMenu?.id === id) {
      setActiveActionMenu(null);
      setActionMenuPos(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 145;
    const menuHeight = 125;
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    const top = rect.bottom + 4 + menuHeight > window.innerHeight
      ? Math.max(8, rect.top - 4 - menuHeight)
      : rect.bottom + 4;

    setActionMenuPos({ top, left });
    setActiveActionMenu({ id, type, item });
  };

  // Modals & Forms
  const [modalType, setModalType] = useState(null); // 'crop' | 'season' | 'variety' | 'category' | 'activity' | null
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, item }
  const [viewTarget, setViewTarget] = useState(null); // { title, subtitle, rawItem, editType, fields }
  const [labourDetailsTarget, setLabourDetailsTarget] = useState(null);
  const [labourDetails, setLabourDetails] = useState([]);
  const [labourDetailsMatch, setLabourDetailsMatch] = useState('');
  const [labourDetailsLoading, setLabourDetailsLoading] = useState(false);
  const [labourDetailsError, setLabourDetailsError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // Upload state for Crop Activity
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [previewModalFile, setPreviewModalFile] = useState(null);

  // Camera state for Crop Activity
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraInputRef = useRef(null);

  const startCameraStream = async (facing = 'environment') => {
    setCameraError('');
    setCapturedPhoto(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
        setCameraActive(false);
      } else {
        setCameraError('Camera API is not supported in this browser. Please use the file upload option.');
      }
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('[Camera error]:', err);
      let msg = 'Could not access camera. Please allow camera permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera access was blocked. Please enable camera permission in your browser address bar settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera hardware found on this computer or device.';
      }
      setCameraError(msg);
    }
  };

  const handleStartCamera = () => {
    setCameraActive(true);
    startCameraStream(cameraFacing);
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCapturedPhoto(null);
    setCameraError('');
  };

  const handleSwitchCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCameraStream(nextFacing);
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);
  };

  const handleAcceptCapturedPhoto = () => {
    if (!capturedPhoto) return;
    const now = new Date();
    const uploadDate = formatUploadDate(now);
    const uploadTime = formatUploadTime(now);

    const stringLength = capturedPhoto.length - 'data:image/jpeg;base64,'.length;
    const sizeInBytes = Math.round(stringLength * 0.75);

    const fileObj = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: `Crop_Capture_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.jpg`,
      size: sizeInBytes,
      formattedSize: formatFileSize(sizeInBytes),
      type: 'image/jpeg',
      displayType: 'JPG Image',
      category: 'image',
      iconColor: '#059669',
      iconBadge: 'IMG',
      uploadDate,
      uploadTime,
      timestamp: now.getTime(),
      previewUrl: capturedPhoto,
      fileUrl: capturedPhoto,
    };

    setActivityForm((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), fileObj],
    }));

    handleStopCamera();
    showToast('Field photo captured and attached.');
  };

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, capturedPhoto]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const processFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError('');

    const errors = [];
    const validFiles = [];

    Array.from(fileList).forEach((file) => {
      const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
      const isSupported = SUPPORTED_EXTENSIONS.includes(ext) || file.type?.startsWith('image/') || file.type === 'application/pdf';

      if (!isSupported) {
        errors.push(`"${file.name}" has an unsupported format. Supported formats: JPG, JPEG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds the 15 MB size limit (${formatFileSize(file.size)}).`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setUploadError(errors.join(' '));
    }

    if (validFiles.length === 0) return;

    const now = new Date();
    const uploadDate = formatUploadDate(now);
    const uploadTime = formatUploadTime(now);

    validFiles.forEach((file) => {
      const info = getFileInfo(file);
      const baseObj = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        type: file.type,
        displayType: info.displayType,
        category: info.category,
        iconColor: info.iconColor,
        iconBadge: info.iconBadge,
        uploadDate,
        uploadTime,
        timestamp: now.getTime(),
        previewUrl: null
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const fileObj = {
          ...baseObj,
          previewUrl: info.category === 'image' ? dataUrl : null,
          fileUrl: dataUrl
        };
        setActivityForm((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), fileObj]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e) => {
    processFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  const handleRemoveAttachment = (fileId) => {
    setActivityForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((f) => f.id !== fileId)
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };


  // Reset pagination on search, tab, or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, statusFilter]);

  // Form states
  const [cropForm, setCropForm] = useState({
    cropCode: '', cropName: '', cropType: '',
    cropCategory: '', defaultUnit: '', status: '', description: ''
  });
  const [seasonForm, setSeasonForm] = useState({
    seasonCode: '', farm: '', crop: '',
    variety: '', season: '',
    sowingDate: '', expectedHarvestDate: '', actualHarvestDate: '',
    area: '', expectedYield: '', expectedRevenue: '',
    actualYield: '', actualRevenue: '', status: ''
  });
  const [activityForm, setActivityForm] = useState({
    activityCode: '',
    farm: '',
    crop: '',
    season: '',
    activityType: '',
    activityDate: '',
    labourWorkers: '',
    machinery: '',
    materialsUsed: '',
    totalCost: '',
    status: '',
    supervisor: '',
    notes: '',
    attachments: []
  });
  const [varietyForm, setVarietyForm] = useState({
    code: '', cropName: '', varietyName: '', durationDays: '',
    season: '', expectedYield: '', status: ''
  });
  const [categoryForm, setCategoryForm] = useState({
    code: '', name: '', description: '', status: ''
  });

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync activeTab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'crops' || initialTab === 'varieties') {
        setActiveTab('crop-management');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  // Load all crop data
  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [crops, categories, varieties, seasons, activities] = await Promise.all([
        cropService.getCrops(),
        cropService.getCategories(),
        cropService.getVarieties(),
        cropService.getSeasons(),
        cropService.getActivities ? cropService.getActivities() : Promise.resolve([])
      ]);
      setCropsList(crops || []);
      setCategoriesList(categories || []);
      setVarietiesList(varieties || []);
      setSeasonsList(seasons || []);
      setActivitiesList(activities || []);
    } catch (err) {
      console.error('[Crops] Failed to load data:', err);
      const msg = err.friendlyMessage || err.message || 'Error loading crop records.';
      setFetchError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Module-specific Statistics
  const safeCrops = Array.isArray(cropsList) ? cropsList : [];
  const safeSeasons = Array.isArray(seasonsList) ? seasonsList : [];
  const safeActivities = Array.isArray(activitiesList) ? activitiesList : [];
  const safeVarieties = Array.isArray(varietiesList) ? varietiesList : [];
  const safeCategories = Array.isArray(categoriesList) ? categoriesList : [];

  // Helper: Resolve agricultural crop type (Cereal, Vegetable, Spices, Fibre Crop, Oilseeds, Commercial, Pulses, Horticulture, etc.)
const resolveCropType = (crop) => {
  if (!crop) return 'Field Crop';
  const rawType = String(crop.cropType || '').trim();
  const lowerType = rawType.toLowerCase();
  const seasonWords = ['kharif', 'rabi', 'zaid', 'annual', 'perennial', 'summer', 'winter', 'monsoon', 'standing', 'seasonal'];

  // If rawType is an actual agricultural type and not a season/duration word
  if (rawType && !seasonWords.includes(lowerType) && lowerType !== 'field crop' && lowerType !== 'agricultural') {
    return rawType;
  }

  // Derive from cropName
  const name = String(crop.cropName || crop.name || '').toLowerCase();
  if (name.includes('paddy') || name.includes('rice') || name.includes('wheat') || name.includes('maize') || name.includes('corn') || name.includes('millet') || name.includes('jowar') || name.includes('bajra') || name.includes('ragi') || name.includes('barley')) {
    return 'Cereal';
  }
  if (name.includes('tomato') || name.includes('onion') || name.includes('potato') || name.includes('brinjal') || name.includes('eggplant') || name.includes('okra') || name.includes('bhendi') || name.includes('cabbage') || name.includes('cauliflower') || name.includes('vegetable')) {
    return 'Vegetable';
  }
  if (name.includes('chilli') || name.includes('chili') || name.includes('pepper') || name.includes('turmeric') || name.includes('ginger') || name.includes('spice')) {
    return 'Spices';
  }
  if (name.includes('cotton') || name.includes('jute')) {
    return 'Fibre Crop';
  }
  if (name.includes('groundnut') || name.includes('peanut') || name.includes('soybean') || name.includes('mustard') || name.includes('sunflower') || name.includes('oilseed')) {
    return 'Oilseeds';
  }
  if (name.includes('sugarcane') || name.includes('tobacco')) {
    return 'Commercial';
  }
  if (name.includes('gram') || name.includes('pulse') || name.includes('dal') || name.includes('pea') || name.includes('lentil')) {
    return 'Pulses';
  }
  if (name.includes('mango') || name.includes('banana') || name.includes('guava') || name.includes('citrus') || name.includes('apple') || name.includes('fruit')) {
    return 'Horticulture';
  }

  // Fallback to cropCategory if meaningful
  const cat = String(crop.cropCategory || crop.category || '').trim();
  if (cat && !['field crop', 'agricultural', 'active', 'inactive'].includes(cat.toLowerCase())) {
    return cat;
  }

  return 'Field Crop';
};

  // ── Combined Crop Management Dataset (Merging Crop Master & Crop Varieties) ──
  const combinedCropManagementRows = useMemo(() => {
    const rows = [];
    const matchedVarietyIds = new Set();

    safeCrops.forEach((c) => {
      const cName = String(c.cropName || '').trim();
      const cId = c.cropCode || (c.id ? `CRP-${String(c.id).padStart(3, '0')}` : 'CRP-001');

      // Find all varieties associated with this crop (by cropId or matching cropName)
      const linkedVarieties = safeVarieties.filter((v) => {
        if (!v) return false;
        if (v.cropId && String(v.cropId) === String(c.id)) return true;
        if (v.cropName && v.cropName.trim().toLowerCase() === cName.toLowerCase()) return true;
        return false;
      });

      if (linkedVarieties.length > 0) {
        linkedVarieties.forEach((v) => {
          matchedVarietyIds.add(v.id);
          const resolvedType = resolveCropType(c);
          rows.push({
            uniqueKey: `crop-${c.id}-var-${v.id}`,
            rowId: `crop-${c.id}-var-${v.id}`,
            cropId: cId,
            cropName: cName,
            cropType: resolvedType,
            varietyName: v.varietyName || v.name || '—',
            durationDays: v.durationDays || v.duration || '',
            season: v.season || 'Kharif',
            status: v.status || c.status || 'Active',
            rawCrop: c,
            rawVariety: v
          });
        });
      } else {
        // Crop with no variety registered yet
        const resolvedType = resolveCropType(c);
        rows.push({
          uniqueKey: `crop-${c.id}-standalone`,
          rowId: `crop-${c.id}-standalone`,
          cropId: cId,
          cropName: cName,
          cropType: resolvedType,
          varietyName: '—',
          durationDays: '',
          season: '—',
          status: c.status || 'Active',
          rawCrop: c,
          rawVariety: null
        });
      }
    });

    // Support standalone varieties without linked crop in master list
    safeVarieties.forEach((v) => {
      if (!matchedVarietyIds.has(v.id)) {
        const cName = v.cropName || 'Other Crop';
        const resolvedType = resolveCropType({ cropName: cName, cropType: v.cropType });
        rows.push({
          uniqueKey: `var-orphan-${v.id}`,
          rowId: `var-orphan-${v.id}`,
          cropId: v.code ? `CRP-${String(v.code).replace(/\D/g, '').padStart(3, '0')}` : 'CRP-009',
          cropName: cName,
          cropType: resolvedType,
          varietyName: v.varietyName || '—',
          durationDays: v.durationDays || '',
          season: v.season || 'Seasonal',
          status: v.status || 'Active',
          rawCrop: null,
          rawVariety: v
        });
      }
    });

    // Deterministic sorting by Crop ID sequence
    return rows.sort((a, b) => {
      const numA = parseInt(String(a.cropId).replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.cropId).replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return String(a.cropName).localeCompare(String(b.cropName));
    });
  }, [safeCrops, safeVarieties]);

  // Unique Dropdown Options dynamically extracted from data
  const availableCropTypes = useMemo(() => {
    const set = new Set();
    combinedCropManagementRows.forEach(r => {
      if (r.cropType && r.cropType !== '—') set.add(r.cropType.trim());
    });
    ['Cereal', 'Vegetable', 'Spices', 'Fibre Crop', 'Oilseeds', 'Commercial', 'Pulses', 'Horticulture'].forEach(t => set.add(t));
    const sorted = Array.from(set).filter(Boolean).sort();
    return ['All', ...sorted];
  }, [combinedCropManagementRows]);

  const availableSeasons = useMemo(() => {
    const set = new Set();
    combinedCropManagementRows.forEach(r => {
      if (r.season && r.season !== '—') set.add(r.season.trim());
    });
    ['Kharif', 'Rabi', 'Zaid', 'Kharif-Rabi', 'Perennial', 'All Season'].forEach(s => set.add(s));
    const sorted = Array.from(set).filter(Boolean).sort();
    return ['All', ...sorted];
  }, [combinedCropManagementRows]);

  // Combined Crop Management Filtering
  const filteredCropManagementRows = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const ct = (cropTypeFilter || 'All').trim().toLowerCase();
    const sf = (seasonFilter || 'All').trim().toLowerCase();
    const st = (statusFilter || 'All').trim().toLowerCase();

    return combinedCropManagementRows.filter((r) => {
      if (!r) return false;
      const matchSearch = !q || (
        String(r.cropId || '').toLowerCase().includes(q) ||
        String(r.cropName || '').toLowerCase().includes(q) ||
        String(r.cropType || '').toLowerCase().includes(q) ||
        String(r.cropCategory || '').toLowerCase().includes(q) ||
        String(r.varietyName || '').toLowerCase().includes(q) ||
        String(r.season || '').toLowerCase().includes(q) ||
        String(r.durationDays || '').toLowerCase().includes(q)
      );
      const matchCropType = ct === 'all' || String(r.cropType || '').toLowerCase() === ct;
      const matchSeason = sf === 'all' || String(r.season || '').toLowerCase().includes(sf);
      const matchStatus = st === 'all' || String(r.status || 'Active').toLowerCase() === st;

      return matchSearch && matchCropType && matchSeason && matchStatus;
    });
  }, [combinedCropManagementRows, searchQuery, cropTypeFilter, seasonFilter, statusFilter]);

  // Dynamic Crop Management Summary Counts
  const cropMgmtTotalCrops = useMemo(() => {
    const unique = new Set();
    safeCrops.forEach(c => {
      if (c && c.cropName) unique.add(c.cropName.trim().toLowerCase());
    });
    return unique.size || safeCrops.length;
  }, [safeCrops]);

  const cropMgmtTotalVarieties = safeVarieties.length;
  const cropMgmtActiveCount = useMemo(() => {
    return combinedCropManagementRows.filter(r => (r.status || 'Active').toLowerCase() === 'active').length;
  }, [combinedCropManagementRows]);

  // 1. Crop Master stats
  const totalCropsCount = safeCrops.length;
  const activeCropsCount = safeCrops.filter(c => c && (c.status === 'Active' || !c.status)).length;
  const inactiveCropsCount = safeCrops.filter(c => c && c.status === 'Inactive').length;

  // 2. Crop Season stats (only in Crop Season module)
  const totalSeasonsCount = safeSeasons.length;
  const activeSeasonsCount = safeSeasons.filter(s => s && ((s.status || '') === 'In Progress' || (s.status || '') === 'Active')).length;
  const totalAreaAcres = safeSeasons.reduce((acc, curr) => {
    const num = parseFloat(curr?.area) || 0;
    return acc + num;
  }, 0);
  const totalRevenueNumber = safeSeasons.reduce((acc, curr) => {
    const clean = String(curr?.expectedRevenue || '').replace(/[^\d]/g, '');
    return acc + (Number(clean) || 0);
  }, 0);

  // 3. Crop Activities stats (only in Crop Activities module)
  const totalActivitiesCount = safeActivities.length;
  const inProgressActivitiesCount = safeActivities.filter(a => a && a.status === 'In Progress').length;
  const completedActivitiesCount = safeActivities.filter(a => a && a.status === 'Completed').length;
  const totalActivityCost = safeActivities.reduce((acc, curr) => {
    const clean = String(curr?.totalCost || '').replace(/[^\d]/g, '');
    return acc + (Number(clean) || 0);
  }, 0);

  // 4. Crop Varieties stats (only in Crop Varieties module)
  const totalVarietiesCount = safeVarieties.length;
  const activeVarietiesCount = safeVarieties.filter(v => v && (v.status === 'Active' || !v.status)).length;
  const uniqueParentCropsCount = new Set(safeVarieties.map(v => v.cropName).filter(Boolean)).size;

  // 5. Category stats
  const totalCategoriesCount = safeCategories.length;
  const activeCategoriesCount = safeCategories.filter(c => c && (c.status === 'Active' || !c.status)).length;

  // Filtering for Crop Master
  const filteredCrops = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const sf = (statusFilter || 'All').trim().toLowerCase();
    return safeCrops.filter(c => {
      if (!c) return false;
      const name = String(c.cropName || '').toLowerCase();
      const code = String(c.cropCode || c.code || c.id || '').toLowerCase();
      const cat = String(c.cropCategory || '').toLowerCase();
      const type = String(c.cropType || '').toLowerCase();
      const status = String(c.status || 'Active').toLowerCase();

      const matchSearch = !q || (
        name.includes(q) ||
        code.includes(q) ||
        cat.includes(q) ||
        type.includes(q)
      );
      const matchStatus = sf === 'all' || status === sf;
      return matchSearch && matchStatus;
    });
  }, [safeCrops, searchQuery, statusFilter]);

  // Filtering for Crop Seasons
  const filteredSeasons = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const sf = (statusFilter || 'All').trim().toLowerCase();
    return safeSeasons.filter(s => {
      if (!s) return false;
      const crop = String(s.crop || s.cropName || '').toLowerCase();
      const farm = String(s.farm || s.farmName || '').toLowerCase();
      const variety = String(s.variety || s.varietyName || '').toLowerCase();
      const season = String(s.season || '').toLowerCase();
      const code = String(s.seasonCode || s.code || s.id || '').toLowerCase();
      const status = String(s.status || 'In Progress').toLowerCase();

      const matchSearch = !q || (
        crop.includes(q) ||
        farm.includes(q) ||
        variety.includes(q) ||
        season.includes(q) ||
        code.includes(q)
      );
      const matchStatus = sf === 'all' || status.includes(sf) || (sf === 'in progress' && status.includes('progress'));
      return matchSearch && matchStatus;
    });
  }, [safeSeasons, searchQuery, statusFilter]);

  // Filtering for Crop Activities
  const filteredActivities = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const sf = (statusFilter || 'All').trim().toLowerCase();
    return safeActivities.filter(a => {
      if (!a) return false;
      const type = String(a.activityType || '').toLowerCase();
      const farm = String(a.farm || '').toLowerCase();
      const crop = String(a.crop || '').toLowerCase();
      const season = String(a.season || '').toLowerCase();
      const code = String(a.activityCode || a.code || a.id || '').toLowerCase();
      const supervisor = String(a.supervisor || '').toLowerCase();
      const materials = String(a.materialsUsed || '').toLowerCase();
      const status = String(a.status || 'In Progress').toLowerCase();

      const matchSearch = !q || (
        type.includes(q) ||
        farm.includes(q) ||
        crop.includes(q) ||
        season.includes(q) ||
        code.includes(q) ||
        supervisor.includes(q) ||
        materials.includes(q)
      );
      const matchStatus = sf === 'all' || status === sf;
      return matchSearch && matchStatus;
    });
  }, [safeActivities, searchQuery, statusFilter]);

  // Filtering for Crop Varieties
  const filteredVarieties = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const sf = (statusFilter || 'All').trim().toLowerCase();
    return safeVarieties.filter(v => {
      if (!v) return false;
      const varName = String(v.varietyName || '').toLowerCase();
      const cropName = String(v.cropName || '').toLowerCase();
      const code = String(v.code || v.id || '').toLowerCase();
      const status = String(v.status || 'Active').toLowerCase();

      const matchSearch = !q || (
        varName.includes(q) ||
        cropName.includes(q) ||
        code.includes(q)
      );
      const matchStatus = sf === 'all' || status === sf;
      return matchSearch && matchStatus;
    });
  }, [safeVarieties, searchQuery, statusFilter]);

  // Filtering for Crop Categories
  const filteredCategories = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const sf = (statusFilter || 'All').trim().toLowerCase();
    return safeCategories.filter(cat => {
      if (!cat) return false;
      const name = String(cat.name || '').toLowerCase();
      const code = String(cat.code || cat.id || '').toLowerCase();
      const desc = String(cat.description || '').toLowerCase();
      const status = String(cat.status || 'Active').toLowerCase();

      const matchSearch = !q || (
        name.includes(q) ||
        code.includes(q) ||
        desc.includes(q)
      );
      const matchStatus = sf === 'all' || status === sf;
      return matchSearch && matchStatus;
    });
  }, [safeCategories, searchQuery, statusFilter]);

  // Available Farm Parcels extracted dynamically from crops and recorded seasons
  const availableFarms = useMemo(() => {
    const set = new Set();
    safeCrops.forEach(c => {
      if (c && c.farm && typeof c.farm === 'string') set.add(c.farm.trim());
    });
    safeSeasons.forEach(s => {
      if (s && s.farm && typeof s.farm === 'string') set.add(s.farm.trim());
      if (s && s.farmName && typeof s.farmName === 'string') set.add(s.farmName.trim());
    });
    ['Farm 1 (South Block)', 'Farm 2 (Canal Belt)', 'Sunrise Farms (East Block)', 'Krishna Delta Parcel', 'Greenfield Farm'].forEach(f => set.add(f));
    return Array.from(set).filter(Boolean);
  }, [safeCrops, safeSeasons]);

  // Dynamic Tab Meta Information
  const tabMeta = {
    'crop-management': {
      eyebrow: 'MASTERS • CROPS',
      title: 'Crops',
      subtitle: 'Manage crops and varieties in one place.',
      addLabel: 'Crop'
    },
    crops: {
      eyebrow: 'MASTERS • CROPS',
      title: 'Crops',
      subtitle: 'Manage crops and varieties in one place.',
      addLabel: 'Crop'
    },
    seasons: {
      eyebrow: 'AGRICULTURE • CROP SEASON',
      title: 'Crop Season',
      subtitle: 'Manage standing seasonal crop cycles, farm plots, sowing schedules, and revenue projections.',
      addLabel: 'Season Record'
    },
    varieties: {
      eyebrow: 'MASTERS • CROP VARIETIES',
      title: 'Crop Varieties',
      subtitle: 'Manage seed cultivar varieties, hybrid traits, maturation duration, and yield benchmarks.',
      addLabel: 'Variety'
    },
    activities: {
      eyebrow: 'AGRICULTURE • CROP ACTIVITIES',
      title: 'Crop Activities',
      subtitle: 'Track field operations, labour deployment, machinery usage, and input materials across farm plots.',
      addLabel: 'Crop Activity'
    },
    categories: {
      eyebrow: 'MASTERS • CROP CATEGORIES',
      title: 'Crop Categories',
      subtitle: 'Configure agricultural crop categories and classification taxonomy.',
      addLabel: 'Category'
    }
  };
  const currentTabInfo = tabMeta[activeTab] || tabMeta['crop-management'] || tabMeta.crops;

  // Active Tab Filtered Items & Pagination calculation
  const currentList = useMemo(() => {
    if (activeTab === 'crop-management' || activeTab === 'crops' || activeTab === 'varieties') return filteredCropManagementRows;
    if (activeTab === 'seasons') return filteredSeasons;
    if (activeTab === 'varieties') return filteredVarieties;
    if (activeTab === 'categories') return filteredCategories;
    if (activeTab === 'activities') return filteredActivities;
    return [];
  }, [activeTab, filteredCropManagementRows, filteredSeasons, filteredVarieties, filteredCategories, filteredActivities]);

  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const pagedList = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return currentList.slice(start, start + PAGE_SIZE);
  }, [currentList, currentPage]);

  // View Detail Handler - Connected to live backend endpoints
  const handleOpenView = async (item, type) => {
    if (type === 'crop') {
      let target = item;
      try {
        const live = await cropService.getCropById(item.id);
        if (live) target = live;
      } catch (e) {
        console.warn('[handleOpenView] Failed to fetch live crop, using active record:', e);
      }
      setViewTarget({
        title: `Crop Record: ${target.cropName}`,
        subtitle: `Crop Code: ${target.cropCode || target.code || target.id}`,
        rawItem: target,
        editType: 'crop',
        fields: [
          { label: 'Crop ID', value: target.cropCode || target.id },
          { label: 'Crop Name', value: target.cropName },
          { label: 'Crop Type', value: target.cropType },
          { label: 'Crop Category', value: target.cropCategory },
          { label: 'Default Unit', value: target.defaultUnit },
          { label: 'Status', value: target.status },
          { label: 'Cultivated Farm', value: target.farm || 'Sample Farm' },
          { label: 'Planting Season / Date', value: target.plantingDate || 'Seasonal' },
          { label: 'Description & Notes', value: (typeof target?.description === 'string' && target.description.trim() && !target.description.toLowerCase().includes('standard cultivar') && !target.description.toLowerCase().includes('standard agricultural cultivar')) ? target.description : '—', fullWidth: true }
        ]
      });
    } else if (type === 'category') {
      let target = item;
      try {
        const live = await cropService.getCategoryById(item.id);
        if (live) target = live;
      } catch (e) {
        console.warn('[handleOpenView] Failed to fetch live category, using active record:', e);
      }
      setViewTarget({
        title: `Crop Category: ${target.name || target.categoryName}`,
        subtitle: `Category ID: ${target.code || target.id}`,
        rawItem: target,
        editType: 'category',
        fields: [
          { label: 'Category ID', value: target.code || target.id },
          { label: 'Category Name', value: target.name || target.categoryName },
          { label: 'Status', value: target.status },
          { label: 'Description', value: target.description || '-', fullWidth: true }
        ]
      });
    } else if (type === 'season') {
      let target = item;
      try {
        if (cropService.getSeasonById) {
          const live = await cropService.getSeasonById(item.id);
          if (live) target = live;
        }
      } catch {}
      const sCode = target.seasonCode || target.code || (typeof target.id === 'string' && target.id.startsWith('CS-') ? target.id : `CS-2025-${String(target.id || 1).padStart(2, '0')}`);
      const sFarm = target.farm || target.farmName || 'Farm 1 (South Block)';
      const sCrop = target.crop || target.cropName || 'Cotton';
      const sVariety = target.variety || target.varietyName || 'Standard';
      setViewTarget({
        title: `Crop Season Record: ${sCode}`,
        subtitle: `${sCrop} • ${sFarm}`,
        rawItem: target,
        editType: 'season',
        fields: [
          { label: 'Season ID', value: sCode },
          { label: 'Farm Parcel', value: sFarm },
          { label: 'Crop', value: sCrop },
          { label: 'Variety / Hybrid', value: sVariety },
          { label: 'Season', value: target.season },
          { label: 'Status', value: target.status },
          { label: 'Sowing Date', value: target.sowingDate || '-' },
          { label: 'Expected Harvest Date', value: target.expectedHarvestDate || '-' },
          { label: 'Actual Harvest Date', value: target.actualHarvestDate || 'Pending Harvest' },
          { label: 'Area', value: typeof target.area === 'number' ? `${target.area} Acres` : target.area },
          { label: 'Expected Yield', value: target.expectedYield || '-' },
          { label: 'Actual Yield', value: target.actualYield || '-' },
          { label: 'Expected Revenue', value: target.expectedRevenue || '-' },
          { label: 'Actual Revenue', value: target.actualRevenue || '-' }
        ]
      });
    } else if (type === 'crop-management') {
      setViewTarget({
        title: `Crop Details: ${item.cropName}`,
        subtitle: `${item.cropId} • ${item.varietyName || 'Standard'}`,
        rawItem: item,
        editType: 'crop-management',
        fields: [
          { label: 'Crop ID', value: item.cropId },
          { label: 'Crop Name', value: item.cropName },
          { label: 'Crop Type', value: item.cropType },
          { label: 'Variety / Hybrid Name', value: item.varietyName || '—' },
          { label: 'Duration (Days)', value: item.durationDays ? `${item.durationDays} Days` : '—' },
          { label: 'Season', value: item.season || '—' },
          { label: 'Status', value: item.status || 'Active' },
          { label: 'Cultivated Farm', value: item.rawCrop?.farm || 'Sample Farm' },
          { label: 'Description & Notes', value: (typeof item.rawCrop?.description === 'string' && item.rawCrop.description.trim() && !item.rawCrop.description.toLowerCase().includes('standard cultivar') && !item.rawCrop.description.toLowerCase().includes('standard agricultural cultivar')) ? item.rawCrop.description : '—', fullWidth: true }
        ]
      });
    } else if (type === 'variety') {
      let target = item;
      try {
        if (cropService.getVarietyById) {
          const live = await cropService.getVarietyById(item.id);
          if (live) target = live;
        }
      } catch {}
      setViewTarget({
        title: `Crop Variety Record: ${target.varietyName}`,
        subtitle: `Parent Crop: ${target.cropName}`,
        rawItem: target,
        editType: 'variety',
        fields: [
          { label: 'Variety ID', value: target.code || target.id },
          { label: 'Parent Crop', value: target.cropName },
          { label: 'Variety / Hybrid Name', value: target.varietyName },
          { label: 'Maturation Duration', value: `${target.durationDays} Days` },
          { label: 'Recommended Season', value: target.season },
          { label: 'Status', value: target.status },
          { label: 'Expected Yield Benchmark', value: target.expectedYield || '-', fullWidth: true }
        ]
      });
    } else if (type === 'activity') {
      let target = item;
      try {
        if (cropService.getActivityById) {
          const live = await cropService.getActivityById(item.id);
          if (live) target = live;
        }
      } catch {}
      setViewTarget({
        title: `Field Activity Record: ${target.activityCode}`,
        subtitle: `${target.activityType} • ${target.crop}`,
        rawItem: target,
        editType: 'activity',
        fields: [
          { label: 'Activity ID', value: target.activityCode },
          { label: 'Crop & Season', value: `${target.crop} (${target.season})` },
          { label: 'Farm Parcel', value: target.farm },
          { label: 'Activity Type', value: target.activityType },
          { label: 'Activity Date', value: target.activityDate },
          { label: 'Status', value: target.status },
          { label: 'Labour', value: target.labourWorkers || '-' },
          { label: 'Machinery', value: target.machinery || '-' },
          { label: 'Input Materials Applied', value: target.materialsUsed || 'None' },
          { label: 'Total Activity Cost', value: target.totalCost },
          { label: 'Supervisor In-Charge', value: target.supervisor },
          { label: 'Notes & Field Observations', value: target.notes || '-', fullWidth: true }
        ]
      });
    }
  };

  const handleOpenLabourDetails = async (activity) => {
    setLabourDetailsTarget(activity);
    setLabourDetails([]);
    setLabourDetailsMatch('');
    setLabourDetailsError('');
    setLabourDetailsLoading(true);

    try {
      const [attendanceRecords, labourRecords, paymentRecords] = await Promise.all([
        labourService.getAttendance(),
        labourService.getLabours(),
        labourService.getPayments()
      ]);
      const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const dateOnly = (value) => String(value || '').split(/[T ]/)[0];
      const parseAmount = (value) => {
        const amount = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
        return Number.isFinite(amount) ? amount : 0;
      };
      const activityDate = dateOnly(activity.activityDate);
      const activityFarm = normalize(activity.farm);
      const activityCrop = normalize(activity.crop);
      const labourNames = new Map(
        labourRecords.map((labour) => [String(labour.id), labour.labourName])
      );

      const allAttendance = attendanceRecords.map((record, index) => ({
        record,
        key: String(record.id || record.attendanceCode || index),
        labourId: String(record.labourId || ''),
        date: dateOnly(record.attendanceDate || record.date),
        amount: parseAmount(record.amount ?? record.calculatedAmount),
        index
      }));
      const paidByAttendance = new Map(allAttendance.map(({ key }) => [key, 0]));
      const orderedPayments = [...paymentRecords].sort(
        (a, b) => dateOnly(a.paymentDate).localeCompare(dateOnly(b.paymentDate))
      );

      orderedPayments.forEach((payment) => {
        const paymentStart = dateOnly(payment.periodStart || payment.periodEnd || payment.paymentDate);
        const paymentEnd = dateOnly(payment.periodEnd || payment.periodStart || payment.paymentDate);
        let remaining = parseAmount(payment.amountPaid);
        if (!paymentStart || !paymentEnd || paymentStart > paymentEnd || remaining <= 0) return;

        const eligibleAttendance = allAttendance
          .filter((entry) => (
            entry.labourId === String(payment.labourId || '') &&
            entry.date >= paymentStart &&
            entry.date <= paymentEnd
          ))
          .sort((a, b) => a.date.localeCompare(b.date) || a.index - b.index);

        eligibleAttendance.forEach((entry) => {
          if (remaining <= 0) return;
          const alreadyPaid = paidByAttendance.get(entry.key) || 0;
          const stillDue = Math.max(0, entry.amount - alreadyPaid);
          const allocated = Math.min(stillDue, remaining);
          paidByAttendance.set(entry.key, alreadyPaid + allocated);
          remaining -= allocated;
        });
      });

      const dateAndCropMatches = allAttendance.filter(({ record }) => (
        dateOnly(record.attendanceDate || record.date) === activityDate &&
        normalize(record.cropName) === activityCrop
      ));
      const sameFarmMatches = dateAndCropMatches.filter(
        ({ record }) => normalize(record.farmName) === activityFarm
      );
      const matchingAttendance = (sameFarmMatches.length > 0 ? sameFarmMatches : dateAndCropMatches)
        .map(({ record, key, amount }) => {
          const paidAmount = Math.min(amount, paidByAttendance.get(key) || 0);
          const paymentStatus = amount <= 0
            ? 'Amount not set'
            : paidAmount >= amount
              ? 'Paid'
              : paidAmount > 0
                ? 'Partially paid'
                : 'Unpaid';

          return {
            ...record,
            labourName: record.labourName ||
              labourNames.get(String(record.labourId)) ||
              (record.labourId ? `Labour #${record.labourId}` : 'Labourer'),
            amount,
            paidAmount,
            paymentStatus
          };
        });

      if (matchingAttendance.length > 0) {
        setLabourDetailsMatch(sameFarmMatches.length > 0 ? 'date-farm-crop' : 'date-crop');
        setLabourDetails(matchingAttendance);
      } else {
        const activeLabours = labourRecords.filter(
          (labour) => String(labour.status || 'Active').toLowerCase() !== 'inactive'
        );
        const sampleLabours = activeLabours.length > 0 ? activeLabours : labourRecords;
        const requestedCount = Number(String(activity.labourWorkers || '').match(/\d+/)?.[0]) || 1;
        const workerLabel = normalize(activity.labourWorkers);
        const femaleLabours = workerLabel.includes('women')
          ? sampleLabours.filter((labour) => normalize(labour.gender) === 'female')
          : [];
        const workersToShow = (femaleLabours.length > 0 ? femaleLabours : sampleLabours)
          .slice(0, Math.min(requestedCount, sampleLabours.length));

        setLabourDetailsMatch(workersToShow.length > 0 ? 'sample' : 'no-match');
        setLabourDetails(workersToShow.map((labour, index) => ({
          id: `sample-${activity.id}-${labour.id || index}`,
          labourName: labour.labourName || `Labourer ${index + 1}`,
          farmName: activity.farm,
          workType: activity.activityType,
          workBasis: 'Days',
          unitsWorked: 1,
          amount: Number(labour.dailyRate) || 400,
          paidAmount: 0,
          paymentStatus: 'Unpaid',
          notes: '',
          isSample: true
        })));
      }
    } catch (error) {
      console.error('[Crops] Failed to load matching labour attendance:', error);
      setLabourDetailsError('Could not load labour attendance details. Please try again.');
    } finally {
      setLabourDetailsLoading(false);
    }
  };

  // Reusable Pagination Footer
  const renderPaginationFooter = (itemCount) => {
    if (itemCount === 0) return null;
    return (
      <div className="cr-table-footer">
        <div className="cr-page-info">
          Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong> to <strong>{Math.min(currentPage * PAGE_SIZE, itemCount)}</strong> of <strong>{itemCount}</strong> records
        </div>
        {totalPages > 1 && (
          <div className="cr-pagination">
            <button
              type="button"
              className="cr-page-nav"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                className={`cr-page-num ${page === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="cr-page-nav"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  // Handlers for Add / Edit
  const handleOpenAddCropManagement = () => {
    setEditingItem(null);
    setCropMgmtForm({
      cropName: '',
      cropType: '',
      varietyName: '',
      durationDays: '',
      season: 'Kharif',
      status: 'Active'
    });
    setModalType('crop-management');
  };

  const handleOpenEditCropManagement = (row) => {
    setEditingItem(row);
    setCropMgmtForm({
      cropName: row.cropName || '',
      cropType: row.cropType || '',
      varietyName: row.varietyName === '—' ? '' : (row.varietyName || ''),
      durationDays: row.durationDays || '',
      season: row.season === '—' ? 'Kharif' : (row.season || 'Kharif'),
      status: row.status || 'Active'
    });
    setModalType('crop-management');
  };

  const handleSaveCropManagement = async (e) => {
    e.preventDefault();
    if (!cropMgmtForm.cropName?.trim()) {
      showToast('Crop Name is required', 'error');
      return;
    }
    if (!cropMgmtForm.varietyName?.trim()) {
      showToast('Variety / Hybrid Name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const cName = cropMgmtForm.cropName.trim();
      const vName = cropMgmtForm.varietyName.trim();
      const cType = cropMgmtForm.cropType?.trim() || resolveCropType({ cropName: cName });
      const durDays = cropMgmtForm.durationDays ? Number(cropMgmtForm.durationDays) : null;
      const seas = cropMgmtForm.season?.trim() || 'Kharif';
      const stat = cropMgmtForm.status || 'Active';

      if (editingItem) {
        if (editingItem.rawVariety) {
          await cropVarietyService.updateVariety(editingItem.rawVariety.id, {
            ...editingItem.rawVariety,
            varietyName: vName,
            cropName: cName,
            durationDays: durDays,
            season: seas,
            status: stat
          });
        }
        if (editingItem.rawCrop) {
          await cropService.updateCrop(editingItem.rawCrop.id, {
            ...editingItem.rawCrop,
            cropName: cName,
            cropType: cType,
            cropCategory: cCat,
            status: stat
          });
        }
        showToast('Crop & Variety record updated successfully!', 'success');
      } else {
        // 1. Check if crop already exists
        let targetCrop = safeCrops.find(
          c => String(c.cropName || '').trim().toLowerCase() === cName.toLowerCase()
        );

        if (!targetCrop) {
          const nextCropSeq = safeCrops.length + 1;
          const newCropPayload = {
            cropCode: `CRP-${String(nextCropSeq).padStart(3, '0')}`,
            cropName: cName,
            cropType: cType,
            cropCategory: cCat,
            defaultUnit: 'Quintals',
            status: stat,
            farm: 'Sample Farm',
            description: `${cName} agricultural crop record.`
          };
          targetCrop = await cropService.createCrop(newCropPayload);
        } else if (cType !== targetCrop.cropType || cCat !== targetCrop.cropCategory) {
          await cropService.updateCrop(targetCrop.id, {
            ...targetCrop,
            cropType: cType,
            cropCategory: cCat
          });
        }

        // 2. Create the associated variety record
        const nextVarSeq = safeVarieties.length + 1;
        const newVarietyPayload = {
          code: `VAR-${String(nextVarSeq).padStart(3, '0')}`,
          cropId: targetCrop?.id,
          cropName: targetCrop?.cropName || cName,
          varietyName: vName,
          durationDays: durDays,
          season: seas,
          status: stat,
          expectedYield: '—'
        };
        await cropVarietyService.createVariety(newVarietyPayload);
        showToast('Crop & Variety successfully added!', 'success');
      }

      setModalType(null);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      console.error('[handleSaveCropManagement error]:', err);
      showToast(err.message || 'Failed to save crop record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCropManagementStatus = async (item) => {
    const newStatus = (item.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
    try {
      if (item.rawVariety && cropVarietyService.updateVariety) {
        await cropVarietyService.updateVariety(item.rawVariety.id, {
          ...item.rawVariety,
          status: newStatus
        });
      }
      if (item.rawCrop && cropService.updateCrop) {
        await cropService.updateCrop(item.rawCrop.id, {
          ...item.rawCrop,
          status: newStatus
        });
      }
      showToast(`Record status updated to "${newStatus}"`, 'success');
      await loadData();
    } catch (err) {
      console.error('[handleToggleCropManagementStatus error]:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    if (activeTab === 'crop-management' || activeTab === 'crops' || activeTab === 'varieties') {
      handleOpenAddCropManagement();
      return;
    }
    if (activeTab === 'crops') {
      const nextNum = cropsList.length + 1;
      setCropForm({
        cropCode: `CRP-${String(nextNum).padStart(3, '0')}`,
        cropName: '',
        cropType: '',
        cropCategory: '',
        cropCategoryId: '',
        defaultUnit: '',
        status: '',
        description: ''
      });
      setModalType('crop');
    } else if (activeTab === 'seasons') {
      const nextNum = seasonsList.length + 1;
      setSeasonForm({
        seasonCode: `CS-${new Date().getFullYear()}-${String(nextNum).padStart(2, '0')}`,
        farm: '',
        farmName: '',
        crop: '',
        cropName: '',
        variety: '',
        varietyName: '',
        season: '',
        sowingDate: '',
        expectedHarvestDate: '',
        actualHarvestDate: '',
        area: '',
        expectedYield: '',
        actualYield: '',
        expectedRevenue: '',
        actualRevenue: '',
        status: ''
      });
      setModalType('season');
    } else if (activeTab === 'varieties') {
      const nextNum = varietiesList.length + 1;
      setVarietyForm({
        code: `VAR-${String(nextNum).padStart(3, '0')}`,
        cropName: '',
        varietyName: '',
        durationDays: '',
        season: '',
        expectedYield: '',
        status: ''
      });
      setModalType('variety');
    } else if (activeTab === 'categories') {
      const nextNum = categoriesList.length + 1;
      setCategoryForm({
        code: `CAT-${String(nextNum).padStart(2, '0')}`,
        name: '',
        description: '',
        status: ''
      });
      setModalType('category');
    } else if (activeTab === 'activities') {
      const nextNum = safeActivities.length + 1;
      setActivityForm({
        activityCode: `ACT-${new Date().getFullYear()}-${String(nextNum).padStart(2, '0')}`,
        farm: '',
        crop: '',
        season: '',
        activityType: '',
        activityDate: '',
        labourWorkers: '',
        machinery: '',
        materialsUsed: '',
        totalCost: '',
        status: '',
        supervisor: '',
        notes: '',
        attachments: []
      });
      setUploadError('');
      setModalType('activity');
    }
  };

  const handleOpenEdit = async (item) => {
    if (activeTab === 'crops') {
      let itemToEdit = item;
      try {
        const live = await cropService.getCropById(item.id);
        if (live) itemToEdit = live;
      } catch (e) {
        console.warn('[handleOpenEdit] Failed to fetch live crop, using cached record:', e);
      }
      setEditingItem(itemToEdit);
      const matchedCat = categoriesList.find(c => (c.name || c.categoryName) === (itemToEdit.cropCategory || itemToEdit.categoryName));
      setCropForm({
        ...itemToEdit,
        cropCategoryId: matchedCat?.id || itemToEdit.cropCategoryId || 1,
        cropCategory: itemToEdit.cropCategory || matchedCat?.name || 'Cereal'
      });
      setModalType('crop');
    } else if (activeTab === 'seasons') {
      let itemToEdit = item;
      try {
        if (cropService.getSeasonById) {
          const live = await cropService.getSeasonById(item.id);
          if (live) itemToEdit = live;
        }
      } catch {}
      setEditingItem(itemToEdit);
      const sCode = itemToEdit.seasonCode || itemToEdit.code || (typeof itemToEdit.id === 'string' && itemToEdit.id.startsWith('CS-') ? itemToEdit.id : `CS-2025-${String(itemToEdit.id || 1).padStart(2, '0')}`);
      const sFarm = itemToEdit.farm || itemToEdit.farmName || 'Farm 1 (South Block)';
      const sCrop = itemToEdit.crop || itemToEdit.cropName || 'Cotton';
      const sVariety = itemToEdit.variety || itemToEdit.varietyName || 'Standard';
      setSeasonForm({
        ...itemToEdit,
        seasonCode: sCode,
        farm: sFarm,
        farmName: sFarm,
        crop: sCrop,
        cropName: sCrop,
        variety: sVariety,
        varietyName: sVariety,
        actualYield: itemToEdit.actualYield || '',
        actualRevenue: itemToEdit.actualRevenue || '',
      });
      setModalType('season');
    } else if (activeTab === 'varieties') {
      let itemToEdit = item;
      try {
        if (cropService.getVarietyById) {
          const live = await cropService.getVarietyById(item.id);
          if (live) itemToEdit = live;
        }
      } catch {}
      setEditingItem(itemToEdit);
      setVarietyForm({ ...itemToEdit });
      setModalType('variety');
    } else if (activeTab === 'categories') {
      let itemToEdit = item;
      try {
        const live = await cropService.getCategoryById(item.id);
        if (live) itemToEdit = live;
      } catch (e) {
        console.warn('[handleOpenEdit] Failed to fetch live category, using cached record:', e);
      }
      setEditingItem(itemToEdit);
      setCategoryForm({
        ...itemToEdit,
        name: itemToEdit.name || itemToEdit.categoryName || '',
        code: itemToEdit.code || `CAT-${String(itemToEdit.id).padStart(2, '0')}`
      });
      setModalType('category');
    } else if (activeTab === 'activities') {
      let itemToEdit = item;
      try {
        if (cropService.getActivityById) {
          const live = await cropService.getActivityById(item.id);
          if (live) itemToEdit = live;
        }
      } catch {}
      setEditingItem(itemToEdit);
      setActivityForm({ ...itemToEdit, attachments: itemToEdit.attachments || [] });
      setUploadError('');
      setModalType('activity');
    }
  };

  // Submit Save
  const handleSaveForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalType === 'crop') {
        if (!cropForm.cropName || !cropForm.cropName.trim()) {
          showToast('Crop name is required', 'error');
          setSaving(false);
          return;
        }
        const matchedCat = categoriesList.find(c => (c.name || c.categoryName) === cropForm.cropCategory);
        const payload = {
          ...cropForm,
          cropType: cropForm.cropType || 'Kharif / Food Grain',
          cropCategoryId: matchedCat?.id || cropForm.cropCategoryId || 1,
          cropCategory: cropForm.cropCategory || matchedCat?.name || 'Cereals',
          defaultUnit: cropForm.defaultUnit || 'Quintals',
          status: cropForm.status || 'Active'
        };
        if (editingItem) {
          await cropService.updateCrop(editingItem.id, payload);
          showToast(`Crop "${cropForm.cropName}" updated successfully.`);
        } else {
          await cropService.createCrop(payload);
          showToast(`Crop "${cropForm.cropName}" created successfully.`);
        }
      } else if (modalType === 'season') {
        const farmVal = (seasonForm.farm || seasonForm.farmName || '').trim();
        const cropVal = (seasonForm.crop || seasonForm.cropName || '').trim();
        if (!farmVal) {
          showToast('Farm parcel selection is required.', 'error');
          setSaving(false);
          return;
        }
        if (!cropVal) {
          showToast('Crop selection is required.', 'error');
          setSaving(false);
          return;
        }
        if (!seasonForm.season || !seasonForm.season.trim()) {
          showToast('Season identifier is required (e.g. Kharif 2025-26).', 'error');
          setSaving(false);
          return;
        }
        if (!seasonForm.sowingDate) {
          showToast('Sowing date is required.', 'error');
          setSaving(false);
          return;
        }
        if (seasonForm.expectedHarvestDate && seasonForm.sowingDate) {
          if (new Date(seasonForm.expectedHarvestDate) < new Date(seasonForm.sowingDate)) {
            showToast('Expected harvest date cannot be earlier than sowing date.', 'error');
            setSaving(false);
            return;
          }
        }
        if (seasonForm.actualHarvestDate && seasonForm.sowingDate) {
          if (new Date(seasonForm.actualHarvestDate) < new Date(seasonForm.sowingDate)) {
            showToast('Actual harvest date cannot be earlier than sowing date.', 'error');
            setSaving(false);
            return;
          }
        }
        const areaNumber = parseFloat(seasonForm.area);
        if (isNaN(areaNumber) || areaNumber <= 0) {
          showToast('Cultivated area must be a valid positive number.', 'error');
          setSaving(false);
          return;
        }
        if (!seasonForm.expectedYield || !seasonForm.expectedYield.trim()) {
          showToast('Expected yield is required.', 'error');
          setSaving(false);
          return;
        }
        if (!seasonForm.expectedRevenue || !seasonForm.expectedRevenue.trim()) {
          showToast('Expected revenue is required.', 'error');
          setSaving(false);
          return;
        }
        const recordToSave = {
          ...seasonForm,
          farm: farmVal,
          farmName: farmVal,
          crop: cropVal,
          cropName: cropVal,
          status: seasonForm.status || 'In Progress'
        };
        if (editingItem) {
          await cropService.updateSeason(editingItem.id, recordToSave);
          showToast(`Crop Season "${seasonForm.seasonCode || editingItem.id}" updated.`);
        } else {
          await cropService.createSeason(recordToSave);
          showToast(`Crop Season created for "${cropVal}".`);
        }
      } else if (modalType === 'variety') {
        if (!varietyForm.varietyName || !varietyForm.varietyName.trim()) {
          showToast('Variety name is required', 'error');
          setSaving(false);
          return;
        }
        const varietyToSave = {
          ...varietyForm,
          status: varietyForm.status || 'Active'
        };
        if (editingItem) {
          await cropService.updateVariety(editingItem.id, varietyToSave);
          showToast(`Variety "${varietyForm.varietyName}" updated.`);
        } else {
          await cropService.createVariety(varietyToSave);
          showToast(`Variety "${varietyForm.varietyName}" added.`);
        }
      } else if (modalType === 'category') {
        if (!categoryForm.name || !categoryForm.name.trim()) {
          showToast('Category name is required', 'error');
          setSaving(false);
          return;
        }
        const categoryToSave = {
          ...categoryForm,
          status: categoryForm.status || 'Active'
        };
        if (editingItem) {
          await cropService.updateCategory(editingItem.id, categoryToSave);
          showToast(`Category "${categoryForm.name}" updated.`);
        } else {
          await cropService.createCategory(categoryToSave);
          showToast(`Category "${categoryForm.name}" created.`);
        }
      } else if (modalType === 'activity') {
        if (!activityForm.crop || !activityForm.activityType) {
          showToast('Crop and Activity Type are required', 'error');
          setSaving(false);
          return;
        }
        const activityToSave = {
          ...activityForm,
          status: activityForm.status || 'In Progress'
        };
        if (editingItem) {
          await cropService.updateActivity(editingItem.id, activityToSave);
          showToast(`Activity "${activityForm.activityCode}" updated.`);
        } else {
          await cropService.createActivity(activityToSave);
          showToast(`Activity "${activityForm.activityCode}" logged.`);
        }
      }
      const isNewRecord = !editingItem;
      setModalType(null);
      setEditingItem(null);
      await loadData();
      if (isNewRecord) {
        const nextCount = currentList.length + 1;
        const targetPage = Math.max(1, Math.ceil(nextCount / PAGE_SIZE));
        setCurrentPage(targetPage);
      }
    } catch (err) {
      console.error('[Crops] Error saving item:', err);
      showToast(err.friendlyMessage || err.message || 'Failed to save record.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Quick Status Toggle - Using PATCH /api/Crop/{id}/status for Crops
  const handleToggleStatus = async (item, type) => {
    const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    try {
      if (type === 'crop') {
        await cropService.patchCropStatus(item.id, nextStatus);
        showToast(`${item.cropName} is now ${nextStatus}.`);
      } else if (type === 'season') {
        const nextSeasonStatus = item.status === 'In Progress' ? 'Harvested' : 'In Progress';
        await cropService.updateSeason(item.id, { ...item, status: nextSeasonStatus });
        showToast(`Season ${item.seasonCode} status changed to ${nextSeasonStatus}.`);
      } else if (type === 'variety') {
        await cropService.updateVariety(item.id, { ...item, status: nextStatus });
        showToast(`Variety ${item.varietyName} is now ${nextStatus}.`);
      } else if (type === 'category') {
        await cropService.updateCategory(item.id, { ...item, status: nextStatus });
        showToast(`Category ${item.name} is now ${nextStatus}.`);
      } else if (type === 'activity') {
        const nextActivityStatus = item.status === 'Completed' ? 'In Progress' : 'Completed';
        await cropService.updateActivity(item.id, { ...item, status: nextActivityStatus });
        showToast(`Activity ${item.activityCode} marked as ${nextActivityStatus}.`);
      }
      await loadData();
    } catch (err) {
      console.error('[Crops] Toggle status error:', err);
      showToast(err.friendlyMessage || err.message || 'Failed to toggle status', 'error');
    }
  };

  // Delete Action - Handles backend constraints & conflicts safely
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, item } = deleteTarget;
    setSaving(true);
    try {
      if (type === 'crop') {
        await cropService.deleteCrop(item.id);
        showToast(`Crop "${item.cropName}" deleted.`);
      } else if (type === 'season') {
        await cropService.deleteSeason(item.id);
        showToast(`Season "${item.seasonCode}" removed.`);
      } else if (type === 'variety') {
        await cropService.deleteVariety(item.id);
        showToast(`Variety "${item.varietyName}" deleted.`);
      } else if (type === 'category') {
        await cropService.deleteCategory(item.id);
        showToast(`Category "${item.name}" deleted.`);
      } else if (type === 'activity') {
        await cropService.deleteActivity(item.id);
        showToast(`Activity "${item.activityCode}" deleted.`);
      }
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error('[Crops] Error deleting record:', err);
      showToast(err.friendlyMessage || err.message || 'Failed to delete record.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cr-page">
      {/* 1. Header */}
      <div className="cr-page-head">
        <div>
          <div className="cr-eyebrow">{currentTabInfo.eyebrow}</div>
          <h1 className="cr-title">{currentTabInfo.title}</h1>
          <p className="cr-subtitle">{currentTabInfo.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="cr-btn-primary"
            onClick={handleOpenAdd}
          >
            <span>+</span> Add {currentTabInfo.addLabel}
          </button>
        </div>
      </div>

      {/* Backend / Network Status Banner */}
      {fetchError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span><strong>Backend Connection Notice:</strong> {fetchError}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ↻ Retry
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards - Strictly scoped to the relevant module */}
      <div className="cr-stats-grid">
        {(activeTab === 'crop-management' || activeTab === 'crops' || activeTab === 'varieties') && initialTab !== 'seasons' && initialTab !== 'activities' && (
          <>
            <div className="cr-stat-card">
              <div className="cr-stat-info">
                <span className="cr-stat-label">Total Crops</span>
                <span className="cr-stat-value">{cropMgmtTotalCrops}</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-info">
                <span className="cr-stat-label">Total Varieties</span>
                <span className="cr-stat-value">{cropMgmtTotalVarieties}</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-info">
                <span className="cr-stat-label">Active</span>
                <span className="cr-stat-value">{cropMgmtActiveCount}</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'seasons' && (
          <>
            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                ▦
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Active Seasons</span>
                <span className="cr-stat-value">{activeSeasonsCount} Standing</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                📅
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Total Seasons</span>
                <span className="cr-stat-value">{totalSeasonsCount} Cycles</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                ▤
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Total Sown Area</span>
                <span className="cr-stat-value">{totalAreaAcres} Acres</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                ₹
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Expected Revenue</span>
                <span className="cr-stat-value">₹ {totalRevenueNumber.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'activities' && (
          <>
            <div className="cr-stat-card">
              <div className="cr-stat-info">
                <span className="cr-stat-label">Crop Activities</span>
                <span className="cr-stat-value">{totalActivitiesCount} Logged</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-info">
                <span className="cr-stat-label">In Progress</span>
                <span className="cr-stat-value">{inProgressActivitiesCount} Active</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                ✓
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Completed</span>
                <span className="cr-stat-value">{completedActivitiesCount} Finished</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                ₹
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Total Operations Cost</span>
                <span className="cr-stat-value">₹ {totalActivityCost.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'varieties' && (
          <>
            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                🌾
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Crop Varieties</span>
                <span className="cr-stat-value">{totalVarietiesCount} Varieties</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                ✓
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Active Varieties</span>
                <span className="cr-stat-value">{activeVarietiesCount} Active</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                🌱
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Parent Crops</span>
                <span className="cr-stat-value">{uniqueParentCropsCount} Crops</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                🏷️
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Crop Categories</span>
                <span className="cr-stat-value">{totalCategoriesCount} Categories</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                ✓
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Active Categories</span>
                <span className="cr-stat-value">{activeCategoriesCount} Active</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Sub Tabs Navigation - Only shown for Crop Master module to manage Crop Master & Categories */}
      {activeTab === 'categories' && initialTab !== 'crop-management' && (
        <div className="cr-tabs-bar">
          <button
            type="button"
            className={`cr-tab-btn ${activeTab === 'crops' ? 'active' : ''}`}
            onClick={() => { setActiveTab('crops'); setSearchQuery(''); setStatusFilter('All'); }}
          >
            <span>Crop Master</span>
            <span className="cr-tab-badge">{cropsList.length}</span>
          </button>

          <button
            type="button"
            className={`cr-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => { setActiveTab('categories'); setSearchQuery(''); setStatusFilter('All'); }}
          >
            <span>Crop Categories</span>
            <span className="cr-tab-badge">{categoriesList.length}</span>
          </button>
        </div>
      )}

      {/* 4. Toolbar: Search & Filter Pills */}
      <div className="cr-toolbar">
        <div className="cr-search-wrap">
          <span className="cr-search-icon">🔍</span>
          <input
            type="text"
            className="cr-search"
            placeholder={
              (activeTab === 'crop-management' || activeTab === 'crops' || activeTab === 'varieties')
                ? "Search crop, variety or hybrid..."
                : activeTab === 'seasons'
                ? "Search seasons, farms, dates..."
                : activeTab === 'activities'
                ? "Search activities, operations, machinery..."
                : "Search categories..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="cr-clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {(activeTab === 'crop-management' || activeTab === 'crops' || activeTab === 'varieties') && initialTab !== 'seasons' && initialTab !== 'activities' ? (
          <div className="cr-filters-dropdown-wrap" ref={filterDropdownRef}>
            <button
              type="button"
              className={`cr-filters-btn ${isFilterOpen ? 'active' : ''} ${activeFiltersCount > 0 ? 'has-active' : ''}`}
              onClick={() => setIsFilterOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isFilterOpen}
              title="Filter crops by type, season, and status"
            >
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="cr-filters-count-badge">{activeFiltersCount}</span>
              )}
              <svg
                className={`cr-filters-chevron ${isFilterOpen ? 'rotated' : ''}`}
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M2.4 4.5h7.2a.5.5 0 0 1 .38.83l-3.6 4.1a.5.5 0 0 1-.76 0l-3.6-4.1a.5.5 0 0 1 .38-.83z" />
              </svg>
            </button>

            {isFilterOpen && (
              <div className="cr-filters-dropdown-menu">
                <div className="cr-filters-dropdown-header">
                  <div className="cr-filters-header-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <span>Filter Crops</span>
                  </div>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      className="cr-filters-clear-btn"
                      onClick={handleClearFilters}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="cr-filters-dropdown-body">
                  <div className="cr-filter-field">
                    <label className="cr-filter-field-label">Crop Type</label>
                    <select
                      value={cropTypeFilter}
                      onChange={(e) => setCropTypeFilter(e.target.value)}
                      aria-label="Filter by Crop Type"
                    >
                      {availableCropTypes.map(ct => (
                        <option key={ct} value={ct}>
                          {ct === 'All' ? 'All Crop Types' : ct}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cr-filter-field">
                    <label className="cr-filter-field-label">Season</label>
                    <select
                      value={seasonFilter}
                      onChange={(e) => setSeasonFilter(e.target.value)}
                      aria-label="Filter by Season"
                    >
                      {availableSeasons.map(s => (
                        <option key={s} value={s}>
                          {s === 'All' ? 'All Seasons' : s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cr-filter-field">
                    <label className="cr-filter-field-label">Status</label>
                    <div className="cr-filters-status-row">
                      {['All', 'Active', 'Inactive'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={`cr-filters-status-btn ${statusFilter === st ? 'active' : ''}`}
                          onClick={() => setStatusFilter(st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="cr-filters-dropdown-footer">
                  <button
                    type="button"
                    className="cr-filters-apply-action"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="cr-filter-group">
            {(activeTab === 'activities'
              ? ['All', 'In Progress', 'Completed', 'Scheduled']
              : activeTab === 'seasons'
              ? ['All', 'In Progress', 'Harvested']
              : ['All', 'Active', 'Inactive']
            ).map((st) => (
              <button
                key={st}
                type="button"
                className={`cr-filter-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Main Content Tables */}
      {/* ─── MODULE: CROP MANAGEMENT (COMBINED) ───────────────────────── */}
      {(activeTab === 'crop-management' || activeTab === 'crops' || activeTab === 'varieties') && initialTab !== 'seasons' && initialTab !== 'activities' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th><strong>Crop ID</strong></th>
                <th><strong>Crop Name</strong></th>
                <th><strong>Crop Type</strong></th>
                <th><strong>Variety / Hybrid Name</strong></th>
                <th><strong>Duration (Days)</strong></th>
                <th><strong>Season</strong></th>
                <th><strong>Status</strong></th>
                <th style={{ textAlign: 'right' }}><strong>Actions</strong></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading crop management records...
                  </td>
                </tr>
              ) : currentList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">🌱</span>
                      <h4>No crop records found</h4>
                      <p>Try adjusting your search or filters, or add a new crop.</p>
                      <button
                        type="button"
                        className="cr-btn-primary"
                        onClick={handleOpenAddCropManagement}
                        style={{ marginTop: '12px' }}
                      >
                        + Add Crop
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedList.map((row) => (
                  <tr key={row.uniqueKey || `${row.cropId}-${row.varietyId || row.varietyName}`}>
                    <td>
                      <span className="cr-code-badge">{row.cropId}</span>
                    </td>
                    <td>
                      <span className="cr-item-title">{row.cropName}</span>
                    </td>
                    <td>
                      <span className="cr-tag-pill">{row.cropType}</span>
                    </td>
                    <td>
                      <span>{row.varietyName || '—'}</span>
                    </td>
                    <td>
                      <span>{row.durationDays ? `${row.durationDays} Days` : '—'}</span>
                    </td>
                    <td>
                      <span className="cr-season-badge">{row.season || '—'}</span>
                    </td>
                    <td>
                      <span className={`cr-status-pill cr-status-${(row.status || 'active').toLowerCase()}`}>
                        {row.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className={`cr-action-menu-btn ${activeActionMenu?.id === (row.uniqueKey || row.cropId) ? 'active' : ''}`}
                          title="Actions"
                          aria-label="Actions"
                          aria-haspopup="menu"
                          aria-expanded={activeActionMenu?.id === (row.uniqueKey || row.cropId)}
                          onClick={(e) => toggleActionMenu(e, row.uniqueKey || row.cropId, 'crop-management', row)}
                        >
                          ⋮
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {renderPaginationFooter(currentList.length)}
        </div>
      )}

      {/* ─── TAB 2: CROP SEASON ────────────────────────────────────────── */}
      {activeTab === 'seasons' && (
        <div className="cr-table-wrap">
          <table className="cr-table cr-seasons-table">
            <colgroup>
              <col style={{ width: '120px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '125px' }} />
              <col style={{ width: '125px' }} />
              <col style={{ width: '85px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '65px' }} />
            </colgroup>
            <thead>
              <tr>
                <th><strong>Season ID</strong></th>
                <th><strong>Farm Parcel</strong></th>
                <th><strong>Crop &amp; Variety</strong></th>
                <th><strong>Season</strong></th>
                <th><strong>Sowing Date</strong></th>
                <th><strong>Exp. Harvest</strong></th>
                <th><strong>Actual Harvest</strong></th>
                <th><strong>Area</strong></th>
                <th><strong>Expected Yield</strong></th>
                <th><strong>Actual Yield</strong></th>
                <th><strong>Expected Revenue</strong></th>
                <th><strong>Actual Revenue</strong></th>
                <th><strong>Status</strong></th>
                <th style={{ textAlign: 'right' }}><strong>Actions</strong></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="14" style={{ textAlign: 'center', padding: '32px' }}>Loading seasons...</td></tr>
              ) : filteredSeasons.length === 0 ? (
                <tr>
                  <td colSpan="14" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">📅</span>
                      <p>No crop season records found</p>
                      <span>Plan a crop season across active farm land parcels</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedList.map((s) => {
                  const sCode = s.seasonCode || s.code || (typeof s.id === 'string' && s.id.startsWith('CS-') ? s.id : `CS-2025-${String(s.id || 1).padStart(2, '0')}`);
                  const sFarm = s.farm || s.farmName || s.parcel || 'Farm 1 (South Block)';
                  const sCrop = s.crop || s.cropName || 'Cotton';
                  const sVariety = s.variety || s.varietyName || 'Standard';
                  const sArea = typeof s.area === 'number' ? `${s.area} ${s.areaUnit || 'Acres'}` : (s.area || '-');
                  const sRevenue = typeof s.expectedRevenue === 'number'
                    ? `₹ ${s.expectedRevenue.toLocaleString('en-IN')}`
                    : String(s.expectedRevenue || '').startsWith('₹')
                    ? s.expectedRevenue
                    : s.expectedRevenue
                    ? `₹ ${Number(String(s.expectedRevenue).replace(/[^\d]/g, '')).toLocaleString('en-IN')}`
                    : '-';
                  const sActualRevenue = typeof s.actualRevenue === 'number'
                    ? `₹ ${s.actualRevenue.toLocaleString('en-IN')}`
                    : String(s.actualRevenue || '').startsWith('₹')
                    ? s.actualRevenue
                    : s.actualRevenue
                    ? `₹ ${Number(String(s.actualRevenue).replace(/[^\d]/g, '')).toLocaleString('en-IN')}`
                    : '-';

                  return (
                    <tr key={s.id || sCode}>
                      <td><span className="cr-code-badge">{sCode}</span></td>
                      <td><strong>{sFarm}</strong></td>
                      <td>
                        <div className="cr-item-cell">
                          <div>
                            <span className="cr-item-title">{sCrop}</span>
                            <span className="cr-item-sub">{sVariety}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="cr-tag-pill">{s.season}</span></td>
                      <td>{s.sowingDate || '-'}</td>
                      <td>{s.expectedHarvestDate || '-'}</td>
                      <td>{s.actualHarvestDate || <span style={{ color: '#94a3b8' }}>Pending</span>}</td>
                      <td><strong>{sArea}</strong></td>
                      <td>{s.expectedYield || '-'}</td>
                      <td>{s.actualYield || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                      <td style={{ fontWeight: 700, color: '#15803d' }}>{sRevenue}</td>
                      <td style={{ fontWeight: 700, color: s.actualRevenue ? '#15803d' : '#94a3b8' }}>{sActualRevenue}</td>
                      <td>
                        <button
                          type="button"
                          className={`cr-status-pill ${
                            String(s.status || '').includes('Harvest') ? 'cr-status-harvested' :
                            String(s.status || '').includes('Plan') ? 'cr-status-planned' : 'cr-status-progress'
                          }`}
                          onClick={() => handleToggleStatus(s, 'season')}
                          title="Click to advance status"
                        >
                          {s.status}
                        </button>
                      </td>
                      <td>
                        <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={`cr-action-menu-btn ${activeActionMenu?.id === s.id ? 'active' : ''}`}
                            title="Actions"
                            aria-label="Actions"
                            aria-haspopup="menu"
                            aria-expanded={activeActionMenu?.id === s.id}
                            onClick={(e) => toggleActionMenu(e, s.id, 'season', s)}
                          >
                            ⋮
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {filteredSeasons.length > 0 && renderPaginationFooter(filteredSeasons.length)}
        </div>
      )}



      {/* ─── TAB 4: CROP CATEGORIES ────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th><strong>Category ID</strong></th>
                <th><strong>Category Name</strong></th>
                <th><strong>Description</strong></th>
                <th><strong>Status</strong></th>
                <th style={{ textAlign: 'right' }}><strong>Actions</strong></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>Loading categories...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">🏷️</span>
                      <p>No categories found</p>
                      <span>Create crop classification categories</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedList.map((cat) => (
                  <tr key={cat.id}>
                    <td><span className="cr-code-badge">{cat.code}</span></td>
                    <td>
                      <div className="cr-item-cell">
                        <span className="cr-item-title">{cat.name}</span>
                      </div>
                    </td>
                    <td>{cat.description || '-'}</td>
                    <td>
                      <button
                        type="button"
                        className={`cr-status-pill ${cat.status === 'Active' ? 'cr-status-active' : 'cr-status-inactive'}`}
                        onClick={() => handleToggleStatus(cat, 'category')}
                        title="Click to toggle status"
                      >
                        {cat.status}
                      </button>
                    </td>
                    <td>
                      <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className={`cr-action-menu-btn ${activeActionMenu?.id === cat.id ? 'active' : ''}`}
                          title="Actions"
                          aria-label="Actions"
                          aria-haspopup="menu"
                          aria-expanded={activeActionMenu?.id === cat.id}
                          onClick={(e) => toggleActionMenu(e, cat.id, 'category', cat)}
                        >
                          ⋮
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredCategories.length > 0 && renderPaginationFooter(filteredCategories.length)}
        </div>
      )}



            {/* ─── TAB 5: CROP ACTIVITIES ─────────────────────────────────────── */}
      {activeTab === 'activities' && (
        <div className="cr-table-wrap">
          <table className="cr-table cr-activities-table">
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '6%' }} />
            </colgroup>
            <thead>
              <tr>
                <th><strong>Activity ID</strong></th>
                <th><strong>Crop &amp; Season</strong></th>
                <th><strong>Farm Parcel</strong></th>
                <th><strong>Activity Type</strong></th>
                <th><strong>Date</strong></th>
                <th><strong>Labour</strong></th>
                <th><strong>Machinery</strong></th>
                <th><strong>Materials Used</strong></th>
                <th><strong>Total Cost</strong></th>
                <th><strong>Supervisor</strong></th>
                <th><strong>Status</strong></th>
                <th style={{ textAlign: 'right' }}><strong>Actions</strong></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '32px' }}>Loading activities...</td></tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="12" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">🚜</span>
                      <p>No crop activities found</p>
                      <span>Log seasonal agricultural activities (Land Prep, Sowing, Weeding, Spraying, Harvest)</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedList.map((act) => (
                  <tr key={act.id}>
                    <td><span className="cr-code-badge">{act.activityCode}</span></td>
                    <td>
                      <div className="cr-item-cell">
                        <div>
                          <span className="cr-item-title">{act.crop}</span>
                          <span className="cr-item-sub">{act.season}</span>
                        </div>
                      </div>
                    </td>
                    <td><strong>{act.farm}</strong></td>
                    <td>
                      <span className="cr-tag-pill" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                        {act.activityType}
                      </span>
                    </td>
                    <td>{act.activityDate ? String(act.activityDate).split(/[T ]/)[0] : '-'}</td>
                    <td>
                      {act.labourWorkers ? (
                        <button
                          type="button"
                          className="cr-labour-count"
                          onClick={() => handleOpenLabourDetails(act)}
                          aria-label={`View labour attendance for ${act.activityCode}`}
                          title="View matching attendance details"
                        >
                          {act.labourWorkers}
                        </button>
                      ) : '-'}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#475569' }}>{act.machinery || '-'}</span>
                    </td>
                    <td style={{ maxWidth: '180px', fontSize: '11.5px', color: '#334155' }}>
                      {act.materialsUsed || <span style={{ color: '#94a3b8' }}>None</span>}
                    </td>
                    <td style={{ fontWeight: 700, color: '#15803d' }}>{act.totalCost || '-'}</td>
                    <td><span style={{ fontSize: '12px', color: '#475569' }}>{act.supervisor || '-'}</span></td>
                    <td>
                      <button
                        type="button"
                        className={`cr-status-pill ${
                          act.status === 'Completed' ? 'cr-status-completed' :
                          act.status === 'Scheduled' ? 'cr-status-scheduled' : 'cr-status-progress'
                        }`}
                        onClick={() => handleToggleStatus(act, 'activity')}
                        title="Click to toggle status"
                      >
                        {act.status}
                      </button>
                    </td>
                    <td>
                      <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className={`cr-action-menu-btn ${activeActionMenu?.id === act.id ? 'active' : ''}`}
                          title="Actions"
                          aria-label="Actions"
                          aria-haspopup="menu"
                          aria-expanded={activeActionMenu?.id === act.id}
                          onClick={(e) => toggleActionMenu(e, act.id, 'activity', act)}
                        >
                          ⋮
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredActivities.length > 0 && renderPaginationFooter(filteredActivities.length)}
        </div>
      )}

      {/* ─── MODAL: CROP MASTER FORM ───────────────────────────────────── */}
      {modalType === 'crop-management' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Record' : 'Add New Crop'}</h2>
                <p>Register crop species, crop type classification, and variety information</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveCropManagement}>
              <div className="cr-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Crop Name <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      list="cr-existing-crops-list"
                      value={cropMgmtForm.cropName}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = safeCrops.find(c => c && c.cropName && c.cropName.toLowerCase() === val.toLowerCase());
                        const resolved = resolveCropType(match || { cropName: val });
                        setCropMgmtForm(prev => ({
                          ...prev,
                          cropName: val,
                          cropType: resolved !== 'Field Crop' ? resolved : prev.cropType
                        }));
                      }}
                      placeholder="e.g. Paddy (Rice), Cotton, Chilli..."
                      required
                    />
                    <datalist id="cr-existing-crops-list">
                      {safeCrops.map(c => (
                        <option key={c.id || c.cropCode} value={c.cropName} />
                      ))}
                    </datalist>
                  </div>

                  <div className="cr-field">
                    <label>Crop Type <span className="cr-req">*</span></label>
                    <select
                      value={cropMgmtForm.cropType || ''}
                      onChange={(e) => setCropMgmtForm({ ...cropMgmtForm, cropType: e.target.value })}
                      required
                    >
                      <option value="">Select Crop Type</option>
                      <option value="Cereal">Cereal</option>
                      <option value="Vegetable">Vegetable</option>
                      <option value="Spices">Spices</option>
                      <option value="Fibre Crop">Fibre Crop</option>
                      <option value="Oilseeds">Oilseeds</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Pulses">Pulses</option>
                      <option value="Horticulture">Horticulture</option>
                      <option value="Field Crop">Field Crop</option>
                    </select>
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Variety / Hybrid Name <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={cropMgmtForm.varietyName}
                      onChange={(e) => setCropMgmtForm({ ...cropMgmtForm, varietyName: e.target.value })}
                      placeholder="e.g. BPT 5204 (Samba Mahsuri)"
                      required
                    />
                  </div>

                  <div className="cr-field">
                    <label>Duration (Days)</label>
                    <input
                      type="number"
                      value={cropMgmtForm.durationDays}
                      onChange={(e) => setCropMgmtForm({ ...cropMgmtForm, durationDays: e.target.value })}
                      placeholder="e.g. 145"
                      min="1"
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Season</label>
                    <select
                      value={cropMgmtForm.season || 'Kharif'}
                      onChange={(e) => setCropMgmtForm({ ...cropMgmtForm, season: e.target.value })}
                    >
                      <option value="Kharif">Kharif</option>
                      <option value="Rabi">Rabi</option>
                      <option value="Zaid">Zaid</option>
                      <option value="Kharif-Rabi">Kharif-Rabi</option>
                      <option value="Perennial">Perennial</option>
                      <option value="All Season">All Season</option>
                    </select>
                  </div>

                  <div className="cr-field">
                    <label>Status</label>
                    <select
                      value={cropMgmtForm.status || 'Active'}
                      onChange={(e) => setCropMgmtForm({ ...cropMgmtForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="cr-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'crop' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Record' : 'Add New Crop Record'}</h2>
                <p>Register crop species, biological type, category, and standard yield units</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Crop ID / Code</label>
                    <input
                      type="text"
                      value={cropForm.cropCode}
                      onChange={(e) => setCropForm({ ...cropForm, cropCode: e.target.value })}
                      placeholder="e.g. CRP-001"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Crop Name <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={cropForm.cropName}
                      onChange={(e) => setCropForm({ ...cropForm, cropName: e.target.value })}
                      placeholder="e.g. Paddy, Cotton, Chilli..."
                      required
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Crop Type</label>
                    <select
                      value={cropForm.cropType || ''}
                      onChange={(e) => setCropForm({ ...cropForm, cropType: e.target.value })}
                    >
                      <option value="">Select Crop Type</option>
                      <option value="Kharif / Food Grain">Kharif / Food Grain</option>
                      <option value="Kharif / Cash Crop">Kharif / Cash Crop</option>
                      <option value="Kharif-Rabi / Spices">Kharif-Rabi / Spices</option>
                      <option value="Kharif-Rabi / Oilseeds">Kharif-Rabi / Oilseeds</option>
                      <option value="Rabi / Horticulture">Rabi / Horticulture</option>
                      <option value="Perennial / Commercial">Perennial / Commercial</option>
                      <option value="Zaid / Summer">Zaid / Summer</option>
                    </select>
                  </div>
                  <div className="cr-field">
                    <label>Crop Category</label>
                    <select
                      value={cropForm.cropCategory || ''}
                      onChange={(e) => {
                        const selected = e.target.value;
                        const match = categoriesList.find(c => (c.name || c.categoryName) === selected);
                        setCropForm({
                          ...cropForm,
                          cropCategory: selected,
                          cropCategoryId: match?.id || match?.cropCategoryId || cropForm.cropCategoryId || 1
                        });
                      }}
                    >
                      <option value="">Select Crop Category</option>
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.name || cat.categoryName}>{cat.name || cat.categoryName}</option>
                      ))}
                      <option value="Cereals">Cereals</option>
                      <option value="Fibre Crops">Fibre Crops</option>
                      <option value="Spices">Spices</option>
                      <option value="Oilseeds">Oilseeds</option>
                      <option value="Vegetables">Vegetables</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Default Unit</label>
                    <select
                      value={cropForm.defaultUnit || ''}
                      onChange={(e) => setCropForm({ ...cropForm, defaultUnit: e.target.value })}
                    >
                      <option value="">Select Default Unit</option>
                      <option value="Quintals">Quintals</option>
                      <option value="Bags">Bags</option>
                      <option value="Kg">Kg</option>
                      <option value="Tonnes">Tonnes</option>
                      <option value="Boxes">Boxes</option>
                    </select>
                  </div>
                  <div className="cr-field">
                    <label>Status</label>
                    <select
                      value={cropForm.status || ''}
                      onChange={(e) => setCropForm({ ...cropForm, status: e.target.value })}
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="cr-field cr-field-full">
                  <label>Description &amp; Agricultural Notes</label>
                  <textarea
                    rows="2"
                    value={cropForm.description || ''}
                    onChange={(e) => setCropForm({ ...cropForm, description: e.target.value })}
                    placeholder="Soil specifications, climate requirements..."
                  />
                </div>
              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="cr-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Crop Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CROP SEASON FORM ───────────────────────────────────── */}
      {modalType === 'season' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-modal cr-season-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Season' : 'Add New Crop Season (crop_seasons)'}</h2>
                <p>Record farm parcel, standing crop cycle, sowing &amp; harvest timeline, yield, and revenue</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form cr-season-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body cr-season-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Season Record ID</label>
                    <input
                      type="text"
                      value={seasonForm.seasonCode}
                      onChange={(e) => setSeasonForm({ ...seasonForm, seasonCode: e.target.value })}
                      placeholder="e.g. CS-2025-01"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Farm Parcel <span className="cr-req">*</span></label>
                    <select
                      value={seasonForm.farm || seasonForm.farmName || ''}
                      onChange={(e) => setSeasonForm({ ...seasonForm, farm: e.target.value, farmName: e.target.value })}
                      required
                    >
                      <option value="">Select Farm Parcel</option>
                      {availableFarms.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Crop <span className="cr-req">*</span></label>
                    <select
                      value={seasonForm.crop || seasonForm.cropName || ''}
                      onChange={(e) => {
                        const selectedCrop = e.target.value;
                        const matchVar = safeVarieties.find(v => v.cropName === selectedCrop);
                        setSeasonForm({
                          ...seasonForm,
                          crop: selectedCrop,
                          cropName: selectedCrop,
                          variety: matchVar ? matchVar.varietyName : (seasonForm.variety || ''),
                          varietyName: matchVar ? matchVar.varietyName : (seasonForm.variety || '')
                        });
                      }}
                      required
                    >
                      <option value="">Select Crop</option>
                      {safeCrops.map(c => (
                        <option key={c.id} value={c.cropName}>{c.cropName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cr-field">
                    <label>Variety / Hybrid</label>
                    <select
                      value={seasonForm.variety || seasonForm.varietyName || ''}
                      onChange={(e) => setSeasonForm({ ...seasonForm, variety: e.target.value, varietyName: e.target.value })}
                    >
                      <option value="">Select Variety / Cultivar</option>
                      {safeVarieties
                        .filter(v => !seasonForm.crop || v.cropName?.toLowerCase() === seasonForm.crop?.toLowerCase())
                        .map(v => (
                          <option key={v.id} value={v.varietyName}>{v.varietyName}</option>
                        ))}
                      <option value="Standard Hybrid">Standard Hybrid</option>
                      <option value="High-Yield Cultivar">High-Yield Cultivar</option>
                    </select>
                  </div>
                </div>

                <div className="cr-row-3">
                  <div className="cr-field">
                    <label>Season <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={seasonForm.season}
                      onChange={(e) => setSeasonForm({ ...seasonForm, season: e.target.value })}
                      placeholder="e.g. Kharif 2025-26"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Area <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={seasonForm.area}
                      onChange={(e) => setSeasonForm({ ...seasonForm, area: e.target.value })}
                      placeholder="e.g. 10 Acres"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Status</label>
                    <select
                      value={seasonForm.status || ''}
                      onChange={(e) => setSeasonForm({ ...seasonForm, status: e.target.value })}
                    >
                      <option value="">Select Status</option>
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Harvest Ready">Harvest Ready</option>
                      <option value="Harvested">Harvested</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="cr-row-3">
                  <div className="cr-field">
                    <label>Sowing Date <span className="cr-req">*</span></label>
                    <input
                      type="date"
                      value={seasonForm.sowingDate}
                      onChange={(e) => setSeasonForm({ ...seasonForm, sowingDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Exp. Harvest Date</label>
                    <input
                      type="date"
                      value={seasonForm.expectedHarvestDate}
                      onChange={(e) => setSeasonForm({ ...seasonForm, expectedHarvestDate: e.target.value })}
                    />
                  </div>
                  <div className="cr-field">
                    <label>Actual Harvest Date</label>
                    <input
                      type="date"
                      value={seasonForm.actualHarvestDate || ''}
                      onChange={(e) => setSeasonForm({ ...seasonForm, actualHarvestDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Expected Yield <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={seasonForm.expectedYield}
                      onChange={(e) => setSeasonForm({ ...seasonForm, expectedYield: e.target.value })}
                      placeholder="e.g. 140 Quintals"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Actual Yield</label>
                    <input
                      type="text"
                      value={seasonForm.actualYield || ''}
                      onChange={(e) => setSeasonForm({ ...seasonForm, actualYield: e.target.value })}
                      placeholder="e.g. 135 Quintals"
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Expected Revenue (INR) <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={seasonForm.expectedRevenue}
                      onChange={(e) => setSeasonForm({ ...seasonForm, expectedRevenue: e.target.value })}
                      placeholder="e.g. ₹ 3,80,000"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Actual Revenue (INR)</label>
                    <input
                      type="text"
                      value={seasonForm.actualRevenue || ''}
                      onChange={(e) => setSeasonForm({ ...seasonForm, actualRevenue: e.target.value })}
                      placeholder="e.g. ₹ 3,65,000"
                    />
                  </div>
                </div>
              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="cr-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Season Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: VARIETY FORM ───────────────────────────────────────── */}
      {modalType === 'variety' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Variety' : 'Add New Variety (crop_varieties)'}</h2>
                <p>Register cultivar hybrids, seed duration, and expected yield traits</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Variety Code</label>
                    <input
                      type="text"
                      value={varietyForm.code}
                      onChange={(e) => setVarietyForm({ ...varietyForm, code: e.target.value })}
                      placeholder="e.g. VAR-001"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Parent Crop <span className="cr-req">*</span></label>
                    <select
                      value={varietyForm.cropName || ''}
                      onChange={(e) => setVarietyForm({ ...varietyForm, cropName: e.target.value })}
                      required
                    >
                      <option value="">Select Parent Crop</option>
                      {cropsList.map(c => (
                        <option key={c.id} value={c.cropName}>{c.cropName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="cr-field">
                  <label>Variety / Hybrid Name <span className="cr-req">*</span></label>
                  <input
                    type="text"
                    value={varietyForm.varietyName}
                    onChange={(e) => setVarietyForm({ ...varietyForm, varietyName: e.target.value })}
                    placeholder="e.g. BPT 5204 (Samba Mahsuri)"
                    required
                  />
                </div>

                <div className="cr-row-3">
                  <div className="cr-field">
                    <label>Duration (Days)</label>
                    <input
                      type="number"
                      value={varietyForm.durationDays}
                      onChange={(e) => setVarietyForm({ ...varietyForm, durationDays: Number(e.target.value) })}
                      placeholder="120"
                    />
                  </div>
                  <div className="cr-field">
                    <label>Recommended Season</label>
                    <input
                      type="text"
                      value={varietyForm.season}
                      onChange={(e) => setVarietyForm({ ...varietyForm, season: e.target.value })}
                      placeholder="Kharif"
                    />
                  </div>
                  <div className="cr-field">
                    <label>Status</label>
                    <select
                      value={varietyForm.status || ''}
                      onChange={(e) => setVarietyForm({ ...varietyForm, status: e.target.value })}
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="cr-field">
                  <label>Expected Yield Benchmark</label>
                  <input
                    type="text"
                    value={varietyForm.expectedYield}
                    onChange={(e) => setVarietyForm({ ...varietyForm, expectedYield: e.target.value })}
                    placeholder="e.g. 25-30 Quintals/Acre"
                  />
                </div>
              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="cr-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Variety'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CATEGORY FORM ──────────────────────────────────────── */}
      {modalType === 'category' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Category' : 'Add Crop Category (crop_categories)'}</h2>
                <p>Define classification groups for sorting and reporting crops</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Category Code</label>
                    <input
                      type="text"
                      value={categoryForm.code}
                      onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                      placeholder="e.g. CAT-01"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Category Name <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g. Cereals, Oilseeds..."
                      required
                    />
                  </div>
                </div>

                <div className="cr-field">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Brief description of this crop classification..."
                  />
                </div>

                <div className="cr-field">
                  <label>Status</label>
                  <select
                    value={categoryForm.status || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="cr-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* ─── MODAL: CROP ACTIVITY FORM ─────────────────────────────────── */}
      {modalType === 'activity' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
                <div className="cr-modal cr-modal-lg cr-activity-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Activity' : 'Log New Crop Activity'}</h2>
                <p>Record field operations, labour deployment, machinery usage, and input materials</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form cr-activity-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body cr-activity-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Activity Code</label>
                    <input
                      type="text"
                      value={activityForm.activityCode}
                      onChange={(e) => setActivityForm({ ...activityForm, activityCode: e.target.value })}
                      placeholder="e.g. ACT-2025-01"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Farm Parcel <span className="cr-req">*</span></label>
                    <select
                      value={activityForm.farm || ''}
                      onChange={(e) => setActivityForm({ ...activityForm, farm: e.target.value })}
                      required
                    >
                      <option value="">Select Farm Parcel</option>
                      <option value="Farm 1 (South Block)">Farm 1 (South Block)</option>
                      <option value="Farm 2 (Canal Belt)">Farm 2 (Canal Belt)</option>
                      <option value="Sunrise Farms (East Block)">Sunrise Farms (East Block)</option>
                      <option value="Krishna Delta Parcel">Krishna Delta Parcel</option>
                    </select>
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Target Crop <span className="cr-req">*</span></label>
                    <select
                      value={activityForm.crop || ''}
                      onChange={(e) => setActivityForm({ ...activityForm, crop: e.target.value })}
                      required
                    >
                      <option value="">Select Target Crop</option>
                      {safeCrops.map(c => (
                        <option key={c.id} value={c.cropName}>{c.cropName}</option>
                      ))}
                      <option value="Paddy">Paddy</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Chilli">Chilli</option>
                      <option value="Groundnut">Groundnut</option>
                      <option value="Maize">Maize</option>
                      <option value="Tomato">Tomato</option>
                      <option value="Sugarcane">Sugarcane</option>
                    </select>
                  </div>
                  <div className="cr-field">
                    <label>Season Cycle <span className="cr-req">*</span></label>
                    <select
                      value={activityForm.season || ''}
                      onChange={(e) => setActivityForm({ ...activityForm, season: e.target.value })}
                      required
                    >
                      <option value="">Select Season Cycle</option>
                      <option value="Kharif 2025-26">Kharif 2025-26</option>
                      <option value="Kharif-Rabi 2025-26">Kharif-Rabi 2025-26</option>
                      <option value="Rabi 2025-26">Rabi 2025-26</option>
                      <option value="Annual 2025-26">Annual 2025-26</option>
                    </select>
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Activity Type <span className="cr-req">*</span></label>
                    <select
                      value={activityForm.activityType || ''}
                      onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                      required
                    >
                      <option value="">Select Activity Type</option>
                      <option value="Land Preparation">Land Preparation</option>
                      <option value="Sowing / Planting">Sowing / Planting</option>
                      <option value="Nursery Raising &amp; Puddling">Nursery Raising &amp; Puddling</option>
                      <option value="Transplanting">Transplanting</option>
                      <option value="Drip &amp; Bed Preparation">Drip &amp; Bed Preparation</option>
                      <option value="Weeding &amp; Intercultivation">Weeding &amp; Intercultivation</option>
                      <option value="Fertilization (Top Dressing)">Fertilization (Top Dressing)</option>
                      <option value="Pesticide &amp; Foliar Spraying">Pesticide &amp; Foliar Spraying</option>
                      <option value="Staking &amp; Trellising">Staking &amp; Trellising</option>
                      <option value="Harvesting (First Picking)">Harvesting (First Picking)</option>
                      <option value="Harvesting &amp; Threshing">Harvesting &amp; Threshing</option>
                    </select>
                  </div>
                  <div className="cr-field">
                    <label>Activity Date <span className="cr-req">*</span></label>
                    <input
                      type="date"
                      value={activityForm.activityDate}
                      onChange={(e) => setActivityForm({ ...activityForm, activityDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Labour</label>
                    <input
                      type="text"
                      value={activityForm.labourWorkers}
                      onChange={(e) => setActivityForm({ ...activityForm, labourWorkers: e.target.value })}
                      placeholder="e.g. 6 Labourers, 4 Operators"
                    />
                  </div>
                  <div className="cr-field">
                    <label>Machinery</label>
                    <input
                      type="text"
                      value={activityForm.machinery}
                      onChange={(e) => setActivityForm({ ...activityForm, machinery: e.target.value })}
                      placeholder="e.g. Mahindra 575 DI Tractor, Power Weeder, Manual"
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Materials Used / Applied</label>
                    <input
                      type="text"
                      value={activityForm.materialsUsed}
                      onChange={(e) => setActivityForm({ ...activityForm, materialsUsed: e.target.value })}
                      placeholder="e.g. Neem Coated Urea (4 Bags), BT Cotton Seeds"
                    />
                  </div>
                  <div className="cr-field">
                    <label>Total Activity Cost</label>
                    <input
                      type="text"
                      value={activityForm.totalCost}
                      onChange={(e) => setActivityForm({ ...activityForm, totalCost: e.target.value })}
                      placeholder="e.g. ₹ 8,500"
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Supervisor / In-charge</label>
                    <input
                      type="text"
                      value={activityForm.supervisor}
                      onChange={(e) => setActivityForm({ ...activityForm, supervisor: e.target.value })}
                      placeholder="e.g. Niranjan Reddy"
                    />
                  </div>
                  <div className="cr-field">
                    <label>Activity Status</label>
                    <select
                      value={activityForm.status || ''}
                      onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })}
                    >
                      <option value="">Select Activity Status</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>

                <div className="cr-field cr-field-full">
                  <label>Agricultural Notes &amp; Observations</label>
                  <textarea
                    rows="2"
                    value={activityForm.notes}
                    onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                    placeholder="Field observations, weather conditions, water levels..."
                  />
                </div>

                {/* ─── UPLOAD FILES & PHOTOS SECTION ─── */}
                <div className="cr-upload-section">
                  <div className="cr-upload-header">
                    <div className="cr-upload-title">
                      <label>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        Upload Files &amp; Photos
                      </label>
                      <span>Attach field photos, geo-tagged crop pictures, soil test reports, chemical bills, or machinery logs</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                      />

                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                      />

                      <button
                        type="button"
                        className="cr-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span>+</span> Upload Files / Photos
                      </button>

                      <button
                        type="button"
                        className="cr-upload-btn cr-camera-btn"
                        onClick={handleStartCamera}
                        title="Capture field photo using camera"
                      >
                        <span>📷</span> Use Camera
                      </button>
                    </div>
                  </div>

                  {/* Validation Error Banner */}
                  {uploadError && (
                    <div className="cr-upload-error">
                      <span>⚠️ {uploadError}</span>
                      <button type="button" onClick={() => setUploadError('')} aria-label="Dismiss error">✕</button>
                    </div>
                  )}

                  {/* Drag & Drop Area / Empty State */}
                  {(!activityForm.attachments || activityForm.attachments.length === 0) ? (
                    <div
                      className={`cr-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="cr-upload-dropzone-icon">📁</div>
                      <p>No files or photos attached yet</p>
                      <small>Click <strong>"+ Upload Files / Photos"</strong> or drag and drop files here</small>
                      <small style={{ color: '#94a3b8', fontSize: '10px' }}>
                        Supports JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX (up to 15 MB each)
                      </small>
                    </div>
                  ) : (
                    <>
                      {/* Dropzone bar when files already exist */}
                      <div
                        className={`cr-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                        style={{ padding: '10px 14px', flexDirection: 'row', justifyContent: 'space-between' }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Drag &amp; drop more files here, or click to browse
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803d' }}>
                          {activityForm.attachments.length} {activityForm.attachments.length === 1 ? 'file' : 'files'} attached
                        </span>
                      </div>

                      {/* Uploaded Files List */}
                      <div className="cr-upload-list">
                        {activityForm.attachments.map((file) => (
                          <div
                            key={file.id}
                            className="cr-file-card clickable"
                            onClick={() => setPreviewModalFile(file)}
                            title={`Click to view ${file.name}`}
                          >
                            {/* Preview Thumbnail or Document Icon */}
                            <div className="cr-file-preview">
                              {file.category === 'image' && (file.previewUrl || file.fileUrl) ? (
                                <img src={file.previewUrl || file.fileUrl} alt={file.name} />
                              ) : (
                                <span
                                  className="cr-file-icon-badge"
                                  style={{ background: file.iconColor || '#64748b' }}
                                >
                                  {file.iconBadge || 'DOC'}
                                </span>
                              )}
                            </div>

                            {/* File Info & Timestamps */}
                            <div className="cr-file-info">
                              <div className="cr-file-name-row">
                                <span className="cr-file-name" title={file.name}>
                                  {file.name}
                                </span>
                                <span className="cr-file-type-pill">{file.displayType}</span>
                                <span className="cr-file-size">{file.formattedSize}</span>
                              </div>
                              <div className="cr-file-meta-row">
                                <span className="cr-file-meta-item">
                                  <span>📅</span>
                                  <span>Upload Date: <strong>{file.uploadDate}</strong></span>
                                </span>
                                <span style={{ color: '#cbd5e1' }}>•</span>
                                <span className="cr-file-meta-item">
                                  <span>⏰</span>
                                  <span>Upload Time: <strong>{file.uploadTime}</strong></span>
                                </span>
                              </div>
                            </div>

                            <div className="cr-file-open-hint" style={{ marginRight: '6px' }}>
                              <span>👁</span> View
                            </div>

                            {/* Remove / Delete Button */}
                            <button
                              type="button"
                              className="cr-file-remove-btn"
                              title={`Remove ${file.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAttachment(file.id);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="cr-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DETAIL VIEW ────────────────────────────────────────── */}
      {viewTarget && (
        <div className="cr-overlay" role="dialog" aria-modal="true" onClick={() => setViewTarget(null)}>
          <div className="cr-modal cr-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="cr-modal-head">
              <div>
                <h2>{viewTarget.title}</h2>
                <p>{viewTarget.subtitle}</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setViewTarget(null)}>✕</button>
            </div>

            <div className="cr-form-body">
              <div className="cr-view-grid">
                
                {viewTarget.rawItem?.attachments && viewTarget.rawItem.attachments.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <span className="cr-view-label" style={{ marginBottom: '8px', display: 'block' }}>
                      Attached Files &amp; Photos ({viewTarget.rawItem.attachments.length})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {viewTarget.rawItem.attachments.map((file) => (
                        <div
                          key={file.id}
                          className="cr-file-card clickable"
                          onClick={() => setPreviewModalFile(file)}
                          title={`Click to view ${file.name}`}
                        >
                          <div className="cr-file-preview">
                            {file.category === 'image' && (file.previewUrl || file.fileUrl) ? (
                              <img src={file.previewUrl || file.fileUrl} alt={file.name} />
                            ) : (
                              <span className="cr-file-icon-badge" style={{ background: file.iconColor || '#64748b' }}>
                                {file.iconBadge || 'DOC'}
                              </span>
                            )}
                          </div>
                          <div className="cr-file-info">
                            <div className="cr-file-name-row">
                              <span className="cr-file-name">{file.name}</span>
                              <span className="cr-file-type-pill">{file.displayType}</span>
                              <span className="cr-file-size">{file.formattedSize}</span>
                            </div>
                            <div className="cr-file-meta-row">
                              <span>📅 Upload Date: <strong>{file.uploadDate}</strong></span>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <span>⏰ Upload Time: <strong>{file.uploadTime}</strong></span>
                            </div>
                          </div>
                          <div className="cr-file-open-hint">
                            <span>👁</span> View File
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

{viewTarget.fields.map((f, i) => (
                  <div key={i} className={`cr-view-item ${f.fullWidth ? 'full-width' : ''}`}>
                    <span className="cr-view-label">{f.label}</span>
                    <span className="cr-view-value">{f.value || '-'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cr-modal-foot">
              <button type="button" className="cr-btn-secondary" onClick={() => setViewTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {labourDetailsTarget && (
        <div className="cr-overlay" role="dialog" aria-modal="true" onClick={() => setLabourDetailsTarget(null)}>
          <div className="cr-modal cr-labour-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cr-modal-head">
              <div>
                <h2>Labour Attendance</h2>
                <p>
                  {labourDetailsTarget.activityCode} · {labourDetailsTarget.crop} · {labourDetailsTarget.activityDate ? String(labourDetailsTarget.activityDate).split(/[T ]/)[0] : '-'}
                </p>
              </div>
              <button type="button" className="cr-close" onClick={() => setLabourDetailsTarget(null)}>✕</button>
            </div>

            <div className="cr-labour-details-content">
              <p className="cr-labour-details-hint">
                {labourDetailsMatch === 'sample'
                  ? 'Sample details only: names and daily rates are from Labour Management; one-day duration and unpaid status are illustrative. Record actual details in Labour Attendance and Labour Payments.'
                  : labourDetailsMatch === 'date-crop'
                  ? 'No farm-name match found. Showing attendance for the same date and crop; farm/plot is shown as recorded. Payments are allocated oldest attendance first within each settlement period, or by exact payment date if no period is set.'
                  : labourDetailsMatch === 'date-farm-crop'
                    ? 'Attendance matched by date, farm and crop. Names, work and duration come from Labour Attendance and Labour Management. Payments are allocated oldest attendance first within each settlement period, or by exact payment date if no period is set.'
                    : 'Attendance details are loaded from Labour Attendance and Labour Management.'}
              </p>
              {labourDetailsLoading ? (
                <div className="cr-labour-details-state">Loading attendance details...</div>
              ) : labourDetailsError ? (
                <div className="cr-labour-details-state cr-labour-details-error">{labourDetailsError}</div>
              ) : labourDetails.length === 0 ? (
                <div className="cr-labour-details-state">
                  No Labour Attendance record found for this crop and date. Add attendance there to see worker details here.
                </div>
              ) : (
                <div className="cr-labour-details-table-wrap">
                  <table className="cr-labour-details-table">
                    <thead>
                      <tr>
                        <th>Labourer</th>
                        <th>Farm / Plot</th>
                        <th>Work performed</th>
                        <th>Duration</th>
                        <th>Amount</th>
                        <th>Payment status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labourDetails.map((record, index) => {
                        const unitsWorked = Number(record.unitsWorked);
                        const unit = String(record.workBasis || 'Days').toLowerCase().replace(/s$/, '');
                        const duration = Number.isFinite(unitsWorked)
                          ? `${unitsWorked} ${unit}${unitsWorked === 1 ? '' : 's'}`
                          : '-';
                        const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        })}`;
                        const paymentStatusClass = record.paymentStatus === 'Paid'
                          ? 'paid'
                          : record.paymentStatus === 'Partially paid'
                            ? 'partial'
                            : record.paymentStatus === 'Unpaid'
                              ? 'unpaid'
                              : 'unset';

                        return (
                          <tr key={record.id || record.attendanceCode || index}>
                            <td><strong>{record.labourName}</strong></td>
                            <td>{record.farmName || '-'}</td>
                            <td>{record.workType || '-'}</td>
                            <td>{duration}{record.isSample ? ' (sample)' : ''}</td>
                            <td>
                              <strong>{formatCurrency(record.amount)}</strong>
                              {record.isSample && <span className="cr-labour-sample-label">Sample estimate</span>}
                              {record.paidAmount > 0 && (
                                <span className="cr-labour-paid-amount">Paid: {formatCurrency(record.paidAmount)}</span>
                              )}
                            </td>
                            <td>
                              <span className={`cr-labour-payment-status ${paymentStatusClass}`}>
                                {record.paymentStatus || 'Unpaid'}
                              </span>
                              {record.isSample && <span className="cr-labour-sample-label">Illustrative</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="cr-modal-foot">
              <button type="button" className="cr-btn-secondary" onClick={() => setLabourDetailsTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ───────────────────────────────────────── */}
      {deleteTarget && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-confirm">
            <div className="cr-confirm-icon">⚠️</div>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete this record? This action will remove the record from your active agricultural list.
            </p>
            <div className="cr-confirm-btns">
              <button
                type="button"
                className="cr-btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cr-btn-danger"
                onClick={handleConfirmDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION ─────────────────────────────────────────── */}
      
      
      {/* ─── MODAL: CAMERA LIVE CAPTURE ─────────────────────────────────── */}
      {cameraActive && (
        <div
          className="cr-overlay"
          style={{ zIndex: 10001 }}
          role="dialog"
          aria-modal="true"
          onClick={handleStopCamera}
        >
          <div
            className="cr-modal"
            style={{
              maxWidth: '640px',
              maxHeight: '92vh',
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="cr-modal-head"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  📷 Camera Field Photo Capture
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                  Capture live crop conditions, field operations, or plant health
                </p>
              </div>
              <button
                type="button"
                className="cr-close"
                onClick={handleStopCamera}
                style={{ fontSize: '18px', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: '20px',
                background: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '320px',
                position: 'relative'
              }}
            >
              {cameraError ? (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '10px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    maxWidth: '420px'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#b91c1c' }}>
                    Camera Access Needed
                  </h3>
                  <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                    {cameraError}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="cr-btn-primary"
                      onClick={() => {
                        handleStopCamera();
                        if (cameraInputRef.current) cameraInputRef.current.click();
                      }}
                    >
                      Use Device Camera / Gallery
                    </button>
                    <button
                      type="button"
                      className="cr-btn-secondary"
                      onClick={handleStopCamera}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : capturedPhoto ? (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <img
                    src={capturedPhoto}
                    alt="Captured Field Photo"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '380px',
                      borderRadius: '8px',
                      objectFit: 'contain',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                    }}
                  />
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '10px' }}>
                    Preview captured photo. Click "Attach to Activity" to keep, or "Retake" to shoot again.
                  </div>
                </div>
              ) : (
                <div className="cr-camera-viewfinder">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                  />
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="cr-camera-controls">
              {capturedPhoto ? (
                <>
                  <button
                    type="button"
                    className="cr-btn-secondary"
                    onClick={() => {
                      setCapturedPhoto(null);
                      startCameraStream(cameraFacing);
                    }}
                  >
                    🔄 Retake Photo
                  </button>
                  <button
                    type="button"
                    className="cr-btn-primary"
                    onClick={handleAcceptCapturedPhoto}
                    style={{ padding: '9px 20px', fontWeight: 700 }}
                  >
                    ✓ Attach to Activity
                  </button>
                </>
              ) : !cameraError ? (
                <>
                  <button
                    type="button"
                    className="cr-btn-secondary"
                    onClick={handleSwitchCamera}
                    title="Switch between front and back camera"
                    style={{ fontSize: '12px' }}
                  >
                    🔄 Switch Camera
                  </button>

                  <button
                    type="button"
                    className="cr-camera-snap-btn"
                    onClick={handleSnapPhoto}
                  >
                    <span>⚪</span> Capture Photo
                  </button>

                  <button
                    type="button"
                    className="cr-btn-secondary"
                    onClick={handleStopCamera}
                  >
                    Cancel
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: FILE & PHOTO PREVIEW LIGHTBOX ──────────────────────── */}
      {previewModalFile && (
        <div
          className="cr-overlay"
          style={{ zIndex: 10000 }}
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewModalFile(null)}
        >
          <div
            className="cr-modal"
            style={{
              maxWidth: '820px',
              maxHeight: '92vh',
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="cr-modal-head"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: previewModalFile.iconColor || '#16a34a',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                    flexShrink: 0
                  }}
                >
                  {previewModalFile.iconBadge || 'FILE'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '480px'
                    }}
                    title={previewModalFile.name}
                  >
                    {previewModalFile.name}
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                    {previewModalFile.displayType} • {previewModalFile.formattedSize} • Uploaded on {previewModalFile.uploadDate} at {previewModalFile.uploadTime}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {(previewModalFile.previewUrl || previewModalFile.fileUrl) && (
                  <a
                    href={previewModalFile.previewUrl || previewModalFile.fileUrl}
                    download={previewModalFile.name}
                    target="_blank"
                    rel="noreferrer"
                    className="cr-btn-secondary"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      padding: '6px 12px'
                    }}
                  >
                    <span>⬇</span> Download / Open
                  </a>
                )}
                <button
                  type="button"
                  className="cr-close"
                  onClick={() => setPreviewModalFile(null)}
                  style={{ fontSize: '18px', padding: '4px 8px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '280px',
                maxHeight: 'calc(92vh - 120px)'
              }}
            >
              {previewModalFile.category === 'image' && (previewModalFile.previewUrl || previewModalFile.fileUrl) ? (
                <img
                  src={previewModalFile.previewUrl || previewModalFile.fileUrl}
                  alt={previewModalFile.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '68vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    background: '#ffffff'
                  }}
                />
              ) : previewModalFile.category === 'pdf' && (previewModalFile.fileUrl || previewModalFile.previewUrl) ? (
                <iframe
                  src={previewModalFile.fileUrl || previewModalFile.previewUrl}
                  title={previewModalFile.name}
                  style={{
                    width: '100%',
                    height: '65vh',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#ffffff'
                  }}
                />
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    maxWidth: '420px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: previewModalFile.iconColor || '#2563eb',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '20px',
                      fontWeight: 700,
                      margin: '0 auto 16px'
                    }}
                  >
                    {previewModalFile.iconBadge || 'DOC'}
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '15px', color: '#0f172a' }}>
                    {previewModalFile.name}
                  </h3>
                  <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b' }}>
                    {previewModalFile.displayType} • {previewModalFile.formattedSize}
                  </p>
                  {(previewModalFile.fileUrl || previewModalFile.previewUrl) && (
                    <a
                      href={previewModalFile.fileUrl || previewModalFile.previewUrl}
                      download={previewModalFile.name}
                      className="cr-btn-primary"
                      style={{
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 18px'
                      }}
                    >
                      <span>⬇</span> Download &amp; View Document
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="cr-modal-foot"
              style={{
                padding: '12px 20px',
                background: '#ffffff',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Captured on <strong>{previewModalFile.uploadDate}</strong> at <strong>{previewModalFile.uploadTime}</strong>
              </span>
              <button
                type="button"
                className="cr-btn-secondary"
                onClick={() => setPreviewModalFile(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Dropdown Menu (Three Dots) ── */}
      {activeActionMenu && actionMenuPos && createPortal(
        <div
          className="cr-action-dropdown"
          style={{ top: actionMenuPos.top, left: actionMenuPos.left }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="cr-action-menu-item view"
            role="menuitem"
            onClick={() => {
              const { type, item } = activeActionMenu;
              setActiveActionMenu(null);
              setActionMenuPos(null);
              handleOpenView(item, type);
            }}
          >
            <span className="cr-menu-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            View Details
          </button>

          <button
            type="button"
            className="cr-action-menu-item edit"
            role="menuitem"
            onClick={() => {
              const { item } = activeActionMenu;
              setActiveActionMenu(null);
              setActionMenuPos(null);
              if (activeActionMenu?.type === 'crop-management') {
                handleOpenEditCropManagement(item);
              } else {
                handleOpenEdit(item);
              }
            }}
          >
            <span className="cr-menu-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </span>
            Edit
          </button>

          {activeActionMenu?.type === 'crop-management' ? (
            <button
              type="button"
              className={`cr-action-menu-item toggle ${(activeActionMenu.item.status || 'Active') === 'Active' ? 'deactivate' : 'activate'}`}
              role="menuitem"
              onClick={() => {
                const { item } = activeActionMenu;
                setActiveActionMenu(null);
                setActionMenuPos(null);
                handleToggleCropManagementStatus(item);
              }}
            >
              <span className="cr-menu-icon">
                {(activeActionMenu.item.status || 'Active') === 'Active' ? '⏸' : '▶'}
              </span>
              {(activeActionMenu.item.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
          ) : (
            <button
              type="button"
              className="cr-action-menu-item delete"
              role="menuitem"
              onClick={() => {
                const { type, item } = activeActionMenu;
                setActiveActionMenu(null);
                setActionMenuPos(null);
                setDeleteTarget({ type, item });
              }}
            >
              <span className="cr-menu-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </span>
              Delete
            </button>
          )}
        </div>,
        document.body
      )}

      {toast && (
        <div className={`cr-toast cr-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠️'} {toast.message}
        </div>
      )}
    </div>
  );
}

class CropsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[Crops ErrorBoundary caught error]:', error, errorInfo);
  }
  handleReset = () => {
    try {
      localStorage.removeItem('agriman_crops_master');
      localStorage.removeItem('agriman_crop_categories');
      localStorage.removeItem('agriman_crop_varieties');
      localStorage.removeItem('agriman_crop_seasons');
      localStorage.removeItem('agriman_crop_activities');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px auto', maxWidth: '600px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌱</div>
          <h2 style={{ color: '#1e3325', margin: '0 0 8px', fontSize: '20px' }}>Crop Module Reset</h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
            A temporary display error was encountered. Click the button below to restore default crop master records.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{ padding: '10px 24px', background: '#15803d', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
          >
            Reset to Clean Default Crop Data
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Crops(props) {
  return (
    <CropsErrorBoundary>
      <CropsInner {...props} />
    </CropsErrorBoundary>
  );
}

