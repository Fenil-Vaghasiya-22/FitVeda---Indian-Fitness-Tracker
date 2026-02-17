import React, { useState, useEffect } from 'react';
import { WorkoutLog, Exercise, ExerciseSet } from '../types';
import { getWorkouts, addWorkout, deleteWorkout } from '../services/storageService';
import { analyzeWorkout } from '../services/geminiService';
import { Dumbbell, Plus, Trash2, Save, Calendar, Clock, Flame, Sparkles, X } from 'lucide-react';

const WorkoutTracker: React.FC = () => {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [loggingMode, setLoggingMode] = useState<'manual' | 'ai'>('manual');
  
  // AI Form State
  const [aiInput, setAiInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Manual Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<number | ''>('');
  const [caloriesBurned, setCaloriesBurned] = useState<number | ''>('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: Date.now().toString(), name: '', sets: [{ reps: 0, weight: 0 }] }
  ]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setWorkouts(getWorkouts());
  }, []);

  // Auto-calculate calories when duration changes in Manual Mode (approx 6 cal/min)
  useEffect(() => {
    if (loggingMode === 'manual' && typeof duration === 'number' && duration > 0) {
       // Only auto-fill if empty to allow user override
       if (caloriesBurned === '' || caloriesBurned === 0) {
           setCaloriesBurned(Math.round(duration * 6));
       }
    }
  }, [duration, loggingMode]);

  const handleAiAnalyze = async () => {
    if (!aiInput.trim()) return;
    setAnalyzing(true);
    try {
        const result = await analyzeWorkout(aiInput);
        setExercises(result.exercises);
        setCaloriesBurned(result.caloriesBurned);
        setDuration(result.durationMinutes);
        setNotes('AI Generated Workout');
        setLoggingMode('manual'); // Switch to manual to review/save
    } catch (error) {
        alert('Failed to analyze workout. Try again.');
    } finally {
        setAnalyzing(false);
    }
  };

  const addExercise = () => {
    setExercises([...exercises, { id: Date.now().toString(), name: '', sets: [{ reps: 0, weight: 0 }] }]);
  };

  const removeExercise = (index: number) => {
    const newEx = [...exercises];
    newEx.splice(index, 1);
    setExercises(newEx);
  };

  const updateExerciseName = (index: number, name: string) => {
    const newEx = [...exercises];
    newEx[index].name = name;
    setExercises(newEx);
  };

  const addSet = (exerciseIndex: number) => {
    const newEx = [...exercises];
    newEx[exerciseIndex].sets.push({ reps: 0, weight: 0 });
    setExercises(newEx);
  };

  const updateSet = (exIndex: number, setIndex: number, field: keyof ExerciseSet, value: number) => {
    const newEx = [...exercises];
    newEx[exIndex].sets[setIndex][field] = value;
    setExercises(newEx);
  };

  const handleSave = async () => {
    const validExercises = exercises.filter(e => e.name.trim() !== '');
    if (validExercises.length === 0) return;

    const newWorkout: WorkoutLog = {
      id: Date.now().toString(),
      date,
      exercises: validExercises,
      caloriesBurned: Number(caloriesBurned) || 0,
      durationMinutes: Number(duration) || 0,
      notes
    };

    const updated = await addWorkout(newWorkout);
    setWorkouts(updated);
    setIsLogging(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
      if(confirm("Delete this workout?")) {
          const updated = await deleteWorkout(id);
          setWorkouts(updated);
      }
  };

  const resetForm = () => {
    setExercises([{ id: Date.now().toString(), name: '', sets: [{ reps: 0, weight: 0 }] }]);
    setNotes('');
    setDuration('');
    setCaloriesBurned('');
    setAiInput('');
    setLoggingMode('manual');
  };

  return (
    <div className="space-y-6 md:pl-64">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Workout Log</h2>
        {!isLogging && (
          <button 
            onClick={() => setIsLogging(true)}
            className="bg-secondary text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-secondary/20 hover:bg-secondary/90 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Log Workout
          </button>
        )}
      </div>

      {isLogging && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
           
           {/* Mode Toggles */}
           <div className="flex border-b border-slate-100">
               <button 
                onClick={() => setLoggingMode('manual')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${loggingMode === 'manual' ? 'text-secondary bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                   <Dumbbell size={16} /> Manual Entry
               </button>
               <button 
                onClick={() => setLoggingMode('ai')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${loggingMode === 'ai' ? 'text-primary bg-emerald-50' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                   <Sparkles size={16} /> AI Smart Log
               </button>
           </div>

           {/* AI Mode */}
           {loggingMode === 'ai' && (
               <div className="p-6">
                   <p className="text-sm text-slate-500 mb-4">Paste your workout routine (e.g., "3 sets of squats, 20 mins treadmill") and we'll calculate the rest.</p>
                   <textarea 
                     value={aiInput}
                     onChange={(e) => setAiInput(e.target.value)}
                     className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 mb-4 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                     placeholder="Type your workout here..."
                   />
                   <div className="flex gap-4">
                       <button onClick={() => setLoggingMode('manual')} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-medium">Cancel</button>
                       <button onClick={handleAiAnalyze} disabled={analyzing} className="flex-[2] py-3 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/20 flex justify-center items-center gap-2">
                           {analyzing ? 'Analyzing...' : <><Sparkles size={18} /> Generate Log</>}
                       </button>
                   </div>
               </div>
           )}

           {/* Manual Mode */}
           {loggingMode === 'manual' && (
            <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Duration (min)</label>
                            <div className="relative">
                                <Clock className="absolute left-2.5 top-3 text-slate-400 w-4 h-4" />
                                <input type="number" placeholder="45" value={duration} onChange={(e) => setDuration(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Calories Burned</label>
                            <div className="relative">
                                <Flame className="absolute left-2.5 top-3 text-orange-400 w-4 h-4" />
                                <input type="number" placeholder="300" value={caloriesBurned} onChange={(e) => setCaloriesBurned(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800" />
                            </div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Notes</label>
                            <input type="text" placeholder="e.g. Chest focus" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800" />
                        </div>
                </div>

                <div className="space-y-6">
                    {exercises.map((ex, exIdx) => (
                    <div key={ex.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative">
                        <button onClick={() => removeExercise(exIdx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                        
                        <div className="mb-4 pr-8">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Exercise Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Bench Press" 
                            value={ex.name} 
                            onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                        />
                        </div>

                        <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-slate-500 uppercase text-center mb-1">
                            <span className="col-span-1">Set</span>
                            <span className="col-span-2">Reps</span>
                            <span className="col-span-2">Kg</span>
                        </div>
                        {ex.sets.map((set, setIdx) => (
                            <div key={setIdx} className="grid grid-cols-6 gap-2 items-center">
                            <span className="col-span-1 text-center font-bold text-slate-400 text-sm">{setIdx + 1}</span>
                            <input 
                                type="number" 
                                value={set.reps || ''} 
                                onChange={(e) => updateSet(exIdx, setIdx, 'reps', parseFloat(e.target.value))}
                                className="col-span-2 bg-white border border-slate-200 rounded px-2 py-1 text-center" 
                                placeholder="0"
                                />
                            <input 
                                type="number" 
                                value={set.weight || ''} 
                                onChange={(e) => updateSet(exIdx, setIdx, 'weight', parseFloat(e.target.value))}
                                className="col-span-2 bg-white border border-slate-200 rounded px-2 py-1 text-center" 
                                placeholder="0"
                                />
                            </div>
                        ))}
                        <button onClick={() => addSet(exIdx)} className="text-xs text-primary font-medium hover:underline mt-2 ml-1">+ Add Set</button>
                        </div>
                    </div>
                    ))}
                </div>

                <div className="mt-6 flex gap-4">
                    <button onClick={addExercise} className="flex-1 py-3 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                    + Add Exercise
                    </button>
                    <button onClick={handleSave} className="flex-[2] py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors flex items-center justify-center gap-2">
                    <Save size={18} /> Complete Workout
                    </button>
                </div>
            </div>
           )}
        </div>
      )}

      {/* History List */}
      <div className="space-y-4">
        {workouts.map(w => (
            <div key={w.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 relative group">
                <button onClick={() => handleDelete(w.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 pr-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Calendar size={18} /></div>
                        <div>
                            <div className="font-bold text-slate-800">{new Date(w.date).toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}</div>
                            <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                {w.durationMinutes && <span className="flex items-center gap-1"><Clock size={12}/> {w.durationMinutes} min</span>}
                                {w.caloriesBurned && <span className="flex items-center gap-1 text-orange-500 font-medium"><Flame size={12}/> {w.caloriesBurned} kcal</span>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    {w.exercises.map((ex, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-700">{ex.name}</span>
                            <span className="text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                {ex.sets.length} sets • {Math.max(...ex.sets.map(s => s.weight || 0))}kg max
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        ))}
        {workouts.length === 0 && !isLogging && (
            <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                No workouts logged yet.
            </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTracker;