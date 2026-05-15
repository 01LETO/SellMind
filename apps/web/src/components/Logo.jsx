import React from 'react';

export default function Logo({ size = 32, showText = true }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/LogoSellMind.png"
        alt="SellMind"
        width={size}
        height={size}
        className="object-contain"
        style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.4))' }}
      />
      {showText && (
        <span className="text-xl font-bold gradient-primary-text">SellMind</span>
      )}
    </div>
  );
}
