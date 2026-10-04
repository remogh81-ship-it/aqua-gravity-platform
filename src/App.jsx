import React, { useState } from 'react';
import { evaluateWaterSample } from './api';
import { Droplet, Activity, FlaskConical, ShieldCheck, AlertTriangle, Printer, ArrowRight } from 'lucide-react';

function App() {
  const [language, setLanguage] = useState('ar');
  const [formData, setFormData] = useState({
    flow_rate: 25000, temperature: 22, turbidity: 0.8, ph: 7.2,
    tds: 420, total_hardness: 180, calcium_hardness: 120, total_alkalinity: 95,
    iron: 0.1, manganese: 0.05, nitrate: 10.0, nitrite: 0.0,
    sulfate: 150, chloride: 200, fluoride: 0.5, aluminum: 0.05, lead: 0.0,
    free_chlorine: 1.0, total_coliform: 0, e_coli: 0
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
        ? "تعذر الاتصال بالخادم. يرجى الانتظار لتحديث Vercel والمحاولة ثانية." 
        : "Connection failed. Please wait for Vercel to redeploy.");
    } finally {
      setLoading(false);
    }
  };

  const isAr = language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const printPDF = () => {
    window.print();
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-100 font-sans text-slate-800 print:bg-white print:text-black">
      {/* Header - Hidden on Print */}
      <header className="bg-blue-900 text-white p-4 shadow-lg print:hidden">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplet className="w-8 h-8 text-blue-300" />
            <h1 className="text-2xl font-bold">AquaGravity | Engineering</h1>
          </div>
          <div className="flex gap-4">
            <select 
              className="bg-blue-800 border border-blue-600 p-2 rounded outline-none"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="ar">العربية (AR)</option>
              <option value="en">English (EN)</option>
            </select>
            {results && (
              <button onClick={printPDF} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded flex gap-2 items-center">
                <Printer size={18} /> {isAr ? 'تصدير PDF' : 'Export PDF'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Print Header - Visible ONLY on Print */}
      <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold">AquaGravity Engineering Report</h1>
        <p className="text-gray-500">Decree 458/2007 Compliance & Process Design</p>
      </div>
      
      <main className="container mx-auto p-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:p-0">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600 print:mb-6 print:shadow-none print:border-gray-300 print:border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 print:text-black">
            <FlaskConical className="text-blue-600 print:hidden"/> {isAr ? 'المدخلات الكيميائية والبيولوجية' : 'Chemical & Biological Inputs'}
          </h2>
          <div className="grid grid-cols-2 gap-3 print:grid-cols-4">
            {Object.keys(formData).map((key) => (
              <div key={key} className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 mb-1 capitalize truncate" title={key.replace(/_/g, ' ')}>
                  {key.replace(/_/g, ' ')}
                </label>
                <input 
                  type="number" 
                  name={key} 
                  value={formData[key]} 
                  onChange={handleInputChange}
                  className="p-1 border rounded bg-slate-50 outline-none text-sm print:border-none print:bg-transparent print:font-bold"
                  step="any"
                />
              </div>
            ))}
          </div>
          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-6 print:hidden"
          >
            {loading ? <Activity className="animate-spin" /> : <ShieldCheck />}
            {isAr ? 'تحليل هندسي شامل' : 'Run Full Engineering Analysis'}
          </button>
          {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg print:hidden">{error}</div>}
        </div>

        {/* Right Column: Results Dashboard */}
        <div className="lg:col-span-2 space-y-6 print:block">
          {!results ? (
            <div className="bg-white p-10 rounded-xl shadow-md text-center text-slate-400 flex flex-col items-center justify-center h-full border-2 border-dashed print:hidden">
              <Activity className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg">{isAr ? 'في انتظار إدخال البيانات...' : 'Waiting for data...'}</p>
            </div>
          ) : (
            <>
              {/* Compliance & WQI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                <div className={`p-6 rounded-xl shadow-md text-white print:text-black print:border print:border-gray-300 print:shadow-none ${results.compliance.is_compliant ? 'bg-emerald-600' : 'bg-red-600 print:bg-white'}`}>
                  <h3 className="text-lg font-bold mb-2 opacity-90">{isAr ? 'الامتثال التنظيمي' : 'Regulatory Compliance'}</h3>
                  <div className="text-3xl font-black mb-4">
                    {results.compliance.is_compliant ? (isAr ? 'مطابق' : 'Compliant') : (isAr ? 'غير مطابق' : 'Non-Compliant')}
                  </div>
                  {!results.compliance.is_compliant && (
                    <ul className="list-disc list-inside text-sm bg-black/20 p-3 rounded print:bg-transparent print:text-red-700">
                      {results.compliance.violations.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-600 print:shadow-none print:border print:border-gray-300">
                  <h3 className="text-lg font-bold text-slate-700 mb-2">{isAr ? 'مؤشر جودة المياه (WQI)' : 'Water Quality Index'}</h3>
                  <div className="text-5xl font-black text-indigo-600 mb-2">{results.wqi.wqi_value}</div>
                  <div className="text-lg font-semibold text-slate-600">Grade: {results.wqi.grade}</div>
                </div>
              </div>

              {/* Stability & Dosage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:mt-4">
                <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-cyan-600 print:shadow-none print:border print:border-gray-300">
                  <h3 className="text-lg font-bold text-slate-700 mb-4">{isAr ? 'الاستقرار الهيدروكيميائي' : 'Hydrochemical Stability'}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">LSI (Langelier):</span>
                      <span className="font-bold">{results.stability.lsi} <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">({results.stability.lsi_status})</span></span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">RSI (Ryznar):</span>
                      <span className="font-bold">{results.stability.rsi} <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">({results.stability.rsi_status})</span></span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-amber-500 print:shadow-none print:border print:border-gray-300">
                  <h3 className="text-lg font-bold text-slate-700 mb-4">{isAr ? 'التكييف الكيميائي' : 'Chemical Dosing'}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Reagent:</span>
                      <span className="font-bold text-amber-700">{results.dosage.reagent}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Dose (mg/L):</span>
                      <span className="font-bold">{results.dosage.dosage_mg_l}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Consumption (kg/d):</span>
                      <span className="font-bold">{results.dosage.daily_consumption_kg}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment Train PFD (Process Flow Diagram) */}
              <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-slate-800 print:shadow-none print:border print:border-gray-300 print:mt-4">
                <h3 className="text-lg font-bold text-slate-700 mb-6">{isAr ? 'مخطط سير المعالجة (PFD)' : 'Process Flow Diagram (PFD)'}</h3>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {results.treatment_train.stages.map((stage, i) => (
                    <React.Fragment key={i}>
                      <div className="bg-slate-800 text-white px-4 py-3 rounded-md font-semibold text-center text-sm shadow-sm w-40 h-20 flex items-center justify-center print:bg-white print:text-black print:border-2 print:border-black">
                        {stage}
                      </div>
                      {i < results.treatment_train.stages.length - 1 && (
                        <ArrowRight className="text-slate-400 print:text-black w-6 h-6 shrink-0" />
                      )}
                    </React.Fragment>
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
