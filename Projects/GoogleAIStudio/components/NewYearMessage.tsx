
import React from 'react';

const NewYearMessage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-1000">
      <div className="relative">
         <h1 className="font-cinzel text-8xl md:text-[14rem] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#FCF6BA] via-[#D4AF37] to-[#AA8E3F] drop-shadow-[0_20px_50px_rgba(212,175,55,0.4)]">
          2026
        </h1>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-amber-200 to-transparent opacity-50" />
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="font-cinzel text-3xl md:text-6xl tracking-[1.2em] text-white opacity-95 animate-in slide-in-from-bottom duration-1000 delay-300 ml-[1.2em]">
          HAPPY NEW YEAR
        </p>
        <p className="font-cinzel text-xs tracking-[0.8em] text-amber-200/60 ml-[0.8em] uppercase">
          Welcome to the future
        </p>
      </div>
    </div>
  );
};

export default NewYearMessage;
