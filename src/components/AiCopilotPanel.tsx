import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useDragControls } from 'motion/react';
import { 
  Sparkles,
  X, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Loader2, 
  Calendar, 
  Clock, 
  Mail, 
  Check,
  CheckCircle2,
  CheckCheck, 
  Share2, 
  BookOpen, 
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  RotateCw,
  Search,
  ChevronDown,
  Eye,
  EyeOff,
  MessageSquare
} from 'lucide-react';
import { Batch, BatchScheduleResponse, LectureSchedule, BatchAuditIssue, BatchExtraClassItem } from '../types';

interface AiCopilotPanelProps {
  batch: Batch | null;
  authToken?: string | null;
  onClose: () => void;
  allBatches?: Batch[];
  onSelectBatch?: (batch: Batch) => void;
  autoFocusSearch?: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export default function AiCopilotPanel({ 
  batch, 
  authToken, 
  onClose,
  allBatches = [],
  onSelectBatch,
  autoFocusSearch = false
}: AiCopilotPanelProps) {
  const [activeBatch, setActiveBatch] = useState<Batch | null>(batch);
  const [scheduleData, setScheduleData] = useState<BatchScheduleResponse | null>(null);
  const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('TODAY');

  // Search & Batch Switcher State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedSchedule, setCopiedSchedule] = useState<boolean>(false);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [copiedNoticeId, setCopiedNoticeId] = useState<string | null>(null);
  const [extraClassDayFilter, setExtraClassDayFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'YESTERDAY'>('ALL');
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const aiSectionRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(0);
  const dragControls = useDragControls();

  // Synchronize internal activeBatch with incoming batch prop
  useEffect(() => {
    setActiveBatch(batch);
    if (!batch && (autoFocusSearch || window.innerWidth > 768)) {
      searchInputRef.current?.focus();
    }
  }, [batch, autoFocusSearch]);

  // Handle outside clicks to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter batch suggestions for search dropdown
  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !allBatches || allBatches.length === 0) return [];
    const cleanQ = q.replace(/[^a-z0-9]/gi, '');
    return allBatches.filter((b) => {
      const name = (b.displayName || b.fullName || '').toLowerCase();
      const cleanName = name.replace(/[^a-z0-9]/gi, '');
      const tab = (b.tabName || '').toLowerCase();
      return name.includes(q) || (cleanQ.length >= 2 && cleanName.includes(cleanQ)) || tab.includes(q);
    }).slice(0, 15);
  }, [searchQuery, allBatches]);

  const handleSelectBatch = (selected: Batch) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    setActiveBatch(selected);
    onSelectBatch?.(selected);
  };

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setShowSearchDropdown(false);

    // 1. Exact match against allBatches
    const exact = allBatches?.find((b) => 
      (b.displayName || '').toLowerCase() === q.toLowerCase() ||
      (b.fullName || '').toLowerCase() === q.toLowerCase()
    );
    if (exact) {
      handleSelectBatch(exact);
      return;
    }

    // 2. Partial match against allBatches
    const cleanQ = q.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const partial = allBatches?.find((b) => {
      const cleanName = (b.displayName || b.fullName || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      return cleanName.includes(cleanQ) || (b.displayName || b.fullName || '').toLowerCase().includes(q.toLowerCase());
    });
    if (partial) {
      handleSelectBatch(partial);
      return;
    }

    // 3. If not found in current loaded list, create a dynamic Batch object to search Raw_DB across ALL workspaces
    const dynamicBatch: Batch = {
      fullName: q,
      displayName: q,
      bmEmail: '',
      adminUrl: '',
      pwUrl: '',
      driveUrl: '',
      matchStatus: 'Universal Query',
      category: q.toUpperCase().includes('NEET') ? 'NEET' : q.toUpperCase().includes('JEE') ? 'JEE' : 'Other',
      phase: 'Phase 1',
      timeSlot: 'Morning',
      tabName: '', // Empty center signals backend to query all 9 timetable workbooks
      rowIndex: 0,
    };
    handleSelectBatch(dynamicBatch);
  };

  // Fetch batch schedule from Raw_DB and AI explanation when activeBatch changes
  useEffect(() => {
    if (!activeBatch) {
      setScheduleData(null);
      setExplanation('');
      setMessages([]);
      return;
    }

    let isMounted = true;

    const loadBatchContext = async () => {
      setIsScheduleLoading(true);
      setIsLoading(true);
      setExplanation('');
      setMessages([]);
      setSelectedDayFilter('TODAY');

      let fetchedSchedule: BatchScheduleResponse | null = null;

      // 1. Fetch live schedule from /api/timetable/batch-schedule (searching across all workspaces)
      try {
        const scheduleUrl = `/api/timetable/batch-schedule?searchAll=true&center=${encodeURIComponent(activeBatch.tabName || '')}&batchCode=${encodeURIComponent(activeBatch.fullName || activeBatch.displayName)}`;
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const scheduleRes = await fetch(scheduleUrl, { headers });
        if (scheduleRes.ok) {
          const sData = await scheduleRes.json();
          if (isMounted) {
            fetchedSchedule = sData;
            setScheduleData(sData);
            if (sData.center && (!activeBatch.tabName || activeBatch.tabName === '')) {
              setActiveBatch((prev) => prev ? { ...prev, tabName: sData.center } : prev);
            }
          }
        }
      } catch (schErr) {
        console.warn('Could not fetch Raw_DB schedule:', schErr);
      } finally {
        if (isMounted) setIsScheduleLoading(false);
      }

      // 2. Fetch AI explanation with schedule context
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 sec client timeout

        const explainRes = await fetch('/api/ai/explain', {
          method: 'POST',
          signal: controller.signal,
          headers: { 
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify({
            batchCode: activeBatch.displayName || activeBatch.fullName,
            tabName: activeBatch.tabName,
            category: activeBatch.category,
            phase: activeBatch.phase,
            timeSlot: activeBatch.timeSlot,
            bmEmail: activeBatch.bmEmail,
            todayLectures: fetchedSchedule?.todayLectures || [],
            allLectures: fetchedSchedule?.allLectures || [],
            auditIssues: fetchedSchedule?.auditIssues || [],
            extraClasses: fetchedSchedule?.extraClasses || [],
          }),
        });
        clearTimeout(timeoutId);

        if (!explainRes.ok) throw new Error('AI Server is currently busy.');
        const data = await explainRes.json();
        if (isMounted) {
          setExplanation(data.explanation || 'No explanation generated.');
        }
      } catch (err: any) {
        if (isMounted) {
          const scheduleSummary = fetchedSchedule && fetchedSchedule.allLectures.length > 0
            ? `\n\n#### 📅 Timetable Overview:\n` +
              (fetchedSchedule.todayLectures.length > 0
                ? `* **Today's Classes:** ${fetchedSchedule.todayLectures.map(l => `${l.timeRange || l.startTime}: ${l.subject || 'Lecture'} (${l.facultyCode || 'Faculty'}${l.room ? ` - ${l.room}` : ''})`).join(', ')}`
                : `* **Today:** No classes scheduled.\n* **This Week:** ${fetchedSchedule.allLectures.length} class(es) scheduled on ${fetchedSchedule.daysAvailable?.join(', ') || 'other days'}.`)
            : `\n\n*(No live lecture rows found in timetable or extra class sheets for this batch.)*`;

          let auditSummary = '';
          if (fetchedSchedule?.auditIssues && fetchedSchedule.auditIssues.length > 0) {
            auditSummary = `\n\n#### ⚠️ Audit Issues Recorded (${fetchedSchedule.auditIssues.length}):\n` +
              fetchedSchedule.auditIssues.map(a => `* **${a.subsheet}** (${a.lecStartTime}): ${a.errors} [BM: ${a.finalBm}]`).join('\n');
          } else {
            auditSummary = `\n\n#### ✅ Audit Status:\n* No audit issues or pendency recorded.`;
          }

          let extraSummary = '';
          if (fetchedSchedule?.extraClasses && fetchedSchedule.extraClasses.length > 0) {
            extraSummary = `\n\n#### 📌 Extra Classes (${fetchedSchedule.extraClasses.length}):\n` +
              fetchedSchedule.extraClasses.map(e => `* **${e.date}** (${e.timeRange}): ${e.subject} - Announcement: ${e.isDone ? 'DONE' : 'PENDING'}`).join('\n');
          }

          setExplanation(`### 📋 Batch Details: **${activeBatch.displayName || activeBatch.fullName}**
* **Center:** ${activeBatch.tabName || 'Pune Center'}
* **Category:** ${activeBatch.category} | **Phase:** ${activeBatch.phase}
* **Shift:** ${activeBatch.timeSlot || 'Standard'}
* **Assigned BM:** ${activeBatch.bmEmail || 'None'}${scheduleSummary}${auditSummary}${extraSummary}`);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadBatchContext();

    return () => {
      isMounted = false;
    };
  }, [activeBatch, authToken]);

  // Scroll internal panel content only when new messages are sent (never scroll outer window/batches)
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && contentScrollRef.current) {
      contentScrollRef.current.scrollTo({
        top: contentScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, isSending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isSending) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages,
          contextBatch: activeBatch,
          todayLectures: scheduleData?.todayLectures || [],
        }),
      });

      if (!res.ok) throw new Error('Could not contact assistant.');
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Sorry, I encountered an issue replying to that question. Please make sure your server is online and try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyExplanation = () => {
    const textToCopy = explanation + "\n\n" + messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySchedule = () => {
    if (!scheduleData) return;
    const center = activeBatch?.tabName || '';
    const batchName = activeBatch?.displayName || activeBatch?.fullName || '';

    if (selectedDayFilter === 'TODAY') {
      const dayLabel = `Today (${scheduleData.todayDay}, ${scheduleData.todayDate})`;
      let text = `📅 *PW Class Schedule - ${dayLabel}*\n📍 *Center:* ${center}\n📚 *Batch:* ${batchName}\n\n`;
      if (scheduleData.todayLectures.length === 0) {
        text += `No lectures scheduled for today.\n`;
      } else {
        scheduleData.todayLectures.forEach((lec, i) => {
          text += `*Lecture ${i + 1}:* ${lec.timeRange || `${lec.startTime} - ${lec.endTime}`}\n`;
          text += `🔹 *Subject:* ${lec.subject || 'General'}\n`;
          text += `👨‍🏫 *Faculty:* ${lec.facultyCode || 'TBD'}\n`;
          if (lec.teacherEmail) text += `✉️ *Email:* ${lec.teacherEmail}\n`;
          text += `\n`;
        });
      }
      text += `Please carry your modules & notes!`;
      navigator.clipboard.writeText(text);
      setCopiedSchedule(true);
      setTimeout(() => setCopiedSchedule(false), 2000);
      return;
    }

    if (selectedDayFilter === 'ALL') {
      let text = `📅 *PW Weekly Class Schedule*\n📍 *Center:* ${center}\n📚 *Batch:* ${batchName}\n\n`;
      if (groupedLecturesByDay.length === 0) {
        text += `No lectures scheduled for this week.\n`;
      } else {
        groupedLecturesByDay.forEach((group) => {
          text += `━━━━━━━━━━━━━━━━━━━━━\n`;
          text += `🗓️ *${group.dayLabel.toUpperCase()}${group.date ? ` (${group.date})` : ''}*:\n`;
          group.lectures.forEach((lec, i) => {
            text += `  ${i + 1}. ${lec.timeRange || `${lec.startTime} - ${lec.endTime}`} | *${lec.subject || 'General'}* | Fac: ${lec.facultyCode || 'TBD'}`;
            if (lec.teacherEmail) text += ` (${lec.teacherEmail})`;
            text += `\n`;
          });
          text += `\n`;
        });
      }
      text += `Please carry your modules & notes!`;
      navigator.clipboard.writeText(text);
      setCopiedSchedule(true);
      setTimeout(() => setCopiedSchedule(false), 2000);
      return;
    }

    // Specific Day
    const targetLectures = scheduleData.allLectures.filter(l => 
      (l.day || '').toUpperCase().startsWith(selectedDayFilter.substring(0, 3).toUpperCase())
    );
    const dayDate = targetLectures.find(l => l.lectureDate)?.lectureDate || '';
    const dayLabel = `${selectedDayFilter}${dayDate ? ` (${dayDate})` : ''}`;

    let text = `📅 *PW Class Schedule - ${dayLabel}*\n📍 *Center:* ${center}\n📚 *Batch:* ${batchName}\n\n`;
    if (targetLectures.length === 0) {
      text += `No lectures scheduled for ${selectedDayFilter}.\n`;
    } else {
      targetLectures.forEach((lec, i) => {
        text += `*Lecture ${i + 1}:* ${lec.timeRange || `${lec.startTime} - ${lec.endTime}`}\n`;
        text += `🔹 *Subject:* ${lec.subject || 'General'}\n`;
        text += `👨‍🏫 *Faculty:* ${lec.facultyCode || 'TBD'}\n`;
        if (lec.teacherEmail) text += `✉️ *Email:* ${lec.teacherEmail}\n`;
        text += `\n`;
      });
    }
    text += `Please carry your modules & notes!`;
    navigator.clipboard.writeText(text);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 2000);
  };

  const handleRefreshSchedule = async () => {
    if (!activeBatch) return;
    setIsScheduleLoading(true);
    try {
      const scheduleUrl = `/api/timetable/batch-schedule?searchAll=true&center=${encodeURIComponent(activeBatch.tabName || '')}&batchCode=${encodeURIComponent(activeBatch.fullName || activeBatch.displayName)}&forceRefresh=true`;
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(scheduleUrl, { headers });
      if (res.ok) {
        const sData = await res.json();
        setScheduleData(sData);
        if (sData.center && (!activeBatch.tabName || activeBatch.tabName === '')) {
          setActiveBatch((prev) => prev ? { ...prev, tabName: sData.center } : prev);
        }
      }
    } catch (err) {
      console.warn('Refresh schedule error:', err);
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const handleCopyEmail = (email: string, id: string) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 1800);
  };

  const handleCopyExtraAnnouncement = (item: BatchExtraClassItem) => {
    let text = item.announcement;
    if (!text) {
      text = `Dear Vidyapeeth Students, ${item.teacherName || 'Faculty'} Sir/Ma'am will take Extra Class of ${item.subject || 'Special Lecture'} on (${item.date}) at (${item.timeRange}). Don't forget to join! Keep studying! Physics Wallah is for you, by you, from you!`;
    }
    navigator.clipboard.writeText(text);
    setCopiedNoticeId(item.id);
    setTimeout(() => setCopiedNoticeId(null), 2000);
  };

  const handleShareExtraWhatsApp = (item: BatchExtraClassItem) => {
    let text = item.announcement;
    if (!text) {
      text = `Dear Vidyapeeth Students, ${item.teacherName || 'Faculty'} Sir/Ma'am will take Extra Class of ${item.subject || 'Special Lecture'} on (${item.date}) at (${item.timeRange}). Don't forget to join! Keep studying! Physics Wallah is for you, by you, from you!`;
    }
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const extraDayCounts = useMemo(() => {
    const list = scheduleData?.extraClasses || [];
    return {
      all: list.length,
      today: list.filter((e) => e.isToday).length,
      tomorrow: list.filter((e) => e.isTomorrow).length,
      yesterday: list.filter((e) => e.isYesterday).length,
    };
  }, [scheduleData?.extraClasses]);

  const displayedExtraClasses = useMemo(() => {
    const list = scheduleData?.extraClasses || [];
    if (extraClassDayFilter === 'TODAY') return list.filter((e) => e.isToday);
    if (extraClassDayFilter === 'TOMORROW') return list.filter((e) => e.isTomorrow);
    if (extraClassDayFilter === 'YESTERDAY') return list.filter((e) => e.isYesterday);
    return list;
  }, [scheduleData?.extraClasses, extraClassDayFilter]);

  const quickQuestions = [
    "Draft WhatsApp reminder for students",
    "List today's teachers and emails",
    "How to manage today's schedule load?",
  ];

  const triggerQuickQuestion = (q: string) => {
    setInputQuery(q);
  };

  const getSubjectBadgeStyle = (subject: string) => {
    const s = (subject || '').toLowerCase();
    if (s.includes('phy')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s.includes('chem')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('math')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s.includes('bio') || s.includes('zoo') || s.includes('bot')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  const getStatusBadge = (status: 'upcoming' | 'ongoing' | 'completed') => {
    if (status === 'ongoing') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-black uppercase tracking-wider animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Live Now
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-black uppercase tracking-wider">
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-sky-50 text-sky-700 border border-sky-200 text-[9px] font-black uppercase tracking-wider">
        Upcoming
      </span>
    );
  };

  const availableDays = ['TODAY', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'ALL'];

  const getLectureDay = React.useCallback((lec: LectureSchedule): string => {
    const d = (lec.day || '').trim();
    if (d.length >= 3) return d.substring(0, 3).toUpperCase();
    if (lec.lectureDate) {
      try {
        const parsed = new Date(lec.lectureDate);
        if (!isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        }
      } catch {}
    }
    return '';
  }, []);

  const dayCounts = React.useMemo(() => {
    if (!scheduleData) return {} as Record<string, number>;
    const counts: Record<string, number> = {
      TODAY: scheduleData.todayLectures?.length || 0,
      ALL: scheduleData.allLectures?.length || 0,
    };
    (scheduleData.allLectures || []).forEach((l) => {
      const d3 = getLectureDay(l).toLowerCase();
      availableDays.forEach((ad) => {
        if (ad !== 'TODAY' && ad !== 'ALL' && ad.toLowerCase().startsWith(d3)) {
          counts[ad] = (counts[ad] || 0) + 1;
        }
      });
    });
    return counts;
  }, [scheduleData, getLectureDay]);

  const groupedLecturesByDay = React.useMemo(() => {
    if (!scheduleData?.allLectures) return [];

    const groups: {
      dayKey: string;
      dayLabel: string;
      date?: string;
      isToday: boolean;
      lectures: LectureSchedule[];
    }[] = [];

    const mapByDay = new Map<string, LectureSchedule[]>();
    for (const lec of scheduleData.allLectures) {
      const day3 = getLectureDay(lec) || 'OTHER';
      const existing = mapByDay.get(day3) || [];
      existing.push(lec);
      mapByDay.set(day3, existing);
    }

    const DAY_NAMES: Record<string, string> = {
      MON: 'Monday',
      TUE: 'Tuesday',
      WED: 'Wednesday',
      THU: 'Thursday',
      FRI: 'Friday',
      SAT: 'Saturday',
      SUN: 'Sunday',
    };

    ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].forEach((dUpper) => {
      const lecs = mapByDay.get(dUpper);
      if (lecs && lecs.length > 0) {
        const firstDate = lecs.find((l) => l.lectureDate)?.lectureDate || '';
        const isToday = lecs.some((l) => l.isToday);
        const dayLabel = DAY_NAMES[dUpper] || lecs[0].day || dUpper;
        groups.push({
          dayKey: dUpper.substring(0, 3),
          dayLabel,
          date: firstDate,
          isToday,
          lectures: lecs,
        });
        mapByDay.delete(dUpper);
      }
    });

    mapByDay.forEach((lecs, key) => {
      if (lecs.length > 0) {
        const firstDate = lecs.find((l) => l.lectureDate)?.lectureDate || '';
        const isToday = lecs.some((l) => l.isToday);
        groups.push({
          dayKey: key,
          dayLabel: lecs[0].day || key,
          date: firstDate,
          isToday,
          lectures: lecs,
        });
      }
    });

    return groups;
  }, [scheduleData]);

  const parseInlineBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold text-slate-800">{part}</strong> : part));
  };

  const renderLectureCard = (lec: LectureSchedule, uniqueKey: string, showDayBadge: boolean = false) => {
    const cleanTime = (lec.timeRange || `${lec.startTime || ''} - ${lec.endTime || ''}`)
      .replace(/\s*-\/-\s*/g, ' – ')
      .replace(/\s*\/\s*/g, ' – ')
      .replace(/\s*-\s*/g, ' – ')
      .trim();

    return (
      <div
        key={uniqueKey}
        className="p-3 sm:p-3.5 bg-white rounded-[3px] border border-slate-200 hover:border-slate-400 transition-all shadow-xs space-y-2"
      >
        {/* Top Row: Time & Subject & Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              {cleanTime}
            </span>
            {showDayBadge && lec.day && (
              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded-[2px] text-[9px] font-black uppercase">
                {lec.day}
              </span>
            )}
            {lec.lectureDate && (
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-[2px] text-[8.5px] font-bold">
                {lec.lectureDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {lec.isExtraClass && (
              <span className="px-2 py-0.5 rounded-[2px] text-[8.5px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                Extra Class
              </span>
            )}
            {lec.subject && (
              <span className={`px-2 py-0.5 rounded-[2px] text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider border ${getSubjectBadgeStyle(lec.subject)}`}>
                {lec.subject}
              </span>
            )}
            {lec.isToday && getStatusBadge(lec.status)}
          </div>
        </div>

        {/* Bottom Row: Faculty, Room & Teacher Email */}
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 text-slate-600 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold min-w-0">
            <span className="text-slate-400 uppercase text-[9px] flex-shrink-0">Faculty:</span>
            <span className="text-slate-900 font-black text-xs sm:text-[13px] truncate max-w-[150px]">
              {lec.teacherName ? `${lec.teacherName} (${lec.facultyCode || 'TBD'})` : (lec.facultyCode || 'TBD')}
            </span>
            {lec.room && (
              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-[2px] text-[8px] font-bold uppercase flex-shrink-0">
                {lec.room}
              </span>
            )}
          </div>

          {lec.teacherEmail ? (
            <div className="flex items-center gap-1 font-mono text-[10.5px] sm:text-xs flex-shrink-0">
              <a
                href={`mailto:${lec.teacherEmail}`}
                className="text-indigo-600 hover:underline font-medium truncate max-w-[150px] sm:max-w-[190px]"
                title={`Email: ${lec.teacherEmail}`}
              >
                {lec.teacherEmail}
              </a>
              <button
                onClick={() => handleCopyEmail(lec.teacherEmail, uniqueKey)}
                className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer rounded-[2px] hover:bg-slate-100"
                title="Copy email"
              >
                {copiedEmailId === uniqueKey ? (
                  <span className="text-[9px] text-emerald-600 font-bold">✓</span>
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          ) : (
            <span className="text-[9px] text-slate-400 font-bold uppercase flex-shrink-0">Email not listed</span>
          )}
        </div>
      </div>
    );
  };

  // Convert custom simple markdown headers/lists to bold text or neat lists
  const renderMarkdown = (mdText: string) => {
    if (!mdText) return null;
    return mdText.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-2 first:mt-0">{trimmed.replace('### ', '')}</h4>;
      }
      if (trimmed.startsWith('#### ')) {
        return <h5 key={idx} className="text-xs font-bold text-slate-700 mt-3 mb-1">{trimmed.replace('#### ', '')}</h5>;
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <p key={idx} className="text-xs font-bold text-slate-800 mt-2">{trimmed.replace(/\*\*/g, '')}</p>;
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        let content = trimmed.substring(2);
        return (
          <li key={idx} className="text-xs text-slate-600 ml-4 list-disc mt-1 leading-relaxed">
            {parseInlineBold(content)}
          </li>
        );
      }
      if (trimmed.match(/^\d+\.\s/)) {
        let content = trimmed.replace(/^\d+\.\s/, '');
        return (
          <div key={idx} className="text-xs text-slate-600 ml-4 pl-1 list-decimal mt-1.5 leading-relaxed">
            <span className="font-bold text-indigo-600 mr-1">{trimmed.match(/^\d+\./)?.[0]}</span>
            {parseInlineBold(content)}
          </div>
        );
      }
      return <p key={idx} className="text-xs text-slate-600 leading-relaxed mt-1">{parseInlineBold(trimmed)}</p>;
    });
  };

  return (
    <motion.div 
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.7 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 60 || info.velocity.y > 250) {
          onClose();
        }
      }}
      className="bg-white rounded-t-2xl sm:rounded-[2px] border border-[#E2E1DA] flex flex-col h-full w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 overflow-hidden shadow-2xl lg:shadow-sm overscroll-contain" 
      id="ai-copilot-panel"
    >
      {/* Mobile drag handle with interactive swipe-down-to-close */}
      <div 
        onPointerDown={(e) => {
          if (window.innerWidth < 1024) {
            dragControls.start(e);
          }
        }}
        onClick={onClose}
        className="w-full pt-3 pb-2.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none lg:hidden bg-slate-900 border-b border-slate-800 active:bg-slate-800 transition-colors"
        title="Swipe down or tap to close"
      >
        <div className="w-14 h-1.5 bg-slate-400/80 rounded-full transition-colors" />
        <div className="flex items-center gap-1 text-[9.5px] text-slate-300 font-bold uppercase tracking-wider mt-1">
          <ChevronDown className="w-3.5 h-3.5 text-slate-300 animate-pulse" />
          <span>Swipe down or tap to close</span>
        </div>
      </div>

      {/* Header */}
      <div 
        onPointerDown={(e) => {
          if (window.innerWidth < 1024) {
            const target = e.target as HTMLElement;
            if (!target.closest('button') && !target.closest('input')) {
              dragControls.start(e);
            }
          }
        }}
        className="bg-slate-900 text-white px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 bg-indigo-600 rounded-[2px] text-white flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black tracking-wider uppercase text-white truncate">AI Decode & Schedule</h3>
              <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 text-[8px] font-black uppercase rounded-[1px] flex-shrink-0">
                Raw_DB Live
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[180px] sm:max-w-[220px]">
              {activeBatch ? `${activeBatch.tabName} • ${activeBatch.displayName || activeBatch.fullName}` : 'Batch Schedule Finder'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {activeBatch && (
            <button
              type="button"
              onClick={() => {
                setActiveBatch(null);
                setSearchQuery('');
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-[2px] text-[8px] font-black uppercase border border-slate-700 cursor-pointer transition-all"
              title="Search and switch to another batch schedule"
            >
              Switch Batch
            </button>
          )}
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-[2px] text-slate-400 hover:text-white transition-all cursor-pointer flex-shrink-0"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Universal Batch Search & Quick Switcher Bar */}
      <div ref={searchContainerRef} className="bg-slate-900 border-b border-slate-800 px-3.5 py-2 flex-shrink-0 relative z-30">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit();
            }}
            placeholder="Search ANY batch across ALL workspaces (e.g. 27-AJ253MA)..."
            className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs pl-8 pr-16 py-2 rounded-[2px] border border-slate-700 focus:outline-hidden focus:border-indigo-400 transition-colors font-medium font-sans"
          />
          <div className="absolute right-1 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="p-1 text-slate-400 hover:text-white text-[10px] cursor-pointer"
                title="Clear"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase rounded-[1px] cursor-pointer shadow-xs"
            >
              Find
            </button>
          </div>
        </div>

        {/* Dropdown Suggestions */}
        {showSearchDropdown && (
          <div className="absolute left-3.5 right-3.5 top-full mt-1 bg-slate-900 border border-slate-700 rounded-[2px] shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-800 overscroll-contain">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item, idx) => (
                <button
                  key={`${item.tabName}-${item.displayName}-${idx}`}
                  type="button"
                  onClick={() => handleSelectBatch(item)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/90 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.2 bg-slate-800 text-indigo-300 border border-slate-700 text-[7.5px] font-black uppercase rounded-[1px] flex-shrink-0">
                        {item.tabName}
                      </span>
                      <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                        {item.displayName || item.fullName}
                      </p>
                    </div>
                    <p className="text-[8.5px] text-slate-400 uppercase tracking-wider mt-0.5">
                      {item.category ? `${item.category} • ` : ''}{item.phase || 'Phase 1'} {item.timeSlot ? `• ${item.timeSlot}` : ''}
                    </p>
                  </div>
                  <span className="px-1.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-700 text-[8px] font-black uppercase rounded-[1px] flex-shrink-0">
                    View TT
                  </span>
                </button>
              ))
            ) : searchQuery.trim() ? (
              <div className="p-3 text-center space-y-1.5 bg-slate-900">
                <p className="text-xs text-slate-300">No preset matches in workspace for "{searchQuery}"</p>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-[1px] cursor-pointer inline-flex items-center gap-1"
                >
                  <Search className="w-3 h-3" />
                  <span>Search Raw_DB Timetable for "{searchQuery}" →</span>
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Main Content Scrollable Area */}
      <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-[#FAF9F5] overscroll-contain">
        {!activeBatch ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Batch Schedule & AI Finder
              </h4>
              <p className="text-[11px] text-slate-500 max-w-[280px] leading-relaxed">
                Type any batch name or code (e.g. <span className="font-semibold text-slate-800">27-LJE51MP</span>) in the search bar above to instantly view today's schedule, weekly timetable, subjects, and teacher emails from <strong className="text-slate-800">Raw_DB</strong>!
              </p>
            </div>

            {/* Quick Select from Loaded Batches */}
            {allBatches && allBatches.length > 0 && (
              <div className="w-full pt-4 border-t border-slate-200 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Quick Select ({allBatches.length} Batches Loaded):
                  </p>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Click to view</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 overscroll-contain">
                  {allBatches.slice(0, 16).map((b, i) => (
                    <button
                      key={`${b.tabName}-${b.displayName}-${i}`}
                      type="button"
                      onClick={() => handleSelectBatch(b)}
                      className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-[2px] text-[9.5px] font-bold text-slate-700 hover:text-indigo-600 transition-all text-left truncate max-w-[190px] cursor-pointer shadow-2xs"
                    >
                      <span className="text-indigo-600 mr-1 text-[8px] font-black uppercase">{b.tabName}:</span>
                      {b.displayName || b.fullName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* SECTION 1: LIVE TIMETABLE / SCHEDULE CARD (FROM Raw_DB) */}
            <div className="bg-white rounded-[2px] border border-[#E2E1DA] overflow-hidden shadow-xs">
              {/* Timetable Header */}
              <div className="bg-slate-50 border-b border-[#E2E1DA] px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-wider truncate">
                    {scheduleData 
                      ? (selectedDayFilter === 'TODAY' 
                          ? `Today • ${scheduleData.todayDay} (${scheduleData.todayDate})` 
                          : selectedDayFilter === 'ALL'
                            ? `Full Week Schedule`
                            : `${selectedDayFilter} Schedule`)
                      : 'Batch Schedule'}
                  </span>
                  {scheduleData && (
                    <span className={`px-2 py-0.5 rounded-[2px] text-[8.5px] font-black uppercase flex-shrink-0 ${
                      selectedDayFilter === 'TODAY' && scheduleData.todayLectures.length > 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedDayFilter === 'TODAY'
                        ? `${scheduleData.todayLectures.length} Class${scheduleData.todayLectures.length !== 1 ? 'es' : ''}`
                        : selectedDayFilter === 'ALL'
                          ? `${scheduleData.allLectures.length} Class${scheduleData.allLectures.length !== 1 ? 'es' : ''}`
                          : `${dayCounts[selectedDayFilter] || 0} Class${(dayCounts[selectedDayFilter] || 0) !== 1 ? 'es' : ''}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleRefreshSchedule}
                    disabled={isScheduleLoading}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-[#E2E1DA] text-slate-700 hover:text-slate-900 rounded-[2px] text-[8.5px] font-bold flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider disabled:opacity-50"
                    title="Force refresh timetable from Google Sheets Raw_DB"
                  >
                    <RotateCw className={`w-3 h-3 ${isScheduleLoading ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>Sync</span>
                  </button>
                  <button
                    onClick={handleCopySchedule}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-[#E2E1DA] text-slate-700 hover:text-slate-900 rounded-[2px] text-[8.5px] font-bold flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
                    title="Copy timetable as WhatsApp text"
                  >
                    {copiedSchedule ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 text-[8.5px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[8.5px]">Copy TT</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      aiSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-[2px] text-[8.5px] font-black flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
                    title="Jump to AI Academic Briefing & Chat"
                  >
                    <Bot className="w-3 h-3 text-indigo-600" />
                    <span>AI Info ↓</span>
                  </button>
                </div>
              </div>

              {/* Day filter selector tabs with live class counts */}
              <div className="px-2.5 py-2 bg-[#FAF9F5] border-b border-[#E2E1DA] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {availableDays.map((d) => {
                  const count = dayCounts[d] || 0;
                  const isSelected = selectedDayFilter === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDayFilter(d)}
                      className={`px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-[2px] transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-[#E2E1DA]'
                      }`}
                    >
                      <span>{d === 'TODAY' ? 'Today' : d === 'ALL' ? 'All (Week)' : d}</span>
                      {count > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-bold ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Lectures List */}
              <div className="p-3 space-y-2">
                {isScheduleLoading ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Reading Raw_DB subsheet...
                    </span>
                  </div>
                ) : selectedDayFilter === 'TODAY' ? (
                  /* TODAY: STRICTLY TODAY'S CLASSES ONLY */
                  scheduleData && scheduleData.todayLectures.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-wider text-slate-700">
                        <span>Today's Classes • {scheduleData.todayDay} ({scheduleData.todayDate})</span>
                        <span className="text-emerald-700 font-black">{scheduleData.todayLectures.length} Class{scheduleData.todayLectures.length !== 1 ? 'es' : ''}</span>
                      </div>
                      <div className="space-y-1.5">
                        {scheduleData.todayLectures.map((lec: LectureSchedule, idx: number) => 
                          renderLectureCard(lec, `today-${idx}`, false)
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="py-3.5 px-3 bg-amber-50/90 border border-amber-200/80 rounded-[2px] space-y-1.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-amber-900 font-black text-[10.5px] uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5 text-amber-700" />
                          <span>No classes scheduled for Today ({scheduleData?.todayDay}, {scheduleData?.todayDate})</span>
                        </div>
                        {scheduleData && scheduleData.allLectures.length > 0 ? (
                          <div className="pt-1 border-t border-amber-200/60 flex items-center justify-between text-[9px] text-slate-700 font-medium px-1">
                            <span>
                              This batch has <strong>{scheduleData.allLectures.length} class{scheduleData.allLectures.length !== 1 ? 'es' : ''}</strong> scheduled on other days this week:
                            </span>
                            <button
                              onClick={() => setSelectedDayFilter('ALL')}
                              className="text-indigo-600 font-bold hover:underline cursor-pointer uppercase text-[8px] flex items-center gap-0.5"
                            >
                              Day-by-Day →
                            </button>
                          </div>
                        ) : (
                          <p className="text-[8.5px] text-slate-400 uppercase font-bold">
                            No lecture rows found for this batch in Timetable Raw_DB or Extra Class sheets.
                          </p>
                        )}
                      </div>

                      {/* DIRECT PREVIEW OF SCHEDULED CLASSES THIS WEEK */}
                      {scheduleData && scheduleData.allLectures.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
                            <span>Scheduled Classes for this Batch ({scheduleData.allLectures.length}):</span>
                            <span className="text-[7.5px] text-slate-400 font-bold">ALL TIMETABLE & EXTRA LECTURES</span>
                          </div>
                          <div className="space-y-1.5">
                            {scheduleData.allLectures.map((lec: LectureSchedule, idx: number) => 
                              renderLectureCard(lec, `today-preview-${idx}`, true)
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : selectedDayFilter === 'ALL' ? (
                  /* ALL: GROUPED VISUALLY BY DAY (MON, TUE, WED, THU, FRI, SAT) */
                  groupedLecturesByDay.length > 0 ? (
                    <div className="space-y-3">
                      {groupedLecturesByDay.map((group) => (
                        <div key={group.dayKey} className="space-y-1.5">
                          {/* Day Group Header */}
                          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-100 rounded-[2px] border border-slate-200">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-indigo-600" />
                              <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">
                                {group.dayLabel} {group.date ? `(${group.date})` : ''}
                              </span>
                              {group.isToday && (
                                <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-[1px] text-[7px] font-black uppercase tracking-wider">
                                  Today
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] font-bold text-slate-600 uppercase">
                              {group.lectures.length} Class{group.lectures.length !== 1 ? 'es' : ''}
                            </span>
                          </div>

                          {/* Day Lectures */}
                          <div className="space-y-1.5">
                            {group.lectures.map((lec: LectureSchedule, idx: number) => 
                              renderLectureCard(lec, `${group.dayKey}-${idx}`, false)
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 px-4 bg-[#FAF9F5] border border-dashed border-[#E2E1DA] rounded-[2px] text-center space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                        No weekly lectures found
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        No matching lecture rows found in Timetable Raw_DB or Extra Class sheets for this batch.
                      </p>
                    </div>
                  )
                ) : (
                  /* SPECIFIC DAY VIEW: e.g. Mon, Tue, Wed, Thu, Fri, Sat */
                  (() => {
                    const dayLecs = (scheduleData?.allLectures || []).filter((l) => 
                      getLectureDay(l).startsWith(selectedDayFilter.substring(0, 3).toUpperCase())
                    );
                    const dayDate = dayLecs.find((l) => l.lectureDate)?.lectureDate || '';
                    const isToday = dayLecs.some((l) => l.isToday);

                    return dayLecs.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-wider text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span>{selectedDayFilter} {dayDate ? `(${dayDate})` : ''}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-[1px] text-[7px] font-black uppercase tracking-wider">
                                Today
                              </span>
                            )}
                          </div>
                          <span className="text-slate-600 font-bold">
                            {dayLecs.length} Class{dayLecs.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {dayLecs.map((lec: LectureSchedule, idx: number) => 
                            renderLectureCard(lec, `${selectedDayFilter}-${idx}`, false)
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 px-4 bg-[#FAF9F5] border border-dashed border-[#E2E1DA] rounded-[2px] text-center space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                          No classes scheduled for {selectedDayFilter}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          {scheduleData && scheduleData.totalWeeklyLectures > 0
                            ? `Total ${scheduleData.totalWeeklyLectures} lectures scheduled on other days this week.`
                            : 'No matching entries found in Raw_DB for this batch.'}
                        </p>
                        <button
                          onClick={() => setSelectedDayFilter('ALL')}
                          className="mt-2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[8px] font-black uppercase tracking-wider rounded-[2px] cursor-pointer transition-all inline-flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          <span>View All Days</span>
                        </button>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Timetable Card Footer */}
              {scheduleData?.spreadsheetTitle && (
                <div className="px-3 py-1.5 bg-slate-50 border-t border-[#E2E1DA] flex items-center justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="truncate max-w-[280px]" title={scheduleData.spreadsheetTitle}>
                    Source: {scheduleData.spreadsheetTitle}
                  </span>
                  <span className="text-emerald-700 font-black">Raw_DB Aligned</span>
                </div>
              )}
            </div>

            {/* Scroll Down Prompt for AI Section */}
            <div 
              onClick={() => aiSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="py-2.5 flex items-center justify-center gap-2.5 text-slate-400 cursor-pointer select-none group"
            >
              <div className="h-px bg-slate-200 flex-1 group-hover:bg-slate-300 transition-colors" />
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 group-hover:border-indigo-300 rounded-full shadow-2xs text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-slate-600 group-hover:text-indigo-600 transition-all">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Scroll down for Audit, Extra Classes & AI Briefing</span>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
              </div>
              <div className="h-px bg-slate-200 flex-1 group-hover:bg-slate-300 transition-colors" />
            </div>

            {/* SECTION 2 & 3: AUDIT ISSUES, EXTRA CLASSES & GEMINI AI COPILOT */}
            <div ref={aiSectionRef} className="space-y-4 pt-1">
              {/* 1. Audit Issues & Pendency Card */}
              <div className="bg-white rounded-[2px] border border-[#E2E1DA] overflow-hidden shadow-xs">
                <div className="bg-slate-50 border-b border-[#E2E1DA] px-3.5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${
                      scheduleData?.auditIssues && scheduleData.auditIssues.length > 0
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`} />
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-wider truncate">
                      Audit Sheet Status & Pendency
                    </span>
                  </div>
                  {isScheduleLoading ? (
                    <span className="flex items-center gap-1 text-[8.5px] font-bold text-slate-400 uppercase">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking...
                    </span>
                  ) : scheduleData?.auditIssues && scheduleData.auditIssues.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-[2px] text-[8.5px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      {scheduleData.auditIssues.length} Issue{scheduleData.auditIssues.length > 1 ? 's' : ''} Flagged
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-[2px] text-[8.5px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Clean Record
                    </span>
                  )}
                </div>

                <div className="p-3 sm:p-3.5 space-y-2">
                  {isScheduleLoading ? (
                    <div className="py-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      Scanning Pune Audit Sheet logs...
                    </div>
                  ) : scheduleData?.auditIssues && scheduleData.auditIssues.length > 0 ? (
                    <div className="space-y-2">
                      {scheduleData.auditIssues.map((issue, idx) => (
                        <div 
                          key={issue.id || idx}
                          className="bg-rose-50/50 border border-rose-200/80 rounded-[2px] p-2.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap text-[9px]">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-rose-200 text-rose-900 font-black uppercase rounded-[1px] text-[8px]">
                                {issue.subsheet || 'Audit Issue'}
                              </span>
                              {issue.branch && (
                                <span className="text-slate-500 font-semibold">
                                  {issue.branch}
                                </span>
                              )}
                            </div>
                            {issue.lecStartTime && (
                              <div className="flex items-center gap-1 text-slate-600 font-medium">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{issue.lecStartTime}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-1.5 text-xs text-rose-950 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-rose-900 leading-snug">
                                {issue.errors || 'Audit error flagged'}
                              </p>
                              {issue.subjectName && (
                                <p className="text-[10px] text-slate-600 mt-0.5">
                                  Subject: <span className="font-semibold text-slate-800">{issue.subjectName}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {issue.finalBm && (
                            <div className="pt-1 border-t border-rose-200/50 flex items-center justify-between text-[8.5px] text-slate-500">
                              <span>Assigned BM: <strong className="text-slate-700">{issue.finalBm}</strong></span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-[2px] text-emerald-900 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-emerald-900">No Audit Issues Recorded</p>
                        <p className="text-[9.5px] text-emerald-700">
                          This batch has 0 audit issues or pendency recorded in the central Pune Audit Sheet.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Extra Classes & Announcements Card */}
              <div className="bg-white rounded-[2px] border border-[#E2E1DA] overflow-hidden shadow-xs">
                <div className="bg-slate-50 border-b border-[#E2E1DA] px-3.5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-wider truncate">
                      Extra Classes (Yesterday, Today & Tomorrow)
                    </span>
                  </div>
                  {isScheduleLoading ? (
                    <span className="flex items-center gap-1 text-[8.5px] font-bold text-slate-400 uppercase">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking...
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-[2px] text-[8.5px] font-black uppercase ${
                      scheduleData?.extraClasses && scheduleData.extraClasses.length > 0
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {scheduleData?.extraClasses?.length || 0} Extra Lecture{scheduleData?.extraClasses?.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Day Filter Pills for Extra Classes (Yesterday / Today / Tomorrow) */}
                {scheduleData?.extraClasses && scheduleData.extraClasses.length > 0 && (
                  <div className="px-3.5 pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-100 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => setExtraClassDayFilter('ALL')}
                      className={`px-2 py-0.5 rounded-[1px] text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        extraClassDayFilter === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                      }`}
                    >
                      All ({extraDayCounts.all})
                    </button>
                    {extraDayCounts.today > 0 && (
                      <button
                        type="button"
                        onClick={() => setExtraClassDayFilter('TODAY')}
                        className={`px-2 py-0.5 rounded-[1px] text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          extraClassDayFilter === 'TODAY'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        Today ({extraDayCounts.today})
                      </button>
                    )}
                    {extraDayCounts.tomorrow > 0 && (
                      <button
                        type="button"
                        onClick={() => setExtraClassDayFilter('TOMORROW')}
                        className={`px-2 py-0.5 rounded-[1px] text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          extraClassDayFilter === 'TOMORROW'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        Tomorrow ({extraDayCounts.tomorrow})
                      </button>
                    )}
                    {extraDayCounts.yesterday > 0 && (
                      <button
                        type="button"
                        onClick={() => setExtraClassDayFilter('YESTERDAY')}
                        className={`px-2 py-0.5 rounded-[1px] text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          extraClassDayFilter === 'YESTERDAY'
                            ? 'bg-slate-700 text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        Yesterday ({extraDayCounts.yesterday})
                      </button>
                    )}
                  </div>
                )}

                <div className="p-3 sm:p-3.5 space-y-2">
                  {isScheduleLoading ? (
                    <div className="py-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      Checking extra class records...
                    </div>
                  ) : displayedExtraClasses && displayedExtraClasses.length > 0 ? (
                    <div className="space-y-2.5">
                      {displayedExtraClasses.map((ec) => {
                        const isExpanded = expandedNoticeId === ec.id;
                        const isCopied = copiedNoticeId === ec.id;

                        return (
                          <div 
                            key={ec.id}
                            className={`border rounded-[2px] p-2.5 space-y-2 transition-all ${
                              ec.isDone 
                                ? 'bg-emerald-50/40 border-emerald-200' 
                                : 'bg-amber-50/40 border-amber-200'
                            }`}
                          >
                            {/* Top row: Date Tag, Date, Time & Announcement Badge */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {ec.isToday ? (
                                  <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-black uppercase rounded-[1px] text-[7.5px] tracking-wider shadow-2xs">
                                    TODAY
                                  </span>
                                ) : ec.isTomorrow ? (
                                  <span className="px-1.5 py-0.5 bg-indigo-600 text-white font-black uppercase rounded-[1px] text-[7.5px] tracking-wider shadow-2xs">
                                    TOMORROW
                                  </span>
                                ) : ec.isYesterday ? (
                                  <span className="px-1.5 py-0.5 bg-slate-700 text-white font-black uppercase rounded-[1px] text-[7.5px] tracking-wider shadow-2xs">
                                    YESTERDAY
                                  </span>
                                ) : null}
                                <span className="px-1.5 py-0.5 bg-white text-slate-800 border border-slate-200 font-black uppercase rounded-[1px] text-[8.5px]">
                                  {ec.date} ({ec.day})
                                </span>
                                <span className="px-1.5 py-0.5 bg-white text-indigo-700 border border-indigo-200 font-bold rounded-[1px] text-[8.5px] flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {ec.timeRange}
                                </span>
                              </div>

                              {/* Prominent Announcement Status Badge (Col O) */}
                              {ec.isDone ? (
                                <span className="px-2 py-0.5 rounded-[2px] text-[8.5px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Announcement Done
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-[2px] text-[8.5px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Announcement Pending
                                </span>
                              )}
                            </div>

                            {/* Lecture details */}
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">
                                  {ec.subject}
                                </p>
                                <p className="text-[10px] text-slate-600">
                                  Faculty: <strong className="text-slate-800">{ec.teacherName}</strong>
                                  {ec.room ? ` • Room: ${ec.room}` : ''}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setExpandedNoticeId(isExpanded ? null : ec.id)}
                                  className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-[2px] text-[8.5px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                  title="Toggle WhatsApp Column K Announcement"
                                >
                                  {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  <span>{isExpanded ? 'Hide Notice' : 'Col K Notice'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyExtraAnnouncement(ec)}
                                  className="p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-[2px] text-slate-600 hover:text-indigo-600 cursor-pointer transition-all shadow-2xs"
                                  title="Copy Announcement Notice"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShareExtraWhatsApp(ec)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] cursor-pointer transition-all shadow-2xs"
                                  title="Share to WhatsApp"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Expandable Column K Notice Box */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-500">
                                  <span className="flex items-center gap-1 text-indigo-700">
                                    <MessageSquare className="w-3 h-3" />
                                    Extra Class Announcement Message (Column K)
                                  </span>
                                  {isCopied && <span className="text-emerald-600 font-bold">✓ Copied!</span>}
                                </div>
                                <div className="p-2 bg-white rounded border border-slate-200 text-[10.5px] text-slate-700 font-sans whitespace-pre-wrap leading-relaxed select-text">
                                  {ec.announcement || `Dear Vidyapeeth Students, ${ec.teacherName} Sir/Ma'am will take Extra Class of ${ec.subject} on (${ec.date}) at (${ec.timeRange}). Don't forget to join! Keep studying! Physics Wallah is for you, by you, from you!`}
                                </div>
                                <div className="flex items-center justify-end gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyExtraAnnouncement(ec)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-[2px] text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>{isCopied ? 'Copied' : 'Copy Message'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleShareExtraWhatsApp(ec)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>WhatsApp Share</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-[2px] text-slate-600 text-xs">
                      <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-slate-800">
                          {extraClassDayFilter === 'ALL'
                            ? 'No Extra Classes for Yesterday, Today or Tomorrow'
                            : `No Extra Classes for ${extraClassDayFilter}`}
                        </p>
                        <p className="text-[9.5px] text-slate-500">
                          There are no extra lectures recorded for this batch in the active window (Yesterday, Today, Tomorrow).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. AI Academic Briefing Card */}
              <div className="bg-white p-4 rounded-[2px] border border-[#E2E1DA] relative group shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E1DA]">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                      AI Academic Briefing
                    </h4>
                  </div>
                  <button 
                    onClick={handleCopyExplanation}
                    className="p-1 bg-white hover:bg-slate-50 border border-[#E2E1DA] text-slate-500 rounded-[2px] transition-all cursor-pointer flex items-center gap-1"
                    title="Copy analysis"
                  >
                    {copied ? (
                      <span className="text-[8px] text-emerald-600 font-black px-1 uppercase tracking-wider">Copied!</span>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[8px] font-bold uppercase tracking-wider">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider animate-pulse">
                      Synthesizing schedule & batch intelligence...
                    </p>
                  </div>
                ) : (
                  <div className="prose max-w-none space-y-1.5 text-xs text-slate-700">
                    {renderMarkdown(explanation)}
                  </div>
                )}
              </div>

              {/* Recommended prompt bubbles */}
              {batch && !isLoading && (
                <div className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-0.5">
                    Quick AI Prompts:
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {quickQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => triggerQuickQuestion(q)}
                        className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-[9px] font-bold text-slate-700 hover:text-indigo-600 border border-[#E2E1DA] hover:border-indigo-200 rounded-[2px] whitespace-nowrap transition-all cursor-pointer shadow-2xs"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation History */}
              {messages.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-center">
                    Chat Context
                  </div>
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-[2px] px-3.5 py-2.5 text-xs border ${
                        msg.role === 'user' 
                          ? 'bg-slate-900 border-slate-900 text-white font-medium' 
                          : 'bg-white border-[#E2E1DA] text-slate-800'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1 text-[8px] opacity-75 uppercase tracking-wide font-black">
                          {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                          <span>{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                        </div>
                        <div className="whitespace-pre-line leading-relaxed text-[11px]">{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isSending && (
                <div className="flex gap-2 justify-start">
                  <div className="bg-white border border-[#E2E1DA] rounded-[2px] px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <Loader2 className="w-3 h-3 animate-spin text-slate-800" />
                      <span>AI Copilot formulating reply...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Input Box */}
              <form onSubmit={handleSendMessage} className="p-2.5 bg-white rounded-[2px] border border-[#E2E1DA] shadow-xs flex items-center gap-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={batch ? "Ask Gemini about schedule, faculty, or students..." : "Select batch to chat..."}
                  disabled={!batch || isSending}
                  className="flex-1 text-xs px-3 py-2 border border-[#E2E1DA] rounded-[2px] focus:outline-none focus:border-slate-800 disabled:bg-[#FAF9F5] disabled:text-slate-400 transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={!batch || !inputQuery.trim() || isSending}
                  className="p-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-300 rounded-[2px] transition-all cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
