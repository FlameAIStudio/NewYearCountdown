
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import FireworksCanvas, { FireworksHandle } from './components/FireworksCanvas';
import CountdownDigit from './components/CountdownDigit';
import NewYearMessage from './components/NewYearMessage';
import { CountdownState } from './types';
import { decodeBase64, decodeAudioData, createProceduralClick, createProceduralBell } from './utils/audio';

const App: React.FC = () => {
  const [state, setState] = useState<CountdownState>('waiting');
  const [seconds, setSeconds] = useState(10);
  const [progress, setProgress] = useState(0);
  const [loadingTask, setLoadingTask] = useState('');
  const [activeSparklers, setActiveSparklers] = useState(false);

  const fireworksRef = useRef<FireworksHandle>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<{ [key: string]: AudioBuffer }>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const prepareAssets = async () => {
    setState('preparing');
    setProgress(0);
    
    // 初始化 AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;

    const tasks = [
      { id: 'click', prompt: 'Subtle mechanical click haptic sound.' },
      { id: 'bell', prompt: 'Pure, deep, massive bronze church bell toll.' }
    ];

    let completedCount = 0;

    for (const task of tasks) {
      if (ctx.state === 'suspended') await ctx.resume();
      setLoadingTask(task.id === 'click' ? 'Syncing Haptics...' : 'Tuning Bell Resonance...');

      // 优化：静默处理 Quota 限制。如果 API 失败，立即采用本地物理建模合成
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: task.prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { 
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } 
            },
          },
        });

        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
          audioBuffersRef.current[task.id] = await decodeAudioData(decodeBase64(base64), ctx);
        } else {
          throw new Error('No data');
        }
      } catch (err) {
        // 静默降级：API 报错（如 429 Quota Exceeded）时直接使用本地合成音，不弹出任何 UI
        console.warn(`Gemini API skipped for ${task.id}, using local high-fidelity synthesizer.`);
        if (task.id === 'click') {
          audioBuffersRef.current['click'] = createProceduralClick(ctx);
        } else {
          audioBuffersRef.current['bell'] = createProceduralBell(ctx);
        }
      }

      completedCount++;
      setProgress(Math.round((completedCount / tasks.length) * 100));
      await delay(400); 
    }

    setLoadingTask('All Assets Ready');
    await delay(300);
    setState('counting');
  };

  const playSound = (type: 'click' | 'bell') => {
    const ctx = audioContextRef.current;
    const buffer = audioBuffersRef.current[type];
    if (ctx && buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = ctx.createGain();
      // 物理建模的钟声音质极佳，2.0 增益即可达到厚重效果
      gainNode.gain.value = type === 'bell' ? 2.0 : 0.6; 
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();
    }
  };

  useEffect(() => {
    if (state === 'counting') {
      playSound('click');
      if (seconds <= 3 || seconds % 2 === 0) {
        fireworksRef.current?.trigger(false);
      }
    } else if (state === 'celebrating') {
      playSound('bell');
      // 史诗级开场烟花：通过数量级而非滤镜来营造高级感
      for(let i = 0; i < 40; i++) {
        setTimeout(() => fireworksRef.current?.trigger(Math.random() < 0.4), i * 120);
      }
    }
  }, [seconds, state]);

  useEffect(() => {
    if (state === 'counting') {
      setActiveSparklers(true);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setState('celebrating');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === 'celebrating') {
      interval = setInterval(() => {
        fireworksRef.current?.trigger(Math.random() < 0.3);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div className="relative min-h-screen w-full bg-[#020617] overflow-hidden flex items-center justify-center select-none">
      {/* 极简深邃星空背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#1e1b4b_0%,_#0f172a_50%,_#020617_100%)] opacity-95" />
      
      <FireworksCanvas 
        ref={fireworksRef}
        activeSparklers={activeSparklers}
      />

      <div className="relative z-10 text-center w-full max-w-4xl px-6">
        {state === 'waiting' && (
          <div className="flex flex-col items-center gap-16 animate-in fade-in duration-1000">
            <div className="space-y-4">
              <h2 className="font-cinzel text-amber-200/40 text-sm tracking-[1.5em] uppercase">Temporal Node 2026</h2>
              <h1 className="font-cinzel text-white text-6xl md:text-9xl font-light tracking-[0.2em] drop-shadow-2xl">
                2026
              </h1>
            </div>
            
            <button 
              onClick={prepareAssets}
              className="group relative px-28 py-10 bg-white/5 border border-white/10 hover:border-amber-400/50 backdrop-blur-3xl transition-all duration-500 overflow-hidden rounded-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative font-cinzel text-2xl tracking-[1em] text-white group-hover:text-amber-100 transition-colors ml-[1em]">
                INITIATE
              </span>
            </button>
          </div>
        )}

        {state === 'preparing' && (
          <div className="flex flex-col items-center gap-12 animate-in fade-in duration-500">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                <circle
                  cx="80" cy="80" r="70"
                  fill="none" stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * progress) / 100}
                  className="text-amber-400/80 transition-all duration-300 ease-out"
                />
              </svg>
              <div className="absolute font-cinzel text-3xl text-white font-thin">
                {progress}%
              </div>
            </div>
            <div className="font-cinzel text-amber-100/60 tracking-[0.8em] text-[10px] uppercase animate-pulse ml-[0.8em]">
              {loadingTask}
            </div>
          </div>
        )}

        {state === 'counting' && (
          <div className="animate-in zoom-in fade-in duration-300">
            <CountdownDigit value={seconds} isIntense={seconds <= 3} />
          </div>
        )}

        {state === 'celebrating' && (
          <NewYearMessage />
        )}
      </div>

      <div className="fixed top-12 left-12 flex items-center gap-6 opacity-20 pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="font-cinzel text-[10px] tracking-[0.5em] text-white uppercase">SYSTEM_STABLE</div>
          <div className="w-40 h-[1px] bg-gradient-to-r from-white to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default App;
