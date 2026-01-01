
import React, { useEffect, useState, useRef } from 'react';

interface Props {
  value: number;
  isIntense: boolean;
}

const CountdownDigit: React.FC<Props> = ({ value, isIntense }) => {
  const [isShaking, setIsShaking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsShaking(true);
    const timer = setTimeout(() => setIsShaking(false), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div ref={containerRef} className={`
      relative font-cinzel text-[22rem] md:text-[28rem] lg:text-[34rem] font-black transition-all duration-500 transform
      ${isShaking ? 'scale-110' : 'scale-100'}
    `}>
      {/* 底部扩散光晕 */}
      <span className="absolute inset-0 blur-[120px] opacity-20 text-white select-none translate-y-20">
        {value}
      </span>
      
      {/* 核心发光数字 */}
      <span className={`
        relative bg-clip-text text-transparent bg-gradient-to-b from-white via-amber-100 to-amber-500 
        drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]
        ${isIntense ? 'brightness-125' : 'brightness-100'}
      `}>
        {value}
      </span>

      {/* 模拟掉落的火星氛围（CSS动画） */}
      {isIntense && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-amber-200 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 2 + 1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CountdownDigit;
