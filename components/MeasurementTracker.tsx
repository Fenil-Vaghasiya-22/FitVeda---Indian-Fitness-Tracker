import React, { useState, useEffect } from 'react';
import { BodyMeasurement } from '../types';
import { getMeasurements, addMeasurement, deleteMeasurement } from '../services/storageService';
import { Ruler, Save, Calendar, ChevronUp, Edit2, Trash2, LineChart as ChartIcon, Calculator, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const MeasurementTracker: React.FC = () => {
  const [history, setHistory] = useState<BodyMeasurement[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [chartMetric, setChartMetric] = useState<keyof BodyMeasurement>('weight');
  const [chartView, setChartView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const [formData, setFormData] = useState<Partial<BodyMeasurement>>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    weight: undefined,
    height: undefined,
    chest: undefined,
    waist: undefined,
    belly: undefined,
    hips: undefined,
    armsLeft: undefined,
    armsRight: undefined,
    thighsLeft: undefined,
    thighsRight: undefined,
    neck: undefined
  });

  useEffect(() => {
    setHistory(getMeasurements());
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : parseFloat(value)
    }));
  };

  const handleEdit = (measurement: BodyMeasurement) => {
      setFormData(measurement);
      setIsFormOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
      if (confirm('Are you sure you want to delete this entry?')) {
          const updated = await deleteMeasurement(id);
          setHistory(updated);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.weight || !formData.date) return;

    const newMeasurement: BodyMeasurement = {
      id: formData.id || Date.now().toString(),
      date: formData.date!,
      weight: formData.weight!,
      height: formData.height || 0,
      ...formData
    } as BodyMeasurement;

    const updated = await addMeasurement(newMeasurement);
    setHistory(updated);
    setIsFormOpen(false);
    
    // Reset form
    setFormData({
        id: '',
        date: new Date().toISOString().split('T')[0],
        weight: undefined,
        height: undefined,
        chest: undefined,
        waist: undefined,
        belly: undefined,
        hips: undefined,
        armsLeft: undefined,
        armsRight: undefined,
        thighsLeft: undefined,
        thighsRight: undefined,
        neck: undefined
    });
  };

  const calculateBMI = (weight?: number, height?: number) => {
      if(!weight || !height) return { value: 0, label: 'Unknown', color: 'text-slate-400' };
      const hM = height / 100;
      const bmi = parseFloat((weight / (hM * hM)).toFixed(1));
      let label = 'Normal';
      let color = 'text-emerald-500';
      if(bmi < 18.5) { label = 'Underweight'; color = 'text-blue-500'; }
      else if(bmi >= 25 && bmi < 30) { label = 'Overweight'; color = 'text-orange-500'; }
      else if(bmi >= 30) { label = 'Obese'; color = 'text-red-500'; }
      return { value: bmi, label, color };
  };

  const getChartData = () => {
    // Sort by date
    const sorted = [...history].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (chartView === 'daily') {
        return sorted.map(m => ({ 
            date: new Date(m.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}), 
            value: m[chartMetric] 
        })).filter(d => d.value !== undefined);
    }
 
    // Grouping
    const grouped: Record<string, number[]> = {};
    sorted.forEach(m => {
        if (m[chartMetric] === undefined) return;
        const d = new Date(m.date);
        let key = '';
        if (chartView === 'weekly') {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            key = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
        
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m[chartMetric] as number);
    });
 
    return Object.keys(grouped).map(key => ({
        date: key,
        value: Number((grouped[key].reduce((a,b) => a+b, 0) / grouped[key].length).toFixed(1))
    }));
  };

  const bmiData = calculateBMI(formData.weight, formData.height);

  const InputField = ({ label, name, placeholder = "0" }: { label: string, name: keyof BodyMeasurement, placeholder?: string }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          name={name}
          value={formData[name] !== undefined ? formData[name] : ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <span className="absolute right-3 top-2 text-slate-400 text-sm">cm</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:pl-64">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Body Measurements</h2>
        <button 
          onClick={() => {
              setIsFormOpen(!isFormOpen);
              if(!isFormOpen) setFormData({ ...formData, id: '' }); 
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          {isFormOpen ? <ChevronUp size={18} /> : <PlusIcon />} 
          {isFormOpen ? 'Close' : 'Add New'}
        </button>
      </div>

      {/* Progress Chart */}
      {history.length > 1 && !isFormOpen && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2"><ChartIcon size={18} /> Trends</h3>
                    <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-medium">
                        <button onClick={() => setChartView('daily')} className={`px-2 py-1 rounded ${chartView === 'daily' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Days</button>
                        <button onClick={() => setChartView('weekly')} className={`px-2 py-1 rounded ${chartView === 'weekly' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Week</button>
                        <button onClick={() => setChartView('monthly')} className={`px-2 py-1 rounded ${chartView === 'monthly' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Month</button>
                    </div>
                  </div>
                  <select 
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-primary focus:border-primary w-full md:w-auto"
                    value={chartMetric}
                    onChange={(e) => setChartMetric(e.target.value as keyof BodyMeasurement)}
                  >
                      <option value="weight">Weight</option>
                      <option value="belly">Belly</option>
                      <option value="waist">Waist</option>
                      <option value="chest">Chest</option>
                      <option value="hips">Hips</option>
                      <option value="armsRight">Arms</option>
                      <option value="thighsRight">Thighs</option>
                  </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData()}>
                        <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
           {/* BMI Calculator Live */}
           <div className="mb-6 p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
               <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-lg text-primary shadow-sm"><Calculator size={20} /></div>
                   <div>
                       <div className="text-xs font-bold uppercase text-slate-400">BMI Calculator</div>
                       <div className="text-sm text-slate-600">Enter weight & height below</div>
                   </div>
               </div>
               {bmiData.value > 0 && (
                   <div className="text-right">
                       <div className="text-2xl font-bold text-slate-800">{bmiData.value}</div>
                       <div className={`text-xs font-bold uppercase ${bmiData.color}`}>{bmiData.label}</div>
                   </div>
               )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <input
                            type="date"
                            name="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Weight (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="weight"
                            required
                            value={formData.weight !== undefined ? formData.weight : ''}
                            onChange={handleInputChange}
                            placeholder="0.0"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Height (cm)</label>
                        <input
                            type="number"
                            step="1"
                            name="height"
                            value={formData.height !== undefined ? formData.height : ''}
                            onChange={handleInputChange}
                            placeholder="170"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
           </div>

           <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Body Parts (cm)</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <InputField label="Belly" name="belly" />
                <InputField label="Waist" name="waist" />
                <InputField label="Chest" name="chest" />
                <InputField label="Hips" name="hips" />
                <InputField label="Neck" name="neck" />
                <InputField label="Arm (L)" name="armsLeft" />
                <InputField label="Arm (R)" name="armsRight" />
                <InputField label="Thigh (L)" name="thighsLeft" />
                <InputField label="Thigh (R)" name="thighsRight" />
           </div>

           <button type="submit" className="w-full md:w-auto bg-slate-800 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-900 transition-colors flex items-center justify-center gap-2">
             <Save size={18} /> {formData.id ? 'Update Entry' : 'Save Entry'}
           </button>
        </form>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Measurement History</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Weight</th>
                        <th className="px-4 py-3">BMI</th>
                        <th className="px-4 py-3">Belly</th>
                        <th className="px-4 py-3 hidden md:table-cell">Waist</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {history.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-slate-400">No measurements recorded yet.</td></tr>
                    ) : (
                        history.map((m) => {
                            const bmi = calculateBMI(m.weight, m.height);
                            return (
                                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-700">{new Date(m.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">{m.weight} kg</td>
                                    <td className={`px-4 py-3 font-semibold ${bmi.color}`}>{bmi.value > 0 ? bmi.value : '-'}</td>
                                    <td className="px-4 py-3">{m.belly || '-'} cm</td>
                                    <td className="px-4 py-3 hidden md:table-cell">{m.waist || '-'} cm</td>
                                    <td className="px-4 py-3 flex justify-end gap-2">
                                        <button onClick={() => handleEdit(m)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

export default MeasurementTracker;