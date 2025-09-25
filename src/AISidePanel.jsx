import React, { useState, useEffect } from 'react';

// Define the base URL for the backend API (should match BudgetVisualisation.jsx)
const API_BASE_URL = 'http://localhost:3001/api';

// Define the prompts configuration
const promptsConfig = {
  yearly: [
    { id: 'yearly_summary', text: 'Give me a summary of my yearly spending trends.' },
    { id: 'yearly_biggest_category', text: 'What is my biggest spending category this year?' },
    { id: 'yearly_variance_drivers', text: 'Which categories have the biggest budget variances?' }
  ],
  monthly: [
    { id: 'monthly_summary', text: 'Summarize my spending for this month.' },
    { id: 'monthly_vs_budget', text: 'How does my spending compare to the budget this month?' },
    { id: 'monthly_anomaly', text: 'Are there any unusual spending patterns this month?' },
    { id: 'monthly_top_subcategory_details', text: 'What are the main expenses in my highest spending category?' }
  ]
};

// Basic styling (inline for simplicity, consider moving to CSS)
const panelStyle = {
  position: 'fixed',
  right: '0',
  top: '0',
  height: '100vh',
  width: '300px', // Adjust width as needed
  backgroundColor: 'white',
  borderLeft: '1px solid #ccc',
  boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
  padding: '20px',
  transform: 'translateX(100%)',
  transition: 'transform 0.3s ease-in-out',
  zIndex: 1000,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const panelOpenStyle = {
  transform: 'translateX(0)',
};

const buttonStyle = {
  display: 'block',
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  textAlign: 'left',
  backgroundColor: '#f0f0f0',
  border: '1px solid #ddd',
  borderRadius: '4px',
  cursor: 'pointer',
};

const closeButtonStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
};

const resultAreaStyle = {
    marginTop: '20px',
    padding: '15px',
    border: '1px solid #eee',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
    flexGrow: 1, // Allow result area to take remaining space
    overflowY: 'auto', // Scroll if content overflows
    whiteSpace: 'pre-wrap', // Preserve whitespace and wrap text
};

const errorStyle = {
    color: 'red',
    marginTop: '10px',
};

const loadingStyle = {
    marginTop: '10px',
    fontStyle: 'italic',
};

function AISidePanel({ isOpen, currentContext, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [insightResult, setInsightResult] = useState(null);
  const [error, setError] = useState(null);
  // Add state for caching insights
  const [insightCache, setInsightCache] = useState({});

  // Clear results and cache when context changes or panel closes
  useEffect(() => {
    setInsightResult(null);
    setError(null);
    // Clear cache when context changes
    setInsightCache({});
  }, [currentContext, isOpen]);

  const handleInsightRequest = async (promptId) => {
    if (!currentContext) {
      setError("Cannot request insight: context is missing.");
      return;
    }

    // Create a unique cache key for the request
    const cacheKey = `${promptId}-${currentContext.view}${currentContext.month ? '-' + currentContext.month : ''}`;

    // Check if the insight is already in the cache
    if (insightCache[cacheKey]) {
      console.log(`Fetching insight from cache for key: ${cacheKey}`);
      setInsightResult(insightCache[cacheKey]);
      setError(null); // Clear any previous errors
      setIsLoading(false); // Ensure loading state is false
      return; // Exit the function, no API call needed
    }

    setIsLoading(true);
    setInsightResult(null);
    setError(null);

    try {
      const apiUrl = `${API_BASE_URL}/ai/insight`; // Use absolute URL
      console.log(`Fetching AI insight from: ${apiUrl}`); // Add log for debugging

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptId, context: currentContext }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific rate limit error, otherwise generic error
        const errorMessage = data.error || `HTTP error! status: ${response.status}`;
        console.error("AI Insight API Error:", errorMessage);
        setError(errorMessage);
        setInsightResult(null); // Ensure result is null on error
      } else {
        const result = data.insight || "Received empty insight.";
        setInsightResult(result);
        // Store the successful result in the cache
        setInsightCache(prevCache => ({
            ...prevCache,
            [cacheKey]: result
        }));
      }
    } catch (err) {
      console.error("Failed to fetch AI insight:", err);
      setError(`Failed to fetch insight. ${err.message}`);
      setInsightResult(null); // Ensure result is null on error
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which prompts to show based on context
  const availablePrompts = currentContext?.view ? promptsConfig[currentContext.view] || [] : [];

  return (
    <div style={{ ...panelStyle, ...(isOpen ? panelOpenStyle : {}) }}>
        <button onClick={onClose} style={closeButtonStyle} aria-label="Close AI Panel">&times;</button>
        <h3>AI Insights</h3>
        <p>Context: {currentContext?.view} {currentContext?.month ? `- ${currentContext.month}` : ''}</p>
        <hr style={{ margin: '10px 0' }} />

        {availablePrompts.length > 0 ? (
            availablePrompts.map(prompt => (
            <button
                key={prompt.id}
                style={buttonStyle}
                onClick={() => handleInsightRequest(prompt.id)}
                disabled={isLoading}
            >
                {prompt.text}
            </button>
            ))
        ) : (
            <p>No insights available for the current view.</p>
        )}

        <div style={resultAreaStyle}>
            <h4>Result:</h4>
            {isLoading && <p style={loadingStyle}>Generating insight...</p>}
            {error && <p style={errorStyle}>Error: {error}</p>}
            {insightResult && <p>{insightResult}</p>}
            {!isLoading && !error && !insightResult && <p>Click a button above to request an insight.</p>}
        </div>
    </div>
  );
}

export default AISidePanel;
