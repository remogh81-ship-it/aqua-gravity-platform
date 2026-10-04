import React, { useState } from 'react';
import { evaluateWaterSample } from './api';
import { Droplet, Activity, FlaskConical, ShieldCheck, AlertTriangle, Printer, ArrowRight, Upload, Download, X, PlusCircle, Radar } from 'lucide-react';

function App() {
  const [language, setLanguage] = useState('ar');
  
  // Safe defaults for parameters not provided by the lab (0 for most, 7 for pH, 25 for temp)
  const safeDefaults = {
    flow_rate: 25000, temperature: 25, turbidity: 0.0, ph: 7.0,
    tds: 0.0, total_hardness: 0.0, calcium_hardness: 0.0, total_alkalinity: 0.0,
    iron: 0.0, manganese: 0.0, nitrate: 0.0, nitrite: 0.0,
    sulfate: 0.0, chloride: 0.0, fluoride: 0.0, aluminum: 0.0, lead: 0.0,
    free_chlorine: 0.0, total_coliform: 0.0, e_coli: 0.0, sodium: 0.0, potassium: 0.0
  };

  const initialActive = ['flow_rate', 'temperature', 'turbidity', 'ph', 'tds', 'total_hardness', 'iron', 'free_chlorine'];
  
  const [activeFields, setActiveFields] = useState(initialActive);
  const [formData, setFormData] = useState({
    flow_rate: 25000, temperature: 22, turbidity: 0.8, ph: 7.2,
    tds: 420, total_hardness: 180, iron: 0.1, free_chlorine: 1.0
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseFloat(value) || 0 });
  };

  const addField = (e) => {
    const field = e.target.value;
    if (field && !activeFields.includes(field)) {
      setActiveFields([...activeFields, field]);
      setFormData({ ...formData, [field]: safeDefaults[field] });
    }
    e.target.value = ""; 
  };

  const removeField = (fieldToRemove) => {
    setActiveFields(activeFields.filter(f => f !== fieldToRemove));
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    const payload = { ...safeDefaults };
    activeFields.forEach(field => {
      payload[field] = formData[field] !== undefined ? formData[field] : safeDefaults[field];
    });

    try {
      const data = await evaluateWaterSample(payload);
      setResults(data);
    } catch (err) {
      setError(language === 'ar' 
        ? "تعذر الاتصال بالخادم. يرجى الانتظار لتحديث Vercel والمحاولة ثانية." 
        : "Connection failed. Please wait for Vercel to redeploy.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = Object.keys(safeDefaults).join(',');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "AquaGravity_Full_Template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const smartParseCSV = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.replace(/"/g, '').toLowerCase());
    
    const aliases = {
      flow_rate: ['flow', 'تدفق', 'تصرف'],
      temperature: ['temp', 'حرار', 'celsius'],
      turbidity: ['turb', 'عكار', 'ntu'],
      ph: ['ph', 'أس', 'هيدروجين'],
      tds: ['tds', 'صلبة', 'dissolved'],
      total_hardness: ['total hardness', 'عسر كلي', 'hardness'],
      calcium_hardness: ['calcium', 'عسر كالسيوم', 'ca'],
      total_alkalinity: ['alkalin', 'قلوية'],
      iron: ['iron', 'fe', 'حديد'],
      manganese: ['mangan', 'mn', 'منجن'],
      nitrate: ['nitrate', 'no3', 'نترات'],
      nitrite: ['nitrite', 'no2', 'نتريت'],
      sulfate: ['sulfat', 'so4', 'كبريتات'],
      chloride: ['chlorid', 'cl', 'كلوريد'],
      fluoride: ['fluorid', 'f', 'فلوريد'],
      aluminum: ['alumin', 'al', 'ألمن', 'المن'],
      lead: ['lead', 'pb', 'رصاص'],
      free_chlorine: ['free chlor', 'كلور حر', 'متبق'],
      total_coliform: ['coliform', 'قولون'],
      e_coli: ['coli', 'إي كولاي', 'كولاي'],
      sodium: ['sodium', 'na', 'صوديوم'],
      potassium: ['potassium', 'k', 'بوتاسيوم']
    };

    let extractedData = {};
    let foundAny = false;

    lines.forEach(line => {
      const numbers = line.match(/[-+]?[0-9]*\.?[0-9]+/g);
      if (numbers && numbers.length > 0) {
        Object.keys(aliases).forEach(key => {
          if (extractedData[key] === undefined) {
            if (aliases[key].some(alias => line.includes(alias))) {
              extractedData[key] = parseFloat(numbers[numbers.length - 1]);
              foundAny = true;
            }
          }
        });
      }
    });

    if (Object.keys(extractedData).length < 3 && lines.length >= 2) {
       let headerRowIdx = -1;
       let headerMap = {};
       
       for (let i = 0; i < lines.length; i++) {
         const cells = lines[i].split(/[,;\t]/);
         let matchCount = 0;
         cells.forEach((cell, colIdx) => {
           Object.keys(aliases).forEach(key => {
             if (aliases[key].some(alias => cell.includes(alias))) {
               headerMap[key] = colIdx;
               matchCount++;
             }
           });
         });
         if (matchCount > 3) {
           headerRowIdx = i;
           break;
         }
       }

       if (headerRowIdx !== -1 && headerRowIdx + 1 < lines.length) {
          const valueCells = lines[headerRowIdx + 1].split(/[,;\t]/);
          Object.keys(headerMap).forEach(key => {
            const colIdx = headerMap[key];
            if (valueCells[colIdx]) {
              const numMatch = valueCells[colIdx].match(/[-+]?[0-9]*\.?[0-9]+/);
              if (numMatch) {
                extractedData[key] = parseFloat(numMatch[0]);
                foundAny = true;
              }
            }
          });
       }
    }
    return { data: extractedData, success: foundAny };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const result = smartParseCSV(text);

        if (result.success) {
          const foundKeys = Object.keys(result.data);
          setActiveFields(prev => Array.from(new Set([...prev, ...foundKeys])));
          setFormData(prev => ({ ...prev, ...result.data }));
          
          alert(language === 'ar' ? `نجاح! تم التعرف على ${foundKeys.length} عنصراً.` : `Success! Recognized ${foundKeys.length} parameters.`);
        } else {
          alert(language === 'ar' ? 'لم يتم العثور على بيانات قابلة للقراءة.' : 'No readable data found.');
        }
      } catch (err) {
        alert(language === 'ar' ? 'حدث خطأ أثناء قراءة الملف.' : 'Error reading file.');
      }
    };
    
    reader.readAsText(file);
    e.target.value = null; 
  };

  const isAr = language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const availableFieldsToAdd = Object.keys(safeDefaults).filter(k => !activeFields.includes(k));

  return (
    <div dir={dir} className="min-h-screen bg-slate-100 font-sans text-slate-800 print:bg-white print:text-black">
      {/* Header */}
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
              <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded flex gap-2 items-center transition-colors">
                <Printer size={18} /> {isAr ? 'تصدير PDF' : 'Export PDF'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold">AquaGravity Engineering Report</h1>
        <p className="text-gray-500">Decree 458/2007 Compliance & Process Design</p>
      </div>
      
      <main className="container mx-auto p-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:p-0">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600 print:mb-6 print:shadow-none print:border-gray-300 print:border">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-xl font-bold flex items-center gap-2 print:text-black">
              <FlaskConical className="text-blue-600"/> {isAr ? 'البيانات المخبرية' : 'Lab Data'}
            </h2>
          </div>

          <div className="flex flex-col gap-2 mb-6 p-4 bg-slate-50 border rounded-lg print:hidden">
            <div className="flex gap-2">
              <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer py-2 rounded flex justify-center items-center gap-1 text-sm transition-colors shadow-sm">
                <Upload size={16} /> {isAr ? 'الاستيراد الذكي للنتائج' : 'Smart Upload'}
                <input type="file" accept=".csv, .txt, .tsv" className="hidden" onChange={handleFileUpload} />
              </label>
              <button onClick={downloadTemplate} title={isAr ? "تحميل نموذج فارغ" : "Download Template"} className="bg-white border border-blue-600 text-blue-700 hover:bg-blue-50 px-3 py-2 rounded flex justify-center items-center transition-colors">
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 print:grid-cols-4 print:gap-2">
            {activeFields.map((key) => (
              <div key={key} className="flex flex-col relative group">
                <label className="text-xs font-bold text-slate-500 mb-1 capitalize flex justify-between items-center">
                  <span className="truncate" title={key.replace(/_/g, ' ')}>{key.replace(/_/g, ' ')}</span>
                  <button 
                    onClick={() => removeField(key)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                    title={isAr ? "حذف العنصر" : "Remove"}
                  >
                    <X size={14} />
                  </button>
                </label>
                <input 
                  type="number" 
                  name={key} 
                  value={formData[key] || ''} 
                  onChange={handleInputChange}
                  placeholder="0"
                  className="p-1.5 border border-slate-200 rounded bg-slate-50 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all print:border-none print:bg-transparent print:font-bold print:p-0"
                  step="any"
                />
              </div>
            ))}
          </div>

          {availableFieldsToAdd.length > 0 && (
            <div className="mt-4 print:hidden border-t pt-4 border-dashed border-slate-200">
              <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                <PlusCircle size={14} className="text-emerald-600"/> 
                {isAr ? 'إضافة عنصر جديد:' : 'Add parameter:'}
              </label>
              <select 
                className="w-full p-2 border rounded bg-slate-50 text-sm outline-none cursor-pointer"
                onChange={addField}
                defaultValue=""
              >
                <option value="" disabled>{isAr ? '-- اختر العنصر --' : '-- Select Parameter --'}</option>
                {availableFieldsToAdd.map(field => (
                  <option key={field} value={field}>{field.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-6 print:hidden shadow-md"
          >
            {loading ? <Activity className="animate-spin" /> : <ShieldCheck />}
            {isAr ? 'تحليل هندسي شامل' : 'Run Full Analysis'}
          </button>
          
          {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg print:hidden text-sm">{error}</div>}
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
              {/* Intelligent Water Classification Banner */}
              <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-md flex items-center gap-4 print:bg-white print:text-black print:border-2 print:border-indigo-900 print:shadow-none">
                <div className="bg-indigo-700 p-3 rounded-full print:hidden">
                  <Radar className="w-8 h-8 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-1 print:text-slate-500">
                    {isAr ? 'البصمة الكيميائية (تصنيف مصدر المياه)' : 'Chemical Fingerprint (Water Source)'}
                  </h3>
                  <div className="text-2xl font-black">{results.water_type}</div>
                </div>
              </div>

              {/* Compliance & WQI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                <div className={`p-6 rounded-xl shadow-md text-white print:text-black print:border print:border-gray-300 print:shadow-none ${results.compliance.is_compliant ? 'bg-emerald-600' : 'bg-red-600 print:bg-white'}`}>
                  <h3 className="text-lg font-bold mb-2 opacity-90">{isAr ? 'الامتثال التنظيمي' : 'Regulatory Compliance'}</h3>
                  <div className="text-3xl font-black mb-4">
                    {results.compliance.is_compliant ? (isAr ? 'مطابق لقرار 458' : 'Compliant') : (isAr ? 'غير مطابق' : 'Non-Compliant')}
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
                      <span className="font-bold text-amber-700 truncate ml-2" title={results.dosage.reagent}>{results.dosage.reagent}</span>
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

              {/* Treatment Train PFD */}
              <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-slate-800 print:shadow-none print:border print:border-gray-300 print:mt-4">
                <h3 className="text-lg font-bold text-slate-700 mb-6">{isAr ? 'مخطط سير المعالجة المقترح (PFD)' : 'Process Flow Diagram (PFD)'}</h3>
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
