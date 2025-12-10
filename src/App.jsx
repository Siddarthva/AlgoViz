import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Shuffle, Settings2, Code, Menu, X, Info, AlertCircle, CheckCircle2, Volume2, VolumeX, GraduationCap, BrainCircuit, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants & Configuration ---
const THEME = {
  primary: { bg: 'bg-cyan-500/20', border: 'border-cyan-400/50', text: 'text-cyan-100', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]' },
  compare: { bg: 'bg-rose-500/30', border: 'border-rose-500', text: 'text-rose-100', glow: 'shadow-[0_0_35px_rgba(244,63,94,0.7)]' },
  swap: { bg: 'bg-amber-400/30', border: 'border-amber-400', text: 'text-amber-100', glow: 'shadow-[0_0_35px_rgba(251,191,36,0.7)]' },
  sorted: { bg: 'bg-emerald-500/30', border: 'border-emerald-400', text: 'text-emerald-100', glow: 'shadow-[0_0_25px_rgba(52,211,153,0.5)]' },
  default: { bg: 'bg-slate-800/40', border: 'border-white/10', text: 'text-slate-300', glow: 'shadow-none' },
  scan: { bg: 'bg-indigo-500/30', border: 'border-indigo-400', text: 'text-indigo-100', glow: 'shadow-[0_0_25px_rgba(99,102,241,0.5)]' },
};

// Animation Configurations
const SPEEDS = {
  DEFAULT: 350,
  BINARY: 1000,
  TEACHING: 6600 // Tripled: Very slow speed to allow full speech + visual processing
};

const SPRING_CONFIG_DEFAULT = { type: "spring", damping: 25, stiffness: 120, mass: 0.8 };
const SPRING_CONFIG_TEACHING = { type: "spring", damping: 35, stiffness: 60, mass: 1 }; // Slower, relaxed spring

const GLIDE_CONFIG = { type: "spring", damping: 30, stiffness: 80, mass: 1.2 };

const ALGORITHMS = {
  BUBBLE: 'Bubble Sort',
  SELECTION: 'Selection Sort',
  INSERTION: 'Insertion Sort',
  BINARY: 'Binary Search',
};

const QUIZ_DATA = {
  BUBBLE: [
    { q: "What is the worst-case time complexity of Bubble Sort?", options: ["O(n)", "O(n²)", "O(log n)"], correct: 1 },
    { q: "After the first pass, where is the largest element?", options: ["At the beginning", "At the end", "In the middle"], correct: 1 }
  ],
  SELECTION: [
    { q: "What does Selection Sort search for in each pass?", options: ["The minimum value", "The median value", "The maximum value"], correct: 0 },
    { q: "Does Selection Sort assume part of the array is sorted?", options: ["Yes, the left side", "No", "Only on Sundays"], correct: 0 }
  ],
  INSERTION: [
    { q: "How does Insertion Sort handle new elements?", options: ["Swaps randomly", "Inserts into sorted sub-list", "Appends to end"], correct: 1 },
    { q: "Best case complexity (already sorted)?", options: ["O(n)", "O(n²)", "O(1)"], correct: 0 }
  ],
  BINARY: [
    { q: "What is required for Binary Search to work?", options: ["Random data", "Sorted data", "Unique numbers"], correct: 1 },
    { q: "If target > mid, which half is discarded?", options: ["The right half", "The left half", "Neither"], correct: 1 }
  ]
};

// Height Scaling Configuration
const BASE_HEIGHT_PX = 80;
const HEIGHT_MULTIPLIER = 3.5;
const calculateHeight = (value) => `${BASE_HEIGHT_PX + Math.min(value, 100) * HEIGHT_MULTIPLIER}px`;

// --- TTS Helper ---
const speak = (text) => {
  if (!window.speechSynthesis) return;
  // Note: We handle the main cancel() logic in the effect for the delay, 
  // but keeping it here adds a layer of safety.
  window.speechSynthesis.cancel(); 
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9; 
  utterance.pitch = 1.0;
  // Try to select a "Google US English" or similar standard voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.name.includes("Google US English")) || voices[0];
  if (preferredVoice) utterance.voice = preferredVoice;
  window.speechSynthesis.speak(utterance);
};

// --- Algorithm Logic Generators ---

const generateBubbleSortSteps = (arr) => {
  const steps = [];
  const a = arr.map(item => ({...item}));
  const snapshot = (curr) => curr.map(item => ({...item}));
  const n = a.length;
  let swapped;
  for (let i = 0; i < n - 1; i++) {
    swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ 
        array: snapshot(a), compare: [j, j + 1], swap: [], sorted: [], type: 'compare',
        narration: `Comparing ${a[j].value} and ${a[j+1].value}.` 
      });
      if (a[j].value > a[j + 1].value) {
        let temp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = temp;
        swapped = true;
        steps.push({ 
          array: snapshot(a), compare: [], swap: [j, j + 1], sorted: [], type: 'swap',
          narration: `${a[j+1].value} is smaller, so swapping them.` 
        });
      }
    }
    const sortedIndices = [];
    for(let k = 0; k <= i; k++) sortedIndices.push(n - 1 - k);
    steps.push({ 
      array: snapshot(a), compare: [], swap: [], sorted: sortedIndices, type: 'sorted',
      narration: `Element ${a[n-1-i].value} is now locked in its final sorted position.` 
    });
    if (!swapped) break;
  }
  steps.push({ 
    array: snapshot(a), compare: [], swap: [], sorted: a.map((_, i) => i), type: 'finish',
    narration: "The array is completely sorted." 
  });
  return steps;
};

const generateSelectionSortSteps = (arr) => {
  const steps = [];
  const a = arr.map(item => ({...item}));
  const snapshot = (curr) => curr.map(item => ({...item}));
  const n = a.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    steps.push({ 
        array: snapshot(a), compare: [], swap: [], sorted: Array.from({ length: i }, (_, k) => k), scan: minIdx, type: 'scan',
        narration: `Starting pass ${i + 1}. Current minimum is ${a[minIdx].value}.` 
    });
    for (let j = i + 1; j < n; j++) {
      steps.push({ 
        array: snapshot(a), compare: [j, minIdx], swap: [], sorted: Array.from({ length: i }, (_, k) => k), scan: minIdx, type: 'compare',
        narration: `Comparing ${a[j].value} with minimum ${a[minIdx].value}.` 
      });
      if (a[j].value < a[minIdx].value) {
        minIdx = j;
        steps.push({ 
            array: snapshot(a), compare: [j], swap: [], sorted: Array.from({ length: i }, (_, k) => k), scan: minIdx, type: 'found-min',
            narration: `Found new minimum: ${a[minIdx].value}.` 
        });
      }
    }
    if (minIdx !== i) {
      let temp = a[i];
      a[i] = a[minIdx];
      a[minIdx] = temp;
      steps.push({ 
        array: snapshot(a), compare: [], swap: [i, minIdx], sorted: Array.from({ length: i }, (_, k) => k), type: 'swap',
        narration: `Swapping ${a[i].value} to the sorted partition.` 
      });
    }
  }
  steps.push({ array: snapshot(a), compare: [], swap: [], sorted: a.map((_, i) => i), type: 'finish', narration: "Sorting complete." });
  return steps;
};

const generateInsertionSortSteps = (arr) => {
  const steps = [];
  const a = arr.map(item => ({...item}));
  const snapshot = (curr) => curr.map(item => ({...item}));
  const n = a.length;
  for (let i = 1; i < n; i++) {
    steps.push({ 
        array: snapshot(a), compare: [i], swap: [], sorted: Array.from({ length: i }, (_, k) => k), scan: i, type: 'select',
        narration: `Taking ${a[i].value} to insert into the sorted left side.` 
    });
    let j = i - 1;
    let currentIdx = i;
    while (j >= 0 && a[j].value > a[currentIdx].value) {
      steps.push({ 
          array: snapshot(a), compare: [j, currentIdx], swap: [], sorted: [], scan: currentIdx, type: 'compare',
          narration: `${a[j].value} is larger, so we shift it right.` 
      });
      let temp = a[j];
      a[j] = a[currentIdx];
      a[currentIdx] = temp;
      steps.push({ 
          array: snapshot(a), compare: [], swap: [j, currentIdx], sorted: [], scan: j, type: 'swap',
          narration: `Moved ${temp.value} forward.` 
      });
      currentIdx = j;
      j = j - 1;
    }
    steps.push({ 
        array: snapshot(a), compare: [], swap: [], sorted: Array.from({ length: i + 1 }, (_, k) => k), type: 'place',
        narration: `Inserted ${a[currentIdx].value} correctly.` 
    });
  }
  steps.push({ array: snapshot(a), compare: [], swap: [], sorted: a.map((_, i) => i), type: 'finish', narration: "All elements inserted." });
  return steps;
};

const generateBinarySearchSteps = (arr, targetVal) => {
  const steps = [];
  const snapshot = (curr) => curr.map(item => ({...item}));
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    steps.push({ 
        array: snapshot(arr), compare: [mid], swap: [], sorted: [], range: { low, high, mid }, found: null, type: 'compare',
        narration: `Checking Middle index ${mid}. Value is ${arr[mid].value}.` 
    });
    if (arr[mid].value === targetVal) {
      steps.push({ 
          array: snapshot(arr), compare: [], swap: [], sorted: [mid], range: { low, high, mid }, found: mid, type: 'found',
          narration: `Match found! Target is at index ${mid}.` 
      });
      return steps;
    } else if (arr[mid].value < targetVal) {
      low = mid + 1;
      steps.push({ 
        array: snapshot(arr), compare: [], swap: [], sorted: [], range: { low, high, mid }, found: null, type: 'eliminate-left',
        narration: `${arr[mid].value} is smaller than target ${targetVal}. Eliminating the left half.` 
      });
    } else {
      high = mid - 1;
      steps.push({ 
        array: snapshot(arr), compare: [], swap: [], sorted: [], range: { low, high, mid }, found: null, type: 'eliminate-right',
        narration: `${arr[mid].value} is larger than target ${targetVal}. Eliminating the right half.` 
      });
    }
  }
  steps.push({ array: snapshot(arr), compare: [], swap: [], sorted: [], range: { low, high, mid: -1 }, found: -1, type: 'not-found', narration: "Search range exhausted. Target not found." });
  return steps;
};

// --- Components ---

const QuizModal = ({ algo, onClose }) => {
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [questionData] = useState(() => {
    const questions = QUIZ_DATA[algo] || QUIZ_DATA['BUBBLE'];
    return questions[Math.floor(Math.random() * questions.length)];
  });

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === questionData.correct;
    setIsCorrect(correct);
    setTimeout(onClose, correct ? 4000 : 5000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
             <BrainCircuit className="text-cyan-400" size={24} />
             <h3 className="text-lg font-bold text-white uppercase tracking-wider">Quick Quiz</h3>
          </div>
          <p className="text-slate-300 mb-6 font-medium">{questionData.q}</p>
          <div className="space-y-3">
            {questionData.options.map((opt, idx) => {
              let stateClass = "border-white/10 hover:bg-slate-800 text-slate-300";
              if (selected === idx) {
                stateClass = isCorrect 
                  ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
                  : "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
              } else if (selected !== null && idx === questionData.correct) {
                 stateClass = "border-green-500 bg-green-500/10 text-green-400 opacity-50";
              }

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  animate={selected === idx ? (isCorrect ? { scale: [1, 1.02, 1] } : { x: [0, -5, 5, 0] }) : {}}
                  className={`w-full text-left p-3 rounded-lg border font-medium transition-all ${stateClass}`}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
          {selected !== null && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`mt-4 flex items-center gap-2 text-sm font-bold uppercase ${isCorrect ? 'text-green-400' : 'text-red-400'}`}
            >
               {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
               {isCorrect ? "Correct! Well done." : "Not quite right."}
            </motion.div>
          )}
        </div>
        {selected === null && (
             <div className="h-1 bg-slate-800 w-full">
                 <motion.div 
                    initial={{ width: "100%" }} 
                    animate={{ width: "0%" }} 
                    transition={{ duration: 10, ease: "linear" }} 
                    onAnimationComplete={onClose}
                    className="h-full bg-cyan-500" 
                 />
             </div>
        )}
      </div>
    </motion.div>
  );
};

const Navbar = ({ activeAlgo, setAlgo }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 border border-white/10 shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
               <span className="text-sm font-bold text-cyan-400">AV</span>
            </div>
            <div className="h-6 w-[1px] bg-white/10"></div>
            <h1 className="hidden md:block text-lg font-bold tracking-wider text-slate-100 uppercase">
              Algo<span className="text-cyan-400">Viz</span>
            </h1>
          </div>
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-1">
              {Object.entries(ALGORITHMS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setAlgo(key)}
                  className={`group relative px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeAlgo === key ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {label}
                  {activeAlgo === key && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></span>}
                </button>
              ))}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:text-white focus:outline-none">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden border-b border-white/5 bg-slate-900/95 backdrop-blur-xl">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {Object.entries(ALGORITHMS).map(([key, label]) => (
              <button key={key} onClick={() => { setAlgo(key); setIsOpen(false); }} className={`block w-full rounded-md px-3 py-2 text-left text-base font-medium uppercase tracking-wider ${activeAlgo === key ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const ControlPanel = ({ 
  size, setSize, isPlaying, togglePlay, reset, randomize, 
  customInput, setCustomInput, handleCustomInput, 
  customTargetInput, setCustomTargetInput,
  activeAlgo, isBinaryReady, binaryNotification,
  isTeachingMode, toggleTeachingMode
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-md">
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-6 items-end">
        {/* Toggle Teaching Mode */}
        <div className="lg:col-span-3">
           <button
             onClick={toggleTeachingMode}
             className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-all ${isTeachingMode ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : 'bg-slate-950 border-white/10 text-slate-400 hover:border-white/20'}`}
           >
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
               <GraduationCap size={16} /> Teaching Mode
             </div>
             <div className={`w-8 h-4 rounded-full relative transition-colors ${isTeachingMode ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isTeachingMode ? 'left-4.5' : 'left-0.5'}`} style={{ left: isTeachingMode ? '18px' : '2px' }}></div>
             </div>
           </button>
        </div>

        {activeAlgo !== 'BINARY' && (
          <div className="space-y-4 lg:col-span-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-2"><Settings2 size={12}/> Array Size</span>
                <span className="text-cyan-400">{size}</span>
              </div>
              <input
                type="range" min="5" max="30" value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                disabled={isPlaying}
                className="h-2 w-full appearance-none rounded-lg bg-slate-800 accent-cyan-400 hover:accent-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeAlgo === 'BINARY' && (
          <div className="lg:col-span-3 flex items-center h-full pb-2">
            {binaryNotification ? (
               <div className="flex items-center gap-2 text-amber-400 bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-500/20">
                 <AlertCircle size={16} /> <span className="text-xs font-bold uppercase tracking-wide truncate">{binaryNotification}</span>
               </div>
            ) : (
               <div className="flex items-center gap-2 text-slate-500 px-3 py-2">
                 <Info size={16} /> <span className="text-xs">Enter inputs to start</span>
               </div>
            )}
          </div>
        )}

        <div className="lg:col-span-3 w-full space-y-3">
           <div className="relative group">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">{activeAlgo === 'BINARY' ? 'Array (Comma Sep)' : 'Custom Input'}</label>
              <div className="flex gap-2">
                <input 
                  type="text" value={customInput} onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={activeAlgo === 'BINARY' ? "e.g. 1, 3, 5, 8, 12" : "10, 5, 8, 20..."}
                  disabled={isPlaying}
                  className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${activeAlgo === 'BINARY' && !isBinaryReady ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'}`}
                />
                {activeAlgo !== 'BINARY' && (
                  <button 
                    onClick={handleCustomInput} disabled={isPlaying}
                    className="rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wider transition-all border bg-slate-800 text-slate-300 hover:bg-slate-700 border-white/5 disabled:opacity-50"
                  >
                    Set
                  </button>
                )}
              </div>
           </div>

           {activeAlgo === 'BINARY' && (
              <div className="relative group">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Target Element</label>
                <div className="flex gap-2">
                  <input 
                    type="number" value={customTargetInput} onChange={(e) => setCustomTargetInput(e.target.value)}
                    placeholder="e.g. 5"
                    disabled={isPlaying}
                    className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${!isBinaryReady ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'}`}
                  />
                  <button 
                    onClick={handleCustomInput} disabled={isPlaying}
                    className="rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wider transition-all border bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-400 disabled:opacity-50"
                  >
                    Set
                  </button>
                </div>
              </div>
           )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 lg:col-span-3">
          {activeAlgo !== 'BINARY' && (
            <button onClick={randomize} disabled={isPlaying} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50">
              <Shuffle size={14} /> Rand
            </button>
          )}
          <button onClick={reset} disabled={isPlaying} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50">
            <RotateCcw size={14} /> Reset
          </button>
          <button 
            onClick={togglePlay} 
            disabled={activeAlgo === 'BINARY' && !isBinaryReady}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-all shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none ${isPlaying ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/25' : 'bg-cyan-400 hover:bg-cyan-300 shadow-cyan-500/25'}`}
          >
            {isPlaying ? (<><Pause size={14} fill="currentColor" /> Pause</>) : (<><Play size={14} fill="currentColor" /> Play</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

const AlgoInfo = ({ algo }) => {
  const info = {
    BUBBLE: { title: "Bubble Sort", desc: "Bubble Sort makes passes through the array, comparing adjacent items and swapping them if they are in the wrong order.", time: "O(n²)", space: "O(1)" },
    SELECTION: { title: "Selection Sort", desc: "Selection Sort divides the list into sorted and unsorted parts. It repeatedly finds the minimum element from the unsorted part.", time: "O(n²)", space: "O(1)" },
    INSERTION: { title: "Insertion Sort", desc: "Insertion Sort builds the final sorted array one item at a time. It takes an element and inserts it into its correct position.", time: "O(n²)", space: "O(1)" },
    BINARY: { title: "Binary Search", desc: "Binary Search finds a target in a sorted array by repeatedly dividing the search interval in half. It is extremely efficient.", time: "O(log n)", space: "O(1)" }
  };
  const current = info[algo];
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
       <div className="col-span-2 rounded-xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-sm">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200"><Info size={16} className="text-cyan-400" /> Key Takeaways</h3>
          <ul className="list-disc list-inside text-sm leading-relaxed text-slate-400 space-y-1">
             <li>{current.desc}</li>
             <li>Useful for understanding fundamental algorithmic thinking.</li>
          </ul>
       </div>
       <div className="rounded-xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Performance</h3>
          <div className="space-y-3">
             <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-sm text-slate-400">Time Complexity</span><span className="font-mono text-sm font-bold text-rose-400">{current.time}</span></div>
             <div className="flex justify-between"><span className="text-sm text-slate-400">Space Complexity</span><span className="font-mono text-sm font-bold text-emerald-400">{current.space}</span></div>
          </div>
       </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [activeAlgo, setActiveAlgo] = useState('BUBBLE');
  const [array, setArray] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [size, setSize] = useState(12);
  const [customInput, setCustomInput] = useState('');
  const [customTargetInput, setCustomTargetInput] = useState('');
  
  // Teaching & Quiz State
  const [isTeachingMode, setIsTeachingMode] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const speechTimeout = useRef(null);
  
  // Binary Search State
  const [target, setTarget] = useState(null);
  const [isBinaryReady, setIsBinaryReady] = useState(false);
  const [binaryNotification, setBinaryNotification] = useState('');

  const generateArray = useCallback((len = size) => {
    if (activeAlgo === 'BINARY') {
        setArray([]);
        setSteps([]);
        setCurrentStep(0);
        setIsPlaying(false);
        setCustomInput('');
        setCustomTargetInput('');
        setIsBinaryReady(false);
        setBinaryNotification('');
        setTarget(null);
        setShowQuiz(false);
        return;
    }

    const newArr = Array.from({ length: len }, (_, i) => ({
        id: `bar-${i}-${Date.now()}`,
        value: Math.floor(Math.random() * 90) + 10
    }));
    setArray(newArr);
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setCustomInput('');
    setShowQuiz(false);
  }, [size, activeAlgo]);

  useEffect(() => { generateArray(); }, [generateArray]);

  const prepareAlgorithm = useCallback(() => {
    let generatedSteps = [];
    if (activeAlgo === 'BUBBLE') generatedSteps = generateBubbleSortSteps(array);
    if (activeAlgo === 'SELECTION') generatedSteps = generateSelectionSortSteps(array);
    if (activeAlgo === 'INSERTION') generatedSteps = generateInsertionSortSteps(array);
    if (activeAlgo === 'BINARY') {
        if (target === null) return;
        generatedSteps = generateBinarySearchSteps(array, target);
    }
    setSteps(generatedSteps);
  }, [activeAlgo, array, target]);

  // Handle Teaching Mode Toggle Cleanup
  useEffect(() => {
    if (!isTeachingMode) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (speechTimeout.current) clearTimeout(speechTimeout.current);
    }
  }, [isTeachingMode]);

  // Animation Loop
  useEffect(() => {
    let interval;
    if (isPlaying) {
      if (steps.length === 0) prepareAlgorithm();
      
      // Determine Speed
      let speed = activeAlgo === 'BINARY' ? SPEEDS.BINARY : SPEEDS.DEFAULT;
      if (isTeachingMode) speed = SPEEDS.TEACHING;
      
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (steps.length > 0 && prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            if (isTeachingMode) {
                // Short delay before showing quiz
                setTimeout(() => setShowQuiz(true), 1000);
            }
            return prev;
          }
        });
      }, speed);
    } else {
        // Stop speaking if paused
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (speechTimeout.current) clearTimeout(speechTimeout.current);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps, prepareAlgorithm, activeAlgo, isTeachingMode]);

  // Narration Effect with Sequential Delay
  useEffect(() => {
    if (speechTimeout.current) clearTimeout(speechTimeout.current);

    if (isPlaying && isTeachingMode && steps[currentStep]?.narration) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        speechTimeout.current = setTimeout(() => {
             speak(steps[currentStep].narration);
        }, 1350); // Tripled from 450
    }
    return () => {
        if (speechTimeout.current) clearTimeout(speechTimeout.current);
    };
  }, [currentStep, isPlaying, isTeachingMode, steps]);


  const currentSnapshot = steps.length > 0 ? steps[currentStep] : { 
      array: array, compare: [], swap: [], sorted: [], scan: null, range: null, narration: "Ready to start."
  };
  const displayArray = currentSnapshot.array;

  // --- Theme Style Logic ---
  const getCardStyle = (index, item) => {
    const isCompare = currentSnapshot.compare?.includes(index);
    const isSwap = currentSnapshot.swap?.includes(index);
    const isSorted = currentSnapshot.sorted?.includes(index);
    const isScan = currentSnapshot.scan === index;

    let baseTheme = THEME.default;
    let lift = 0;

    if (activeAlgo === 'BINARY') {
        const { range, found } = currentSnapshot;
        if (!range) return { ...THEME.default, lift: 0 };
        if (index < range.low || index > range.high) {
            return { ...THEME.default, bg: 'bg-slate-900/40', text: 'text-slate-600', border: 'border-white/5', lift: 0 };
        }
        if (found === index) return { ...THEME.sorted, lift: 20 };
        if (index === range.mid) return { ...THEME.swap, lift: 15 };
        return { ...THEME.default, lift: 0 };
    }

    if (isSwap) { baseTheme = THEME.swap; lift = 20; }
    else if (isCompare) { baseTheme = THEME.compare; lift = 15; }
    else if (isSorted) { baseTheme = THEME.sorted; lift = 0; }
    else if (isScan) { baseTheme = THEME.scan; lift = 10; }

    return { ...baseTheme, lift };
  };

  const handleCustomInputSubmit = () => {
      const nums = customInput.split(',').map((s, i) => {
          const val = parseInt(s.trim());
          if (isNaN(val)) return null;
          return { id: `custom-${i}-${Date.now()}`, value: val };
      }).filter(Boolean);

      if (nums.length > 0) {
          if (activeAlgo === 'BINARY') {
             // Parse Manual Target
             const manualTarget = parseInt(customTargetInput.trim());
             if (isNaN(manualTarget)) {
                 setBinaryNotification('Please enter a numeric target.');
                 return;
             }

            const isSorted = nums.every((val, i, arr) => !i || (arr[i-1].value <= val.value));
            if (!isSorted) {
                nums.sort((a,b) => a.value - b.value);
                setBinaryNotification('Input sorted automatically.');
            } else {
                setBinaryNotification('Array & Target set.');
            }
            
            // Set the manual target instead of random
            setTarget(manualTarget);
            setIsBinaryReady(true);
          }
          setArray(nums);
          setSize(nums.length);
          setSteps([]);
          setCurrentStep(0);
          setIsPlaying(false);
          setShowQuiz(false);
      }
  };

  const springConfig = isTeachingMode ? SPRING_CONFIG_TEACHING : SPRING_CONFIG_DEFAULT;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200 font-sans relative overflow-x-hidden">
      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && <QuizModal algo={activeAlgo} onClose={() => setShowQuiz(false)} />}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-slate-800/20 blur-[80px]"></div>
      </div>

      <Navbar activeAlgo={activeAlgo} setAlgo={(a) => { setActiveAlgo(a); setIsPlaying(false); setSteps([]); setCurrentStep(0); setShowQuiz(false); }} />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 drop-shadow-sm">{ALGORITHMS[activeAlgo]}</h2>
                <p className="mt-1 text-sm font-medium text-cyan-500 flex items-center gap-2"><Code size={14} /> Visualization Engine Active</p>
            </div>
            {activeAlgo === 'BINARY' && target !== null && isBinaryReady && (
               <div className="px-6 py-3 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                   <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Target Value</span>
                   <span className="text-cyan-400 text-xl font-bold font-mono">{target}</span>
               </div>
            )}
        </div>

        <ControlPanel 
            size={size} setSize={(s) => { setSize(s); generateArray(s); }}
            isPlaying={isPlaying} togglePlay={() => setIsPlaying(!isPlaying)}
            reset={() => { setIsPlaying(false); setCurrentStep(0); setShowQuiz(false); }}
            randomize={() => generateArray(size)}
            customInput={customInput} setCustomInput={setCustomInput} handleCustomInput={handleCustomInputSubmit}
            customTargetInput={customTargetInput} setCustomTargetInput={setCustomTargetInput}
            activeAlgo={activeAlgo} isBinaryReady={isBinaryReady} binaryNotification={binaryNotification}
            isTeachingMode={isTeachingMode} toggleTeachingMode={() => setIsTeachingMode(!isTeachingMode)}
        />

        <div className="mt-8 relative min-h-[500px] w-full rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-2xl backdrop-blur-md flex flex-col justify-end overflow-hidden">
            {/* Teaching Explanation Box */}
            <AnimatePresence>
                {isTeachingMode && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-4 left-4 right-4 z-40 bg-indigo-950/80 border border-indigo-500/50 backdrop-blur-md rounded-lg p-4 shadow-lg flex items-start gap-3"
                    >
                        <div className="p-2 bg-indigo-500/20 rounded-full">
                            {isPlaying ? <Volume2 size={20} className="text-indigo-300 animate-pulse" /> : <VolumeX size={20} className="text-slate-500" />}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Teaching Mode Active</h4>
                            <p className="text-indigo-100 font-medium text-sm leading-relaxed">
                                {currentSnapshot.narration || "Ready to explain step-by-step."}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] uppercase font-bold tracking-wider z-20 opacity-70">
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${THEME.compare.bg.split(' ')[0]} ${THEME.compare.border.split(' ')[0]} border`}></div> Compare</div>
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${THEME.swap.bg.split(' ')[0]} ${THEME.swap.border.split(' ')[0]} border`}></div> Swap</div>
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${THEME.sorted.bg.split(' ')[0]} ${THEME.sorted.border.split(' ')[0]} border`}></div> Sorted</div>
            </div>

            {/* CARD CONTAINER */}
            <div className="relative z-10 flex h-[450px] w-full items-end justify-center gap-2 sm:gap-3 px-2 pb-12">
                <AnimatePresence>
                {displayArray.map((item, idx) => {
                    const theme = getCardStyle(idx, item);
                    const calculatedHeight = calculateHeight(item.value);
                    
                    return (
                        <motion.div 
                           key={item.id}
                           layout 
                           transition={springConfig}
                           initial={{ opacity: 0, y: 50 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="flex-1 max-w-[80px] h-full flex items-end justify-center relative"
                        >
                            <motion.div 
                                animate={{ 
                                    height: calculatedHeight,
                                    y: -theme.lift, 
                                    borderColor: theme.border.replace('border-', ''), 
                                }}
                                className={`w-full rounded-xl backdrop-blur-md border border-t-2 transition-colors duration-500 flex flex-col items-center justify-start overflow-hidden relative group ${theme.bg} ${theme.border} ${theme.glow}`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-40 pointer-events-none"></div>
                                <div className={`mt-3 z-10 font-mono text-lg sm:text-2xl font-bold tracking-tighter drop-shadow-md ${theme.text}`}>
                                    {item.value}
                                </div>
                                <div className={`absolute bottom-0 w-full h-1 sm:h-2 opacity-60 ${theme.text.replace('text-', 'bg-')}`}></div>
                            </motion.div>
                            
                            {activeAlgo === 'BINARY' && currentSnapshot.range && (
                                <>
                                    {idx === currentSnapshot.range.low && (
                                        <motion.div layoutId="ptr-low" transition={GLIDE_CONFIG} className="absolute -bottom-10 flex flex-col items-center z-30">
                                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-cyan-400 mb-1"></div>
                                            <div className="px-2 py-1 rounded bg-cyan-900/90 border border-cyan-500/50 text-cyan-200 text-[10px] uppercase font-bold shadow-lg whitespace-nowrap">Low</div>
                                        </motion.div>
                                    )}
                                    {idx === currentSnapshot.range.high && (
                                        <motion.div layoutId="ptr-high" transition={GLIDE_CONFIG} className="absolute -bottom-10 flex flex-col items-center z-30">
                                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-cyan-400 mb-1"></div>
                                            <div className="px-2 py-1 rounded bg-cyan-900/90 border border-cyan-500/50 text-cyan-200 text-[10px] uppercase font-bold shadow-lg whitespace-nowrap">High</div>
                                        </motion.div>
                                    )}
                                    {idx === currentSnapshot.range.mid && (
                                        <motion.div layoutId="ptr-mid" transition={GLIDE_CONFIG} className="absolute -bottom-16 flex flex-col items-center z-40">
                                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-amber-400 mb-1"></div>
                                            <div className="px-3 py-1.5 rounded-md bg-amber-900/90 border border-amber-500 text-amber-300 text-xs uppercase font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)] whitespace-nowrap">Mid</div>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </div>
        </div>
        <AlgoInfo algo={activeAlgo} />
      </main>
    </div>
  );
};

export default App;