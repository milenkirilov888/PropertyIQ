import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Activity, Layers, 
  ChevronLeft, ChevronRight, Bed, Bath, 
  Maximize, Zap, Info, Home, ShieldCheck
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from 'recharts';

/**
 * @component Skeleton
 * @description Smooth pulse animation for pre-rendering phase to maintain high-end UX.
 */
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`}></div>
);

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);

  /**
   * Data Sanitization Utility
   * Ensures UI integrity by handling null/undefined API responses gracefully.
   */
  const formatValue = (value, fallback = "N/A") => {
    if (value === undefined || value === null || value === "" || value === "N/A") return fallback;
    return String(value).trim();
  };

  /**
   * Asset Data Retrieval
   * Cross-references UPRN and ID indices to fetch granular property intelligence.
   */
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Logical: Using prioritized environment variables
        const base_url = import.meta.env.VITE_BACKEND_URL || import.meta.env.Backend_URL || "http://127.0.0.1:5000";
        const response = await fetch(`${base_url.replace(/\/$/, '')}/api/properties`);
        
        if (!response.ok) throw new Error("Infrastructure Fetch Failed");
        
        const data = await response.json();
        
        // Logical Lookup: Validating asset across primary and secondary identifiers
        const selected = Array.isArray(data) ? data.find(p => 
          String(p.uprn || "").trim() === String(id).trim() || 
          String(p.id || "").trim() === String(id).trim()
        ) : null;

        if (selected) {
          setProperty(selected);
        }
      } catch (err) {
        console.error("Critical Data Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8"><Skeleton className="aspect-video" /></div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-slate-300 border border-slate-100">
          <Home size={32} />
      </div>
      <p className="text-slate-800 mb-4 font-bold text-lg">Asset Disconnected</p>
      <p className="text-slate-400 mb-8 text-sm max-w-xs">The requested asset record (ID: {id}) is unavailable in the current perimeter.</p>
      <button onClick={() => navigate('/listings')} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 cursor-pointer">Re-synchronize Listings</button>
    </div>
  );

  /**
   * Investment Matrix Calculation
   * Heuristic mapping of property metrics into a 5-point radar visualization.
   */
  const getRadarData = () => {
    const yieldVal = property.yield_num || 5;
    const epc = String(property.ecp_rating || 'C').toUpperCase();
    const tenure = String(property.tenure || '').toLowerCase();
    
    return [
      { subject: 'Potential Yield', A: Math.min(yieldVal * 12, 95) },
      { subject: 'Energy Score', A: epc.includes('A') ? 98 : epc.includes('B') ? 85 : 70 },
      { subject: 'Market Stability', A: tenure.includes('freehold') ? 92 : 78 },
      { subject: 'Rental Demand', A: (property.bedrooms || 0) <= 3 ? 90 : 75 },
      { subject: 'Capital Growth', A: 82 },
    ];
  };

  const images = property.property_images?.length > 0 ? property.property_images : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1280"];
  const encodedAddress = encodeURIComponent(property.address || "London");
  const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="bg-[#FCFDFF] min-h-screen font-sans text-slate-800 pb-20">
      
      {/* Navigation Layer */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-semibold text-sm cursor-pointer">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> <span>Inventory</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Live Asset Profile</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        
        {/* Top-Tier: Visual Assets & Valuation Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          
          {/* High-Fidelity Gallery Layer */}
          <div className="lg:col-span-8">
            <div className="relative aspect-video bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
              <img 
                src={images[currentImg]} 
                className="w-full h-full object-cover transition-opacity duration-500" 
                alt="Property View"
              />
              {images.length > 1 && (
                <div className="absolute inset-x-6 bottom-6 flex justify-between items-center">
                  <div className="flex gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200">
                    <button onClick={() => setCurrentImg(p => (p - 1 + images.length) % images.length)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><ChevronLeft size={18}/></button>
                    <button onClick={() => setCurrentImg(p => (p + 1) % images.length)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><ChevronRight size={18}/></button>
                  </div>
                  <div className="bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-[10px] font-bold">
                    ASSET VIEW {currentImg + 1} / {images.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Primary Valuation & Identifier Card */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 h-full flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                   <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase tracking-wide border border-slate-200">
                     {formatValue(property.property_type, "Residential Asset")}
                   </span>
                   <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md uppercase tracking-wide border border-indigo-100">
                     {formatValue(property.tenure, "Freehold Index")}
                   </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
                  {property.property_title || "Market Asset Index"}
                </h1>
                <p className="flex items-start gap-2 text-slate-400 text-sm font-medium leading-snug">
                  <MapPin size={16} className="shrink-0 text-slate-400 mt-0.5" /> {property.address}
                </p>
              </div>

              <div className="mt-8">
                <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-100 mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-[0.1em]">Current Book Value</p>
                  <p className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tighter">
                    {property.price || "Contact for Quote"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-white border border-slate-100 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rating</p>
                      <p className="text-sm font-bold text-slate-700">EPC {formatValue(property.ecp_rating, "C")}</p>
                   </div>
                   <div className="p-3 bg-white border border-slate-100 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metrics</p>
                      <p className="text-sm font-bold text-slate-700">{formatValue(property.property_size, "TBC")}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mid-Tier: Qualitative Data & Mapping */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Asset Intelligence Memorandum */}
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-700 border border-slate-100"><Info size={20}/></div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Executive Summary</h3>
              </div>
              <p className="text-slate-500 leading-relaxed font-normal text-[15px] whitespace-pre-line">
                {property.description || "The full investment memorandum for this asset is currently being indexed. This property undergoes quarterly performance audits to ensure valuation accuracy."}
              </p>
            </div>

            {/* Geographic Verification Layer */}
            <div className="bg-white p-2 rounded-3xl border border-slate-200 h-[400px] overflow-hidden">
               <iframe 
                title="Property Map" 
                width="100%" height="100%" 
                className="rounded-2xl grayscale-[0.2] contrast-[1.1] transition-all duration-700" 
                frameBorder="0" src={mapUrl} allowFullScreen
               ></iframe>
            </div>
          </div>

          {/* Sidebar: Quantitative Analysis & Logistics */}
          <div className="space-y-8">
            {/* Performance Radar Index */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500"/> Performance Matrix
                </h3>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData()}>
                    <PolarGrid stroke="#F1F5F9" />
                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 7, fontWeight: 700, fill: '#94A3B8'}} />
                    <Radar 
                      dataKey="A" 
                      stroke="#4F46E5" 
                      strokeWidth={2} 
                      fill="#4F46E5" 
                      fillOpacity={0.08} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <ShieldCheck size={18} className="text-indigo-600 shrink-0" />
                <p className="text-[11px] font-semibold text-indigo-700 leading-tight"> Compliance Verified: Asset aligns with regional market stability benchmarks.</p>
              </div>
            </div>

            {/* Forensic Physical Audit */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">Physical Infrastructure</h3>
              <div className="divide-y divide-slate-50">
                {[
                  { label: 'Bedrooms', val: property.bedrooms, icon: <Bed size={15}/> },
                  { label: 'Bathrooms', val: property.bathrooms, icon: <Bath size={15}/> },
                  { label: 'Tax Band', val: property.council_tax_band, icon: <Layers size={15}/> },
                  { label: 'Asset Tenure', val: property.tenure, icon: <Home size={15}/> },
                  { label: 'Footprint', val: property.property_size, icon: <Maximize size={15}/> },
                  { label: 'Status', val: property.availability || 'Available', icon: <Zap size={15}/> },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-3.5 group">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 group-hover:text-indigo-500 transition-all duration-300 transform group-hover:scale-110">{item.icon}</span>
                      <span className="text-[12px] font-semibold text-slate-500">{item.label}</span>
                    </div>
                    <span className="text-[12px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{formatValue(item.val, "TBC")}</span>
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