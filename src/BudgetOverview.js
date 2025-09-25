import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, DollarSign, TrendingUp} from 'lucide-react';
import * as XLSX from 'xlsx';
import logo from './assets/Altron Logo - Light 2x.png';

const COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
  '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'
];

const spendStructure = {
  'People': [
    'Salaries', 'Fringe Benefits', 'UIF', 'CODIA', 'AVBOB', 
    'Skills Development Levy', 'Travel Claims', 'Expense Claims', 'Gifts (People)'
  ],
  'Programs': [
    'Agencies and Consulting Services', 'Content Creation', 'Events and Sponsorships', 
    'Marketing Tech and Software', 'Paid Media', 'Production of Physical Branding', 'General'
  ]
};

const segregateSpendType = (spendTypeName, categoryFromFile) => {
  const lowerCaseName = spendTypeName.toLowerCase();
  const lowerCaseCategory = categoryFromFile ? categoryFromFile.toLowerCase() : '';
  
  // Check existing structure first
  if (spendStructure.People.some(s => s.toLowerCase() === lowerCaseName)) return 'people';
  if (spendStructure.Programs.some(s => s.toLowerCase() === lowerCaseName)) return 'programs';

  // AI-based segregation for new items
  const peopleKeywords = ['salaries', 'benefits', 'claim', 'levy', 'uif', 'gifts', 'payroll', 'hr', 'compensation'];
  if (peopleKeywords.some(keyword => lowerCaseName.includes(keyword) || lowerCaseCategory.includes(keyword))) {
    return 'people';
  }

  return 'programs'; // Default to programs if no people keywords are found
};

const BudgetOverview = ({ selectedTeam, onTeamSelect, budgetData, setBudgetData, onDataUpdate }) => {
  const costCenters = Object.keys(budgetData).filter(key => key !== 'financialYear');
  const [primaryFilter, setPrimaryFilter] = useState('all'); // 'all', 'People', 'Programs'
  const [selectedSpendTypes, setSelectedSpendTypes] = useState([]);
  const [teamChartFilters, setTeamChartFilters] = useState({}); // Local filters for each team chart

  const handlePrimaryFilterChange = (e) => {
    const newFilter = e.target.value;
    setPrimaryFilter(newFilter);
    setSelectedSpendTypes([]); // Reset spend types when primary filter changes
  };

  const handleSpendTypeChange = (spendType) => {
    setSelectedSpendTypes(prev => 
      prev.includes(spendType) 
        ? prev.filter(s => s !== spendType) 
        : [...prev, spendType]
    );
  };

  const handleTeamFilterChange = (teamName, filter) => {
    setTeamChartFilters(prev => ({
      ...prev,
      [teamName]: filter,
    }));
  };
  
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 bg-[#1F4659] text-white p-6 overflow-y-auto">
        <div className="mb-4">
          <div>
            <img src={logo} alt="Altron Logo" className="h-20 mx-auto" />
          </div>
        </div>
        
        <h2 className="text-lg font-semibold mb-4 p-3">Cost Centers</h2>
        <nav className="space-y-2 mb-6">
          {costCenters.map((costCenter) => (
            <button
              key={costCenter}
              onClick={() => onTeamSelect(costCenter)}
              className={`w-full text-left p-3 rounded-lg transition-colors text-white hover:bg-[#2A5A70] ${
                selectedTeam === costCenter 
                  ? 'bg-white text-[#1F4659]' 
                  : 'hover:bg-[#2A5A70] text-white'
              }`}
            >
              {budgetData[costCenter].teamName}
            </button>
          ))}
        </nav>

      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-[#1F4659]">Group Budget Overview</h1>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Upload Actuals</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
  
                const reader = new FileReader();
                const processAndSetData = (jsonData) => {
                  const newBudgetData = ((prevData) => {
                    const newData = { ...prevData };
                    const categoryUpdatesByTeam = {};
                    const monthlyUpdatesByTeam = {};
  
                    // 1. Aggregate all updates from the file by team and category
                    jsonData.forEach(row => {
                      // Find keys case-insensitively
                      const costCenterKey = Object.keys(row).find(k => k.toLowerCase() === 'costcenter');
                      const dateKey = Object.keys(row).find(k => k.toLowerCase() === 'date');                      
                      const ccNumber = costCenterKey ? String(row[costCenterKey]) : null;

                      // --- Monthly Actual/Anticipated Update Logic ---
                      if (ccNumber && newData[ccNumber] && dateKey) {
                        const dateValue = row[dateKey];

                        // Find potential value columns
                        const actualKey = Object.keys(row).find(k => k.toLowerCase() === 'actual');
                        const anticipatedKey = Object.keys(row).find(k => k.toLowerCase() === 'anticipated');
                        const amountKey = Object.keys(row).find(k => k.toLowerCase() === 'amount'); // Fallback for actual
                        if (dateValue) {
                          const date = new Date(dateValue);
                          if (!isNaN(date.getTime())) {
                            const monthStr = date.toLocaleString('en-US', { month: 'short' });
                            const yearStr = date.getFullYear().toString().slice(-2);
                            const formattedMonth = `${monthStr}-${yearStr}`;

                            if (!monthlyUpdatesByTeam[ccNumber]) monthlyUpdatesByTeam[ccNumber] = {};
                            if (!monthlyUpdatesByTeam[ccNumber][formattedMonth]) monthlyUpdatesByTeam[ccNumber][formattedMonth] = {};

                            // Update actual if present
                            const actualValue = actualKey ? row[actualKey] : row[amountKey];
                            if (actualValue !== undefined && !isNaN(parseFloat(actualValue))) {
                              monthlyUpdatesByTeam[ccNumber][formattedMonth].actual = (monthlyUpdatesByTeam[ccNumber][formattedMonth].actual || 0) + parseFloat(actualValue);
                            }

                            // Update anticipated if present
                            if (anticipatedKey && row[anticipatedKey] !== undefined && !isNaN(parseFloat(row[anticipatedKey]))) {
                              monthlyUpdatesByTeam[ccNumber][formattedMonth].anticipated = (monthlyUpdatesByTeam[ccNumber][formattedMonth].anticipated || 0) + parseFloat(row[anticipatedKey]);
                            }
                          }
                        }
                      }

                      // --- Spend Type Update Logic ---
                      const spendTypeKey = Object.keys(row).find(k => k.toLowerCase() === 'spend type' || k.toLowerCase() === 'category');
                      const categoryKey = Object.keys(row).find(k => k.toLowerCase() === 'category');
                      const amountKey = Object.keys(row).find(k => k.toLowerCase() === 'amount');

                      if (ccNumber && newData[ccNumber] && spendTypeKey && amountKey) {
                        const spendTypeName = String(row[spendTypeKey]).trim();
                        const categoryFromFile = categoryKey ? String(row[categoryKey]).trim() : null;
                        const amount = parseFloat(row[amountKey]);

                        if (spendTypeName && !isNaN(amount) && categoryFromFile) {
                          if (!categoryUpdatesByTeam[ccNumber]) {
                            categoryUpdatesByTeam[ccNumber] = {};
                          }
                          if (!categoryUpdatesByTeam[ccNumber][spendTypeName]) {
                            categoryUpdatesByTeam[ccNumber][spendTypeName] = 0;
                          }
                          categoryUpdatesByTeam[ccNumber][spendTypeName] += amount;
                          // Store the category from the file to use for segregation
                          if (!categoryUpdatesByTeam[ccNumber].__categories) categoryUpdatesByTeam[ccNumber].__categories = {};
                          categoryUpdatesByTeam[ccNumber].__categories[spendTypeName] = categoryFromFile;
                        }
                      }
                    });
  
                    // 2. Apply the aggregated updates to the budget data
                    for (const ccNumber in categoryUpdatesByTeam) {
                      if (newData[ccNumber]) {
                        const teamData = newData[ccNumber];
                        const categoryUpdates = categoryUpdatesByTeam[ccNumber];
                        const fileCategories = categoryUpdates.__categories || {};
    
                        const peopleMap = new Map(teamData.people.map(p => [p.name, { ...p }]));
                        const programsMap = new Map(teamData.programs.map(p => [p.name, { ...p }]));
  
                        // Update existing categories and add new ones
                        for (const categoryName in categoryUpdates) {
                          const newAmount = categoryUpdates[categoryName];
                          if (categoryName === '__categories') continue; // Skip internal helper property

                          if (peopleMap.has(categoryName)) {
                            peopleMap.get(categoryName).amount = newAmount;
                          } else if (programsMap.has(categoryName)) {
                            programsMap.get(categoryName).amount = newAmount;
                          } else {
                            const categoryFromFile = fileCategories[categoryName];
                            const group = segregateSpendType(categoryName, categoryFromFile);
                            (group === 'people' ? peopleMap : programsMap).set(categoryName, { name: categoryName, amount: newAmount, value: 0 });
                          }
                        }
    
                        const updatedPeople = Array.from(peopleMap.values());
                        const updatedPrograms = Array.from(programsMap.values());
                        const newTotalForTeam = [...updatedPeople, ...updatedPrograms].reduce((sum, s) => sum + s.amount, 0);
    
                        // Recalculate percentages for all categories
                        const finalPeople = updatedPeople.map(p => ({ ...p, value: newTotalForTeam > 0 ? Math.round((p.amount / newTotalForTeam) * 100) : 0 }));
                        const finalPrograms = updatedPrograms.map(p => ({ ...p, value: newTotalForTeam > 0 ? Math.round((p.amount / newTotalForTeam) * 100) : 0 }));
    
                        newData[ccNumber] = { 
                          ...teamData, 
                          people: finalPeople,
                          programs: finalPrograms,
                          categories: [] // Keep this empty as it's deprecated
                        };
                      }
                    }
  
                    // 3. Apply monthly updates
                    for (const ccNumber in monthlyUpdatesByTeam) {
                      if (newData[ccNumber]) {
                        const teamData = newData[ccNumber];
                        const monthUpdates = monthlyUpdatesByTeam[ccNumber];
                        const monthsMap = new Map(teamData.months.map(m => [m.month, { ...m }]));
  
                        for (const monthKey in monthUpdates) {
                          const updates = monthUpdates[monthKey];
                          const existingMonth = monthsMap.get(monthKey);

                          if (existingMonth) {
                            if (updates.actual !== undefined) existingMonth.actual = updates.actual;
                            if (updates.anticipated !== undefined) existingMonth.anticipated = 0;
                          } else {
                            // Add new month if it doesn't exist, ensuring both fields are present
                            const newMonth = { month: monthKey, actual: updates.actual || 0, anticipated: 0 };
                            if (updates.actual === undefined) newMonth.actual = 0; // Default if not in file
                            monthsMap.set(monthKey, newMonth);
                          }
                        }
                        newData[ccNumber] = { ...teamData, months: Array.from(monthsMap.values()) };
                      }
                    }
                    return newData;
                  })(budgetData);
                  onDataUpdate(newBudgetData);
                }

                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                  reader.onload = (event) => {
                    const data = event.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    processAndSetData(jsonData);
                  };
                  reader.readAsArrayBuffer(file);
                } else {
                  // Fallback or CSV handling can go here if needed
                  console.error("Unsupported file type or logic for this file type is missing.");
                }

                e.target.value = null; // Reset file input
              }}
              className="hidden"
            />
          </label>
        </div>
        
        {/* Filter Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <label htmlFor="primaryFilter" className="font-medium text-gray-700">Filter by:</label>
            <select id="primaryFilter" value={primaryFilter} onChange={handlePrimaryFilterChange} className="border rounded p-2">
              <option value="all">All Spend Types</option>
              <option value="People">People</option>
              <option value="Programs">Programs</option>
            </select>
          </div>
          {primaryFilter !== 'all' && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {spendStructure[primaryFilter].map(spendType => (
                  <label key={spendType} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600">
                    <input 
                      type="checkbox" 
                      checked={selectedSpendTypes.includes(spendType)}
                      onChange={() => handleSpendTypeChange(spendType)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {spendType}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {useMemo(() => {
              const getFilteredTotal = (type) => {
                return costCenters.reduce((sum, costCenter) => {
                  const teamData = budgetData[costCenter];
                  const relevantSpend = primaryFilter === 'all' ? [...teamData.people, ...teamData.programs] : teamData[primaryFilter.toLowerCase()] || [];
                  const spendTypesToConsider = selectedSpendTypes.length > 0 ? selectedSpendTypes : relevantSpend.map(s => s.name);
                  const teamTotal = relevantSpend.filter(s => spendTypesToConsider.includes(s.name)).reduce((s, i) => s + i.amount, 0);
                  return sum + (teamData.months.reduce((mSum, m) => mSum + (m[type] || 0), 0) * (teamTotal / ([...teamData.people, ...teamData.programs].reduce((t, i) => t + i.amount, 1) || 1) ));
                }, 0);
              };
              const totalActual = getFilteredTotal('actual');
              const totalAnticipated = getFilteredTotal('anticipated');
              const variance = totalActual - totalAnticipated;
              const averageMonthly = totalActual / 12;
              return (
              <>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Total Actual</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">R{totalActual.toLocaleString()}</span>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Total Anticipated</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">R{totalAnticipated.toLocaleString()}</span>
                </div>
                <div className={`p-4 rounded-lg ${variance >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className={`w-5 h-5 ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`} />
                    <span className={`text-sm font-medium ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>Total Variance</span>
                  </div>
                  <span className={`text-2xl font-bold ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    R{Math.abs(variance).toLocaleString()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Avg Monthly</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-600">R{Math.round(averageMonthly).toLocaleString()}</span>
                </div>
              </>
              );
          }, [budgetData, costCenters, primaryFilter, selectedSpendTypes])}
        </div>
        
        {/* Cost Center Budget Charts - 3 per row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {costCenters.map((costCenter) => {
            const teamData = budgetData[costCenter];
            const allSpendTypes = [...teamData.people, ...teamData.programs];
            const totalTeamBudget = allSpendTypes.reduce((sum, s) => sum + s.amount, 0);

            const chartData = teamData.months.map(month => {
              const monthData = {
                month: month.month,
                actual: month.actual,
                anticipated: month.anticipated,
              };
              allSpendTypes.forEach(spendType => {
                const proportion = totalTeamBudget > 0 ? spendType.amount / totalTeamBudget : 0;
                monthData[spendType.name] = month.actual * proportion;
              });
              return monthData;
            });

            return (
              <div key={costCenter} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">{teamData.teamName}</h3>
                  <div className="flex border border-gray-200 rounded-md p-0.5">
                    {['All', 'People', 'Programs'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => handleTeamFilterChange(costCenter, filter.toLowerCase())}
                        className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${
                          (teamChartFilters[costCenter] || 'all') === filter.toLowerCase() ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >{filter}</button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{(teamChartFilters[costCenter] || 'all') === 'all' ? 'Actual vs. Anticipated Spend' : `Monthly spend breakdown for ${teamChartFilters[costCenter]}.`}</p>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {(teamChartFilters[costCenter] || 'all') === 'all' ? (
                        <BarChart data={teamData.months}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" fontSize={10} angle={-45} textAnchor="end" height={50} />
                          <YAxis fontSize={10} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip formatter={(value, name) => [`R${value.toLocaleString()}`, name]} labelStyle={{ color: '#333' }} />
                          <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="rect" />
                          <Bar dataKey="actual" fill="#3B82F6" name="Actual" />
                          <Bar dataKey="anticipated" fill="#F97316" name="Anticipated" barSize={0}/>
                        </BarChart>
                    ) : (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" fontSize={10} angle={-45} textAnchor="end" height={50} />
                          <YAxis fontSize={10} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip formatter={(value, name) => [`R${value.toLocaleString()}`, name]} labelStyle={{ color: '#333' }} />
                          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} iconType="circle" iconSize={8} />
                          {(teamData[teamChartFilters[costCenter]] || allSpendTypes)
                            .map((spendType, index) => (
                              <Bar key={spendType.name} dataKey={spendType.name} stackId="a" name={spendType.name} fill={COLORS[index % COLORS.length]} />
                            ))
                          }
                        </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                
                {/* Team Summary */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-blue-600 font-medium">Total Actual</div>
                    <div className="text-blue-800 font-semibold">R{teamData.months.reduce((sum, month) => sum + month.actual, 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="text-orange-600 font-medium">Total Anticipated</div>
                    <div className="text-orange-800 font-semibold">R{teamData.months.reduce((sum, month) => sum + month.anticipated, 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetOverview;