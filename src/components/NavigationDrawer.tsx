import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Layers, 
  CalendarPlus, 
  Megaphone, 
  ClipboardList, 
  LineChart, 
  Target, 
  ChevronRight,
  Database,
  ExternalLink,
  Sparkles,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { AppView } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  userEmail?: string | null;
  totalBatchesCount?: number;
}

interface NavItem {
  id: AppView;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isMain?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'batches',
    title: 'Batches & Schedule',
    subtitle: 'Class batches, drive links & timetable',
    icon: Layers,
    badge: 'Main / Default',
    isMain: true,
  },
  {
    id: 'extra-class',
    title: 'Extra Class',
    subtitle: 'Special extra lecture schedules',
    icon: CalendarPlus,
    badge: 'Live Sheet',
  },
  {
    id: 'test-announcement',
    title: 'Test Announcement',
    subtitle: 'Upcoming test dates & syllabus',
    icon: Megaphone,
    badge: 'Live Sheet',
  },
  {
    id: 'city-test',
    title: 'City Test',
    subtitle: 'City-wide tests, centers & venues',
    icon: ClipboardList,
    badge: 'Live Sheet',
  },
  {
    id: 'batch-overlook',
    title: 'Batch Overlook',
    subtitle: 'Batch performance & KPIs',
    icon: LineChart,
    badge: 'Live Sheet',
  },
  {
    id: 'mip-batches',
    title: 'MIP Batches',
    subtitle: 'Most Important Program batches',
    icon: Target,
    badge: 'Live Sheet',
  },
  {
    id: 'audit-sheet',
    title: 'Audit Sheet',
    subtitle: 'Pendency, notes, video & teacher audit',
    icon: FileSpreadsheet,
    badge: 'Pune Only',
  },
];

export default function NavigationDrawer({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  userEmail,
  totalBatchesCount = 0,
}: NavigationDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onTouchMove={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 touch-none overscroll-none select-none"
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-50 w-72 sm:w-84 bg-white border-r border-[#E2E1DA] shadow-2xl flex flex-col font-sans overscroll-contain"
          >
            {/* Drawer Header */}
            <div className="bg-slate-950 text-white px-4 py-4 sm:px-5 flex items-center justify-between border-b border-slate-900 select-none">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-[2px] text-white shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase">
                    Pune Portal Hub
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    PW Pune Batches & Operations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-[2px] text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hub Category Header */}
            <div className="px-4 py-2.5 bg-[#FAF9F5] border-b border-[#E2E1DA] flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                Navigation Modules
              </span>
              <span className="text-[8px] font-bold text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded-[1px] border border-indigo-200">
                6 Views
              </span>
            </div>

            {/* Navigation Options List */}
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1.5 overscroll-contain">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectView(item.id);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-[2px] flex items-center justify-between text-left transition-all cursor-pointer group border ${
                      isActive
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-[2px] flex-shrink-0 transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black uppercase tracking-wider truncate">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span
                              className={`text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded-[1px] tracking-wider ${
                                isActive
                                  ? 'bg-indigo-900 text-indigo-200 border border-indigo-700'
                                  : item.isMain
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[9.5px] truncate mt-0.5 font-medium ${
                            isActive ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-2">
                      {isActive ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Section */}
            <div className="p-3 bg-[#FAF9F5] border-t border-[#E2E1DA] space-y-2 select-none">
              <div className="p-2 bg-white rounded-[2px] border border-[#E2E1DA] text-[9.5px] space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[8.5px]">
                  <span>Loaded Batches:</span>
                  <span className="text-slate-900 font-black">{totalBatchesCount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[8.5px]">
                  <span>Region Filter:</span>
                  <span className="text-emerald-700 font-black">Pune & SIP (S41, S91, S98)</span>
                </div>
                {userEmail && (
                  <div className="truncate text-slate-400 text-[8.5px] font-mono pt-1 border-t border-slate-100">
                    Logged in as: <strong className="text-slate-700">{userEmail}</strong>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
