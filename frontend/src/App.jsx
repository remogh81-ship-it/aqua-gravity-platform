import React, { useState } from 'react'

function App() {
  const [language, setLanguage] = useState('ar')
  
  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'dir-rtl' : 'dir-ltr'}`}>
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">AquaGravity Platform</h1>
          <select 
            className="bg-blue-700 border-none p-2 rounded text-white"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="zh">中文</option>
            <option value="ru">Русский</option>
          </select>
        </div>
      </header>
      
      <main className="container mx-auto p-4 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Water Quality Assessment Dashboard</h2>
          <p className="text-gray-600">
            Frontend UI components (SampleInputGrid, WqiGaugeCard, StabilityPanel, DosingCalculator, TreatmentTrain) 
            are scaffolded and ready to be integrated with the FastAPI backend.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
