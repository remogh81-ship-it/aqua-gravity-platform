import React, { useState } from 'react';
import { evaluateWaterSample } from './api';
import { Droplet, Activity, FlaskConical, ShieldCheck, AlertTriangle } from 'lucide-react';

function App() {
  const [language, setLanguage] = useState('ar');
  const [formData, setFormData] = useState({
    flow_rate: 25000,
    temperature: 22,
    turbidity: 0.8,
    ph: 7.2,
    tds: 420,
    total_hardness: 180,
    calcium_hardness: 120,
    total_alkalinity: 95,
    iron: 0.1,
    manganese: 0.05,
    nitrate: 10.0,
    nitrite: 0.0,
    e_coli: 0
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseFloat(value) || 0 });
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await evaluateWaterSample(formData);
      setResults(data);
    } catch (err) {
      setError(language === 'ar' 
        ? "تعذر الاتصال بالخادم (Backend). يرجى التأكد من استضافة الباك إند وتحديث رابط الـ API في ملف api.js."
        : "Cannot connect to Backend. Ensure backend is deployed and api.js baseURL is updated.");
    } finally {
      setLoading(false);
    }
  };

  const isAr = language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const t = {
    title: isAr ? 'أكوا-جرافيتي | هندسة المياه' : 'AquaGravity | Water Engineering',
    analyzeBtn: isAr ? 'تحليل العينة' : 'Analyze Sample',
    inputs: isAr ? 'المدخلات المخبرية' : 'Laboratory Inputs',
    results: isAr ? 'التقرير الهندسي الشامل' : 'Comprehensive Engineering Report',
    compliance: isAr ? 'الامتثال التنظيمي (قرار 458)' : 'Regulatory Compliance (Decree 458)',
    wqi: isAr ? 'مؤشر جودة المياه (WQI)' : 'Water Quality Index (WQI)',
    stability: isAr ? 'الاستقرار الهيدروكيميائي' : 'Hydrochemical Stability',
    dosage: isAr ? 'التكييف الكيميائي (الجرعات)' : 'Chemical Conditioning (Dosage)',
    treatment: isAr ? 'قطار المعالجة المقترح' : 'Proposed Treatment Train',
    compliant: isAr ? 'مطابق للمواصفات' : 'Compliant',
    nonCompliant: isAr ? 'غير مطابق' : 'Non-Compliant',
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplet className="w-8 h-8 text-blue-300" />
            <h1 className="text-2xl font-bold">{t.title}</h1>
          </div>
          <select 
            className="bg-blue-800 border border-blue-600 p-2 rounded text-white outline-none"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="ar">العربية (Arabic)</option>
            <option value="en">English (English)</option>
          </select>
        </div>
      </header>
      
      <main className="container mx-auto p-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FlaskConical className="text-blue-600"/> {t.inputs}
          </h2>
          <div className="space-y-4">
            {Object.keys(formData).map((key) => (
              <div key={key} className="flex flex-col">
                <label className="text-sm font-semibold text-slate-600 mb-1 capitalize">
                  {key.replace('_', ' ')}
                </label>
                <input 
                  type="number" 
                  name={key} 
                  value={formData[key]} 
                  onChange={handleInputChange}
                  className="p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  step="any"
                />
              </div>
            ))}
            <button 
              onClick={runAnalysis}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4"
            >
              {loading ? <Activity className="animate-spin" /> : <ShieldCheck />}
              {t.analyzeBtn}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-start gap-2">
              <AlertTriangle className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Results Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {!results ? (
            <div className="bg-white p-10 rounded-xl shadow-md text-center text-slate-400 flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-200">
              <Activity className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg">أدخل البيانات واضغط على "تحليل العينة" لبناء التقرير.</p>
            </div>
          ) : (
            <>
              {/* Compliance & WQI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-xl shadow-md text-white ${results.compliance.is_compliant ? 'bg-emerald-600' : 'bg-red-600'}`}>
                  <h3 className="text-lg font-bold mb-2 opacity-90">{t.compliance}</h3>
                  <div className="text-3xl font-black mb-4">
                    {results.compliance.is_compliant ? t.compliant : t.nonCompliant}
                  </div>
                  {!results.compliance.is_compliant && (
                    <ul className="list-disc list-inside text-sm bg-black/20 p-3 rounded">
                      {results.compliance.violations.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-600">
                  <h3 className="text-lg font-bold text-slate-700 mb-2">{t.wqi}</h3>
                  <div className="text-5xl font-black text-indigo-600 mb-2">{results.wqi.wqi_value}</div>
                  <div className="text-lg font-semibold text-slate-600">Grade: {results.wqi.grade}</div>
                </div>
              </div>

              {/* Stability & Dosage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-cyan-600">
                  <h3 className="text-lg font-bold text-slate-700 mb-4">{t.stability}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">LSI (Langelier):</span>
                      <span className="font-bold">{results.stability.lsi} <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">({results.stability.lsi_status})</span></span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">RSI (Ryznar):</span>
                      <span className="font-bold">{results.stability.rsi} <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">({results.stability.rsi_status})</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Saturation pH (pHs):</span>
                      <span className="font-bold">{results.stability.phs}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-amber-500">
                  <h3 className="text-lg font-bold text-slate-700 mb-4">{t.dosage}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Reagent:</span>
                      <span className="font-bold text-amber-700">{results.dosage.reagent}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Target Dose:</span>
                      <span className="font-bold">{results.dosage.dosage_mg_l} mg/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Daily Consumption:</span>
                      <span className="font-bold">{results.dosage.daily_consumption_kg} kg/day</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment Train */}
              <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-slate-800">
                <h3 className="text-lg font-bold text-slate-700 mb-4">{t.treatment}</h3>
                <div className="flex flex-wrap gap-2">
                  {results.treatment_train.stages.map((stage, i) => (
                    <div key={i} className="flex items-center">
                      <div className="bg-slate-100 text-slate-800 px-4 py-2 rounded-lg font-semibold text-sm border border-slate-200">
                        {stage}
                      </div>
                      {i < results.treatment_train.stages.length - 1 && (
                        <div className="text-slate-400 mx-2">➔</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
