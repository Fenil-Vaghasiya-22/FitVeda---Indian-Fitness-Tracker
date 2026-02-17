import React, { useEffect, useState } from 'react';
import { getMeasurements, getWaterForDate, getMeals, getWorkouts, getProfile } from '../services/storageService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { Droplets, Flame, Dumbbell, TrendingDown, Zap, Scale, BarChart2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activityView, setActivityView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [stats, setStats] = useState({
    todayWater: 0,
    waterGoal: 0,
    todayProtein: 0,
    todayCaloriesIn: 0,
    todayCaloriesBurned: 0,
    targetCalories: 2000,
    netCalories: 0,
    caloriesRemaining: 0,
    lastWeight: 0,
    weightDiff: 0,
    weightData: [] as any[],
    workoutData: [] as any[],
  });

  // Calculate workout data based on view mode
  const getWorkoutData = (workouts: any[], view: 'daily' | 'weekly' | 'monthly') => {
    if (view === 'daily') {
        // Last 7 days
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();
        
        return last7Days.map(date => {
            const count = workouts.filter((w: any) => w.date === date).length;
            return {
                name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                count
            };
        });
    } else if (view === 'weekly') {
        // Group by week (last 8 weeks)
        const weeks: Record<string, number> = {};
        workouts.forEach((w: any) => {
            const d = new Date(w.date);
            // Find Monday of that week
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const key = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            weeks[key] = (weeks[key] || 0) + 1;
        });
        // Convert to array and slice last 8
        return Object.entries(weeks).map(([name, count]) => ({ name, count })).slice(-8);
    } else {
        // Monthly (last 6 months)
        const months: Record<string, number> = {};
        workouts.forEach((w: any) => {
            const d = new Date(w.date);
            const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            months[key] = (months[key] || 0) + 1;
        });
        return Object.entries(months).map(([name, count]) => ({ name, count })).slice(-6);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const water = getWaterForDate(today);
    const meals = getMeals();
    const workouts = getWorkouts();
    const measurements = getMeasurements();
    const profile = getProfile();

    // Calculate today's diet stats
    const todayMeals = meals.filter(m => m.date === today);
    const todayProtein = todayMeals.reduce((acc, curr) => acc + curr.totalProtein, 0);
    const todayCaloriesIn = todayMeals.reduce((acc, curr) => acc + curr.totalCalories, 0);

    // Calculate today's workout stats
    const todayWorkouts = workouts.filter(w => w.date === today);
    const todayCaloriesBurned = todayWorkouts.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0);

    const netCalories = todayCaloriesIn - todayCaloriesBurned;
    const caloriesRemaining = profile.targetCalories - netCalories;

    // Weight Trends
    const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastWeight = sortedMeasurements.length > 0 ? sortedMeasurements[sortedMeasurements.length - 1].weight : 0;
    const prevWeight = sortedMeasurements.length > 1 ? sortedMeasurements[sortedMeasurements.length - 2].weight : lastWeight;
    
    const weightChartData = sortedMeasurements.slice(-5).map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: m.weight
    }));

    setStats({
      todayWater: water.glasses,
      waterGoal: water.goal,
      todayProtein,
      todayCaloriesIn,
      todayCaloriesBurned,
      targetCalories: profile.targetCalories,
      netCalories,
      caloriesRemaining,
      lastWeight,
      weightDiff: lastWeight - prevWeight,
      weightData: weightChartData,
      workoutData: getWorkoutData(workouts, activityView)
    });
    setLoading(false);
  }, [activityView]);

  if (loading) return <div className="p-10 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6 md:pl-64">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Water */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
            <Droplets className="w-4 h-4 text-blue-500" /> Water
          </div>
          <div>
             <div className="text-xl font-bold text-slate-800">
               {stats.todayWater}<span className="text-sm font-normal text-slate-400">/{stats.waterGoal}</span>
             </div>
             <div className="text-xs text-blue-500 font-medium mt-1">
               {((stats.todayWater * 250) / 1000).toFixed(2)} Liters
             </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
             <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min((stats.todayWater / stats.waterGoal) * 100, 100)}%` }}></div>
          </div>
        </div>

        {/* Calories In */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
            <Flame className="w-4 h-4 text-orange-500" /> Eaten
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{Math.round(stats.todayCaloriesIn)}</div>
            <div className="text-xs text-slate-400 mt-1">Kcal Food</div>
          </div>
        </div>

        {/* Calories Burned */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
            <Zap className="w-4 h-4 text-red-500" /> Burned
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{Math.round(stats.todayCaloriesBurned)}</div>
            <div className="text-xs text-slate-400 mt-1">Kcal Exercise</div>
          </div>
        </div>

        {/* Net Calories */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
            <Scale className="w-4 h-4 text-purple-500" /> Net Cal
          </div>
          <div>
             <div className="text-xl font-bold text-slate-800">
                {Math.round(stats.netCalories)}
             </div>
             <div className="text-xs text-slate-400 mt-1">Food - Exercise</div>
          </div>
        </div>

        {/* Protein */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
            <Dumbbell className="w-4 h-4 text-emerald-500" /> Protein
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{Math.round(stats.todayProtein)}g</div>
             <div className="text-xs text-slate-400 mt-1">Daily intake</div>
          </div>
        </div>

        {/* Weight */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
            <TrendingDown className="w-4 h-4 text-indigo-500" /> Weight
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{stats.lastWeight || '--'} <span className="text-sm font-normal">kg</span></div>
            <div className={`text-xs mt-1 ${stats.weightDiff <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stats.weightDiff > 0 ? '+' : ''}{stats.weightDiff.toFixed(1)} kg
            </div>
          </div>
        </div>

      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weight Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Weight Progress</h3>
          <div className="h-64">
            {stats.weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weightData}>
                    <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No weight data yet</div>
            )}
          </div>
        </div>

        {/* Workout Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Workout Activity</h3>
              <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-medium">
                  <button onClick={() => setActivityView('daily')} className={`px-2 py-1 rounded ${activityView === 'daily' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>7D</button>
                  <button onClick={() => setActivityView('weekly')} className={`px-2 py-1 rounded ${activityView === 'weekly' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Week</button>
                  <button onClick={() => setActivityView('monthly')} className={`px-2 py-1 rounded ${activityView === 'monthly' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Month</button>
              </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.workoutData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;