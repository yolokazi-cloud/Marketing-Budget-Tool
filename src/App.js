import React, { useState } from 'react';
import initialBudgetData from './budgetData.json';
import BudgetOverview from './BudgetOverview';
import BudgetExpensePage from './BudgetExpensePage';
import logo from './assets/Altron Logo - Light 2x.png';


const App = () => {
  const [budgetData, setBudgetData] = useState(initialBudgetData);
  const [currentView, setCurrentView] = useState('overview');
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  const handleTeamSelect = (team) => {
    setSelectedTeam(team); // This will automatically switch the view if needed
    setCurrentView('expenses'); // Explicitly switch to details view
  };
  
  const handleUpload = (data) => {
    console.log('Uploaded data:', data);
    // Here you could process the uploaded CSV data and update the anticipatedBudgetData
  };

  const handleDataUpdate = (newBudgetData) => {
    setBudgetData(newBudgetData);
    alert('Budget data has been updated successfully across the application.');
  };

  return (
    <div className="min-h-screen bg-white">
      {currentView === 'overview' ? (
        <BudgetOverview 
          budgetData={budgetData}
          selectedTeam={selectedTeam} 
          setBudgetData={setBudgetData}
          onTeamSelect={handleTeamSelect}
          onDataUpdate={handleDataUpdate}
        />
      ) : (
        <div className="flex h-screen">
          {/* Sidebar for expense page */}
          <div className="w-80 bg-[#1F4659] text-white p-6 overflow-y-auto">
            <div className="mb-0">
              <div>
                <img src={logo} alt="Altron Logo" className="h-20 mx-auto" />
              </div>
            </div>
            
            <nav className="space-y-4">
              <div>
                <button
                  onClick={() => {
                    setCurrentView('overview');
                    setSelectedTeam(null); // Deselect any team when going to overview
                  }}
                  className={`w-full text-left p-3 rounded-lg font-medium transition-colors ${
                    currentView === 'overview' ? 'bg-white text-[#1F4659]' : 'hover:bg-[#2A5A70] text-white'
                  }`}
                >
                  Group Overview
                </button>
              </div>
              <h2 className="text-lg font-semibold pt-2">Cost Centers</h2>
              {Object.keys(budgetData)
                .filter(key => key !== 'financialYear')
                .map((costCenter) => (
                <button
                  key={costCenter}
                  onClick={() => {
                    setSelectedTeam(costCenter);
                    setCurrentView('expenses');
                  }}
                  className={`w-full text-left p-3 rounded-lg font-medium transition-colors ${
                    selectedTeam === costCenter 
                      ? 'bg-white text-[#1F4659]' 
                      : 'hover:bg-[#2A5A70] text-white'
                  }`}
                >
                  {budgetData[costCenter].teamName || costCenter}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <BudgetExpensePage 
              selectedTeam={selectedTeam}
              onUpload={handleUpload}
              budgetData={budgetData}
              setBudgetData={setBudgetData}
              onDataUpdate={handleDataUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;