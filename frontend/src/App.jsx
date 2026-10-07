import React, { useState } from 'react';
import { evaluateWaterSample } from './api';
import { Droplet, Activity, FlaskConical, ShieldCheck, Printer, ArrowRight, Upload, Download, X, PlusCircle, Radar, Bug, Info } from 'lucide-react';

function App() {
  const [language, setLanguage] = useState('ar');
  
  // Safe defaults for parameters not provided by the lab
  const safeDefaults = {
    flow_rate: 25000, temperature: 25, turbidity: 0.0, ph: 7.0,
    tds: 0.0, total_hardness: 0.0, calcium_hardness: 0.0, total_alkalinity: 0.0,
    iron: 0.0, manganese: 0.0, nitrate: 0.0, nitrite: 0.0,
    sulfate: 0.0, chloride: 0.0, fluoride: 0.0, aluminum: 0.0, lead: 0.0,
    free_chlorine: 0.0, total_coliform: 0.0, e_coli: 0.0, sodium: 0.0, potassium: 0.0,
    ammonia: 0.0, phosphorous: 0.0, bod: 0.0, cod: 0.0, 
    total_algae: 0.0, blue_green_algae: 0.0, parasites: 0.0
  };

  const initialActive = ['flow_rate', 'temperature', 'turbidity', 'ph', 'tds', 'total_hardness', 'iron', 'total_algae', 'blue_green_algae'];
  
  const [activeFields, setActiveFields] = useState(initialActive);
  const [formData, setFormData] = useState({
    flow_rate: 25000, temperature: 22, turbidity: 0.8, ph: 7.2,
    tds: 420, total_hardness: 180, iron: 0.1, total_algae: 0.0, blue_green_algae: 0.0
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatLabel = (key) => {
    const specialCases = {
      'ph': 'pH',
      'tds': 'TDS',
      'bod': 'BOD',
      'cod': 'COD',
      'e_coli': 'E. Coli',
      'phosphorous': 'Phosphorus',
      'total_algae': 'Total Algae',
      'blue_green_algae': 'Blue-Green Algae',
      'parasites': 'Parasites'
    };
    
    if (specialCases[key]) return specialCases[key];
    
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

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
    link.setAttribute("download", "AquaGravity_Enterprise_Template.csv");
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
      potassium: ['potassium', 'k', 'بوتاسيوم'],
      ammonia: ['ammonia', 'nh3', 'nh4', 'أمونيا', 'نشادر'],
      phosphorous: ['phosphor', 'po4', 'p', 'فسفور', 'فوسفات'],
      bod: ['bod', 'b.o.d', 'حيوي'],
      cod: ['cod', 'c.o.d', 'كيميائي'],
      total_algae: ['total algae', 'عد كلي للطحالب', 'طحالب كلية', 'algal count'],
      blue_green_algae: ['blue green', 'cyanobacteria', 'خضراء مزرقة', 'مزرقة', 'bga', 'cyano'],
      parasites: ['parasite', 'طفيليات', 'giardia', 'crypto', 'ديدان', 'ديد']
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
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 font-sans text-slate-800 print:bg-white print:text-black">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-cyan-800 text-white p-5 shadow-xl print:hidden">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <Droplet className="w-8 h-8 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AquaGravity <span className="font-light">Engineering</span></h1>
              <div className="text-xs font-medium text-amber-300 flex items-center gap-1 mt-1">
                <ShieldCheck size={12}/> v4.1 - Enterprise Edition
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <select 
              className="bg-white/10 border border-white/20 text-sm font-medium p-2 rounded-lg outline-none backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="ar" className="text-black">العربية (AR)</option>
              <option value="en" className="text-black">English (EN)</option>
            </select>
            {results && (
              <button onClick={() => window.print()} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-5 py-2 rounded-lg flex gap-2 items-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                <Printer size={18} /> {isAr ? 'تصدير التقرير' : 'Export PDF'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6 pt-4">
        <h1 className="text-3xl font-black text-slate-900">AquaGravity Enterprise Report</h1>
        <p className="text-slate-500 mt-1 font-medium">Advanced Compliance & Process Engineering Design</p>
      </div>
      
      <main className="container mx-auto p-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:p-0">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 print:mb-6 print:shadow-none print:border-gray-300">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <FlaskConical className="text-blue-600"/> {isAr ? 'البيانات المخبرية' : 'Lab Data'}
            </h2>
          </div>

          <div className="flex flex-col gap-3 mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl print:hidden">
            <div className="text-xs text-blue-800 mb-1 flex items-center gap-1 font-semibold">
              <Info size={14}/> {isAr ? 'الاستيراد السريع لنتائج المعمل' : 'Fast Lab Result Import'}
            </div>
            <div className="flex gap-2">
              <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer py-2.5 rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-all shadow-md hover:shadow-lg">
                <Upload size={18} /> {isAr ? 'رفع ملف (CSV/TXT)' : 'Upload File'}
                <input type="file" accept=".csv, .txt, .tsv" className="hidden" onChange={handleFileUpload} />
              </label>
              <button onClick={downloadTemplate} title={isAr ? "تحميل نموذج فارغ" : "Download Template"} className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 px-4 py-2.5 rounded-lg flex justify-center items-center transition-all shadow-sm">
                <Download size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 print:grid-cols-4 print:gap-3">
            {activeFields.map((key) => (
              <div key={key} className="flex flex-col relative group">
                <label className="text-xs font-bold text-slate-500 mb-1.5 capitalize flex justify-between items-center">
                  <span className="truncate pr-1" title={formatLabel(key)}>{formatLabel(key)}</span>
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
                  className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition-all print:border-none print:bg-transparent print:font-bold print:p-0 print:text-base"
                  step="any"
                />
              </div>
            ))}
          </div>

          {availableFieldsToAdd.length > 0 && (
            <div className="mt-6 print:hidden border-t pt-5 border-dashed border-slate-200">
              <label className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                <PlusCircle size={14} className="text-emerald-500"/> 
                {isAr ? 'إضافة عنصر جديد:' : 'Add parameter:'}
              </label>
              <select 
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm font-medium outline-none hover:border-blue-400 transition-colors cursor-pointer shadow-sm"
                onChange={addField}
                defaultValue=""
              >
                <option value="" disabled>{isAr ? '-- اختر العنصر --' : '-- Select Parameter --'}</option>
                {availableFieldsToAdd.map(field => (
                  <option key={field} value={field}>{formatLabel(field)}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex justify-center items-center gap-2 mt-8 print:hidden"
          >
            {loading ? <Activity className="animate-spin" /> : <ShieldCheck size={20} />}
            {isAr ? 'تحليل هندسي شامل' : 'Run Full Analysis'}
          </button>
          
          {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl print:hidden text-sm font-medium">{error}</div>}
        </div>

        {/* Right Column: Results Dashboard */}
        <div className="lg:col-span-2 space-y-6 print:block">
          {!results ? (
            <div className="bg-white/50 backdrop-blur-sm p-12 rounded-3xl border-2 border-dashed border-slate-300 text-center text-slate-400 flex flex-col items-center justify-center h-full print:hidden transition-all">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Activity className="w-12 h-12 text-blue-300 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-slate-500 mb-2">{isAr ? 'لوحة التحكم الهندسية' : 'Engineering Dashboard'}</h3>
              <p className="text-sm font-medium">{isAr ? 'في انتظار إدخال البيانات وبدء التحليل...' : 'Waiting for data input and analysis...'}</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Intelligent Water Classification Banner */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl flex items-center gap-5 print:bg-white print:text-black print:border-2 print:border-slate-800 print:shadow-none hover:shadow-2xl transition-shadow duration-300">
                <div className="bg-indigo-500/20 p-4 rounded-2xl backdrop-blur-md print:hidden border border-indigo-400/30">
                  <Radar className="w-10 h-10 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-1.5 print:text-slate-500">
                    {isAr ? 'البصمة الكيميائية (تصنيف المصدر)' : 'Chemical Fingerprint (Water Source)'}
                  </h3>
                  <div className="text-3xl font-black tracking-tight">{results.water_type}</div>
                </div>
              </div>

              {/* Top Row: Compliance & Biological Hazard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                <div className={`p-6 rounded-2xl shadow-lg border border-transparent print:text-black print:border-gray-300 print:shadow-none hover:-translate-y-1 transition-all duration-300 ${results.compliance.is_compliant ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-red-500 to-rose-600 text-white print:bg-white'}`}>
                  <h3 className="text-lg font-bold mb-3 opacity-90 flex items-center gap-2">
                    <ShieldCheck size={20}/> {isAr ? 'الامتثال التنظيمي 458' : 'Regulatory Compliance'}
                  </h3>
                  <div className="text-4xl font-black mb-4 tracking-tight">
                    {results.compliance.is_compliant ? (isAr ? 'مطابق آمن' : 'Compliant') : (isAr ? 'مرفوض' : 'Rejected')}
                  </div>
                  {!results.compliance.is_compliant && (
                    <ul className="list-disc list-inside text-sm bg-black/20 backdrop-blur-sm p-4 rounded-xl print:bg-transparent print:text-red-700 font-medium space-y-1">
                      {results.compliance.violations.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  )}
                </div>

                <div className={`p-6 rounded-2xl shadow-lg border border-transparent print:text-black print:border-gray-300 print:shadow-none hover:-translate-y-1 transition-all duration-300 ${results.biological.hazard_score > 30 ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white print:bg-white' : 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'}`}>
                  <h3 className="text-lg font-bold mb-3 opacity-90 flex items-center gap-2">
                    <Bug size={20} className="print:text-black"/> {isAr ? 'مؤشر الخطر البيولوجي (BHI)' : 'Bio-Hazard Index (BHI)'}
                  </h3>
                  <div className="text-4xl font-black mb-3 tracking-tight">{results.biological.hazard_level}</div>
                  <div className="text-sm font-semibold bg-black/20 backdrop-blur-sm p-3.5 rounded-xl print:bg-transparent print:text-slate-800 leading-relaxed">
                    {results.biological.recommendation}
                  </div>
                </div>
              </div>

              {/* Middle Row: WQI & Stability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:mt-4">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 print:shadow-none print:border-gray-300 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50"></div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">{isAr ? 'مؤشر جودة المياه (WQI)' : 'Water Quality Index'}</h3>
                  <div className="flex items-end gap-3 mb-2">
                    <div className="text-6xl font-black text-indigo-600 tracking-tighter">{results.wqi.wqi_value}</div>
                    <div className="text-xl font-bold text-slate-400 mb-1.5">/ 100</div>
                  </div>
                  <div className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-bold rounded-lg border border-indigo-200">
                    Grade: {results.wqi.grade}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 print:shadow-none print:border-gray-300 hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-lg font-bold text-slate-700 mb-4">{isAr ? 'الاستقرار الهيدروكيميائي' : 'Hydrochemical Stability'}</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-medium">LSI (Langelier):</span>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg text-slate-800">{results.stability.lsi}</span>
                        <span className="text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-md">{results.stability.lsi_status}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">RSI (Ryznar):</span>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg text-slate-800">{results.stability.rsi}</span>
                        <span className="text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-md">{results.stability.rsi_status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Chemical Dosing & PFD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:mt-4">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 print:shadow-none print:border-gray-300 md:col-span-1 hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-lg font-bold text-slate-700 mb-5">{isAr ? 'التهيئة الكيميائية' : 'Chemical Dosing'}</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Reagent</div>
                      <div className="font-bold text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100 truncate" title={results.dosage.reagent}>{results.dosage.reagent}</div>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Dose (mg/L)</span>
                      <span className="font-black text-xl text-slate-800">{results.dosage.dosage_mg_l}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-slate-500 font-medium">Daily Cons. (kg/d)</span>
                      <span className="font-black text-xl text-slate-800">{results.dosage.daily_consumption_kg}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-2xl shadow-xl print:bg-white print:shadow-none print:border print:border-gray-300 md:col-span-2 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -z-10 opacity-50 group-hover:bg-indigo-900 transition-colors duration-700"></div>
                  <h3 className="text-xl font-bold text-white mb-8 print:text-slate-800 flex items-center gap-2">
                    <Activity className="text-emerald-400 print:text-black"/> {isAr ? 'مخطط سير المعالجة (PFD)' : 'Process Flow Diagram (PFD)'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4">
                    {results.treatment_train.stages.map((stage, i) => (
                      <React.Fragment key={i}>
                        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-slate-100 px-5 py-3.5 rounded-xl font-semibold text-center text-sm shadow-lg w-40 h-20 flex items-center justify-center print:bg-white print:text-black print:border-2 print:border-slate-800 hover:bg-slate-700 transition-colors duration-300 hover:-translate-y-1">
                          {stage}
                        </div>
                        {i < results.treatment_train.stages.length - 1 && (
                          <ArrowRight className="text-slate-500 print:text-slate-800 w-6 h-6 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
