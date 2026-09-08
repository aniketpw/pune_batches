import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  googleSignIn, 
  initAuth, 
  logout, 
  getAccessToken 
} from './firebase';
import { Batch, CategoryFilter, PhaseFilter, TimeSlotFilter, getBatchFormattedTitle, CenterTimetableMapping, AppView } from './types';
import BatchCard from './components/BatchCard';
import BulkScanner from './components/BulkScanner';
import EditBatchModal from './components/EditBatchModal';
import AiCopilotPanel from './components/AiCopilotPanel';
import NavigationDrawer from './components/NavigationDrawer';
import GenericSheetView from './components/GenericSheetView';
import ExtraClassView from './components/ExtraClassView';
import BatchOverlookView from './components/BatchOverlookView';
import { 
  Search, 
  LogOut, 
  Database, 
  Settings, 
  Users, 
  SlidersHorizontal, 
  Briefcase, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Sparkles, 
  Loader2, 
  AlertCircle,
  Clock,
  Layers,
  Filter,
  Chrome,
  RefreshCw,
  HardDrive,
  Copy,
  CheckCheck,
  Calendar,
  ExternalLink,
  CheckCircle2,
  ArrowUp,
  Star
} from 'lucide-react';

export function getBatchClass(fullName: string): string {
  const name = (fullName || "").toUpperCase().trim();
  if (name.includes("11TH") || name.includes("CLASS 11") || name.includes("ELEVENTH") || name.includes("ARJUNA")) {
    return "Class 11";
  }
  if (name.includes("12TH") || name.includes("CLASS 12") || name.includes("TWELFTH") || name.includes("LAKSHYA")) {
    return "Class 12";
  }
  if (name.includes("DROPPER") || name.includes("REPEATER") || name.includes("PRAYAS") || name.includes("YAKEEN")) {
    return "Dropper";
  }
  if (name.includes("FOUNDATION") || name.includes("NINTH") || name.includes("TENTH") || name.includes("9TH") || name.includes("10TH")) {
    return "Foundation";
  }

  // Parse using code prefix as fallback
  let raw = name;
  const parts = raw.split("-");
  if (parts.length > 1) raw = parts[1].trim();
  raw = raw.replace(/\s*20\d{2}\s*$/i, "").replace(/[^A-Z0-9]/g, "");
  const prefix = raw.substring(0, 2);

  if (["AJ", "AN"].includes(prefix)) return "Class 11";
  if (["LJ", "LN"].includes(prefix)) return "Class 12";
  if (["PJ", "YN", "YA"].includes(prefix)) return "Dropper";
  if (["UF", "NF", "UP"].includes(prefix)) return "Foundation";

  return "Other";
}

export const ALL_TIMETABLE_SHEETS = [
  { id: "1U5BGET6T_6vzFdEj1BrktFyeKAUNM3le-d6_QXX3IdE", label: "Sheet 1 (gid: 101475223)" },
  { id: "1YRDNMMvsCO8zBzfWP2JA__ewJZqyb8oIUBG8n3evps8", label: "Sheet 2 (gid: 1000661459)" },
  { id: "1aUGmqbnCdVIXrmRXwHTItUN6kKTmk0UFuFi5D172NC4", label: "Sheet 3 (gid: 1000661459)" },
  { id: "1qsgnhF3JTHPJKYSf19uSj5xtivxIDib1CnwSj-kSioE", label: "Sheet 4 (gid: 1000661459)" },
  { id: "1PnpJ7N0VGyn093T3DGxg5DY7RgcEw1sjvJh7ZWhRw20", label: "Sheet 5 (gid: 1000661459)" },
  { id: "103nQ5mxTrQFu8fQgppgzQIkOhbIrrY4VN5s3WpFx4p4", label: "Sheet 6 (gid: 1000661459)" },
  { id: "1JtBcMmkNwnt2hqNgIEBGwNlcdEN4YziQYAN4j6q3GE0", label: "Sheet 7 (gid: 101475223)" },
  { id: "1KbI77PEFsxFqFB1ElUQlqSxz9ixTBevxt7wJPNI8FFU", label: "Sheet 8 (gid: 1133308606)" },
  { id: "1po8VrTl5DXXwxcJN_evxQRn_5S4oNcxnbObQ5rd2K0w", label: "Sheet 9 (gid: 2078808889)" },
];

export const MODULE_METAS: Record<AppView, { title: string; subtitle: string; badge: string }> = {
  'batches': {
    title: 'Batches & Schedule',
    subtitle: 'PW Batch Finder and Automation Suite',
    badge: 'Main',
  },
  'extra-class': {
    title: 'Extra Class',
    subtitle: 'Special & Extra Lecture Schedules for Pune Batches',
    badge: 'Extra Class',
  },
  'test-announcement': {
    title: 'Test Announcement',
    subtitle: 'Upcoming Test Schedules, Dates & Syllabus for Pune Center',
    badge: 'Announcements',
  },
  'city-test': {
    title: 'City Test',
    subtitle: 'City-Level Mock Tests, Venues & Batch Allocations',
    badge: 'City Test',
  },
  'batch-overlook': {
    title: 'Batch Overlook',
    subtitle: 'Batch Performance, Tracking, and High-Level Status Overview',
    badge: 'Overlook',
  },
  'mip-batches': {
    title: 'MIP Batches',
    subtitle: 'Most Important Program (MIP) Batches, Mentors & Allocations',
    badge: 'MIP',
  },
};

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('batches');
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState<boolean>(false);

  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Spreadsheet state
  const [spreadsheetId, setSpreadsheetId] = useState("1-OYeCl3SME14Jjk1CCxRAAho_jrvgji63fFunLZvKiM");
  const [tempSpreadsheetId, setTempSpreadsheetId] = useState(spreadsheetId);
  const [showSettings, setShowSettings] = useState(false);

  // Batches state
  const [batchesData, setBatchesData] = useState<Record<string, Batch[]>>({});
  const [bms, setBms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [activeTab, setActiveTab] = useState("PCMC VP");
  const [universalSearchQuery, setUniversalSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [selectedBm, setSelectedBm] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedPhase, setSelectedPhase] = useState<string>("ALL");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotFilter>("ALL");
  const [activeStatsFilter, setActiveStatsFilter] = useState<'ALL' | 'MAPPED' | 'MISSING' | 'ASSIGNED'>('ALL');

  // Bulk Copy State
  const [copiedBatchCount, setCopiedBatchCount] = useState<number | null>(null);
  const [showCopyMenu, setShowCopyMenu] = useState(false);

  // Editing State
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Center Timetable Mappings state (Raw_DB sheets)
  const [timetableMappings, setTimetableMappings] = useState<Record<string, CenterTimetableMapping>>({});
  const [isUpdatingTimetable, setIsUpdatingTimetable] = useState<boolean>(false);

  // AI Copilot States
  const [selectedAiBatch, setSelectedAiBatch] = useState<Batch | null>(null);
  const [showAiCopilot, setShowAiCopilot] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [onlyMyBatches, setOnlyMyBatches] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bulletproof background scroll lock when mobile AI sheet or modal is open
  useEffect(() => {
    let lockedScrollY = 0;
    let isLocked = false;

    const lockScroll = () => {
      if (isLocked) return;
      lockedScrollY = window.scrollY;
      isLocked = true;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
    };

    const unlockScroll = () => {
      if (!isLocked) return;
      isLocked = false;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
      window.scrollTo(0, lockedScrollY);
    };

    const handleCheckLock = () => {
      const isMobileSheet = showAiCopilot && window.innerWidth < 1024;
      const isAnyModalOpen = isMobileSheet || Boolean(editingBatch);

      if (isAnyModalOpen) {
        lockScroll();
      } else {
        unlockScroll();
      }
    };

    handleCheckLock();
    window.addEventListener('resize', handleCheckLock);

    return () => {
      unlockScroll();
      window.removeEventListener('resize', handleCheckLock);
    };
  }, [showAiCopilot, editingBatch]);

  // Flattened array of all batches across all workspaces for universal finder
  const allBatches = React.useMemo(() => {
    return Object.values(batchesData).flat();
  }, [batchesData]);

  // 1. Initialize Auth on mount
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        setIsLoading(false);
        // Load initial sheets data
        fetchBatches(accessToken);
      },
      () => {
        setNeedsAuth(true);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch timetable mappings for centers
  const fetchTimetableMappings = async (centers: string[], authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken || centers.length === 0) return;
    try {
      const res = await fetch(`/api/timetable/mappings?centers=${encodeURIComponent(centers.join(','))}`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTimetableMappings(data.mappings || {});
      }
    } catch (err) {
      console.warn('Could not load timetable mappings:', err);
    }
  };

  const handleUpdateTimetableMapping = async (centerName: string, newSpreadsheetId: string) => {
    const activeToken = token || getAccessToken();
    if (!activeToken) return;
    setIsUpdatingTimetable(true);
    try {
      const res = await fetch('/api/timetable/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          centerName,
          spreadsheetId: newSpreadsheetId.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTimetableMappings((prev) => ({
          ...prev,
          [centerName]: data.mapping,
        }));
      }
    } catch (err) {
      console.error('Failed to update timetable mapping:', err);
    } finally {
      setIsUpdatingTimetable(false);
    }
  };

  // Fetch batches from Backend
  const fetchBatches = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches?spreadsheetId=${spreadsheetId}`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load spreadsheet data.');
      }
      const data = await res.json();
      setBatchesData(data.batchesData || {});
      setBms(data.bms || []);
      
      const keys = Object.keys(data.batchesData || {});
      if (keys.length > 0 && !keys.includes(activeTab)) {
        setActiveTab(keys[0]);
      }

      // Automatically fetch timetable mappings for all discovered centers
      fetchTimetableMappings(keys, activeToken);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection error. Please ensure you have permission.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login Action
  const handleLogin = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        await fetchBatches(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed. Please allow popups.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Logout Action
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setBatchesData({});
    setBms([]);
    setNeedsAuth(true);
  };

  // Single Batch Scanner trigger
  const handleScanBatch = async (batch: Batch) => {
    const activeToken = token || getAccessToken();
    if (!activeToken) throw new Error("Auth token expired. Please log in again.");

    const res = await fetch('/api/scan/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        spreadsheetId,
        tabName: batch.tabName,
        batchCode: batch.fullName,
        rowIndex: batch.rowIndex,
        allRowIndices: batch.allRowIndices
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Google Drive search failed.');
    }

    const updatedData = await res.json();

    // Update locally in batches data state
    const updatedList = batchesData[batch.tabName].map(b => {
      if (b.rowIndex === batch.rowIndex) {
        return { ...b, driveUrl: updatedData.driveUrl, matchStatus: updatedData.matchStatus };
      }
      return b;
    });

    setBatchesData(prev => ({
      ...prev,
      [batch.tabName]: updatedList
    }));
  };

  // Save manual updates from Modal to spreadsheet
  const handleSaveBatchLinks = async (updatedFields: { adminUrl: string; pwUrl: string; driveUrl: string; matchStatus: string }) => {
    if (!editingBatch) return;
    const activeToken = token || getAccessToken();
    if (!activeToken) throw new Error("Auth token expired. Please log in again.");

    const res = await fetch('/api/update-batch-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        spreadsheetId,
        tabName: editingBatch.tabName,
        rowIndex: editingBatch.rowIndex,
        allRowIndices: editingBatch.allRowIndices,
        ...updatedFields
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to update links in Spreadsheet.');
    }

    // Update local state
    const updatedList = batchesData[editingBatch.tabName].map(b => {
      if (b.rowIndex === editingBatch.rowIndex) {
        return { ...b, ...updatedFields };
      }
      return b;
    });

    setBatchesData(prev => ({
      ...prev,
      [editingBatch.tabName]: updatedList
    }));
  };

  // Apply filter parameters with Universal Search and Local Workspace search
  const userPrefix = React.useMemo(() => {
    return (user?.email || '').toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '');
  }, [user?.email]);

  const isUserBatch = React.useCallback((bmEmail?: string) => {
    if (!userPrefix || !bmEmail) return false;
    const bmClean = bmEmail.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '');
    return bmClean.includes(userPrefix) || userPrefix.includes(bmClean);
  }, [userPrefix]);

  const getFilteredBatches = () => {
    const isSearchingGlobally = universalSearchQuery.trim() !== "";
    
    let sourceBatches: Batch[] = [];
    if (isSearchingGlobally) {
      // Flatten all batches from all tabs for global universal search
      Object.keys(batchesData).forEach(tab => {
        sourceBatches.push(...(batchesData[tab] || []));
      });
    } else {
      sourceBatches = batchesData[activeTab] || [];
    }

    return sourceBatches.filter(batch => {
      // My Batches filter
      if (onlyMyBatches && !isUserBatch(batch.bmEmail)) {
        return false;
      }

      // 1. Universal Search (checks fullName, displayName, bmEmail, batchId, previousNames, or center tabName across all workspaces)
      if (isSearchingGlobally) {
        const query = universalSearchQuery.toLowerCase();
        const matchesUniversal = 
          batch.fullName.toLowerCase().includes(query) ||
          (batch.displayName && batch.displayName.toLowerCase().includes(query)) ||
          (batch.bmEmail && batch.bmEmail.toLowerCase().includes(query)) ||
          (batch.tabName && batch.tabName.toLowerCase().includes(query)) ||
          (batch.batchId && batch.batchId.toLowerCase().includes(query)) ||
          (batch.previousNames && batch.previousNames.some((p: string) => p.toLowerCase().includes(query)));
        if (!matchesUniversal) return false;
      }

      // 2. Local Workspace Search (searches within the current workspace only)
      if (localSearchQuery.trim() !== "") {
        const localQuery = localSearchQuery.toLowerCase();
        const matchesLocal = 
          batch.fullName.toLowerCase().includes(localQuery) ||
          (batch.displayName && batch.displayName.toLowerCase().includes(localQuery)) ||
          (batch.bmEmail && batch.bmEmail.toLowerCase().includes(localQuery)) ||
          (batch.batchId && batch.batchId.toLowerCase().includes(localQuery)) ||
          (batch.previousNames && batch.previousNames.some((p: string) => p.toLowerCase().includes(localQuery)));
        if (!matchesLocal) return false;
      }

      // 3. BM Filter
      const matchesBm = selectedBm === 'ALL' || batch.bmEmail === selectedBm;

      // 4. Category Filter
      const matchesCategory = selectedCategory === 'ALL' || batch.category === selectedCategory;

      // 5. Class Filter
      const matchesClass = selectedClass === 'ALL' || getBatchClass(batch.fullName) === selectedClass;

      // 6. Phase Filter
      const matchesPhase = selectedPhase === 'ALL' || batch.phase === selectedPhase;

      // 7. TimeSlot Filter
      const matchesTimeSlot = selectedTimeSlot === 'ALL' || batch.timeSlot === selectedTimeSlot;

      // 8. Stats Filter
      const matchesStatsFilter = (() => {
        if (activeStatsFilter === 'MAPPED') {
          return batch.driveUrl && batch.driveUrl !== "" && batch.driveUrl !== "Not Found";
        }
        if (activeStatsFilter === 'MISSING') {
          return !batch.driveUrl || batch.driveUrl === "" || batch.driveUrl === "Not Found";
        }
        if (activeStatsFilter === 'ASSIGNED') {
          return !!(batch.bmEmail && batch.bmEmail.trim() !== "");
        }
        return true;
      })();

      return matchesBm && matchesCategory && matchesClass && matchesPhase && matchesTimeSlot && matchesStatsFilter;
    });
  };

  const workspaceKeys = Object.keys(batchesData);
  const currentWorkspaceBatches = batchesData[activeTab] || [];
  const filteredBatches = getFilteredBatches();

  const myBatchesCount = React.useMemo(() => {
    if (!userPrefix) return 0;
    return currentWorkspaceBatches.filter(b => isUserBatch(b.bmEmail)).length;
  }, [userPrefix, currentWorkspaceBatches, isUserBatch]);

  const handleCopyAllBatches = (mode: 'names' | 'codes' | 'with-links' | 'comma' = 'names') => {
    if (filteredBatches.length === 0) return;
    
    let text = '';
    if (mode === 'names') {
      text = filteredBatches.map(b => getBatchFormattedTitle(b)).join('\n');
    } else if (mode === 'comma') {
      text = filteredBatches.map(b => getBatchFormattedTitle(b)).join(', ');
    } else if (mode === 'codes') {
      text = filteredBatches.map(b => b.fullName || b.displayName).join('\n');
    } else if (mode === 'with-links') {
      text = filteredBatches.map(b => {
        const title = getBatchFormattedTitle(b);
        const link = b.driveUrl && b.driveUrl !== 'Not Found' ? b.driveUrl : 'No Link';
        return `${title}\t${link}`;
      }).join('\n');
    }

    navigator.clipboard.writeText(text);
    setCopiedBatchCount(filteredBatches.length);
    setShowCopyMenu(false);
    setTimeout(() => setCopiedBatchCount(null), 2500);
  };

  // Dynamic extraction of unique phases for Phase Filter
  const availablePhases = React.useMemo(() => {
    const source = universalSearchQuery.trim() !== "" 
      ? Object.values(batchesData).flat() 
      : currentWorkspaceBatches;

    const phases = new Set<string>();
    source.forEach(b => {
      if (b.phase && b.phase !== "Unknown" && b.phase.trim() !== "") {
        phases.add(b.phase);
      }
    });

    const sorted = Array.from(phases).sort((a, b) => {
      const aNum = parseInt(a.replace(/[^0-9]/g, ""), 10) || 0;
      const bNum = parseInt(b.replace(/[^0-9]/g, ""), 10) || 0;
      return aNum - bNum;
    });
    return ["ALL", ...sorted];
  }, [batchesData, universalSearchQuery, currentWorkspaceBatches]);

  // Calculate dynamic stats for active workspace
  const totalBatchesCount = currentWorkspaceBatches.length;
  const mappedCount = currentWorkspaceBatches.filter(
    (b) => b.driveUrl && b.driveUrl !== "" && b.driveUrl !== "Not Found"
  ).length;
  const missingCount = totalBatchesCount - mappedCount;
  const activeBmsCount = new Set(
    currentWorkspaceBatches.map((b) => b.bmEmail).filter(Boolean)
  ).size;
  const mappingRate = totalBatchesCount > 0 ? Math.round((mappedCount / totalBatchesCount) * 100) : 0;

  const handleUpdateSpreadsheetId = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempSpreadsheetId.trim() === "") return;
    setSpreadsheetId(tempSpreadsheetId.trim());
    setShowSettings(false);
  };

  // Re-fetch batches whenever spreadsheetId is updated
  useEffect(() => {
    if (token) {
      fetchBatches();
    }
  }, [spreadsheetId]);

  // Auth Screen (Login Render)
  if (needsAuth) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="bg-slate-900 p-3 rounded-[2px] border border-slate-900 text-white">
              <Database className="w-8 h-8" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-2xl font-black text-slate-900 uppercase tracking-wider">
            Pune Batches
          </h2>
          <p className="mt-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            A real-time workspace for class batches, PW Admin links, and Google Drive directories.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 border border-[#E2E1DA] sm:rounded-[2px] sm:px-10 space-y-6">
            <div className="text-center text-[10px] text-slate-500 font-black uppercase tracking-wider">
              SIGN IN WITH YOUR PW.LIVE OR GOOGLE ACCOUNT
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-[2px] text-xs text-red-700 flex items-start gap-2 font-bold uppercase tracking-wide">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="w-full gsi-material-button py-2.5 px-4 border border-[#E2E1DA] rounded-[2px] bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider shadow-none flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60"
            >
              {isAuthenticating ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              )}
              <span>Sign in with Google</span>
            </button>

            <div className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-wider">
              Requires permission to read Google Sheets and search folders in Google Drive.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleExplainBatch = (batch: Batch) => {
    setSelectedAiBatch(batch);
    setShowAiCopilot(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-slate-800">
      {/* Top Banner / Navbar */}
      <header className="bg-white border-b border-[#E2E1DA] px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40">
        {/* Clickable Logo & Slide-out Navigation Drawer Trigger */}
        <div 
          onClick={() => setIsNavDrawerOpen(true)}
          className="flex items-center gap-2 sm:gap-3 flex-shrink-0 cursor-pointer group select-none"
          title="Click to open menu: Extra Class, Test Announcement, City Test, Batch Overlook, MIP Batches"
        >
          <div className="bg-slate-900 group-hover:bg-indigo-600 p-1.5 sm:p-2 rounded-[2px] text-white transition-all shadow-xs flex items-center justify-center relative">
            <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full border border-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-wider uppercase group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                <span className="sm:hidden font-black">PB</span>
                <span className="hidden sm:inline">Pune Batches</span>
              </h1>
              <span className="text-[7.5px] sm:text-[8px] bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-700 border border-slate-200 group-hover:border-indigo-200 px-1 sm:px-1.5 py-0.2 rounded-[1px] font-black uppercase tracking-wider transition-colors flex items-center gap-0.5">
                <span>Menu</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:block">
              {activeView === 'batches' ? 'PW Batch Finder and Automation Suite' : MODULE_METAS[activeView].title}
            </p>
          </div>
        </div>

        {/* Universal Search Bar */}
        <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm mx-1.5 sm:mx-8 relative">
          <Search className="absolute left-2.5 sm:left-3 top-2 sm:top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={universalSearchQuery}
            onChange={(e) => setUniversalSearchQuery(e.target.value)}
            placeholder="Search batches..."
            className="w-full text-xs pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 border border-[#E2E1DA] rounded-[2px] focus:outline-hidden focus:border-slate-950 bg-[#FAF9F5] transition-all font-sans font-bold uppercase tracking-wider placeholder-slate-400"
          />
          {universalSearchQuery && (
            <button 
              onClick={() => setUniversalSearchQuery("")}
              className="absolute right-2 sm:right-2.5 top-2 sm:top-2.5 text-[10px] text-slate-400 hover:text-slate-900 font-black uppercase tracking-wider cursor-pointer"
              title="Clear universal search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* AI Timetable & Schedule Finder toggle (Desktop only, mobile has floating side FAB) */}
          <button
            type="button"
            onClick={() => setShowAiCopilot(!showAiCopilot)}
            className={`hidden lg:flex p-2 rounded-[2px] border transition-all cursor-pointer items-center gap-1.5 ${
              showAiCopilot 
                ? 'bg-indigo-600 text-white border-indigo-600 text-[10px] font-black uppercase tracking-wider shadow-xs' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-[#E2E1DA] text-[10px] font-bold uppercase tracking-wider'
            }`}
            title="Search Any Batch Timetable & AI Decode"
          >
            <Sparkles className={`w-4 h-4 ${showAiCopilot ? 'text-white fill-white/30' : 'text-indigo-600 fill-indigo-200'}`} />
            <span>AI Timetable</span>
          </button>

          {/* Settings / Config toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-[2px] border transition-all cursor-pointer flex items-center gap-1.5 ${
              showSettings 
                ? 'bg-slate-900 text-white border-slate-900 text-[10px] font-black uppercase tracking-wider' 
                : 'bg-white hover:bg-slate-50 text-slate-600 border-[#E2E1DA] text-[10px] font-bold uppercase tracking-wider'
            }`}
            title="Configure Spreadsheet ID and Bulk Scanner"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings & Scanner</span>
          </button>

          {/* Logged in User widget */}
          {user && (
            <div className="flex items-center gap-2 border border-[#E2E1DA] bg-[#FAF9F5] rounded-[2px] py-1 px-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border border-slate-200" />
              ) : (
                <div className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center rounded-full text-[9px] font-bold uppercase">
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </div>
              )}
              <span className="text-[10px] font-bold uppercase text-slate-700 hidden sm:inline truncate max-w-[120px] tracking-wider">
                {user.displayName || user.email.split('@')[0]}
              </span>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-600 transition-all ml-1"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Spreadsheet ID Settings & Bulk Scanner Modal Overlay */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2px] border border-[#E2E1DA] shadow-2xl w-full max-w-2xl overflow-hidden my-8"
              id="settings-tools-modal"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 border-b border-[#E2E1DA] flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-300" />
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-white">Settings & Automation Tools</h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Spreadsheet config & Bulk Drive Scanner</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-white/10 rounded-[2px] text-slate-300 hover:text-white transition-all cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(100vh-160px)] overflow-y-auto">
                {/* Section 1: Spreadsheet ID Settings */}
                <div className="space-y-3.5 bg-[#FAF9F5] border border-[#E2E1DA] p-4 rounded-[2px]">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-slate-800" />
                    Google Spreadsheet ID Configuration
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Specify the source workbook ID. Changes will reload all class databases and manager mappings.
                  </p>
                  <form onSubmit={handleUpdateSpreadsheetId} className="flex flex-col sm:flex-row items-stretch gap-3">
                    <input
                      type="text"
                      value={tempSpreadsheetId}
                      onChange={(e) => setTempSpreadsheetId(e.target.value)}
                      placeholder="Paste custom Spreadsheet ID here..."
                      className="flex-1 text-xs px-3 py-2 border border-[#E2E1DA] rounded-[2px] bg-white focus:outline-hidden focus:border-slate-950 transition-all font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded-[2px] border border-slate-900 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Apply & Reload
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempSpreadsheetId("1-OYeCl3SME14Jjk1CCxRAAho_jrvgji63fFunLZvKiM");
                          setSpreadsheetId("1-OYeCl3SME14Jjk1CCxRAAho_jrvgji63fFunLZvKiM");
                          setShowSettings(false);
                        }}
                        className="px-3 py-2 text-[10px] font-black uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 rounded-[2px] border border-[#E2E1DA] transition-all whitespace-nowrap"
                      >
                        Reset Default
                      </button>
                    </div>
                  </form>
                </div>

                {/* Section 2: Bulk Drive Folder Scanner */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-slate-800" />
                    Bulk Drive Scanner Tool
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Automatically run background checks to map Google Drive folders to missing batch sheets row-by-row.
                  </p>
                  
                  {token && currentWorkspaceBatches.length > 0 ? (
                    <div className="bg-white rounded-[2px] border border-[#E2E1DA] p-1">
                      <BulkScanner
                        tabName={activeTab}
                        batches={currentWorkspaceBatches}
                        onScanBatch={handleScanBatch}
                        onComplete={fetchBatches}
                      />
                    </div>
                  ) : (
                    <div className="p-6 bg-[#FAF9F5] border border-[#E2E1DA] rounded-[2px] text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Please log in or select an active campus tab to configure bulk scanners.
                    </div>
                  )}
                </div>

                {/* Section 3: Center Timetable Sheets Alignment (Raw_DB) */}
                <div className="space-y-3 pt-3 border-t border-[#E2E1DA]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        Center Timetable Alignment (`Raw_DB`)
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        All 9 timetable workbooks aligned to centers. Live schedule (Subject: Col AI, Teacher Email: Col AK) is queried from 'Raw_DB'.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchTimetableMappings(workspaceKeys)}
                      disabled={isUpdatingTimetable}
                      className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-800 border border-[#E2E1DA] rounded-[2px] cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <RefreshCw className={`w-3 h-3 ${isUpdatingTimetable ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
                      <span>Re-align</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-[2px] border border-[#E2E1DA] divide-y divide-slate-100 max-h-[240px] overflow-y-auto">
                    {workspaceKeys.length > 0 ? (
                      workspaceKeys.map((centerName) => {
                        const mapping = timetableMappings[centerName];
                        const currentSheetId = mapping?.spreadsheetId || "Auto-detected on request";
                        return (
                          <div key={centerName} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FAF9F5] transition-all">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{centerName}</span>
                                <span className="px-1.5 py-0.2 rounded-[1px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                  Raw_DB Active
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono mt-0.5">
                                <span className="truncate max-w-[200px]">{mapping?.spreadsheetTitle || currentSheetId}</span>
                                {mapping?.spreadsheetId && (
                                  <a
                                    href={`https://docs.google.com/spreadsheets/d/${mapping.spreadsheetId}/edit`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline flex items-center gap-0.5 font-sans font-bold"
                                  >
                                    <span>Open Sheet</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={mapping?.spreadsheetId || ""}
                                onChange={(e) => handleUpdateTimetableMapping(centerName, e.target.value)}
                                className="text-[10px] px-2 py-1.5 border border-[#E2E1DA] rounded-[2px] bg-white font-mono font-bold max-w-[210px] focus:outline-hidden focus:border-slate-900"
                              >
                                <option value="">Auto-Detect from 9 Sheets</option>
                                {ALL_TIMETABLE_SHEETS.map((s, idx) => (
                                  <option key={s.id} value={s.id}>
                                    Sheet {idx + 1} ({s.id.substring(0, 7)}...)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase">
                        No centers loaded yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content: Batches & Schedule (Default) vs Custom Module Views */}
      {activeView === 'batches' ? (
        <div className="flex-1 max-w-full w-full mx-auto flex flex-col lg:flex-row gap-4 sm:gap-6 p-3 sm:p-6 lg:px-8 xl:px-12">
        {/* Left Side Filter Panel */}
        <aside className="w-full lg:w-[310px] space-y-4 sm:space-y-5 flex-shrink-0 lg:sticky lg:top-[90px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto pr-0 lg:pr-1">
          
          {/* Workspaces List Card */}
          <div className="bg-white rounded-[2px] border border-[#E2E1DA] p-2.5 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-800" />
                Workspaces ({workspaceKeys.length})
              </h2>
              {workspaceKeys.length > 4 && (
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="lg:hidden">Swipe →</span>
                  <span className="hidden lg:inline">Scroll for more</span>
                </span>
              )}
            </div>

            {/* Mobile: Horizontal scrollable chips bar (< lg) */}
            <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" id="mobile-workspace-tabs">
              {isLoading && workspaceKeys.length === 0 ? (
                <div className="py-2 text-[9px] text-slate-400 font-bold uppercase">Loading tabs...</div>
              ) : workspaceKeys.length > 0 ? (
                workspaceKeys.map((key) => {
                  const isActive = activeTab === key && universalSearchQuery.trim() === "";
                  const count = batchesData[key]?.length || 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setActiveTab(key);
                        setLocalSearchQuery("");
                        setUniversalSearchQuery("");
                        setSelectedBm("ALL");
                        setSelectedCategory("ALL");
                        setSelectedClass("ALL");
                        setSelectedPhase("ALL");
                        setSelectedTimeSlot("ALL");
                        setActiveStatsFilter("ALL");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-[2px] transition-all whitespace-nowrap cursor-pointer border flex-shrink-0 ${
                        isActive 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                          : 'bg-white hover:bg-[#FAF9F5] text-slate-700 border-[#E2E1DA]'
                      }`}
                    >
                      <span>{key}</span>
                      <span className={`px-1.5 py-0.2 text-[8px] font-bold rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })
              ) : null}
            </div>

            {/* Desktop: 2-column grid (lg:grid) */}
            <div className="hidden lg:grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1 select-none" id="workspace-tabs">
              {isLoading && workspaceKeys.length === 0 ? (
                <div className="col-span-2 py-6 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reading worksheets...</span>
                </div>
              ) : workspaceKeys.length > 0 ? (
                workspaceKeys.map((key) => {
                  const isActive = activeTab === key && universalSearchQuery.trim() === "";
                  const count = batchesData[key]?.length || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveTab(key);
                        // Reset filters when switching tabs
                        setLocalSearchQuery("");
                        setUniversalSearchQuery("");
                        setSelectedBm("ALL");
                        setSelectedCategory("ALL");
                        setSelectedClass("ALL");
                        setSelectedPhase("ALL");
                        setSelectedTimeSlot("ALL");
                        setActiveStatsFilter("ALL");
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-[2px] transition-all text-left cursor-pointer border ${
                        isActive 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                          : 'bg-white hover:bg-[#FAF9F5] text-slate-700 border-[#E2E1DA]'
                      }`}
                      title={`${key} (${count} batches)`}
                      id={`tab-btn-${key.replace(/\s+/g, '-')}`}
                    >
                      <span className="truncate pr-1">{key}</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-[1px] flex-shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-[#E2E1DA]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-2 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  No compatible workspaces found. Check sheet columns!
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Panel */}
          <div className="bg-white rounded-[2px] border border-[#E2E1DA] p-3.5 sm:p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-800" />
                Filters
                {(localSearchQuery || selectedBm !== 'ALL' || selectedCategory !== 'ALL' || selectedClass !== 'ALL' || selectedPhase !== 'ALL' || selectedTimeSlot !== 'ALL' || activeStatsFilter !== 'ALL') && (
                  <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[8px] rounded-full font-black uppercase">
                    Active
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {(localSearchQuery || universalSearchQuery || selectedBm !== 'ALL' || selectedCategory !== 'ALL' || selectedClass !== 'ALL' || selectedPhase !== 'ALL' || selectedTimeSlot !== 'ALL' || activeStatsFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setLocalSearchQuery("");
                      setUniversalSearchQuery("");
                      setSelectedBm("ALL");
                      setSelectedCategory("ALL");
                      setSelectedClass("ALL");
                      setSelectedPhase("ALL");
                      setSelectedTimeSlot("ALL");
                      setActiveStatsFilter("ALL");
                    }}
                    className="text-[9px] font-black uppercase tracking-wider text-slate-900 underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                {/* Mobile Filter Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="lg:hidden px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[1px] border border-slate-300 text-[8.5px] font-black uppercase tracking-wider cursor-pointer"
                >
                  {showMobileFilters ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Filter controls container: toggleable on mobile, always visible on desktop */}
            <div className={`${showMobileFilters ? 'block' : 'hidden lg:block'} space-y-4 pt-1 border-t border-slate-100 lg:border-none lg:pt-0`}>
              {/* Local Search Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Search in {activeTab}</label>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Workspace only</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                  type="text"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab} batches...`}
                  className="w-full text-xs pl-9 pr-8 py-2 border border-[#E2E1DA] rounded-[2px] focus:outline-hidden focus:border-slate-900 transition-all placeholder-slate-400 font-sans"
                />
                {localSearchQuery && (
                  <button 
                    onClick={() => setLocalSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 hover:text-slate-900 font-black uppercase tracking-wider cursor-pointer"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Assignee / BM Filter */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Assignee (BM)
              </label>
              <select
                value={selectedBm}
                onChange={(e) => setSelectedBm(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#E2E1DA] rounded-[2px] focus:outline-hidden focus:border-slate-900 transition-all bg-white font-bold uppercase tracking-wider"
              >
                <option value="ALL">All Managers ({bms.length})</option>
                {bms.map((bm, idx) => (
                  <option key={idx} value={bm}>{bm.split('@')[0]} ({bm})</option>
                ))}
              </select>
            </div>

            {/* Class Level Filter */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                Class Level
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'Class 11', 'Class 12', 'Dropper', 'Foundation', 'Other'].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-[2px] border transition-all cursor-pointer ${
                      selectedClass === cls
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-[#E2E1DA]'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Stream Category Buttons */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Stream Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'JEE', 'NEET', 'Foundation', 'Other'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as CategoryFilter)}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-[2px] border transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-[#E2E1DA]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Phase Buttons */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Phase Filter
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availablePhases.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPhase(p)}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-[2px] border transition-all cursor-pointer ${
                      selectedPhase === p
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-[#E2E1DA]'
                    }`}
                  >
                    {p === 'ALL' ? 'ALL' : p.replace('Phase ', 'P')}
                  </button>
                ))}
              </div>
            </div>

            {/* Timing Buttons */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Timing Schedule
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'Morning', 'Afternoon', 'Evening', 'Weekend'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTimeSlot(t as TimeSlotFilter)}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-[2px] border transition-all cursor-pointer ${
                      selectedTimeSlot === t
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-[#E2E1DA]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

        {/* Main Content Pane */}
        <main className="flex-1 space-y-3 sm:space-y-5 min-w-0">
          
          {/* Active Workspace Actions Bar (Compact & Sleek) */}
          <div className="flex items-center justify-between bg-white border border-[#E2E1DA] rounded-[2px] px-3 py-2 sm:px-4 sm:py-2.5 gap-2">
            <div className="min-w-0">
              {universalSearchQuery.trim() !== "" ? (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider truncate">
                    Universal: "{universalSearchQuery}"
                  </span>
                  <span className="text-[7.5px] sm:text-[8px] bg-slate-950 text-white font-black px-1.5 py-0.5 rounded-[1px] tracking-widest uppercase flex-shrink-0">
                    {filteredBatches.length} matches
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Batches ({filteredBatches.length})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap ml-auto">
              {/* Universal Search Exit button */}
              {universalSearchQuery.trim() !== "" && (
                <button
                  onClick={() => setUniversalSearchQuery("")}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-[2px] transition-all cursor-pointer"
                >
                  Exit
                </button>
              )}

              {/* My Batches Quick Toggle */}
              {myBatchesCount > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyMyBatches(!onlyMyBatches)}
                  className={`px-2 py-1 sm:px-2.5 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-[2px] flex items-center gap-1 transition-all cursor-pointer border ${
                    onlyMyBatches
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-[#E2E1DA]'
                  }`}
                  title={onlyMyBatches ? "Show all batches" : `Filter to only my ${myBatchesCount} assigned batches`}
                >
                  <Star className={`w-3 h-3 ${onlyMyBatches ? 'fill-slate-950 text-slate-950' : 'text-amber-500 fill-amber-400'}`} />
                  <span className="hidden sm:inline">My Batches ({myBatchesCount})</span>
                  <span className="sm:hidden">Mine ({myBatchesCount})</span>
                </button>
              )}

              {/* Copy All Filtered Batches Button Group */}
              {filteredBatches.length > 0 && (
                <div className="relative inline-flex items-center">
                  <button
                    onClick={() => handleCopyAllBatches('names')}
                    className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-l-[2px] flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer border ${
                      copiedBatchCount !== null
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-900 hover:bg-black text-white border-slate-900 shadow-xs'
                    }`}
                    title={`Copy all ${filteredBatches.length} batch names (1 per line for Excel / Google Sheets)`}
                  >
                    {copiedBatchCount !== null ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="hidden sm:inline">Copied {copiedBatchCount} Names!</span>
                        <span className="sm:hidden">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Copy All ({filteredBatches.length})</span>
                        <span className="sm:hidden">Copy ({filteredBatches.length})</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCopyMenu(!showCopyMenu)}
                    className={`px-1.5 sm:px-2 py-1.5 text-[10px] font-black uppercase rounded-r-[2px] border-y border-r transition-all cursor-pointer ${
                      copiedBatchCount !== null
                        ? 'bg-emerald-800 text-white border-emerald-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-900'
                    }`}
                    title="More copy formats"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${showCopyMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Options */}
                  {showCopyMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#E2E1DA] shadow-lg rounded-[2px] py-1 z-30 font-sans">
                      <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Copy {filteredBatches.length} Batches As:
                      </div>
                      <button
                        onClick={() => handleCopyAllBatches('names')}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <span>Display Names (1 per line)</span>
                        <span className="text-[9px] text-slate-400 font-mono">For Sheets</span>
                      </button>
                      <button
                        onClick={() => handleCopyAllBatches('comma')}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-between cursor-pointer border-t border-slate-50"
                      >
                        <span>Comma Separated</span>
                        <span className="text-[9px] text-slate-400 font-mono">A, B, C</span>
                      </button>
                      <button
                        onClick={() => handleCopyAllBatches('codes')}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-between cursor-pointer border-t border-slate-50"
                      >
                        <span>Batch Code Only</span>
                        <span className="text-[9px] text-slate-400 font-mono">27-LJ...</span>
                      </button>
                      <button
                        onClick={() => handleCopyAllBatches('with-links')}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-between cursor-pointer border-t border-slate-50"
                      >
                        <span>Names + Drive Links</span>
                        <span className="text-[9px] text-slate-400 font-mono">TSV Table</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Reload Tab Button */}
              <button
                onClick={() => fetchBatches()}
                disabled={isLoading}
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white border border-[#E2E1DA] hover:bg-slate-50 text-slate-800 rounded-[2px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-800" />
                ) : (
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                )}
                <span className="hidden sm:inline">Reload Tab</span>
                <span className="sm:hidden">Reload</span>
              </button>
            </div>
          </div>

          {/* Mobile Compact Stats Strip (< md) - Saves ~180px of vertical space */}
          {currentWorkspaceBatches.length > 0 && (
            <div className="grid grid-cols-4 gap-1 p-1 bg-white border border-[#E2E1DA] rounded-[2px] md:hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveStatsFilter('ALL')}
                className={`py-1 px-0.5 text-center rounded-[2px] transition-all cursor-pointer ${
                  activeStatsFilter === 'ALL'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="text-xs font-black leading-tight">{totalBatchesCount}</div>
                <div className="text-[7.5px] font-bold uppercase tracking-wider opacity-75 mt-0.5">Total</div>
              </button>
              <button
                type="button"
                onClick={() => setActiveStatsFilter(activeStatsFilter === 'MAPPED' ? 'ALL' : 'MAPPED')}
                className={`py-1 px-0.5 text-center rounded-[2px] transition-all cursor-pointer ${
                  activeStatsFilter === 'MAPPED'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                }`}
              >
                <div className="text-xs font-black leading-tight">{mappingRate}%</div>
                <div className="text-[7.5px] font-bold uppercase tracking-wider opacity-75 mt-0.5">Mapped</div>
              </button>
              <button
                type="button"
                onClick={() => setActiveStatsFilter(activeStatsFilter === 'MISSING' ? 'ALL' : 'MISSING')}
                className={`py-1 px-0.5 text-center rounded-[2px] transition-all cursor-pointer ${
                  activeStatsFilter === 'MISSING'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                }`}
              >
                <div className="text-xs font-black leading-tight">{missingCount}</div>
                <div className="text-[7.5px] font-bold uppercase tracking-wider opacity-75 mt-0.5">Missing</div>
              </button>
              <button
                type="button"
                onClick={() => setActiveStatsFilter(activeStatsFilter === 'ASSIGNED' ? 'ALL' : 'ASSIGNED')}
                className={`py-1 px-0.5 text-center rounded-[2px] transition-all cursor-pointer ${
                  activeStatsFilter === 'ASSIGNED'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
                }`}
              >
                <div className="text-xs font-black leading-tight">{activeBmsCount}</div>
                <div className="text-[7.5px] font-bold uppercase tracking-wider opacity-75 mt-0.5">BMs</div>
              </button>
            </div>
          )}

          {/* Desktop Bento Stats Widgets grid (>= md) */}
          {currentWorkspaceBatches.length > 0 && (
            <div className="hidden md:grid md:grid-cols-4 gap-4">
              {/* Stat 1: Total Batches */}
              <div 
                onClick={() => {
                  if (activeStatsFilter === 'ALL') {
                    // Clear all sidebar filters as well if clicking active ALL
                    setLocalSearchQuery("");
                    setUniversalSearchQuery("");
                    setSelectedBm("ALL");
                    setSelectedCategory("ALL");
                    setSelectedClass("ALL");
                    setSelectedPhase("ALL");
                    setSelectedTimeSlot("ALL");
                  }
                  setActiveStatsFilter('ALL');
                }}
                className={`rounded-[2px] border p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
                  activeStatsFilter === 'ALL'
                    ? 'bg-slate-950 text-[#FAF9F5] border-slate-950 shadow-xs'
                    : 'bg-white hover:border-slate-900 text-slate-900 border-[#E2E1DA]'
                }`}
                title="Click to reset filters and view all batches"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${activeStatsFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>Total Batches</span>
                  <Database className={`w-3.5 h-3.5 ${activeStatsFilter === 'ALL' ? 'text-white' : 'text-slate-800'}`} />
                </div>
                <div className="mt-2.5">
                  <div className="text-xl font-black tracking-tight">{totalBatchesCount}</div>
                  <div className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${activeStatsFilter === 'ALL' ? 'text-slate-400' : 'text-slate-400'}`}>In {activeTab}</div>
                </div>
              </div>

              {/* Stat 2: Folder Mapped */}
              <div 
                onClick={() => {
                  setActiveStatsFilter(activeStatsFilter === 'MAPPED' ? 'ALL' : 'MAPPED');
                }}
                className={`rounded-[2px] border p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
                  activeStatsFilter === 'MAPPED'
                    ? 'bg-slate-950 text-[#FAF9F5] border-slate-950 shadow-xs'
                    : 'bg-white hover:border-slate-900 text-slate-900 border-[#E2E1DA]'
                }`}
                title="Filter to batches with mapped Google Drive folders"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${activeStatsFilter === 'MAPPED' ? 'text-slate-300' : 'text-slate-500'}`}>Folder Mapped</span>
                  <HardDrive className={`w-3.5 h-3.5 ${activeStatsFilter === 'MAPPED' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div className="mt-2.5">
                  <div className="text-xl font-black tracking-tight">{mappingRate}%</div>
                  <div className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${activeStatsFilter === 'MAPPED' ? 'text-emerald-400' : 'text-emerald-600'}`}>{mappedCount} Mapped</div>
                </div>
              </div>

              {/* Stat 3: Missing Links */}
              <div 
                onClick={() => {
                  setActiveStatsFilter(activeStatsFilter === 'MISSING' ? 'ALL' : 'MISSING');
                }}
                className={`rounded-[2px] border p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
                  activeStatsFilter === 'MISSING'
                    ? 'bg-slate-950 text-[#FAF9F5] border-slate-950 shadow-xs'
                    : 'bg-white hover:border-slate-900 text-slate-900 border-[#E2E1DA]'
                }`}
                title="Filter to batches missing Google Drive folders"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${activeStatsFilter === 'MISSING' ? 'text-slate-300' : 'text-slate-500'}`}>Missing Links</span>
                  <AlertCircle className={`w-3.5 h-3.5 ${activeStatsFilter === 'MISSING' ? 'text-amber-400' : (missingCount > 0 ? 'text-amber-600' : 'text-slate-300')}`} />
                </div>
                <div className="mt-2.5">
                  <div className="text-xl font-black tracking-tight">{missingCount}</div>
                  <div className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${activeStatsFilter === 'MISSING' ? 'text-slate-300' : 'text-slate-400'}`}>{missingCount > 0 ? "Requires Scan" : "All Found!"}</div>
                </div>
              </div>

              {/* Stat 4: Active Managers */}
              <div 
                onClick={() => {
                  setActiveStatsFilter(activeStatsFilter === 'ASSIGNED' ? 'ALL' : 'ASSIGNED');
                }}
                className={`rounded-[2px] border p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
                  activeStatsFilter === 'ASSIGNED'
                    ? 'bg-slate-950 text-[#FAF9F5] border-slate-950 shadow-xs'
                    : 'bg-white hover:border-slate-900 text-slate-900 border-[#E2E1DA]'
                }`}
                title="Filter to batches with assigned Batch Managers"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${activeStatsFilter === 'ASSIGNED' ? 'text-slate-300' : 'text-slate-500'}`}>Workforce (BMs)</span>
                  <Users className={`w-3.5 h-3.5 ${activeStatsFilter === 'ASSIGNED' ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div className="mt-2.5">
                  <div className="text-xl font-black tracking-tight">{activeBmsCount}</div>
                  <div className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${activeStatsFilter === 'ASSIGNED' ? 'text-slate-400' : 'text-slate-400'}`}>Assigned BMs</div>
                </div>
              </div>
            </div>
          )}

          {/* Batches Feed */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-[2px] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-black text-red-950 uppercase tracking-wider">Connection Error</h3>
                <p className="text-xs text-red-600 mt-1 font-bold">{error}</p>
                <button 
                  onClick={() => fetchBatches()}
                  className="mt-3 px-3 py-1.5 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-[2px] border border-red-300 text-red-700 cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {isLoading && filteredBatches.length === 0 ? (
            <div className="bg-white border border-[#E2E1DA] rounded-[2px] py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
              <div className="text-center space-y-1">
                <p className="text-xs font-black uppercase tracking-wider text-slate-800">Connecting to Google Sheets...</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fetching tabs & mapping manager logs</p>
              </div>
            </div>
          ) : filteredBatches.length > 0 ? (
            <div className="space-y-3" id="batches-list">
              {filteredBatches.map((batch) => (
                <BatchCard
                  key={`${batch.tabName}-${batch.rowIndex}`}
                  batch={batch}
                  onEdit={setEditingBatch}
                  onScan={handleScanBatch}
                  onExplain={handleExplainBatch}
                />
              ))}
            </div>
          ) : (
            !error && (
              <div className="bg-white border border-[#E2E1DA] rounded-[2px] py-16 text-center space-y-2">
                <Search className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-700">No batches match search filters</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Try adjusting your query or resetting filter buttons.</p>
              </div>
            )
          )}
        </main>

        {/* Right Side AI Copilot Dock (Desktop Dock & Mobile Bottom Sheet) */}
        <AnimatePresence>
          {showAiCopilot && (
            <>
              {/* Mobile Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAiCopilot(false)}
                onTouchMove={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden touch-none overscroll-none select-none"
                aria-hidden="true"
              />

              {/* Panel Container (Fixed Sheet on Mobile, Sticky Column on Desktop) */}
              <motion.aside
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] flex flex-col items-center justify-end p-0 sm:p-3 lg:p-0 lg:static lg:z-auto lg:inset-auto lg:max-h-[calc(100vh-120px)] lg:w-auto lg:sticky lg:top-[90px] flex-shrink-0 overscroll-contain"
              >
                <div className="w-full sm:max-w-lg lg:max-w-none flex flex-col h-[88vh] sm:h-[82vh] lg:h-[780px]">
                  <AiCopilotPanel
                    batch={selectedAiBatch}
                    authToken={token}
                    onClose={() => setShowAiCopilot(false)}
                    allBatches={allBatches}
                    onSelectBatch={(batch) => setSelectedAiBatch(batch)}
                  />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Floating Transparent Side Action Button (Mobile FAB on bottom-right) */}
        {!showAiCopilot && (
          <div className="fixed bottom-6 right-4 z-40 lg:hidden animate-in fade-in zoom-in-90 duration-200">
            <button
              type="button"
              onClick={() => setShowAiCopilot(true)}
              className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-indigo-600 border border-indigo-200/90 shadow-xl shadow-indigo-950/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all cursor-pointer group relative"
              title="Open AI Timetable & Schedule Search"
            >
              <Sparkles className="w-5.5 h-5.5 text-indigo-600 fill-indigo-100 group-hover:scale-110 transition-transform" />
              {selectedAiBatch && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-[7px] font-bold text-white shadow-xs">
                  ✓
                </span>
              )}
            </button>
          </div>
        )}

        {/* Floating Back to Top Button */}
        {showScrollTop && (
          <div className="fixed bottom-20 right-4.5 z-40 animate-in fade-in zoom-in-90 duration-200">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-11 h-11 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-xl backdrop-blur-md flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-slate-700"
              title="Scroll back to top"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      ) : activeView === 'extra-class' ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:px-8 xl:px-12">
          <ExtraClassView
            authToken={token}
            onBackToBatches={() => setActiveView('batches')}
          />
        </div>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:px-8 xl:px-12">
          <GenericSheetView
            moduleId={activeView}
            title={MODULE_METAS[activeView].title}
            subtitle={MODULE_METAS[activeView].subtitle}
            badge={MODULE_METAS[activeView].badge}
            authToken={token}
            allBatches={allBatches}
            onBackToBatches={() => setActiveView('batches')}
          />
        </div>
      )}

      {/* Navigation Drawer (Slide-out menu from left) */}
      <NavigationDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
        userEmail={user?.email}
        totalBatchesCount={allBatches.length}
      />

      {/* Manual Link Update Modal Popup */}
      {editingBatch && (
        <EditBatchModal
          batch={editingBatch}
          onClose={() => setEditingBatch(null)}
          onSave={handleSaveBatchLinks}
        />
      )}
    </div>
  );
}
