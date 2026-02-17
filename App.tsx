import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WorkoutTracker from './components/WorkoutTracker';
import DietTracker from './components/DietTracker';
import WaterTracker from './components/WaterTracker';
import MeasurementTracker from './components/MeasurementTracker';

const App: React.FC = () => {
  // Simple state-based routing since we can't use React Router DOM in this environment easily without history API issues in some previews
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load active tab from hash if present on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'workouts', 'diet', 'water', 'measure'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'workouts': return <WorkoutTracker />;
      case 'diet': return <DietTracker />;
      case 'water': return <WaterTracker />;
      case 'measure': return <MeasurementTracker />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate-in fade-in duration-500">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;