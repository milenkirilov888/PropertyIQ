import React, { useState, useEffect } from 'react';
import {
  X, MapPin, Loader2, Sparkles, Send,
  ChevronDown, TrendingUp, TrendingDown, Minus,
  BrainCircuit, AlertCircle, Home
} from 'lucide-react';

const VALID_LOCATIONS = [
  'S', 'B', 'O', 'R', 'C', 'M', 'E', 'F', 'T', 'W', 'D', 'J', 'Y', 'G', 'Q',
  'H', 'A', 'L', 'P', 'I', 'V', 'K', 'N', 'U'
];

// Map city names to postcode letters
const cityToPostcodeMap = {
  'london': 'L', 'manchester': 'M', 'birmingham': 'B', 'liverpool': 'L',
  'leeds': 'L', 'sheffield': 'S', 'bristol': 'B', 'newcastle': 'N',
  'nottingham': 'N', 'leicester': 'L', 'coventry': 'C', 'bradford': 'B',
  'cardiff': 'C', 'edinburgh': 'E', 'glasgow': 'G', 'aberdeen': 'A',
  'belfast': 'B', 'southampton': 'S', 'portsmouth': 'P', 'oxford': 'O',
  'cambridge': 'C', 'york': 'Y', 'brighton': 'B', 'exeter': 'E',
  'norwich': 'N', 'derby': 'D', 'wolverhampton': 'W', 'plymouth': 'P',
  'reading': 'R'
};

const getPostcodeLetter = (input) => {
  const trimmed = input?.trim().toUpperCase() || '';
  if (!trimmed) return '';
  
  // Check if it's a single letter (S, M, B, etc.)
  if (VALID_LOCATIONS.includes(trimmed)) return trimmed;
  
  // Check if it's a postcode like M1, SW1, B1 - extract first letter
  const match = trimmed.match(/^([A-Z])/);
  if (match) return match[1];
  
  // Check if it's a city name
  const cityMatch = cityToPostcodeMap[trimmed.toLowerCase()];
  if (cityMatch) return cityMatch;
  
  return '';
};

const buildPayload = (form, propertyData) => {
  if (propertyData) {
    return {
      bedrooms: parseFloat(propertyData.bedrooms) || 2,
      bathrooms: parseFloat(propertyData.bathrooms) || 1,
      receptions: parseFloat(propertyData.receptions) || 1,
      property_size: parseFloat(propertyData.property_size) || 800,
      time_remaining_on_lease: parseFloat(propertyData.time_remaining_on_lease) || 150,
      service_charge: parseFloat(propertyData.service_charge) || 3000,
      price_per_sqft: (parseFloat(propertyData.price_num) || 0) / (parseFloat(propertyData.property_size) || 800) || 1000,
      postcode_area: getPostcodeLetter(propertyData.address),
      property_type_clean: (propertyData.property_type || '').toLowerCase().trim(),
    };
  }
  
  return {
    bedrooms: Math.min(10, Math.max(0, parseFloat(form.bedrooms) || 2)),
    bathrooms: Math.min(8, Math.max(0, parseFloat(form.bathrooms) || 1)),
    receptions: Math.min(6, Math.max(0, parseFloat(form.receptions) || 1)),
    property_size: Math.min(10000, Math.max(200, parseFloat(form.property_size) || 800)),
    time_remaining_on_lease: Math.min(999, Math.max(0, parseFloat(form.time_remaining_on_lease) || 150)),
    service_charge: Math.min(20000, Math.max(0, parseFloat(form.service_charge) || 3000)),
    price_per_sqft: Math.min(5000, Math.max(500, parseFloat(form.price_per_size) || 1000)),
    postcode_area: getPostcodeLetter(form.area),
    property_type_clean: form.property_type?.toLowerCase().trim() || '',
  };
};

const formatPrice = (price) => {
  return `£${Math.round(price).toLocaleString()}`;
};

const generateHumanExplanation = (predictedPrice, propertyData) => {
  const askingPrice = propertyData?.price_num || 0;
  const priceDiff = predictedPrice - askingPrice;
  const diffPercent = askingPrice > 0 ? ((priceDiff / askingPrice) * 100).toFixed(1) : 0;
  const threshold = 0.05;
  
  let priceAssessment = '';
  if (Math.abs(priceDiff) < askingPrice * threshold) {
    priceAssessment = `Our model values this property at ${formatPrice(predictedPrice)}, which aligns closely with the asking price of ${formatPrice(askingPrice)}.`;
  } else if (priceDiff > 0) {
    priceAssessment = `Our model estimates ${formatPrice(predictedPrice)} is ${diffPercent}% above the asking price of ${formatPrice(askingPrice)}. This suggests the property may be priced below market value, but verify comparable sales.`;
  } else {
    priceAssessment = `Our analysis suggests ${formatPrice(predictedPrice)} is ${Math.abs(diffPercent)}% below the asking price of ${formatPrice(askingPrice)}. The property appears overvalued relative to our model. Consider negotiation or further due diligence.`;
  }
  
  const epc = propertyData?.ecp_rating || 'C';
  const epcAssessment = ['A', 'B', 'C'].includes(epc)
    ? `The ${epc} energy rating is strong for this property.`
    : `The ${epc} energy rating may require future improvements, potentially affecting value.`;
  
  const tenure = propertyData?.tenure || 'Leasehold';
  const tenureAssessment = tenure.toLowerCase().includes('freehold')
    ? `Freehold ownership provides full control with no ground rent.`
    : `As leasehold, be mindful of ground rents and service charges.`;
  
  const isGoodDeal = priceDiff > askingPrice * threshold && ['A', 'B', 'C'].includes(epc);
  const recommendation = isGoodDeal
    ? `Property appears undervalued relative to model. Consider accelerated acquisition.`
    : `Proceed with standard due diligence. Price aligns with model expectations.`;

  return { summary: priceAssessment, energyInsight: epcAssessment, tenureInsight: tenureAssessment, recommendation, predictedPrice, askingPrice };
};

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
      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Valuation Analysis</p>
      <p className="text-[13px] text-slate-700">{explanation.summary}</p>
    </div>
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
    const postcodeLetter = getPostcodeLetter(location);
    
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
      const base_url = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
      const payload = buildPayload(form, propertyData);
      const response = await fetch(`${base_url.replace(/\/$/, '')}/explain`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Prediction failed');
      const data = await response.json();
      setResult(data);
      if (simpleMode && propertyData) {
        setHumanExplanation(generateHumanExplanation(data.predicted_price, propertyData));
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
      const base_url = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
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
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Valuation Analysis</p>
                  <p className="text-[13px] text-slate-700">Based on the features provided, the model predicts <strong>{formatPrice(result.predicted_price)}</strong>. This is {result.predicted_price > 500000 ? 'above' : 'below'} the market baseline of {formatPrice(result.base_price)}.</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Key Drivers</p>
                  <p className="text-[13px] text-slate-700">The valuation is primarily influenced by property size, location, and bedroom count.</p>
                </div>
              </div>
              <div className="p-5 bg-indigo-50 rounded-2xl">
                <p className="text-[10px] font-bold text-indigo-500">Model Explanation</p>
                <p className="text-[13px] text-slate-600">{result.explanation}</p>
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
