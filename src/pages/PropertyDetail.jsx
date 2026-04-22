import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Activity, Layers,
  ChevronLeft, ChevronRight, Bed, Bath,
  Maximize, Zap, Info, Home, ShieldCheck,
  TrendingUp, Building2, BrainCircuit
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { buildPayload, formatPrice, generateHumanExplanation } from '../utils/predictionPayload';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-2xl ${className}`} />
);

const formatValue = (value, fallback = 'N/A') => {
  if (value === undefined || value === null || value === '' || value === 'N/A') return fallback;
  return String(value).trim();
};

// Format current valuation string (removes .00)
const formatCurrentPrice = (priceStr) => {
  if (!priceStr) return 'Contact for Quote';
  const cleaned = String(priceStr).replace(/\.00$/, '').replace(/\.00(?=\D|$)/, '');
  return cleaned;
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [humanExplanation, setHumanExplanation] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionFetched, setPredictionFetched] = useState(false);

  // Fetch property and prediction in one go, no double calls
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const base_url = import.meta.env.VITE_BACKEND_URL || '';
        const response = await fetch(`${base_url.replace(/\/$/, '')}/api/properties`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        const selected = Array.isArray(data)
          ? data.find(p => String(p.uprn || '').trim() === String(id).trim() || String(p.id || '').trim() === String(id).trim())
          : null;
        if (isMounted && selected) {
          setProperty(selected);
          // Now fetch prediction
          setPredictionLoading(true);
          try {
            const payload = buildPayload(null, selected);
            const predResponse = await fetch(`${base_url.replace(/\/$/, '')}/explain`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (predResponse.ok) {
              const predData = await predResponse.json();
              if (isMounted) {
                setPrediction(predData);
                setHumanExplanation(generateHumanExplanation(predData.predicted_price, selected, predData));
              }
            }
          } catch (err) {
            console.error('Prediction error:', err);
          } finally {
            if (isMounted) {
              setPredictionLoading(false);
              setPredictionFetched(true);
            }
          }
        }
      } catch (err) {
        console.error('Fetch property error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8"><Skeleton className="aspect-video" /></div>
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );

  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8FA] p-6 text-center">
      <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mb-6 text-slate-200 border border-slate-100 shadow-sm">
        <Home size={36} strokeWidth={1} />
      </div>
      <p className="text-slate-900 font-bold text-xl mb-2">Asset Not Found</p>
      <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
        The requested asset (ID: {id}) is unavailable in current inventory.
      </p>
      <button
        onClick={() => navigate('/listings')}
        className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-colors cursor-pointer"
      >
        Back to Listings
      </button>
    </div>
  );

  const getRadarData = () => {
    const yieldVal = property.yield_num || 5;
    const epc = String(property.ecp_rating || 'C').toUpperCase();
    const tenure = String(property.tenure || '').toLowerCase();
    return [
      { subject: 'Yield',   A: Math.min(yieldVal * 12, 95) },
      { subject: 'Energy',  A: epc.includes('A') ? 98 : epc.includes('B') ? 85 : 70 },
      { subject: 'Stability', A: tenure.includes('freehold') ? 92 : 78 },
      { subject: 'Demand',  A: (property.bedrooms || 0) <= 3 ? 90 : 75 },
      { subject: 'Growth',  A: 82 },
    ];
  };

  const images = property.property_images?.length > 0
    ? property.property_images
    : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1280'];

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(property.address || 'London')}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  const specs = [
    { label: 'Bedrooms',   val: Math.floor(parseFloat(property.bedrooms)), icon: <Bed size={15}/> },
    { label: 'Bathrooms',  val: property.bathrooms,            icon: <Bath size={15}/> },
    { label: 'Tax Band',   val: property.council_tax_band,     icon: <Layers size={15}/> },
    { label: 'Tenure',     val: property.tenure,               icon: <Home size={15}/> },
    { label: 'Size',       val: property.property_size,        icon: <Maximize size={15}/> },
    { label: 'Status',     val: property.availability || 'Available', icon: <Zap size={15}/> },
  ];

  return (
    <div className="bg-[#F7F8FA] min-h-screen font-sans text-slate-800 pb-24">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold text-sm cursor-pointer"
          >
            <ArrowLeft size={17} className="group-hover:-translate-x-1 transition-transform" />
            <span>Inventory</span>
          </button>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live Asset Profile</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

          {/* Gallery */}
          <div className="lg:col-span-8">
            <div className="relative aspect-video bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
              <img
                src={images[currentImg]}
                className="w-full h-full object-cover"
                alt="Property"
              />
              {images.length > 1 && (
                <div className="absolute inset-x-5 bottom-5 flex justify-between items-center">
                  <div className="flex gap-2 bg-white/90 backdrop-blur p-1.5 rounded-2xl border border-white/50">
                    <button onClick={() => setCurrentImg(p => (p - 1 + images.length) % images.length)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setCurrentImg(p => (p + 1) % images.length)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="bg-slate-900/70 backdrop-blur px-3 py-1.5 rounded-xl text-white text-[10px] font-bold">
                    {currentImg + 1} / {images.length}
                  </div>
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                  {images.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${currentImg === i ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Valuation card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-slate-100 h-full flex flex-col p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl uppercase tracking-wide">
                  {formatValue(property.property_type, 'Residential')}
                </span>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl uppercase tracking-wide">
                  {formatValue(property.tenure, 'Freehold')}
                </span>
              </div>

              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-2">
                {property.property_title || 'Market Asset'}
              </h1>

              <div className="flex items-start gap-2 text-slate-400 text-sm mb-5">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                <span className="font-medium text-xs leading-snug">{property.address}</span>
              </div>

              {/* ML Predicted Price */}
              {prediction && !predictionLoading && (
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 mb-3">
                  <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-1">ML Predicted Value</p>
                  <p className="text-2xl font-black text-white tracking-tight">
                    {formatPrice(prediction.predicted_price)}
                  </p>
                  <div className="mt-2 pt-2 border-t border-indigo-500/50 flex justify-between">
                    <span className="text-[9px] text-indigo-200">vs. Asking</span>
                    <span className="text-[11px] font-bold text-white">{formatPrice(property.price_num)}</span>
                  </div>
                </div>
              )}

              {predictionLoading && (
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 mb-3 animate-pulse">
                  <div className="h-2 bg-indigo-400/50 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-indigo-400/50 rounded w-28"></div>
                </div>
              )}

              {/* Current Valuation - without .00 */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 mb-4">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Valuation</p>
                <p className="text-2xl font-black text-white tracking-tight">
                  {formatCurrentPrice(property.price)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">EPC Rating</p>
                  <p className="text-sm font-bold text-slate-800">Grade {formatValue(property.ecp_rating, 'C')}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Size</p>
                  <p className="text-sm font-bold text-slate-800">{formatValue(property.property_size, 'TBC')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: description + map */}
          <div className="lg:col-span-2 space-y-5">

            {/* Full Human Explanation with Feature Contributions */}
            {humanExplanation && !predictionLoading && (
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">📊</span>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Valuation Summary</p>
                  </div>
                  <p className="text-[12px] text-slate-700 leading-tight">{humanExplanation.summary}</p>
                </div>
                {humanExplanation.featureBullets && humanExplanation.featureBullets.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-sm">🔍</span>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Feature Contributions</p>
                    </div>
                    <ul className="space-y-1">
                      {humanExplanation.featureBullets.map((bullet, idx) => (
                        <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                          <span className="text-slate-400 mt-0.5">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">⚡</span>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Energy Efficiency</p>
                  </div>
                  <p className="text-[12px] text-slate-700 leading-tight">{humanExplanation.energyInsight}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">📜</span>
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Tenure Analysis</p>
                  </div>
                  <p className="text-[12px] text-slate-700 leading-tight">{humanExplanation.tenureInsight}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">💡</span>
                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Investment Insight</p>
                  </div>
                  <p className="text-[12px] font-bold text-slate-800 leading-tight">{humanExplanation.recommendation}</p>
                </div>
              </div>
            )}

            {/* Executive Summary */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-indigo-50 rounded-xl text-indigo-500">
                  <Info size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Executive Summary</h3>
              </div>
              <p className="text-slate-500 leading-relaxed text-[13px] whitespace-pre-line">
                {property.description || 'The full investment memorandum for this asset is currently being indexed. This property undergoes quarterly performance audits to ensure valuation accuracy and market alignment.'}
              </p>
            </div>

            {/* Key metrics strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Risk Level', value: 'Low–Moderate', icon: <ShieldCheck size={16} className="text-emerald-500" /> },
                { label: 'Hold Period', value: '5–7 Years', icon: <TrendingUp size={16} className="text-indigo-500" /> },
                { label: 'Demand', value: 'High', icon: <Activity size={16} className="text-amber-500" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                  <div className="flex justify-center mb-1">{m.icon}</div>
                  <p className="text-xs font-black text-slate-800">{m.value}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden h-[320px]">
              <iframe
                title="Property Map"
                width="100%" height="100%"
                className="grayscale-[15%] contrast-[1.05]"
                frameBorder="0"
                src={mapUrl}
                allowFullScreen
              />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={14} className="text-indigo-400" />
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Performance Matrix</h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData()}>
                    <PolarGrid stroke="#F1F5F9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7, fontWeight: 700, fill: '#94A3B8' }} />
                    <Radar dataKey="A" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.1} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center gap-2 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                <ShieldCheck size={14} className="text-indigo-500 shrink-0" />
                <p className="text-[10px] font-semibold text-indigo-700 leading-snug">Asset aligns with regional stability benchmarks.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={14} className="text-slate-400" />
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Physical Specs</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {specs.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 group">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 group-hover:text-indigo-400 transition-colors">{item.icon}</span>
                      <span className="text-[11px] font-semibold text-slate-500">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {formatValue(item.val, 'TBC')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetail;
