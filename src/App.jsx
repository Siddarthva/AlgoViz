import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Shuffle, Settings2, Code, Menu, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants & Configuration ---
// Updated color palette for Glass Cards
const THEME = {
  primary: { bg: 'bg-cyan-500/20', border: 'border-cyan-400/50', text: 'text-cyan-100', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]' },
  compare: { bg: 'bg-rose-500/30', border: 'border-rose-500', text: 'text-rose-100', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.6)]' },
  swap: { bg: 'bg-amber-400/30', border: 'border-amber-400', text: 'text-amber-100', glow: 'shadow-[0_0_30px_rgba(251,191,36,0.6)]' },
  sorted: { bg: 'bg-emerald-500/30', border: 'border-emerald-400', text: 'text-emerald-100', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.4)]' },
  default: { bg: 'bg-slate-800/40', border: 'border-white/10', text: 'text-slate-300', glow: 'shadow-none' },
  scan: { bg: 'bg-indigo-500/30', border: 'border-indigo-400', text: 'text-indigo-100', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.4)]' },
};

const ANIMATION_SPEED_MS = 400; // Slightly slower to appreciate the card movements
const SPRING_CONFIG = { type: "spring", damping: 20, stiffness: 100 }; // Bouncier physics

const ALGORITHMS = {
  BUBBLE: 'Bubble Sort',
  SELECTION: 'Selection Sort',
  INSERTION: 'Insertion Sort',
  BINARY: 'Binary Search',
};

// --- Algorithm Logic Generators (Unchanged logic, just keeping structure) ---

const generateBubbleSortSteps = (arr) => {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  let swapped;
  for (let i = 0; i < n - 1; i++) {
    swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ array: [...a], compare: [j, j + 1], swap: [], sorted: [], type: 'compare' });
      if (a[j].value > a[j + 1].value) {
        let temp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = temp;
        swapped = true;
        steps.push({ array: [...a], compare: [], swap: [j, j + 1], sorted: [], type: 'swap' });
      }
    }
    const sortedIndices = [];
    for(let k = 0; k <= i; k++) sortedIndices.push(n - 1 - k);
    steps.push({ array: [...a], compare: [], swap: [], sorted: sortedIndices, type: 'sorted' });
    if (!swapped) break;
  }
  steps.push({ array: [...a], compare: [], swap: [], sorted: a.map((_, i) => i), type: 'finish' });
  return steps;
};

const generateSelectionSortSteps = (arr) => {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      steps.push({ array: [...a], compare: [j, minIdx], swap: [], sorted: Array.from({ length: i }, (_, k) => k), scan: minIdx, type: 'compare' });
      if (a[j].value < a[minIdx].value) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      let temp = a[i];
      a[i] = a[minIdx];
      a[minIdx] = temp;
      steps.push({ array: [...a], compare: [], swap: [i, minIdx], sorted: Array.from({ length: i }, (_, k) => k), type: 'swap' });
    }
  }
  steps.push({ array: [...a], compare: [], swap: [], sorted: a.map((_, i) => i), type: 'finish' });
  return steps;
};

const generateInsertionSortSteps = (arr) => {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  for (let i = 1; i < n; i++) {
    let key = a[i];
    let j = i - 1;
    steps.push({ array: [...a], compare: [i], swap: [], sorted: Array.from({ length: i }, (_, k) => k), scan: i, type: 'select' });
    
    while (j >= 0 && a[j].value > key.value) {
      steps.push({ array: [...a], compare: [j, j + 1], swap: [], sorted: [], scan: i, type: 'compare' });
      a[j + 1] = a[j];
      steps.push({ array: [...a], compare: [], swap: [j, j + 1], sorted: [], scan: i, type: 'shift' });
      j = j - 1;
    }
    a[j + 1] = key;
    steps.push({ array: [...a], compare: [], swap: [j + 1], sorted: Array.from({ length: i + 1 }, (_, k) => k), type: 'place' });
  }
  steps.push({ array: [...a], compare: [], swap: [], sorted: a.map((_, i) => i), type: 'finish' });
  return steps;
};

const generateBinarySearchSteps = (arr, targetVal) => {
  const steps = [];
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    steps.push({ array: [...arr], compare: [mid], swap: [], sorted: [], range: { low, high, mid }, found: null, type: 'compare' });
    if (arr[mid].value === targetVal) {
      steps.push({ array: [...arr], compare: [], swap: [], sorted: [mid], range: { low, high, mid }, found: mid, type: 'found' });
      return steps;
    } else if (arr[mid].value < targetVal) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  steps.push({ array: [...arr], compare: [], swap: [], sorted: [], range: { low, high, mid: -1 }, found: -1, type: 'not-found' });
  return steps;
};

// --- Components ---

const Navbar = ({ activeAlgo, setAlgo }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 border border-white/10 shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
               <span className="text-sm font-bold text-cyan-400">AV</span>
               <div className="absolute inset-0 rounded-full bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
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
                  className={`group relative px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300
                    ${activeAlgo === key ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}
                  `}
                >
                  {label}
                  {activeAlgo === key && (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></span>
                  )}
                  <span className="absolute inset-0 rounded-md bg-white/5 opacity-0 transition-opacity group-hover:opacity-100"></span>
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
              <button
                key={key}
                onClick={() => { setAlgo(key); setIsOpen(false); }}
                className={`block w-full rounded-md px-3 py-2 text-left text-base font-medium uppercase tracking-wider ${activeAlgo === key ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const ControlPanel = ({ size, setSize, isPlaying, togglePlay, reset, randomize, customInput, setCustomInput, handleCustomInput }) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-md">
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-6 items-end">
        <div className="space-y-4 lg:col-span-4">
           <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-2"><Settings2 size={12}/> Array Size</span>
              <span className="text-cyan-400">{size}</span>
            </div>
            <input
              type="range" min="5" max="30" value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              disabled={isPlaying}
              className="h-2 w-full appearance-none rounded-lg bg-slate-800 accent-cyan-400 hover:accent-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono tracking-tight">* Automatic animation timing active.</div>
        </div>
        <div className="lg:col-span-4 w-full">
           <div className="relative group">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Custom Input</label>
              <div className="flex gap-2">
                <input 
                  type="text" value={customInput} onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="10, 5, 8, 20..." disabled={isPlaying}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] disabled:opacity-50"
                />
                <button 
                  onClick={handleCustomInput} disabled={isPlaying}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
           </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 lg:col-span-4">
          <button onClick={randomize} disabled={isPlaying} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-700 hover:text-white hover:border-white/20 hover:shadow-lg disabled:opacity-50">
            <Shuffle size={14} /> Rand
          </button>
          <button onClick={reset} disabled={isPlaying} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-700 hover:text-white hover:border-white/20 disabled:opacity-50">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={togglePlay} className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-all shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-0.5 ${isPlaying ? 'bg-amber-400 hover:bg-amber-300' : 'bg-cyan-400 hover:bg-cyan-300'}`}>
            {isPlaying ? (<><Pause size={14} fill="currentColor" /> Pause</>) : (<><Play size={14} fill="currentColor" /> Play</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

const AlgoInfo = ({ algo }) => {
  const info = {
    BUBBLE: { title: "Bubble Sort", desc: "Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.", time: "O(n²)", space: "O(1)" },
    SELECTION: { title: "Selection Sort", desc: "Divides the input list into two parts: a sorted sublist of items which is built up from left to right at the front (left) of the list and a sublist of the remaining unsorted items.", time: "O(n²)", space: "O(1)" },
    INSERTION: { title: "Insertion Sort", desc: "Builds the final sorted array (or list) one item at a time. It assumes that the first element is already sorted then picks the next element and places it into the correct position.", time: "O(n²)", space: "O(1)" },
    BINARY: { title: "Binary Search", desc: "Finds the position of a target value within a sorted array. Binary search compares the target value to the middle element of the array. If they are not equal, the half in which the target cannot lie is eliminated.", time: "O(log n)", space: "O(1)" }
  };
  const current = info[algo];
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
       <div className="col-span-2 rounded-xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-sm">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200"><Info size={16} className="text-cyan-400" /> Explanation</h3>
          <p className="text-sm leading-relaxed text-slate-400">{current.desc}</p>
       </div>
       <div className="rounded-xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Complexity</h3>
          <div className="space-y-3">
             <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-sm text-slate-400">Time (Worst)</span><span className="font-mono text-sm font-bold text-rose-400">{current.time}</span></div>
             <div className="flex justify-between"><span className="text-sm text-slate-400">Space</span><span className="font-mono text-sm font-bold text-emerald-400">{current.space}</span></div>
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
  const [size, setSize] = useState(12); // Fewer items by default for "card" look
  const [customInput, setCustomInput] = useState('');
  const [target, setTarget] = useState(null);

  const generateArray = useCallback((len = size) => {
    const newArr = Array.from({ length: len }, (_, i) => ({
        id: `bar-${i}-${Date.now()}`,
        value: Math.floor(Math.random() * 90) + 10
    }));
    if (activeAlgo === 'BINARY') {
        newArr.sort((a, b) => a.value - b.value);
    }
    setArray(newArr);
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setCustomInput('');
  }, [size, activeAlgo]);

  useEffect(() => { generateArray(); }, [generateArray]);

  const prepareAlgorithm = useCallback(() => {
    let generatedSteps = [];
    if (activeAlgo === 'BUBBLE') generatedSteps = generateBubbleSortSteps(array);
    if (activeAlgo === 'SELECTION') generatedSteps = generateSelectionSortSteps(array);
    if (activeAlgo === 'INSERTION') generatedSteps = generateInsertionSortSteps(array);
    if (activeAlgo === 'BINARY') {
        const searchTarget = array[Math.floor(Math.random() * array.length)].value;
        setTarget(searchTarget);
        generatedSteps = generateBinarySearchSteps(array, searchTarget);
    }
    setSteps(generatedSteps);
  }, [activeAlgo, array]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      if (steps.length === 0) prepareAlgorithm();
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (steps.length > 0 && prev < steps.length - 1) return prev + 1;
          else { setIsPlaying(false); return prev; }
        });
      }, ANIMATION_SPEED_MS);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps, prepareAlgorithm]);

  const currentSnapshot = steps.length > 0 ? steps[currentStep] : { 
      array: array, compare: [], swap: [], sorted: [], scan: null, range: null 
  };
  const displayArray = currentSnapshot.array;

  // --- Theme Style Logic ---
  const getCardStyle = (index, item) => {
    const isCompare = currentSnapshot.compare?.includes(index);
    const isSwap = currentSnapshot.swap?.includes(index);
    const isSorted = currentSnapshot.sorted?.includes(index);
    const isScan = currentSnapshot.scan === index;

    if (activeAlgo === 'BINARY') {
        const { range, found } = currentSnapshot;
        if (!range) return THEME.default;
        if (found === index) return THEME.sorted;
        if (index < range.low || index > range.high) return { ...THEME.default, bg: 'bg-slate-900/40', text: 'text-slate-600', border: 'border-white/5' }; // Dimmed
        if (index === range.mid) return THEME.swap;
        return THEME.default;
    }

    if (isSwap) return THEME.swap;
    if (isCompare) return THEME.compare;
    if (isSorted) return THEME.sorted;
    if (isScan) return THEME.scan;
    return THEME.default;
  };

  const handleCustomInputSubmit = () => {
      const nums = customInput.split(',').map((s, i) => {
          const val = parseInt(s.trim());
          if (isNaN(val)) return null;
          return { id: `custom-${i}-${Date.now()}`, value: val };
      }).filter(Boolean);
      if (nums.length > 0) {
          if (activeAlgo === 'BINARY') nums.sort((a,b) => a.value - b.value);
          setArray(nums);
          setSize(nums.length);
          setSteps([]);
          setCurrentStep(0);
          setIsPlaying(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200 font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-slate-800/20 blur-[80px]"></div>
      </div>

      <Navbar activeAlgo={activeAlgo} setAlgo={(a) => { setActiveAlgo(a); setIsPlaying(false); setSteps([]); setCurrentStep(0); }} />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 drop-shadow-sm">{ALGORITHMS[activeAlgo]}</h2>
                <p className="mt-1 text-sm font-medium text-cyan-500 flex items-center gap-2"><Code size={14} /> Visualization Engine Active</p>
            </div>
            {activeAlgo === 'BINARY' && (
               <div className="px-4 py-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-400 text-sm font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)] animate-pulse">
                   Target: {target !== null ? target : '???'}
               </div>
            )}
        </div>

        <ControlPanel 
            size={size} setSize={(s) => { setSize(s); generateArray(s); }}
            isPlaying={isPlaying} togglePlay={() => setIsPlaying(!isPlaying)}
            reset={() => { setIsPlaying(false); setCurrentStep(0); }}
            randomize={() => generateArray(size)}
            customInput={customInput} setCustomInput={setCustomInput} handleCustomInput={handleCustomInputSubmit}
        />

        <div className="mt-8 relative min-h-[450px] w-full rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-2xl backdrop-blur-md flex flex-col justify-end overflow-hidden">
            <div className="absolute top-4 right-4 flex flex-col gap-2 p-3 rounded-lg bg-black/40 border border-white/5 backdrop-blur-sm text-[10px] uppercase font-bold tracking-wider z-20">
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${THEME.compare.bg.split(' ')[0]} ${THEME.compare.border.split(' ')[0]} border`}></div> Compare</div>
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${THEME.swap.bg.split(' ')[0]} ${THEME.swap.border.split(' ')[0]} border`}></div> Swap / Active</div>
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${THEME.sorted.bg.split(' ')[0]} ${THEME.sorted.border.split(' ')[0]} border`}></div> Sorted</div>
            </div>

            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            {/* CARD CONTAINER */}
            <div className="relative z-10 flex h-[400px] w-full items-end justify-center gap-2 sm:gap-4 px-2">
                <AnimatePresence>
                {displayArray.map((item, idx) => {
                    const heightPercent = Math.max((item.value / 100) * 100, 15); // Min height to fit text
                    const theme = getCardStyle(idx, item);
                    
                    return (
                        <motion.div 
                           key={item.id}
                           layout 
                           transition={SPRING_CONFIG}
                           className="flex-1 max-w-[80px] h-full flex items-end justify-center relative"
                        >
                            {/* The Floating Glass Card */}
                            <motion.div 
                                animate={{ 
                                    height: `${heightPercent}%`,
                                    borderColor: theme.border.replace('border-', ''), // Framer can't animate Tailwind classes well, but we can rely on re-render for class updates mostly
                                }}
                                className={`
                                    w-full rounded-xl backdrop-blur-md border border-t-2 shadow-lg transition-colors duration-300
                                    flex flex-col items-center justify-start overflow-hidden relative group
                                    ${theme.bg} ${theme.border} ${theme.glow}
                                `}
                            >
                                {/* Inner Gloss Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none"></div>
                                
                                {/* Value Number */}
                                <div className={`
                                    mt-2 sm:mt-4 z-10 font-mono text-lg sm:text-2xl font-bold tracking-tighter drop-shadow-md
                                    ${theme.text}
                                `}>
                                    {item.value}
                                </div>

                                {/* Decorative Bar at bottom of card */}
                                <div className={`absolute bottom-0 w-full h-1 sm:h-2 opacity-50 ${theme.text.replace('text-', 'bg-')}`}></div>
                            </motion.div>
                            
                            {/* Binary Search Indicators */}
                            {activeAlgo === 'BINARY' && currentSnapshot.range && (
                                <>
                                    {idx === currentSnapshot.range.low && <motion.div layoutId="ptr-low" className="absolute -bottom-8 px-2 py-1 rounded bg-cyan-900/80 border border-cyan-500/50 text-cyan-400 text-[10px] uppercase font-bold">Low</motion.div>}
                                    {idx === currentSnapshot.range.high && <motion.div layoutId="ptr-high" className="absolute -bottom-8 px-2 py-1 rounded bg-cyan-900/80 border border-cyan-500/50 text-cyan-400 text-[10px] uppercase font-bold">High</motion.div>}
                                    {idx === currentSnapshot.range.mid && <motion.div layoutId="ptr-mid" className="absolute -bottom-8 px-2 py-1 rounded bg-amber-900/80 border border-amber-500/50 text-amber-400 text-[10px] uppercase font-bold shadow-lg">Mid</motion.div>}
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