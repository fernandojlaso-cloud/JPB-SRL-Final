import React from 'react';

interface JpbSrlLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'badge' | 'stacked' | 'auth' | 'card';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const JpbSrlLogo: React.FC<JpbSrlLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
}) => {
  // Precision Multi-pointed jagged Leaf matching the uploaded JPB SRL Logo
  const LeafIcon = ({ size = 44 }: { size?: number }) => (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="shrink-0 drop-shadow-sm select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Red Star-Leaf Body with Black Border */}
      <path
        d="M 50 12
           L 57 24 L 68 18 L 65 31 L 78 30 L 71 42 L 84 48 L 76 58 L 83 70 L 68 67 L 70 80 L 57 74 L 50 88
           L 43 74 L 30 80 L 32 67 L 17 70 L 24 58 L 16 48 L 29 42 L 22 30 L 35 31 L 32 18 L 43 24 Z"
        fill="#DC2626"
        stroke="#0F172A"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Central Stem Vein */}
      <path
        d="M 50 88 L 50 26"
        stroke="#0F172A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Radiating Veins */}
      <path
        d="M 50 64 L 66 48"
        stroke="#0F172A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 50 64 L 34 48"
        stroke="#0F172A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 50 74 L 62 65"
        stroke="#0F172A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 50 74 L 38 65"
        stroke="#0F172A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 50 48 L 63 36"
        stroke="#0F172A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 50 48 L 37 36"
        stroke="#0F172A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  // Exact reproduction of the vertical card with white background, red leaf, "JPB" and "SRL"
  if (variant === 'card' || variant === 'auth' || variant === 'stacked') {
    const cardScale = {
      sm: { cardWidth: 'w-20', pad: 'px-2 py-3', leafSize: 32, jpbText: 'text-base', srlText: 'text-[10px]' },
      md: { cardWidth: 'w-28', pad: 'px-3 py-4', leafSize: 46, jpbText: 'text-2xl', srlText: 'text-xs' },
      lg: { cardWidth: 'w-36', pad: 'px-4 py-5', leafSize: 58, jpbText: 'text-3xl', srlText: 'text-sm' },
      xl: { cardWidth: 'w-48', pad: 'px-6 py-7', leafSize: 80, jpbText: 'text-4xl', srlText: 'text-lg' },
    }[size];

    return (
      <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
        <div
          className={`${cardScale.cardWidth} ${cardScale.pad} bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center justify-center transition-transform hover:scale-105 duration-200 ring-4 ring-rose-500/10`}
        >
          {/* Top Red Leaf */}
          <LeafIcon size={cardScale.leafSize} />

          {/* JPB Text */}
          <div className={`font-black text-slate-950 tracking-normal ${cardScale.jpbText} font-sans leading-none mt-2`}>
            JPB
          </div>

          {/* SRL Text */}
          <div className={`font-black text-slate-950 tracking-wider ${cardScale.srlText} font-sans mt-1 leading-none`}>
            SRL
          </div>
        </div>
      </div>
    );
  }

  // Compact badge icon (small card representation)
  if (variant === 'badge') {
    const badgeDimensions = {
      sm: { w: 'w-8 h-10', leaf: 18, jpb: 'text-[8px]', srl: 'text-[6px]' },
      md: { w: 'w-10 h-12', leaf: 22, jpb: 'text-[10px]', srl: 'text-[7px]' },
      lg: { w: 'w-14 h-16', leaf: 28, jpb: 'text-xs', srl: 'text-[9px]' },
      xl: { w: 'w-20 h-24', leaf: 40, jpb: 'text-base', srl: 'text-xs' },
    }[size];

    return (
      <div
        className={`inline-flex flex-col items-center justify-center ${badgeDimensions.w} bg-white rounded-xl border border-slate-200 shadow-sm p-1 shrink-0 select-none ${className}`}
      >
        <LeafIcon size={badgeDimensions.leaf} />
        <span className={`font-black text-slate-950 leading-none ${badgeDimensions.jpb} mt-0.5`}>JPB</span>
        <span className={`font-bold text-slate-900 leading-none ${badgeDimensions.srl}`}>SRL</span>
      </div>
    );
  }

  // Compact inline badge for table titles or chip headers
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div className="w-8 h-10 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center p-0.5 shrink-0">
          <LeafIcon size={18} />
          <span className="text-[7px] font-black text-slate-950 leading-none mt-0.5">JPB</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-white tracking-wide leading-none font-sans">
            JPB <span className="text-rose-500">SRL</span>
          </span>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
            Obras
          </span>
        </div>
      </div>
    );
  }

  // Full Horizontal Brand Layout for Navbar / Header
  return (
    <div className={`inline-flex items-center gap-3 select-none group cursor-pointer ${className}`}>
      {/* Official White Card Container */}
      <div className="w-10 h-13 sm:w-11 sm:h-14 bg-white rounded-xl shadow-md border border-slate-200 flex flex-col items-center justify-center p-1 shrink-0 transition-transform group-hover:scale-105 duration-200 ring-2 ring-rose-500/10">
        <LeafIcon size={24} />
        <span className="text-[9px] font-black text-slate-950 leading-none mt-0.5 font-sans">
          JPB
        </span>
        <span className="text-[7px] font-extrabold text-slate-900 leading-none mt-0.5 tracking-wider font-sans">
          SRL
        </span>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
            JPB
          </span>
          <span className="text-xs font-black text-white bg-rose-600 px-1.5 py-0.5 rounded shadow-sm tracking-wider">
            SRL
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-slate-400 mt-1">
          Control Financiero de Obras
        </span>
      </div>
    </div>
  );
};
