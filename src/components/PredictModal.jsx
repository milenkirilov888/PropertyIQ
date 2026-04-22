import React, { useState, useEffect } from 'react';
import {
  X, MapPin, Loader2, Sparkles, Send,
  ChevronDown, TrendingUp, TrendingDown, Minus,
  BrainCircuit, AlertCircle, Home
} from 'lucide-react';
import { buildPayload, getPostcodePrefix, VALID_POSTCODE_PREFIXES, formatPrice, generateHumanExplanation } from '../utils/predictionPayload';

const HumanExplanation = ({ explanation }) => (
  <div className="space-y-4">
    <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-6 text-white">
      <p className="text-[10px] font-bold uppercase text-indigo-300 mb-1">AI Valuation Estimate</p>
      <p className="text-4xl font-black">{formatPrice(explanation.predictedPrice)}</p>
      <div className="mt-3 pt-3 border-t border-indigo-800/50 flex justify-between">
        <span className="text-[11px] text-indigo-300">vs. Asking</span>
        <span className="text-[13px] font-bold">{formatPrice(explanation.askingPrice)}</span>
      </div>
    </div>
    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Valuation Summary</p>
      <p className="text-[13px] text-slate-700 leading-relaxed">{explanation.summary}</p>
    </div>
    {explanation.featureBullets && explanation.featureBullets.length > 0 && (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-[10px] font-bold text-slate-600 uppercase mb-2">Feature Contributions</p>
        <ul className="space-y-1.5">
          {explanation.featureBullets.map((bullet, idx) => (
            <li key={idx} className="text-[12px] text-slate-700 flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Energy Efficiency</p>
      <p className="text-[13px] text-slate-700">{explanation.energyInsight}</p>
    </div>
    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
      <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Tenure Analysis</p>
      <p className="text-[13px] text-slate-700">{explanation.tenureInsight}</p>
    </div>
    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
      <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Investment Insight</p>
      <p className="text-[13px] font-bold text-slate-800">{explanation.recommendation}</p>
    </div>
  </div>
);

const PredictModal = ({ isOpen, onClose, propertyData, simpleMode = false }) => {
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [humanExplanation, setHumanExplanation] = useState(null);
  const [form, setForm] = useState({
    area: '', property_type: 'flat', tenure: 'Leasehold', epc_rating: 'C',
    bedrooms: '2', bathrooms: '1', receptions: '1', property_size: '800',
    price_per_size: '1000', service_charge: '3000', time_remaining_on_lease: '150',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen && propertyData && step === 1) {
      handlePredict();
    } else if (!isOpen) {
      setStep(1); setResult(null); setErrorMsg(''); setHumanExplanation(null);
    }
  }, [isOpen, propertyData]);

  const validateInputs = () => {
    const location = form.area.trim();
    const postcodeLetter = getPostcodePrefix(location);
    
    if (!location || !postcodeLetter) {
      setErrorMsg('Please enter a valid UK location (e.g., London, Manchester, M, B)');
      return false;
    }
    
    const bedrooms = parseFloat(form.bedrooms);
    const bathrooms = parseFloat(form.bathrooms);
    const receptions = parseFloat(form.receptions);
    const propertySize = parseFloat(form.property_size);
    const serviceCharge = parseFloat(form.service_charge);
    
    if (isNaN(bedrooms) || bedrooms < 0 || bedrooms > 10) { setErrorMsg('Bedrooms must be between 0 and 10'); return false; }
    if (isNaN(bathrooms) || bathrooms < 0 || bathrooms > 8) { setErrorMsg('Bathrooms must be between 0 and 8'); return false; }
    if (isNaN(receptions) || receptions < 0 || receptions > 6) { setErrorMsg('Receptions must be between 0 and 6'); return false; }
    if (isNaN(propertySize) || propertySize < 200 || propertySize > 10000) { setErrorMsg('Property size must be between 200 and 10,000 sq ft'); return false; }
    if (isNaN(serviceCharge) || serviceCharge < 0 || serviceCharge > 20000) { setErrorMsg('Service charge must be between £0 and £20,000'); return false; }
    
    return true;
  };

  const handlePredict = async () => {
    setStep(2);
    try {
      const base_url = import.meta.env.VITE_BACKEND_URL || '';
      const payload = buildPayload(form, propertyData);
      const response = await fetch(`${base_url.replace(/\/$/, '')}/explain`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Prediction failed');
      const data = await response.json();
      setResult(data);
      if (simpleMode && propertyData) {
        setHumanExplanation(generateHumanExplanation(data.predicted_price, propertyData, data));
      }
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message);
      setStep(4);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateInputs()) {
      setStep(4);
      return;
    }
    setStep(2);
    try {
      const base_url = import.meta.env.VITE_BACKEND_URL || '';
      const payload = buildPayload(form, propertyData);
      const response = await fetch(`${base_url.replace(/\/$/, '')}/explain`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Prediction failed');
      const data = await response.json();
      setResult(data);
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message);
      setStep(4);
    }
  };

  if (!isOpen) return null;

  // Simple Mode
  if (simpleMode && propertyData) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white"><Home size={18} /></div>
              <div><p className="text-sm font-bold text-slate-800">Property Valuation</p><p className="text-[10px] text-slate-400 truncate max-w-[200px]">{propertyData.property_title || propertyData.address}</p></div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={17} /></button>
          </div>
          <div className="overflow-y-auto flex-1 p-6">
            {step === 2 && (<div className="py-16 text-center"><Loader2 size={52} className="text-indigo-500 animate-spin mx-auto mb-4" /><p className="text-sm font-bold">Analyzing property...</p></div>)}
            {step === 3 && humanExplanation && <HumanExplanation explanation={humanExplanation} />}
            {step === 3 && !humanExplanation && result && (<div><div className="bg-slate-900 rounded-2xl p-6 text-white mb-4"><p className="text-4xl font-black">{formatPrice(result.predicted_price)}</p></div><p className="text-[13px] text-slate-600">{result.explanation}</p></div>)}
            {step === 4 && (<div className="py-16 text-center"><AlertCircle size={48} className="text-rose-500 mx-auto mb-4" /><p className="text-sm text-slate-600">{errorMsg}</p><button onClick={handlePredict} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl">Retry</button></div>)}
            {step === 3 && (<button onClick={onClose} className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Close</button>)}
          </div>
        </div>
      </div>
    );
  }

  // AI Engine Mode
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl"><BrainCircuit size={18} className="text-indigo-500" /></div>
            <div><p className="text-sm font-bold text-slate-800">ML Price Predictor</p><p className="text-[10px] text-slate-400">XGBoost</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={17} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-7">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400">Area / Location *</label>
                <input type="text" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="e.g. London, Manchester, M, B, L" required list="locations" />
                <datalist id="locations">
                  <option value="London" />
                  <option value="Manchester" />
                  <option value="Birmingham" />
                  <option value="Liverpool" />
                  <option value="Leeds" />
                  <option value="Sheffield" />
                  <option value="Bristol" />
                  <option value="M" />
                  <option value="B" />
                  <option value="L" />
                  <option value="S" />
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-slate-400">Property Type</label><select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"><option>flat</option><option>terraced</option><option>semi-detached</option><option>detached</option></select></div>
                <div><label className="text-[10px] font-bold text-slate-400">Tenure</label><select value={form.tenure} onChange={e => setForm({...form, tenure: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"><option>Leasehold</option><option>Freehold</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-slate-400">Bedrooms (0-10)</label><input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})} min="0" max="10" step="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                <div><label className="text-[10px] font-bold text-slate-400">EPC Rating</label><select value={form.epc_rating} onChange={e => setForm({...form, epc_rating: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option></select></div>
              </div>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-[11px] font-bold text-indigo-500 flex items-center gap-1"><ChevronDown size={14} className={showAdvanced ? 'rotate-180' : ''} />Advanced</button>
              {showAdvanced && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Bathrooms (0-8)</label>
                      <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})} min="0" max="8" step="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Receptions (0-6)</label>
                      <input type="number" value={form.receptions} onChange={e => setForm({...form, receptions: e.target.value})} min="0" max="6" step="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Size (sq ft) 200-10000</label>
                      <input type="number" value={form.property_size} onChange={e => setForm({...form, property_size: e.target.value})} min="200" max="10000" step="50" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Price per sq ft (£)</label>
                      <input type="number" value={form.price_per_size} onChange={e => setForm({...form, price_per_size: e.target.value})} min="500" max="5000" step="100" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Service Charge (£/year)</label>
                    <input type="number" value={form.service_charge} onChange={e => setForm({...form, service_charge: e.target.value})} min="0" max="20000" step="100" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Lease Remaining (years)</label>
                    <input type="number" value={form.time_remaining_on_lease} onChange={e => setForm({...form, time_remaining_on_lease: e.target.value})} min="0" max="999" step="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
              )}
              <button type="submit" className="w-full py-3.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Sparkles size={15} />Run Prediction</button>
            </form>
          )}
          {step === 2 && (<div className="py-24 text-center"><Loader2 size={52} className="text-indigo-500 animate-spin mx-auto mb-4" /><p className="text-sm font-bold">Running XGBoost model...</p></div>)}
          {step === 3 && result && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl p-6 text-white">
                <p className="text-[10px] text-slate-400">ML Predicted Value</p>
                <p className="text-4xl font-black">{formatPrice(result.predicted_price)}</p>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Valuation Summary</p>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{result.valuation_summary || `Based on the features provided, the model predicts ${formatPrice(result.predicted_price)}. This is ${result.predicted_price > result.base_price ? 'above' : 'below'} the market baseline of ${formatPrice(result.base_price)}.`}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Feature Contributions</p>
                  {result.feature_bullets && result.feature_bullets.length > 0 ? (
                    <ul className="space-y-1.5">
                      {result.feature_bullets.map((bullet, idx) => (
                        <li key={idx} className="text-[12px] text-slate-700 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-slate-700">The valuation is influenced by property size, location, and bedroom count.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3"><button onClick={() => setStep(1)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">New Prediction</button><button onClick={onClose} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Done</button></div>
            </div>
          )}
          {step === 4 && (
            <div className="py-16 text-center"><AlertCircle size={48} className="text-rose-500 mx-auto mb-4" /><p className="text-sm text-slate-600">{errorMsg}</p><button onClick={() => setStep(1)} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl">Try Again</button></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictModal;
