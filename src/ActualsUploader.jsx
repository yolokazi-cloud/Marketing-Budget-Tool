import React, { useState, useCallback } from 'react';

// Define the base URL for the backend API (same as in App.js)
const API_BASE_URL = 'http://localhost:3001/api';

function ActualsUploader() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [monthKey, setMonthKey] = useState(''); // e.g., "Mar-25"
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | success | error
  const [message, setMessage] = useState(''); // Feedback message

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadStatus('idle'); // Reset status on new file selection
    setMessage('');
  };

  const handleMonthChange = (event) => {
    setMonthKey(event.target.value.trim());
    setUploadStatus('idle');
    setMessage('');
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setMessage('Please select an Excel file first.');
      return;
    }
    if (!monthKey || !/^[A-Za-z]{3}-\d{2}$/.test(monthKey)) {
        // Basic validation for MMM-YY format
      setMessage('Please enter the month key in MMM-YY format (e.g., Mar-25).');
      return;
    }

    setUploadStatus('uploading');
    setMessage(`Uploading ${selectedFile.name} for ${monthKey}...`);

    const formData = new FormData();
    // 'actualsFile' must match the field name expected by multer on the backend
    formData.append('actualsFile', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/actuals/upload/${monthKey}`, {
        method: 'POST',
        body: formData, // FormData sets the Content-Type header automatically
      });

      const result = await response.json(); // Attempt to parse JSON response body

      if (!response.ok) {
        // Use error message from backend response if available
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setUploadStatus('success');
      setMessage(result.message || `Successfully uploaded and processed actuals for ${monthKey}.`);
      // Optionally clear file input after successful upload
      // setSelectedFile(null);
      // document.getElementById('actuals-file-input').value = null; // Reset file input visually

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setMessage(`Upload failed: ${error.message}`);
    }
  }, [selectedFile, monthKey]);

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Monthly Actuals</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="month-key-input" className="block text-sm font-medium text-gray-700 mb-1">
            Month Key (e.g., Mar-25):
          </label>
          <input
            type="text"
            id="month-key-input"
            value={monthKey}
            onChange={handleMonthChange}
            placeholder="MMM-YY"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="actuals-file-input" className="block text-sm font-medium text-gray-700 mb-1">
            Select Excel File (.xlsx, .xls):
          </label>
          <input
            type="file"
            id="actuals-file-input"
            accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || !monthKey || uploadStatus === 'uploading'}
          className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            uploadStatus === 'uploading'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          } disabled:opacity-50`}
        >
          {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Actuals File'}
        </button>
        {message && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${
              uploadStatus === 'success'
                ? 'bg-green-100 text-green-800'
                : uploadStatus === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActualsUploader;

