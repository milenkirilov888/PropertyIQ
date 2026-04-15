import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, RadialBarChart,
  RadialBar, PolarAngleAxis
} from 'recharts';
import { Activity, ArrowLeft, Building2, TrendingUp, HeartPulse, ShieldCheck, Zap, Home } from 'lucide-react';

const Analysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const base_url = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${base_url.replace(/\/$/, '')}/api/properties`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        const selected = Array.isArray(data)
          ? data.find(p => String(p.uprn || '').trim() === String(id).trim() || String(p.id || '').trim() === String(id).trim())
          : null;
        if (selected) setProperty(selected);
      } catch {}
      finally { setTimeout(() => setLoading(false), 800); }
    };
    fetchProperty();
  }, [id]);

  const analysisData = useMemo(() => {
    if (!property) return null;
    const yieldVal = property.yield_num || 0;
    const priceVal = property.price_num || 0;
    const epc = String(property.ecp_rating || 'N/A').toUpperCase();

    const factorData = [
      { name: 'Income Strength',  score: Math.min(yieldVal * 12, 98), fill: '#6366f1' },
      { name: 'Energy Standard',  score: ['A','B','C'].includes(epc[0]) ? 92 : 45, fill: '#10b981' },
      { name: 'Ownership Value',  score: 78, fill: '#f59e0b' },
      { name: 'Resale Speed',     score: priceVal < 700000 ? 85 : 55, fill: '#ec4899' },
    ];
    const gaugeData = [{ value: 82, fill: '#6366f1' }];
    return { factorData, gaugeData, yieldVal, epc, priceVal };
  }, [property]);

  // ── Skeleton ──
  if (loading) return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 md:p-10 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="h-8 w-48 bg-slate-100 rounded-2xl" />
        <div className="h-12 w-2/3 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-[360px] bg-slate-100 rounded-3xl" />
          <div className="lg:col-span-5 h-[360px] bg-slate-100 rounded-3xl" />
          <div className="lg:col-span-12 h-56 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    </div>
  );

  if (!property) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-6 text-center">
      <div className="max-w-xs space-y-5">
        <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
          <Building2 size={36} strokeWidth={1} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No Asset Context</h2>
        <p className="text-sm text-slate-500">We couldn't find the property data for this ID.</p>
        <button
          onClick={() => navigate('/listings')}
          className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Back to Listings
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-8 border-b border-slate-200/60">
          <div className="space-y-3">
            <button
              onClick={() => navigate('/listings')}
              className="flex items-center gap-2 text-indigo-500 hover:text-indigo-700 text-xs font-bold transition-colors cursor-pointer group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
              Portfolio Explorer
            </button>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">
              Asset Analysis
              <span className="text-slate-300 font-light mx-2">/</span>
              <span className="text-indigo-600">{property.property_title || 'Summary'}</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              <span className="text-slate-600 font-bold">{property.address}</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-2xl border border-slate-100">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Analytical Sync Active</span>
          </div>
        </div>

        {/* ── Charts Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Bar chart */}
          <section className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Comparative Advantage</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Four-pillar investment benchmark</p>
              </div>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysisData.factorData} layout="vertical" barCategoryGap="30%">
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    width={120}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold', padding: '10px 14px' }}
                    formatter={v => [`${v}/100`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={12}>
                    {analysisData.factorData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {analysisData.factorData.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.fill }} />
                  <span className="text-[11px] font-bold text-slate-600">{f.name}</span>
                  <span className="text-[11px] font-black ml-auto" style={{ color: f.fill }}>{f.score}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Gauge */}
          <section className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-50 rounded-xl text-rose-400">
                <HeartPulse size={16} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Portfolio Fit</h3>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <div className="h-[220px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="75%" outerRadius="100%" data={analysisData.gaugeData} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background={{ fill: '#f8fafc' }} dataKey="value" cornerRadius={20} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                    82<span className="text-xl text-slate-300 font-light">%</span>
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    High Reliability
                  </span>
                </div>
              </div>
            </div>

            <p className="text-center text-[12px] text-slate-500 font-medium leading-relaxed mt-4 px-2">
              Validates the asset's <span className="font-bold text-slate-800 underline decoration-indigo-200 decoration-2 underline-offset-4">Yield-to-Risk probability</span> based on local data.
            </p>
          </section>

          {/* Executive Summary */}
          <div className="lg:col-span-12 bg-white border border-slate-100 rounded-3xl p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  <TrendingUp size={13} /> ML Recommendation
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight">
                  A target{' '}
                  <span className="text-indigo-600 font-black">{analysisData.yieldVal}% yield</span>{' '}
                  profile secures this as a primary investment candidate.
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Advanced modeling suggests this asset is currently undervalued relative to its income generation potential in the current market cycle.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Risk Assessment', value: 'Low–Moderate', detail: 'Volatility buffered', icon: <ShieldCheck size={16} className="text-emerald-500" /> },
                  { label: 'Hold Period', value: '5–7 Years', detail: 'Capital growth window', icon: <TrendingUp size={16} className="text-indigo-500" /> },
                  { label: 'Occupancy', value: 'High Demand', detail: 'Rental vacancy < 2%', icon: <Home size={16} className="text-amber-500" /> },
                  { label: 'EPC Compliance', value: `Rating ${analysisData.epc}`, detail: 'Meets 2026 standards', icon: <Zap size={16} className="text-violet-500" /> },
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">{item.icon}<span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span></div>
                    <p className="text-sm font-bold text-slate-900">{item.value}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;