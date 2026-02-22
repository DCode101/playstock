import React from "react";

const PlaystockLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-3 select-none">

      {/* SYMBOL */}
      <div className="relative w-10 h-6">

        {/* F1 nose */}
        <div className="absolute left-0 top-2 w-10 h-1 bg-red-600 rounded-full" />

        {/* Wheel / circle */}
        <div className="absolute left-1 top-0 w-4 h-4 border-2 border-red-600 rounded-full" />

        {/* Stock arrow */}
        <div className="absolute right-0 top-0 text-red-500 text-xs font-bold">
          ↗
        </div>
      </div>

      {/* TEXT */}
      <div className="text-2xl font-extrabold tracking-widest">
        <span className="text-white">PLAY</span>
        <span className="text-red-600">STOCK</span>
      </div>
    </div>
  );
};

export default PlaystockLogo;
