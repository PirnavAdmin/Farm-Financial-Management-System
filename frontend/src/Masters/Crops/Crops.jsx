import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cropService } from '../../services/cropService';
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


function CropsInner({ initialTab = 'crops', onNavigate }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states
  const [cropsList, setCropsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [varietiesList, setVarietiesList] = useState([]);
  const [seasonsList, setSeasonsList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Forms
  const [modalType, setModalType] = useState(null); // 'crop' | 'season' | 'variety' | 'category' | 'activity' | null
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, item }
  const [viewTarget, setViewTarget] = useState(null); // { title, subtitle, rawItem, editType, fields }

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
    cropCode: '', cropName: '', cropType: 'Kharif / Food Grain',
    cropCategory: 'Cereals', defaultUnit: 'Quintals', status: 'Active', description: ''
  });
  const [seasonForm, setSeasonForm] = useState({
    seasonCode: '', farm: 'Farm 1 (South Block)', crop: 'Paddy',
    variety: 'BPT 5204 (Samba Mahsuri)', season: 'Kharif 2025-26',
    sowingDate: '', expectedHarvestDate: '', actualHarvestDate: '',
    area: '5 Acres', expectedYield: '', expectedRevenue: '', status: 'In Progress'
  });
  const [activityForm, setActivityForm] = useState({
    activityCode: '',
    farm: 'Farm 1 (South Block)',
    crop: 'Cotton',
    season: 'Kharif 2025-26',
    activityType: 'Land Preparation',
    activityDate: new Date().toISOString().split('T')[0],
    labourWorkers: '4 Labourers',
    machinery: 'Mahindra 575 DI Tractor',
    materialsUsed: '',
    totalCost: '₹ 5,000',
    status: 'In Progress',
    supervisor: 'Niranjan Reddy',
    notes: '',
    attachments: []
  });
  const [varietyForm, setVarietyForm] = useState({
    code: '', cropName: 'Paddy', varietyName: '', durationDays: 120,
    season: 'Kharif', expectedYield: '', status: 'Active'
  });
  const [categoryForm, setCategoryForm] = useState({
    code: '', name: '', description: '', status: 'Active'
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
      setActiveTab(initialTab);
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
    crops: {
      eyebrow: 'MASTERS • CROP MASTER',
      title: 'Crop Master',
      subtitle: 'Manage standard crop species, biological classifications, harvest units, and active statuses.',
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
  const currentTabInfo = tabMeta[activeTab] || tabMeta.crops;

  // Active Tab Filtered Items & Pagination calculation
  const currentList = useMemo(() => {
    if (activeTab === 'crops') return filteredCrops;
    if (activeTab === 'seasons') return filteredSeasons;
    if (activeTab === 'varieties') return filteredVarieties;
    if (activeTab === 'categories') return filteredCategories;
    if (activeTab === 'activities') return filteredActivities;
    return [];
  }, [activeTab, filteredCrops, filteredSeasons, filteredVarieties, filteredCategories, filteredActivities]);

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
          { label: 'Description & Notes', value: target.description || 'Standard agricultural cultivar.', fullWidth: true }
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
          { label: 'Expected Revenue', value: target.expectedRevenue || '-' }
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
          { label: 'Labour Deployment', value: target.labourWorkers },
          { label: 'Machinery Used', value: target.machinery },
          { label: 'Input Materials Applied', value: target.materialsUsed || 'None' },
          { label: 'Total Activity Cost', value: target.totalCost },
          { label: 'Supervisor In-Charge', value: target.supervisor },
          { label: 'Notes & Field Observations', value: target.notes || '-', fullWidth: true }
        ]
      });
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
  const handleOpenAdd = () => {
    setEditingItem(null);
    if (activeTab === 'crops') {
      const nextNum = cropsList.length + 1;
      setCropForm({
        cropCode: `CRP-${String(nextNum).padStart(3, '0')}`,
        cropName: '',
        cropType: 'Kharif / Food Grain',
        cropCategory: categoriesList[0]?.name || 'Cereals',
        defaultUnit: 'Quintals',
        status: 'Active',
        description: ''
      });
      setModalType('crop');
    } else if (activeTab === 'seasons') {
      const nextNum = seasonsList.length + 1;
      const defaultFarm = availableFarms[0] || 'Farm 1 (South Block)';
      const defaultCrop = safeCrops[0]?.cropName || 'Paddy';
      const matchedVariety = safeVarieties.find(v => v.cropName === defaultCrop);
      setSeasonForm({
        seasonCode: `CS-${new Date().getFullYear()}-${String(nextNum).padStart(2, '0')}`,
        farm: defaultFarm,
        farmName: defaultFarm,
        crop: defaultCrop,
        cropName: defaultCrop,
        variety: matchedVariety ? matchedVariety.varietyName : 'Standard Hybrid',
        varietyName: matchedVariety ? matchedVariety.varietyName : 'Standard Hybrid',
        season: 'Kharif 2025-26',
        sowingDate: new Date().toISOString().split('T')[0],
        expectedHarvestDate: '',
        actualHarvestDate: '',
        area: '5 Acres',
        expectedYield: '50 Quintals',
        expectedRevenue: '₹ 1,50,000',
        status: 'In Progress'
      });
      setModalType('season');
    } else if (activeTab === 'varieties') {
      const nextNum = varietiesList.length + 1;
      setVarietyForm({
        code: `VAR-${String(nextNum).padStart(3, '0')}`,
        cropName: safeCrops[0]?.cropName || 'Paddy',
        varietyName: '',
        durationDays: 120,
        season: 'Kharif',
        expectedYield: '25-30 Qtl/Acre',
        status: 'Active'
      });
      setModalType('variety');
    } else if (activeTab === 'categories') {
      const nextNum = categoriesList.length + 1;
      setCategoryForm({
        code: `CAT-${String(nextNum).padStart(2, '0')}`,
        name: '',
        description: '',
        status: 'Active'
      });
      setModalType('category');
    } else if (activeTab === 'activities') {
      const nextNum = safeActivities.length + 1;
      setActivityForm({
        activityCode: `ACT-${new Date().getFullYear()}-${String(nextNum).padStart(2, '0')}`,
        farm: safeSeasons[0]?.farm || 'Farm 1 (South Block)',
        crop: safeCrops[0]?.cropName || 'Cotton',
        season: safeSeasons[0]?.season || 'Kharif 2025-26',
        activityType: 'Land Preparation',
        activityDate: new Date().toISOString().split('T')[0],
        labourWorkers: '4 Labourers',
        machinery: 'Mahindra 575 DI Tractor',
        materialsUsed: '',
        totalCost: '₹ 5,000',
        status: 'In Progress',
        supervisor: 'Niranjan Reddy',
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
          cropCategoryId: matchedCat?.id || cropForm.cropCategoryId || 1,
          cropCategory: cropForm.cropCategory || matchedCat?.name || 'Cereal'
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
          cropName: cropVal
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
        if (editingItem) {
          await cropService.updateVariety(editingItem.id, varietyForm);
          showToast(`Variety "${varietyForm.varietyName}" updated.`);
        } else {
          await cropService.createVariety(varietyForm);
          showToast(`Variety "${varietyForm.varietyName}" added.`);
        }
      } else if (modalType === 'category') {
        if (!categoryForm.name || !categoryForm.name.trim()) {
          showToast('Category name is required', 'error');
          setSaving(false);
          return;
        }
        if (editingItem) {
          await cropService.updateCategory(editingItem.id, categoryForm);
          showToast(`Category "${categoryForm.name}" updated.`);
        } else {
          await cropService.createCategory(categoryForm);
          showToast(`Category "${categoryForm.name}" created.`);
        }
      } else if (modalType === 'activity') {
        if (!activityForm.crop || !activityForm.activityType) {
          showToast('Crop and Activity Type are required', 'error');
          setSaving(false);
          return;
        }
        if (editingItem) {
          await cropService.updateActivity(editingItem.id, activityForm);
          showToast(`Activity "${activityForm.activityCode}" updated.`);
        } else {
          await cropService.createActivity(activityForm);
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
        {activeTab === 'crops' && (
          <>
            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                🌱
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Total Crops</span>
                <span className="cr-stat-value">{totalCropsCount} Crops</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                ✓
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Active Crops</span>
                <span className="cr-stat-value">{activeCropsCount} Active</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#f8fafc', color: '#64748b' }}>
                ⏸
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Inactive Crops</span>
                <span className="cr-stat-value">{inactiveCropsCount} Inactive</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                🏷️
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Categories</span>
                <span className="cr-stat-value">{totalCategoriesCount} Categories</span>
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
              <div className="cr-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                🚜
              </div>
              <div className="cr-stat-info">
                <span className="cr-stat-label">Crop Activities</span>
                <span className="cr-stat-value">{totalActivitiesCount} Logged</span>
              </div>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                ⚡
              </div>
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
      {(initialTab === 'crops' || activeTab === 'crops' || activeTab === 'categories') && initialTab !== 'seasons' && initialTab !== 'activities' && initialTab !== 'varieties' && (
        <div className="cr-tabs-bar">
          <button
            type="button"
            className={`cr-tab-btn ${activeTab === 'crops' ? 'active' : ''}`}
            onClick={() => { setActiveTab('crops'); setSearchQuery(''); setStatusFilter('All'); }}
          >
            <span>🌱 Crop Master</span>
            <span className="cr-tab-badge">{cropsList.length}</span>
          </button>

          <button
            type="button"
            className={`cr-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => { setActiveTab('categories'); setSearchQuery(''); setStatusFilter('All'); }}
          >
            <span>🏷️ Crop Categories</span>
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
            placeholder={`Search ${activeTab === 'crops' ? 'crops (Paddy, Cotton...)' : activeTab === 'seasons' ? 'seasons, farms, dates...' : activeTab === 'activities' ? 'activities, operations, machinery...' : activeTab === 'varieties' ? 'varieties, hybrids...' : 'categories...'}`}
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
      </div>

      {/* 5. Main Content Tables */}
      {/* ─── TAB 1: CROP MASTER ────────────────────────────────────────── */}
      {activeTab === 'crops' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Crop ID</th>
                <th>Crop Name</th>
                <th>Crop Type</th>
                <th>Crop Category</th>
                <th>Default Unit</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Loading crops...</td></tr>
              ) : filteredCrops.length === 0 ? (
                <tr>
                  <td colSpan="7" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">🌱</span>
                      <p>No crops found matching filters</p>
                      <span>Try clearing your search or add a new crop record</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedList.map((c) => (
                  <tr key={c.id}>
                    <td><span className="cr-code-badge">{c.cropCode}</span></td>
                    <td>
                      <div className="cr-item-cell">
                        <span className="cr-item-icon">🌾</span>
                        <div>
                          <span className="cr-item-title">{c.cropName}</span>
                          <span className="cr-item-sub">{c.description || 'Standard cultivar'}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="cr-tag-pill">{c.cropType}</span></td>
                    <td><strong>{c.cropCategory}</strong></td>
                    <td>{c.defaultUnit}</td>
                    <td>
                      <button
                        type="button"
                        className={`cr-status-pill ${c.status === 'Active' ? 'cr-status-active' : 'cr-status-inactive'}`}
                        onClick={() => handleToggleStatus(c, 'crop')}
                        title="Click to toggle status"
                      >
                        {c.status}
                      </button>
                    </td>
                    <td>
                      <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="cr-action-btn view"
                          onClick={() => handleOpenView(c, 'crop')}
                          title="View Crop Details"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn edit"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Crop"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn delete"
                          onClick={() => setDeleteTarget({ type: 'crop', item: c })}
                          title="Delete Crop"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredCrops.length > 0 && renderPaginationFooter(filteredCrops.length)}
        </div>
      )}



      {/* ─── TAB 2: CROP SEASON ────────────────────────────────────────── */}
      {activeTab === 'seasons' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Season ID</th>
                <th>Farm Parcel</th>
                <th>Crop &amp; Variety</th>
                <th>Season</th>
                <th>Sowing Date</th>
                <th>Exp. Harvest</th>
                <th>Actual Harvest</th>
                <th>Area</th>
                <th>Expected Yield</th>
                <th>Expected Revenue</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '32px' }}>Loading seasons...</td></tr>
              ) : filteredSeasons.length === 0 ? (
                <tr>
                  <td colSpan="12" className="cr-empty">
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

                  return (
                    <tr key={s.id || sCode}>
                      <td><span className="cr-code-badge">{sCode}</span></td>
                      <td><strong>{sFarm}</strong></td>
                      <td>
                        <div className="cr-item-cell">
                          <span className="cr-item-icon">🌱</span>
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
                      <td style={{ fontWeight: 700, color: '#15803d' }}>{sRevenue}</td>
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
                            className="cr-action-btn view"
                            onClick={() => handleOpenView(s, 'season')}
                            title="View Season Details"
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            className="cr-action-btn edit"
                            onClick={() => handleOpenEdit(s)}
                            title="Edit Season Cycle"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="cr-action-btn delete"
                            onClick={() => setDeleteTarget({ type: 'season', item: s })}
                            title="Delete Season"
                          >
                            🗑
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



      {/* ─── TAB 3: CROP VARIETIES ─────────────────────────────────────── */}
      {activeTab === 'varieties' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Variety ID</th>
                <th>Crop Name</th>
                <th>Variety / Hybrid Name</th>
                <th>Duration (Days)</th>
                <th>Season</th>
                <th>Expected Yield</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Loading varieties...</td></tr>
              ) : filteredVarieties.length === 0 ? (
                <tr>
                  <td colSpan="8" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">🌾</span>
                      <p>No crop varieties found</p>
                      <span>Add seed varieties, hybrids, and duration specifications</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedList.map((v) => (
                  <tr key={v.id}>
                    <td><span className="cr-code-badge">{v.code}</span></td>
                    <td><strong>{v.cropName}</strong></td>
                    <td>
                      <div className="cr-item-cell">
                        <span className="cr-item-icon">🧬</span>
                        <span className="cr-item-title">{v.varietyName}</span>
                      </div>
                    </td>
                    <td>{v.durationDays} days</td>
                    <td><span className="cr-tag-pill">{v.season}</span></td>
                    <td>{v.expectedYield}</td>
                    <td>
                      <button
                        type="button"
                        className={`cr-status-pill ${v.status === 'Active' ? 'cr-status-active' : 'cr-status-inactive'}`}
                        onClick={() => handleToggleStatus(v, 'variety')}
                        title="Click to toggle status"
                      >
                        {v.status}
                      </button>
                    </td>
                    <td>
                      <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="cr-action-btn view"
                          onClick={() => handleOpenView(v, 'variety')}
                          title="View Variety Details"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn edit"
                          onClick={() => handleOpenEdit(v)}
                          title="Edit Variety"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn delete"
                          onClick={() => setDeleteTarget({ type: 'variety', item: v })}
                          title="Delete Variety"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredVarieties.length > 0 && renderPaginationFooter(filteredVarieties.length)}
        </div>
      )}



      {/* ─── TAB 4: CROP CATEGORIES ────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Category ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                        <span className="cr-item-icon">📂</span>
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
                          className="cr-action-btn view"
                          onClick={() => handleOpenView(cat, 'category')}
                          title="View Category Details"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn edit"
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn delete"
                          onClick={() => setDeleteTarget({ type: 'category', item: cat })}
                          title="Delete Category"
                        >
                          🗑
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
          <table className="cr-table">
            <thead>
              <tr>
                <th>Activity ID</th>
                <th>Crop &amp; Season</th>
                <th>Farm Parcel</th>
                <th>Activity Type</th>
                <th>Date</th>
                <th>Labour &amp; Machinery</th>
                <th>Materials Used</th>
                <th>Total Cost</th>
                <th>Supervisor</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: '32px' }}>Loading activities...</td></tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="11" className="cr-empty">
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
                        <span className="cr-item-icon">🌱</span>
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
                    <td>{act.activityDate || '-'}</td>
                    <td>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{act.labourWorkers || '-'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{act.machinery || '-'}</div>
                      </div>
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
                          className="cr-action-btn view"
                          onClick={() => handleOpenView(act, 'activity')}
                          title="View Activity Details"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn edit"
                          onClick={() => handleOpenEdit(act)}
                          title="Edit Activity"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn delete"
                          onClick={() => setDeleteTarget({ type: 'activity', item: act })}
                          title="Delete Activity"
                        >
                          🗑
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
                      value={cropForm.cropType}
                      onChange={(e) => setCropForm({ ...cropForm, cropType: e.target.value })}
                    >
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
                      value={cropForm.cropCategory}
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
                      value={cropForm.defaultUnit}
                      onChange={(e) => setCropForm({ ...cropForm, defaultUnit: e.target.value })}
                    >
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
                      value={cropForm.status}
                      onChange={(e) => setCropForm({ ...cropForm, status: e.target.value })}
                    >
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
          <div className="cr-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Season' : 'Add New Crop Season (crop_seasons)'}</h2>
                <p>Record farm parcel, standing crop cycle, sowing &amp; harvest timeline, yield, and revenue</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body">
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
                      value={seasonForm.farm || seasonForm.farmName}
                      onChange={(e) => setSeasonForm({ ...seasonForm, farm: e.target.value, farmName: e.target.value })}
                      required
                    >
                      <option value="" disabled>Select Farm Parcel</option>
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
                      value={seasonForm.crop || seasonForm.cropName}
                      onChange={(e) => {
                        const selectedCrop = e.target.value;
                        const matchVar = safeVarieties.find(v => v.cropName === selectedCrop);
                        setSeasonForm({
                          ...seasonForm,
                          crop: selectedCrop,
                          cropName: selectedCrop,
                          variety: matchVar ? matchVar.varietyName : (seasonForm.variety || 'Standard Hybrid'),
                          varietyName: matchVar ? matchVar.varietyName : (seasonForm.variety || 'Standard Hybrid')
                        });
                      }}
                      required
                    >
                      <option value="" disabled>Select Crop</option>
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
                      <option value="">Select or standard cultivar...</option>
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
                      value={seasonForm.status}
                      onChange={(e) => setSeasonForm({ ...seasonForm, status: e.target.value })}
                    >
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
                    <label>Expected Revenue (INR) <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={seasonForm.expectedRevenue}
                      onChange={(e) => setSeasonForm({ ...seasonForm, expectedRevenue: e.target.value })}
                      placeholder="e.g. ₹ 3,80,000"
                      required
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
                      value={varietyForm.cropName}
                      onChange={(e) => setVarietyForm({ ...varietyForm, cropName: e.target.value })}
                      required
                    >
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
                      value={varietyForm.status}
                      onChange={(e) => setVarietyForm({ ...varietyForm, status: e.target.value })}
                    >
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
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                  >
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
          <div className="cr-modal cr-modal-lg">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Activity' : 'Log New Crop Activity'}</h2>
                <p>Record field operations, labour deployment, machinery usage, and input materials</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body">
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
                      value={activityForm.farm}
                      onChange={(e) => setActivityForm({ ...activityForm, farm: e.target.value })}
                      required
                    >
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
                      value={activityForm.crop}
                      onChange={(e) => setActivityForm({ ...activityForm, crop: e.target.value })}
                      required
                    >
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
                      value={activityForm.season}
                      onChange={(e) => setActivityForm({ ...activityForm, season: e.target.value })}
                      required
                    >
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
                      value={activityForm.activityType}
                      onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                      required
                    >
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
                    <label>Labour Deployment</label>
                    <input
                      type="text"
                      value={activityForm.labourWorkers}
                      onChange={(e) => setActivityForm({ ...activityForm, labourWorkers: e.target.value })}
                      placeholder="e.g. 6 Labourers, 4 Operators"
                    />
                  </div>
                  <div className="cr-field">
                    <label>Machinery / Equipment Used</label>
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
                      value={activityForm.status}
                      onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })}
                    >
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

