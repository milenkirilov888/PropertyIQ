import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, X, BrainCircuit, Building2, ShieldAlert, 
  ChevronLeft, ChevronRight, AlertTriangle, 
  Target, Fingerprint, Activity, Info
} from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import Papa from 'papaparse';

/**
 * @component Skeleton
 */
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-100/80 rounded-2xl ${className}`} />
);

const RiskAlerts = () => {
  const [loading, setLoading] = useState(true);
  const [riskyData, setRiskyData] = useState([]);
  const [totalParsed, setTotalParsed] = useState(0); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchCSVData = async () => {
      try {
        const base_url = import.meta.env.VITE_BACKEND_URL || import.meta.env.Backend_URL || "http://127.0.0.1:5000";
        const cleanUrl = base_url.replace(/\/$/, '');
        const response = await fetch(`${cleanUrl}/api/risk-data-csv`);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              setTotalParsed(results.data.length); 
              
              const validPrices = results.data
                .map(r => parseFloat(r.price) || 0)
                .filter(p => p > 0);
              
              const fleetAvg = validPrices.length > 0 
                ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length 
                : 0;

              const processedItems = results.data.map((row, index) => {
                const price = parseFloat(row.price) || 0;
                // app.py থেকে আসা epc_rating হ্যান্ডেল করা
                const epc = String(row.epc_rating || row.ecp_rating || "N/A").toUpperCase();
                const uprn = row.uprn && row.uprn !== "N/A" ? row.uprn : `ASSET-${1000 + index}`;
                const tenure = String(row.tenure || "N/A").toLowerCase();
                
                let riskScore = 0;
                let problemParts = [];

                if (price > fleetAvg * 1.25) { 
                  riskScore += 45; 
                  problemParts.push("valuation significantly above market average"); 
                }
                if (['D', 'E', 'F', 'G'].some(grade => epc.includes(grade))) { 
                  riskScore += 40; 
                  problemParts.push(`critical energy rating (${epc})`); 
                }
                if (tenure.includes("lease")) {
                  riskScore += 15;
                  problemParts.push("leasehold depreciation risk");
                }

                return {
                  id: uprn,
                  name: row.title || "Unidentified Asset",
                  val: Math.round(price / 1000),
                  fullPrice: price.toLocaleString(),
                  ecp: epc,
                  tenure: row.tenure || "Freehold",
                  riskLevel: riskScore >= 70 ? "Critical Warning" : riskScore >= 40 ? "Attention Required" : "Stable",
                  score: riskScore,
                  color: riskScore >= 70 ? "#f43f5e" : riskScore >= 40 ? "#f59e0b" : "#10b981",
                  bgColor: riskScore >= 70 ? "bg-rose-50" : riskScore >= 40 ? "bg-amber-50" : "bg-emerald-50",
                  summary: problemParts.length > 0 ? problemParts.join(", and ") + "." : "maintained within safety parameters."
                };
              });
              
              setRiskyData(processedItems.sort((a, b) => b.score - a.score));
            }
            setTimeout(() => setLoading(false), 800);
          }
        });
      } catch (err) {
        console.error("Critical Ingestion Error:", err);
        setLoading(false);
      }
    };
    fetchCSVData();
  }, []);

  const filteredRisky = useMemo(() => {
    return riskyData.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [riskyData, searchTerm]);

  const totalPages = Math.ceil(filteredRisky.length / itemsPerPage);
  const currentItems = filteredRisky.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-[#FCFDFF] p-4 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-500 font-bold">
              <ShieldAlert size={18} />
              <span className="text-[10px] uppercase tracking-[0.3em]">Prophetic Intelligence Engine</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Portfolio Risk Audit</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                System Pulse: Analyzing {totalParsed} Distributed Assets
            </p>
          </div>
          
          <div className="flex gap-3">
            <StatCard label="Critical Alerts" value={riskyData.filter(d => d.score >= 70).length} color="text-rose-600" />
            <StatCard label="Audit Coverage" value={`${totalParsed} Assets`} color="text-slate-900" />
          </div>
        </div>

        {/* Dashboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-slate-100 rounded-[2rem] p-8 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100"><Activity size={16} /></div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Volatility Index (k-value)</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="text" 
                  placeholder="ID / ADDRESS INDEX..."
                  className="w-full md:w-64 bg-slate-50 border border-slate-100 py-3 pl-11 pr-4 rounded-xl text-[10px] font-bold focus:outline-none focus:border-indigo-400 uppercase transition-all"
                  value={searchTerm}
                  onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                />
              </div>
            </div>
            
          
            <div className="h-[280px] min-h-[280px] w-full">
              {loading ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredRisky.length > 0 ? filteredRisky.slice(0, 15) : []}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '700', fill: '#cbd5e1'}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={3} fill="url(#chartGrad)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="border border-slate-100 rounded-[2rem] p-8 bg-white flex flex-col justify-between">
             <div className="space-y-6">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                  <BrainCircuit size={24} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Risk Assessment Heuristics</h2>
                  <p className="text-slate-500 text-[11px] font-bold leading-relaxed uppercase tracking-wider">
                    Our proprietary audit engine isolates assets with market-to-value variance exceeding <span className="text-rose-600">25%</span> or sub-optimal <span className="text-rose-600">Grade D-G</span> environmental ratings.
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* Asset Queue */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vulnerability Pipeline</h3>
            <div className="flex items-center gap-5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="text-slate-300 hover:text-slate-900 disabled:opacity-20 cursor-pointer" disabled={currentPage === 1}>
                   <ChevronLeft size={24} />
                </button>
                <span className="text-[10px] font-black text-slate-900 uppercase tabular-nums">Segment {currentPage} / {totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="text-slate-300 hover:text-slate-900 disabled:opacity-20 cursor-pointer" disabled={currentPage === totalPages}>
                   <ChevronRight size={24} />
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56 w-full" />) : 
              currentItems.map((item) => (
                <div key={item.id} className="group border border-slate-100 p-8 rounded-[2.5rem] bg-white hover:border-slate-900 transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full ${item.bgColor} border border-black/5`} style={{ color: item.color }}>
                      {item.riskLevel}
                    </span>
                    <span className="text-lg font-black text-slate-900 tracking-tighter">£{item.val}K</span>
                  </div>
                  
                  <h4 className="text-[13px] font-black uppercase text-slate-800 mb-5 line-clamp-1">{item.name}</h4>
                  
                  <div className="flex items-center gap-5 mb-8">
                     <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase"><Building2 size={14} /> {item.tenure}</div>
                     <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase"><Target size={14} /> Compliance {item.ecp}</div>
                  </div>

                  <button 
                    onClick={() => setSelectedProperty(item)}
                    className="w-full bg-slate-50 text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all cursor-pointer border border-slate-100"
                  >
                    Run Predictive Audit 
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Modal Section */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] relative overflow-hidden border border-slate-200">
            <div className="p-7 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                <Fingerprint size={18} /> Forensic Log ID: {selectedProperty.id}
              </div>
              <button onClick={() => setSelectedProperty(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 cursor-pointer transition-colors">
                <X size={22} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedProperty.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <AlertTriangle size={14} className="text-rose-500" />
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Mitigation Strategy Required</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Internal Risk Rating</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{selectedProperty.score}% Index Factor</p>
                </div>
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Liquidity Value</p>
                  <p className="text-sm font-black text-slate-900">£{selectedProperty.fullPrice}</p>
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Heuristic Attribution</h4>
                 <p className="text-[12px] text-slate-600 font-bold leading-relaxed uppercase">
                    Asset flagged via algorithm due to {selectedProperty.summary} Potential exposure identified.
                 </p>
              </div>

              <button 
                onClick={() => setSelectedProperty(null)}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-all cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-white border border-slate-100 px-6 py-4 rounded-3xl text-right min-w-[140px]">
    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">{label}</p>
    <p className={`text-2xl font-black ${color} tabular-nums`}>{value}</p>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center">
        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{data.name}</p>
        <p className="text-xl font-black text-slate-900">£{data.val}K</p>
        <div className="mt-2 w-full h-1 rounded-full" style={{ backgroundColor: data.color }}></div>
      </div>
    );
  }
  return null;
};

export default RiskAlerts;