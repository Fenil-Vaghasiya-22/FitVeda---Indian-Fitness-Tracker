import React, { useEffect, useState } from 'react';
import { getWaterForDate, saveWaterLog } from '../services/storageService';
import { WaterLog } from '../types';
import { Plus, Minus, Droplets } from 'lucide-react';

const WaterTracker: React.FC = () => {
  const [log, setLog] = useState<WaterLog>({ date: '', glasses: 0, goal: 10 });
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const data = getWaterForDate(today);
    setLog(data);
  }, [today]);

  const updateWater = (change: number) => {
    const newCount = Math.max(0, log.glasses + change);
    const updatedLog = { ...log, glasses: newCount };
    setLog(updatedLog);
    saveWaterLog(updatedLog);
  };

  // Calculate percentage, capped visually at 100 but kept raw for logic if needed
  const rawPercentage = (log.glasses / log.goal) * 100;
  const percentage = Math.min(rawPercentage, 100);
  
  // Calculate liters (assuming 250ml per glass)
  const liters = (log.glasses * 250) / 1000;
  
  // Color change if goal reached
  const strokeColor = rawPercentage >= 100 ? 'text-emerald-500' : 'text-blue-500';

  return (
    <div className="md:pl-64 flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white w-full max-w-sm p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Hydration Tracker</h2>
        
        {/* Responsive Circular Progress Container */}
        <div className="relative w-full max-w-[260px] aspect-square mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
                <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="transparent"
                    className="text-slate-100"
                />
                <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 120}
                    strokeDashoffset={2 * Math.PI * 120 * (1 - percentage / 100)}
                    className={`${strokeColor} transition-all duration-500 ease-out`}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Droplets className={`w-8 h-8 ${strokeColor} mb-2`} />
                <span className="text-5xl font-bold text-slate-800">{log.glasses}</span>
                <span className="text-slate-400 text-sm font-medium mb-1">/ {log.goal} Glasses</span>
                <span className="text-emerald-600 text-lg font-bold bg-emerald-50 px-3 py-1 rounded-full mt-1">{liters.toFixed(2)} L</span>
            </div>
        </div>

        <div className="flex gap-6">
            <button 
                onClick={() => updateWater(-1)}
                className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
            >
                <Minus className="w-6 h-6" />
            </button>
            <button 
                onClick={() => updateWater(1)}
                className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>
        
        <p className="mt-8 text-slate-400 text-center text-sm">
            1 Glass ≈ 250ml <br/>
            Stay hydrated!
        </p>
      </div>
    </div>
  );
};

export default WaterTracker;