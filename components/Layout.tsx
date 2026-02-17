import React from 'react';
import { Activity, Droplets, Ruler, Utensils, LayoutDashboard, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'workouts', icon: Activity, label: 'Workouts' },
    { id: 'diet', icon: Utensils, label: 'Diet' },
    { id: 'water', icon: Droplets, label: 'Water' },
    { id: 'measure', icon: Ruler, label: 'Body' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Bar - Mobile/Desktop */}
      <header className="bg-white shadow-sm sticky top-0 z-20 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="bg-primary p-1.5 rounded-lg">
             <Activity className="text-white w-5 h-5" />
           </div>
           <h1 className="text-xl font-bold tracking-tight text-slate-800">Fit<span className="text-primary">Veda</span></h1>
        </div>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
          <User className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Sticky */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-30 md:hidden">
        <ul className="flex justify-between items-center">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'text-primary' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-current opacity-20 stroke-2' : 'stroke-2'}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 p-4 z-10">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </div>
  );
};

export default Layout;