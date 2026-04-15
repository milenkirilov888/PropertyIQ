import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, X, BrainCircuit, Building2, ShieldAlert,
  ChevronLeft, ChevronRight, AlertTriangle,
  Target, Fingerprint, Activity, TrendingDown,
  TrendingUp, Minus
} from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import Papa from 'papaparse';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-2xl ${className}`} />
);

const formatPrice = (price) => {
  if (price >= 1_000_000) {
    return `£${(price / 1_000_000).toFixed(1)}M`;
  }
  return `£${(price / 1_000).toFixed(0)}k`;
};

const RISK_CONFIG = {
  'Critical Warning':    { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-600',   dot: 'bg-rose-400',   bar: 'bg-rose-400' },
  'Attention Required':  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-600',  dot: 'bg-amber-400',  bar: 'bg-amber-400' },
  'Stable':              { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', dot: 'bg-emerald-400', bar: 'bg-emerald-400' },
};

// Risk level order for sorting (Stable first)
const RISK_ORDER = { 'Stable': 1, 'Attention Required': 2, 'Critical Warning': 3 };

const RiskAlerts = () => {
  const [loading, setLoading]               = useState(true);
  const [riskyData, setRiskyData]           = useState([]);
  const [totalParsed, setTotalParsed]       = useState(0);
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [currentPage, setCurrentPage]       = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchCSVData = async () => {
      try {
        const base_url = import.meta.env.VITE_BACKEND_URL || '';
        const response = await fetch(`${base_url.replace(/\/$/, '')}/api/risk-data-csv`);
        const csvText  = await response.text();

        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data?.length > 0) {
              setTotalParsed(results.data.length);

              const validPrices = results.data.map(r => parseFloat(r.price) || 0).filter(p => p > 0);
              const fleetAvg    = validPrices.length
                ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
                : 0;

              const processed = results.data.map((row, index) => {
                const price  = parseFloat(row.price) || 0;
                const epc    = String(row.epc_rating || row.ecp_rating || 'N/A').toUpperCase();
                const uprn   = row.uprn && row.uprn !== 'N/A' ? row.uprn : `ASSET-${1000 + index}`;
                const tenure = String(row.tenure || 'N/A').toLowerCase();

                let riskScore    = 0;
                let problemParts = [];

                if (price > fleetAvg * 1.25) { riskScore += 45; problemParts.push('valuation above market average'); }
                if (['D','E','F','G'].some(g => epc.includes(g))) { riskScore += 40; problemParts.push(`critical energy rating (${epc})`); }
                if (tenure.includes('lease')) { riskScore += 15; problemParts.push('leasehold depreciation risk'); }

                const level = riskScore >= 70 ? 'Critical Warning' : riskScore >= 40 ? 'Attention Required' : 'Stable';

                return {
                  id: uprn,
                  name: row.title || 'Unidentified Asset',
                  val: price,  // Store full price, not divided by 1000
                  fullPrice: price.toLocaleString(), // This will now show full number with commas (e.g., "3,400,000")
                  ecp: epc,
                  tenure: row.tenure || 'Freehold',
                  riskLevel: level,
                  score: riskScore,
                  summary: problemParts.length > 0
                    ? problemParts.join(', and ') + '.'
                    : 'maintained within safety parameters.',
                };
              });

              // Sort: Stable first (by RISK_ORDER), then by score within same risk level
              setRiskyData(processed.sort((a, b) => {
                // Strict order: Stable (1), Attention Required (2), Critical Warning (3)
                const order = { 'Stable': 1, 'Attention Required': 2, 'Critical Warning': 3 };
                return order[a.riskLevel] - order[b.riskLevel];
              }));
            }
            setTimeout(() => setLoading(false), 800);
          }
        });
      } catch {
        setLoading(false);
      }
    };
    fetchCSVData();
  }, []);

  const filteredRisky = useMemo(() =>
    riskyData.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
    ), [riskyData, searchTerm]);

  const totalPages   = Math.ceil(filteredRisky.length / itemsPerPage);
  const currentItems = filteredRisky.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const criticalCount = riskyData.filter(d => d.score >= 70).length;

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-500">
              <ShieldAlert size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Prophetic Intelligence Engine</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portfolio Risk Audit</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Analyzing {totalParsed} distributed assets
            </p>
          </div>

          <div className="flex gap-3">
            <StatPill label="Critical Alerts" value={criticalCount} color="text-rose-600" bg="bg-rose-50 border-rose-200" />
            <StatPill label="Total Audited" value={`${totalParsed}`} color="text-slate-900" bg="bg-white border-slate-200" />
          </div>
        </div>

        {/* ── Dashboard ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Chart panel - modified to use full price values */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Asset Volatility Index</h3>
                  <p className="text-[10px] text-slate-400">Price in £ — top 15 assets</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                <input
                  type="text"
                  placeholder="Search assets..."
                  className="w-full md:w-56 bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-4 rounded-2xl text-[12px] font-medium text-slate-700 focus:outline-none focus:border-indigo-400 transition-all placeholder-slate-300"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            <div className="h-[260px] w-full">
              {loading ? <Skeleton className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredRisky.slice(0, 15)}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }}
                      tickFormatter={(value) => `£${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="val"
                      stroke="#6366f1" strokeWidth={2.5}
                      fill="url(#riskGrad)"
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Heuristics panel */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500">
                <BrainCircuit size={26} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-3">Risk Heuristics</h2>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Our audit engine flags assets with market-to-value variance exceeding{' '}
                  <span className="font-bold text-rose-500">25%</span> or sub-optimal{' '}
                  <span className="font-bold text-rose-500">Grade D–G</span> energy ratings.
                </p>
              </div>
            </div>

            {/* Risk legend */}
            <div className="space-y-2.5 mt-6">
              {Object.entries(RISK_CONFIG).map(([level, cfg]) => (
                <div key={level} className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className={`text-[11px] font-bold ${cfg.text}`}>{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Asset Queue ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vulnerability Pipeline</h3>
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer transition-all">
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-bold text-slate-600 tabular-nums">
                {currentPage} / {totalPages || 1}
              </span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading
              ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56" />)
              : currentItems.map(item => {
                  const cfg = RISK_CONFIG[item.riskLevel] || RISK_CONFIG['Stable'];
                  return (
                    <div
                      key={item.id}
                      className="group bg-white border border-slate-100 rounded-3xl p-7 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 flex flex-col"
                    >
                      {/* Top row */}
                      <div className="flex justify-between items-start mb-5">
                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                          {item.riskLevel}
                        </span>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Value</p>
                          {/* Changed from £{item.val}K to full formatted price */}
                          <p className="text-lg font-black text-slate-900">{formatPrice(item.val)}</p>
                        </div>
                      </div>

                      <h4 className="text-[13px] font-bold text-slate-800 mb-4 line-clamp-2 leading-snug">{item.name}</h4>

                      {/* Risk score bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Risk Score</span>
                          <span className={`text-[11px] font-black ${cfg.text}`}>{item.score}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Building2 size={12} /> {item.tenure}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Target size={12} /> EPC {item.ecp}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedProperty(item)}
                        className={`mt-auto w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border ${cfg.bg} ${cfg.text} ${cfg.border} group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900`}
                      >
                        Run Predictive Audit
                      </button>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {selectedProperty && (() => {
        const cfg = RISK_CONFIG[selectedProperty.riskLevel] || RISK_CONFIG['Stable'];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 overflow-hidden">

              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3 text-indigo-600">
                  <Fingerprint size={18} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Forensic ID: {selectedProperty.id}</span>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 cursor-pointer transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">{selectedProperty.name}</h2>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    <AlertTriangle size={12} /> {selectedProperty.riskLevel}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Risk Index</p>
                    <p className="text-lg font-black text-slate-900">{selectedProperty.score}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Liquidity</p>
                    <p className="text-lg font-black text-slate-900">{formatPrice(selectedProperty.val)}</p>
                  </div>
                </div>

                {/* Risk bar in modal */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Exposure</span>
                    <span className={`text-[11px] font-black ${cfg.text}`}>{selectedProperty.score}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${selectedProperty.score}%` }} />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest mb-2">Heuristic Attribution</p>
                  <p className="text-[12px] text-slate-600 font-medium leading-relaxed">
                    Asset flagged due to {selectedProperty.summary} Potential exposure identified, mitigation recommended.
                  </p>
                </div>

                <button
                  onClick={() => setSelectedProperty(null)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-rose-600 transition-all cursor-pointer"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const StatPill = ({ label, value, color, bg }) => (
  <div className={`${bg} border px-6 py-4 rounded-3xl text-right min-w-[130px]`}>
    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{label}</p>
    <p className={`text-2xl font-black ${color} tabular-nums`}>{value}</p>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const cfg = RISK_CONFIG[d.riskLevel] || RISK_CONFIG['Stable'];
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-lg">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 truncate max-w-[160px]">{d.name}</p>
      <p className="text-lg font-black text-slate-900">{formatPrice(d.val)}</p>
      <span className={`text-[9px] font-black uppercase ${cfg.text}`}>{d.riskLevel}</span>
    </div>
  );
};

export default RiskAlerts;
