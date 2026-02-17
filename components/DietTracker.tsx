import React, { useState, useEffect } from 'react';
import { MealLog, FoodItem } from '../types';
import { getMeals, addMeal, deleteMeal } from '../services/storageService';
import { analyzeDiet } from '../services/geminiService';
import { Utensils, Sparkles, Check, Coffee, Sun, Moon, Plus, Trash2 } from 'lucide-react';

const DietTracker: React.FC = () => {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [mealType, setMealType] = useState<'Morning' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [previewData, setPreviewData] = useState<{ items: FoodItem[], totalProtein: number, totalCalories: number } | null>(null);

  useEffect(() => {
    setMeals(getMeals());
  }, []);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeDiet(input);
      setPreviewData(result);
    } catch (err) {
      alert("Failed to analyze diet. Please check your API key or connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!previewData) return;
    const newMeal: MealLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      mealType,
      items: previewData.items,
      totalProtein: previewData.totalProtein,
      totalCalories: previewData.totalCalories
    };
    const updated = await addMeal(newMeal);
    setMeals(updated);
    // Reset
    setInput('');
    setPreviewData(null);
  };

  const handleDelete = async (id: string) => {
      if(confirm("Delete this meal entry?")) {
          const updated = await deleteMeal(id);
          setMeals(updated);
      }
  };

  return (
    <div className="space-y-6 md:pl-64">
       <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-3xl shadow-lg text-white">
          <h2 className="text-2xl font-bold mb-2">Smart Diet Logger</h2>
          <p className="opacity-90 text-sm mb-6">Describe your Indian vegetarian meal, and our AI will calculate the macros.</p>
          
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl flex gap-1 mb-4">
             {['Morning', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                 <button 
                   key={type}
                   onClick={() => setMealType(type as any)}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mealType === type ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/70 hover:bg-white/10'}`}
                 >
                   {type}
                 </button>
             ))}
          </div>

          <div className="relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., 2 Jowar bhakari, 1 bowl moong dal, and little ghee..."
              className="w-full h-24 rounded-xl bg-white text-slate-800 p-4 text-sm focus:outline-none focus:ring-4 focus:ring-white/20 placeholder:text-slate-400 resize-none"
            />
            <button 
              onClick={handleAnalyze}
              disabled={analyzing || !input}
              className="absolute bottom-3 right-3 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-black disabled:opacity-50 transition-colors"
            >
              {analyzing ? (
                  <>Analyzing...</>
              ) : (
                  <><Sparkles size={16} className="text-amber-400" /> Calculate Macros</>
              )}
            </button>
          </div>
       </div>

       {previewData && (
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" /> Analysis Result
            </h3>
            <div className="space-y-3 mb-6">
                {previewData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                        <div>
                            <span className="font-medium text-slate-700">{item.name}</span>
                            <span className="text-slate-400 text-xs ml-2">({item.quantity})</span>
                        </div>
                        <div className="text-right">
                             <div className="font-bold text-slate-700">{item.protein}g Protein</div>
                             <div className="text-xs text-slate-400">{item.calories} Kcal</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl mb-4">
                 <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">Total Protein</div>
                    <div className="text-xl font-bold text-emerald-600">{previewData.totalProtein}g</div>
                 </div>
                 <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold">Total Calories</div>
                    <div className="text-xl font-bold text-orange-500">{previewData.totalCalories}</div>
                 </div>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setPreviewData(null)} className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl">Discard</button>
                <button onClick={saveMeal} className="flex-[2] py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200">Save to Log</button>
            </div>
         </div>
       )}

       <div className="space-y-4">
          <h3 className="font-bold text-slate-800 ml-1">Today's Meals</h3>
          {meals.filter(m => m.date === new Date().toISOString().split('T')[0]).length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                  No meals logged today yet.
              </div>
          ) : (
             meals.filter(m => m.date === new Date().toISOString().split('T')[0]).map((meal) => (
                 <div key={meal.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 relative group">
                     <button onClick={() => handleDelete(meal.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                     <div className="flex justify-between items-center pr-8">
                         <div className="flex items-center gap-3">
                             <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                 {meal.mealType === 'Morning' ? <Sun size={18}/> : meal.mealType === 'Dinner' ? <Moon size={18}/> : <Coffee size={18}/>}
                             </div>
                             <span className="font-bold text-slate-700">{meal.mealType}</span>
                         </div>
                         <div className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                             {meal.totalProtein}g Protein
                         </div>
                     </div>
                     <div className="text-sm text-slate-600">
                         {meal.items.map(i => i.name).join(', ')}
                     </div>
                 </div>
             ))
          )}
       </div>
    </div>
  );
};

export default DietTracker;