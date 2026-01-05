import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play, Pause, Check, X, Maximize, Palette, Home, List,
  BookOpen, Calendar as CalendarIcon, Settings, Flame,
  Clock, ChevronRight, Plus, Download, Upload, Trash2,
  AlertCircle, ChevronLeft, Save
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// --- FIREBASE CONFIG & INIT ---
const firebaseConfig = import.meta.env.VITE_FIREBASE_CONFIG
      ? JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG)
      : ((window as any).__firebase_config
        ? JSON.parse((window as any).__firebase_config)
        : {});

let app: any, auth: any, db: any;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Init Error:", e);
}

const appId = import.meta.env.VITE_APP_ID || (typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'default-app-id');

// --- TYPES ---
interface Subject {
  id: string;
  name: string;
  color: string;
  goalMinutes: number;
}

interface Session {
  id: string;
  subjectId: string;
  startTime: any;
  durationSeconds: number;
  note: string;
}

// --- HELPER FUNCTIONS ---
const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDurationHuman = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h > 0) return `${h}h ${remM}min`;
  return `${m}min`;
};

const calculateStreak = (sessions: Session[]) => {
  if (!sessions.length) return 0;

  // Get unique dates YYYY-MM-DD
  const dates = new Set(sessions.map(s => {
    if(!s.startTime) return '';
    return s.startTime.toDate().toISOString().split('T')[0];
  }).filter(Boolean));

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let streak = 0;
  let currentCheck = dates.has(today) ? today : yesterday;

  // Check backwards
  while (dates.has(currentCheck)) {
    streak++;
    const prevDate = new Date(currentCheck);
    prevDate.setDate(prevDate.getDate() - 1);
    currentCheck = prevDate.toISOString().split('T')[0];
  }

  return streak;
};

const AVAILABLE_COLORS = [
  'bg-blue-500', 'bg-red-500', 'bg-purple-500', 'bg-green-500',
  'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500',
  'bg-teal-500', 'bg-rose-500'
];

// --- COMPONENTS ---

// 1. ADD SUBJECT MODAL
const AddSubjectModal = ({ onClose, userId }: { onClose: () => void, userId: string }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(60);
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'subjects'), {
        name,
        color: selectedColor,
        goalMinutes: Number(goal),
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error("Error adding subject", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">Neues Fach</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="z.B. Mathematik"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farbe</label>
            <div className="flex gap-2 flex-wrap">
              {AVAILABLE_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full ${c} ${selectedColor === c ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wochenziel (Minuten)</label>
            <input
              type="number"
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div className="flex gap-2 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-500">Abbrechen</button>
            <button
              type="submit"
              disabled={!name || isSubmitting}
              className="flex-1 bg-black text-white py-2 rounded-lg font-medium disabled:opacity-50"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. DASHBOARD
const DashboardView = ({
  sessions,
  subjects,
  onStartTimer
}: {
  sessions: Session[],
  subjects: Subject[],
  onStartTimer: () => void
}) => {

  const streak = useMemo(() => calculateStreak(sessions), [sessions]);

  // Calculate Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];

      const dayMinutes = sessions
        .filter(s => {
           if(!s.startTime) return false;
           const sDate = s.startTime.toDate();
           return sDate.getDate() === d.getDate() &&
                  sDate.getMonth() === d.getMonth() &&
                  sDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc, s) => acc + (s.durationSeconds / 60), 0);

      data.push({ day: dayName, minutes: Math.round(dayMinutes) });
    }
    return data;
  }, [sessions]);

  const totalMinutesThisWeek = chartData.reduce((acc, d) => acc + d.minutes, 0);

  if (subjects.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl">👋</div>
        <h2 className="text-xl font-bold">Willkommen bei Lernzeit-Tracker!</h2>
        <p className="text-gray-500">Du hast noch keine Daten. Erstelle dein erstes Fach unter "Fächer", um loszulegen.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Übersicht</h1>
          <p className="text-gray-500 text-sm">Deine Lernstatistik</p>
        </div>
        <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-bold text-sm border border-orange-100 shadow-sm">
          <Flame size={16} className="fill-orange-500" />
          <span>{streak} Tage</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Lernzeit (7 Tage)</h2>
        </div>
        <div className="h-48 w-full">
          {sessions.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMinutes)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400 text-sm">
               Noch keine Daten vorhanden
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
          <div className="text-indigo-400 mb-2"><Clock size={20} /></div>
          <div className="text-2xl font-bold text-indigo-900">{formatDurationHuman(totalMinutesThisWeek * 60)}</div>
          <div className="text-xs text-indigo-600">Gesamt (7 Tage)</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
          <div className="text-emerald-400 mb-2"><BookOpen size={20} /></div>
          <div className="text-2xl font-bold text-emerald-900">{subjects.length}</div>
          <div className="text-xs text-emerald-600">Aktive Fächer</div>
        </div>
      </div>

      <button
        onClick={onStartTimer}
        className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        <Play size={20} className="fill-current" />
        Lernen starten
      </button>
    </div>
  );
};

// 3. CALENDAR VIEW
const CalendarView = ({ sessions }: { sessions: Session[] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun
    // Adjust for Monday start (German week)
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: startOffset }, (_, i) => i);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const getDayStatus = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const daySessions = sessions.filter(s => {
            if(!s.startTime) return false;
            const d = s.startTime.toDate();
            return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
        });

        if (daySessions.length === 0) return null;

        const totalMinutes = daySessions.reduce((acc, s) => acc + s.durationSeconds / 60, 0);
        if (totalMinutes > 120) return 'bg-green-500';
        if (totalMinutes > 60) return 'bg-green-400';
        return 'bg-green-300';
    };

    return (
        <div className="p-4 pb-24 space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Kalender</h1>
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20}/></button>
                    <span className="text-sm font-bold w-32 text-center">
                        {currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20}/></button>
                </div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                 <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                     {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                         <div key={d} className="text-xs font-bold text-gray-400 py-2">{d}</div>
                     ))}
                 </div>
                 <div className="grid grid-cols-7 gap-1">
                     {blanks.map(b => <div key={`blank-${b}`} className="aspect-square"></div>)}
                     {days.map(d => {
                         const statusClass = getDayStatus(d);
                         const isToday = new Date().getDate() === d && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

                         return (
                             <div key={d} className="aspect-square flex items-center justify-center relative">
                                 <div
                                    className={`
                                        w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                                        ${statusClass ? `${statusClass} text-white shadow-md scale-105` : 'text-gray-600 hover:bg-gray-50'}
                                        ${isToday && !statusClass ? 'ring-2 ring-black font-bold' : ''}
                                    `}
                                 >
                                     {d}
                                 </div>
                             </div>
                         );
                     })}
                 </div>

                 <div className="mt-6 flex gap-4 text-xs text-gray-500 justify-center">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-300"></div> &lt; 1h</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> &gt; 2h</div>
                 </div>
             </div>
        </div>
    );
};

// 4. TIMER VIEW
const TimerView = ({
  subjects,
  userId,
  onClose
}: {
  subjects: Subject[],
  userId: string,
  onClose: () => void
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [isPaused, setIsPaused] = useState(false);

  // Note Dialog State
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Subject Selector State
  const [showSubjectSelect, setShowSubjectSelect] = useState(false);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const handleFinish = () => {
      setIsActive(false);
      setIsPaused(true); // Stop timer visually
      setShowNoteDialog(true); // Open dialog
  };

  const handleFinalSave = async () => {
    if (!userId) return;
    setIsSaving(true);

    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'sessions'), {
            subjectId: selectedSubjectId,
            startTime: serverTimestamp(),
            durationSeconds: seconds,
            note: sessionNote || 'Fokus Session'
        });
        onClose();
    } catch (e) {
        console.error("Save error", e);
    } finally {
        setIsSaving(false);
    }
  };

  if (!currentSubject) return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle size={48} className="text-red-500 mb-4"/>
          <h2 className="text-xl font-bold">Keine Fächer gefunden</h2>
          <p className="text-gray-500 mb-6">Du musst erst ein Fach erstellen, bevor du den Timer nutzen kannst.</p>
          <button onClick={onClose} className="bg-black text-white px-6 py-2 rounded-full">Zurück</button>
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white animate-in slide-in-from-bottom duration-300">

      {/* Subject Selection Overlay */}
      {showSubjectSelect && (
          <div className="absolute inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-6 animate-in fade-in">
              <h3 className="text-xl font-bold mb-6">Wähle ein Fach</h3>
              <div className="grid gap-3 w-full max-w-xs max-h-[60vh] overflow-y-auto">
                  {subjects.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedSubjectId(s.id); setShowSubjectSelect(false); }}
                        className={`p-4 rounded-xl flex items-center gap-3 transition ${selectedSubjectId === s.id ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
                      >
                          <div className={`w-3 h-3 rounded-full ${s.color.replace('bg-', 'bg-')}`}></div>
                          <span className="font-bold">{s.name}</span>
                      </button>
                  ))}
              </div>
              <button onClick={() => setShowSubjectSelect(false)} className="mt-8 text-white/50">Abbrechen</button>
          </div>
      )}

      {/* Note Input Overlay */}
      {showNoteDialog && (
          <div className="absolute inset-0 bg-black/80 z-[70] flex flex-col items-center justify-center p-6 animate-in fade-in">
              <div className="bg-white text-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-xl font-bold mb-2">Gut gemacht! 🎉</h3>
                  <p className="text-gray-500 mb-4">Du hast {formatDurationHuman(seconds)} gelernt.</p>

                  <label className="block text-sm font-medium text-gray-700 mb-2">Was hast du erledigt?</label>
                  <input
                    value={sessionNote}
                    onChange={(e) => setSessionNote(e.target.value)}
                    placeholder="z.B. Kapitel 3 gelesen, Quiz..."
                    className="w-full border border-gray-300 rounded-lg p-3 mb-6 focus:ring-2 focus:ring-purple-500 outline-none"
                    autoFocus
                  />

                  <button
                    onClick={handleFinalSave}
                    disabled={isSaving}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                  >
                    {isSaving ? 'Speichern...' : (
                        <>
                            <Save size={20} /> Speichern
                        </>
                    )}
                  </button>
                  <button onClick={() => setShowNoteDialog(false)} className="w-full mt-3 text-gray-400 text-sm py-2">
                      Zurück zum Timer
                  </button>
              </div>
          </div>
      )}

      <div className="p-6 flex justify-between items-center">
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md">
          <X size={24} />
        </button>
        <div className="font-medium bg-white/10 px-4 py-1 rounded-full backdrop-blur-md">Focus Mode</div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <button
            onClick={() => !isActive && setShowSubjectSelect(true)}
            className="mb-10 flex items-center gap-2 bg-white/20 hover:bg-white/30 transition px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10"
        >
            <div className={`w-3 h-3 rounded-full ${currentSubject.color.replace('bg-', 'bg-')}`}></div>
            <span className="font-bold text-lg">{currentSubject.name}</span>
            {!isActive && <ChevronRight size={16} className="opacity-50" />}
        </button>

        <div className="text-[5.5rem] leading-none font-bold font-mono tracking-tighter tabular-nums drop-shadow-lg mb-4">
          {formatTime(seconds)}
        </div>

        <div className="flex flex-col w-full max-w-xs gap-4 mt-12">
          {!isActive && seconds === 0 ? (
            <button
              onClick={() => setIsActive(true)}
              className="bg-white text-purple-600 h-20 rounded-full font-bold text-xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-all"
            >
              <Play size={24} className="fill-current" /> Starten
            </button>
          ) : (
            <div className="flex gap-4">
               {/* Resume Button if paused, Pause if active */}
               <button
                  onClick={() => {
                      if(isActive) { setIsActive(false); setIsPaused(true); }
                      else { setIsActive(true); setIsPaused(false); }
                  }}
                  className={`flex-1 h-20 rounded-3xl font-bold text-xl backdrop-blur-md flex items-center justify-center transition ${!isActive ? 'bg-white text-purple-600' : 'bg-white/20 border-2 border-white text-white'}`}
               >
                   {!isActive ? <Play size={28} className="fill-current"/> : <Pause size={28} className="fill-current"/>}
               </button>

               {/* Finish Button */}
               <button
                 onClick={handleFinish}
                 className="flex-1 bg-green-500 text-white h-20 rounded-3xl font-bold text-xl shadow-xl flex items-center justify-center hover:bg-green-400 transition"
               >
                 <Check size={28} />
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 5. SUBJECTS LIST
const SubjectsView = ({ subjects, sessions, userId }: { subjects: Subject[], sessions: Session[], userId: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if(confirm("Fach wirklich löschen?")) {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'subjects', id));
    }
  };

  return (
    <div className="p-4 pb-24 space-y-4 animate-in fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Fächer</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white p-2 rounded-full hover:bg-gray-800 shadow-md transition-transform active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      {subjects.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
              <p>Keine Fächer vorhanden.</p>
              <button onClick={() => setIsModalOpen(true)} className="text-purple-600 font-bold mt-2">Erstes Fach erstellen</button>
          </div>
      ) : (
        <div className="grid gap-4">
            {subjects.map(subject => {
                const subjectSessions = sessions.filter(s => s.subjectId === subject.id);
                const totalSeconds = subjectSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
                const progress = Math.min((totalSeconds / 60 / subject.goalMinutes) * 100, 100);

                return (
                    <div key={subject.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 group">
                        <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${subject.color} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                            {subject.name.substring(0,1).toUpperCase()}
                            </div>
                            <div>
                            <h3 className="font-bold text-gray-800">{subject.name}</h3>
                            <p className="text-xs text-gray-500">{subjectSessions.length} Einheiten</p>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(subject.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                            <Trash2 size={18} />
                        </button>
                        </div>

                        <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-gray-500">{formatDurationHuman(totalSeconds)} gelernt</span>
                            <span className="text-gray-400">Ziel: {formatDurationHuman(subject.goalMinutes * 60)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${subject.color} rounded-full transition-all duration-1000`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {isModalOpen && <AddSubjectModal userId={userId} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

// 6. UNITS / HISTORY VIEW
const UnitsView = ({ sessions, subjects, userId }: { sessions: Session[], subjects: Subject[], userId: string }) => {
  if (sessions.length === 0) return <div className="p-10 text-center text-gray-400">Noch keine Lerneinheiten.</div>;

  // Group and sort
  const sortedSessions = [...sessions].sort((a,b) => (b.startTime?.seconds || 0) - (a.startTime?.seconds || 0));
  const grouped = sortedSessions.reduce((acc, session) => {
    if(!session.startTime) return acc;
    const dateStr = session.startTime.toDate().toDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const deleteSession = async (id: string) => {
      if(confirm("Eintrag löschen?")) {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'sessions', id));
      }
  }

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in">
       <h1 className="text-2xl font-bold text-gray-800">Verlauf</h1>

       <div className="space-y-6">
        {Object.keys(grouped).map(dateStr => (
            <div key={dateStr}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
                    {new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <div className="space-y-3">
                    {grouped[dateStr].map(session => {
                        const subject = subjects.find(s => s.id === session.subjectId);
                        return (
                            <div key={session.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-10 rounded-full ${subject?.color || 'bg-gray-300'}`}></div>
                                    <div>
                                        <div className="font-bold text-gray-800">{subject?.name || 'Unbekanntes Fach'}</div>
                                        <div className="text-xs text-gray-500 flex gap-2">
                                            <span>{session.startTime.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} Uhr</span>
                                            {session.note && <span className="text-gray-400">• {session.note}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="font-mono font-bold text-gray-700">
                                        {Math.round(session.durationSeconds / 60)} min
                                    </div>
                                    <button
                                        onClick={() => deleteSession(session.id)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        ))}
       </div>
    </div>
  );
};

// 7. SETTINGS
const SettingsView = ({ subjects, sessions, userId }: { subjects: Subject[], sessions: Session[], userId: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState('');

    const handleExport = () => {
        const data = {
            version: 1,
            exportedAt: new Date().toISOString(),
            subjects: subjects.map(s => ({...s})),
            sessions: sessions.map(s => ({
                ...s,
                startTime: s.startTime?.toDate().toISOString()
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lernzeit-Tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        setStatus('Export erfolgreich!');
        setTimeout(() => setStatus(''), 3000);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!json.subjects || !json.sessions) throw new Error("Invalid Format");
                setStatus('Importiere Daten...');

                // Import Logic (Simplified: Adds as new)
                const subjectMap: Record<string, string> = {};
                for (const sub of json.subjects) {
                    const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'subjects'), {
                        name: sub.name,
                        color: sub.color,
                        goalMinutes: sub.goalMinutes,
                        createdAt: serverTimestamp()
                    });
                    subjectMap[sub.id] = docRef.id;
                }
                let sessionCount = 0;
                for (const sess of json.sessions) {
                    const newSubjectId = subjectMap[sess.subjectId];
                    if (newSubjectId) {
                        await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'sessions'), {
                            subjectId: newSubjectId,
                            startTime: Timestamp.fromDate(new Date(sess.startTime)),
                            durationSeconds: sess.durationSeconds,
                            note: sess.note || ''
                        });
                        sessionCount++;
                    }
                }
                setStatus(`${json.subjects.length} Fächer und ${sessionCount} Einheiten importiert!`);
            } catch (err) {
                console.error(err);
                setStatus('Fehler beim Import: Ungültige Datei.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in">
            <h1 className="text-2xl font-bold text-gray-800">Einstellungen</h1>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h2 className="font-bold text-gray-700">Datenverwaltung</h2>
                <div className="flex flex-col gap-3">
                    <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium transition">
                        <Download size={20} /> Backup herunterladen
                    </button>
                    <div className="relative">
                        <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden"/>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-medium transition hover:opacity-90">
                            <Upload size={20} /> Backup importieren
                        </button>
                    </div>
                </div>
                {status && <div className="text-sm text-center text-green-600 font-medium py-2">{status}</div>}
            </div>

            <div className="text-center text-xs text-gray-400 mt-10">
                Lernzeit-Tracker Clone v2.0 <br/>
                User: {userId.slice(0,6)}...
            </div>
        </div>
    );
};

// --- MAIN APP WRAPPER ---
export default function LernzeitTrackerReal() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Auth Init
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN || (window as any).__initial_auth_token;
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Error:", e);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // 2. Data Sync
  useEffect(() => {
    if (!user) return;

    // Sync Subjects
    const subQ = query(collection(db, 'artifacts', appId, 'users', user.uid, 'subjects'), orderBy('createdAt', 'desc'));
    const unsubSub = onSnapshot(subQ, (snap) => {
        setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
    });

    // Sync Sessions
    const sessQ = query(collection(db, 'artifacts', appId, 'users', user.uid, 'sessions'), orderBy('startTime', 'desc'));
    const unsubSess = onSnapshot(sessQ, (snap) => {
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session)));
        setLoading(false);
    });

    return () => { unsubSub(); unsubSess(); };
  }, [user]);

  if (!app) return <div className="h-screen flex items-center justify-center bg-gray-50 text-center p-8"><div className="font-bold text-gray-400">Lernzeit-Tracker Konfiguration fehlt (Firebase).<br/>Bitte .env prüfen.</div></div>;
  if (!user || loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse font-bold text-gray-400">Lernzeit-Tracker lädt...</div></div>;

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <DashboardView sessions={sessions} subjects={subjects} onStartTimer={() => setIsTimerOpen(true)} />;
      case 'units': return <UnitsView sessions={sessions} subjects={subjects} userId={user.uid} />;
      case 'subjects': return <SubjectsView subjects={subjects} sessions={sessions} userId={user.uid} />;
      case 'calendar': return <CalendarView sessions={sessions} />;
      case 'settings': return <SettingsView subjects={subjects} sessions={sessions} userId={user.uid} />;
      default: return null;
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-hidden flex flex-col relative max-w-md mx-auto shadow-2xl border-x border-gray-200">

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>

      {/* Timer Overlay */}
      {isTimerOpen && (
        <TimerView
          subjects={subjects}
          userId={user.uid}
          onClose={() => setIsTimerOpen(false)}
        />
      )}

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex justify-around items-center z-40 pb-safe">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={22} />} label="Home" />
        <NavButton active={activeTab === 'units'} onClick={() => setActiveTab('units')} icon={<List size={22} />} label="Verlauf" />

        <div className="relative -top-6">
          <button
            onClick={() => setIsTimerOpen(true)}
            className="w-14 h-14 bg-black rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            <Play size={24} className="fill-current ml-1" />
          </button>
        </div>

        <NavButton active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} icon={<BookOpen size={22} />} label="Fächer" />
        <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={22} />} label="Kalender" />
      </div>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-all duration-200 ${active ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:bg-gray-50'}`}
  >
    {icon}
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);