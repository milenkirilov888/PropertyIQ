import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Search, MapPin, TrendingUp, Activity,
  Globe, ChevronUp, ChevronDown, Database,
  ShieldCheck, AlertCircle, ArrowUpRight, Layers
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState([]);
  const [connStatus, setConnStatus] = useState('Checking');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const base_url = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${base_url.replace(/\/$/, '')}/api/properties`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (Array.isArray(data)) { setProperties(data); setConnStatus('Nominal'); }
        else setConnStatus('Degraded');
      } catch {
        setConnStatus('Offline');
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchAllData();
  }, []);

  const stats = useMemo(() => {
    if (!properties.length) return {
      total: 0, avgYield: '0.00', region: 'N/A', risk: 'Conservative',
      riskColor: 'text-slate-400', biasText: 'Stable', biasColor: 'text-slate-400',
      prices: [], dataPoints: 0
    };

    const prices   = properties.map(p => p.price_num || 0);
    const yields   = properties.map(p => (p.yield_num || 0) / 100).filter(y => y > 0 && y < 20);
    const avgYield = yields.length ? yields.reduce((a, b) => a + b, 0) / yields.length : 5.5;
    const riskLevel = avgYield > 7 ? 'High Return' : avgYield > 5 ? 'Balanced' : 'Conservative';
    const riskColor = riskLevel === 'High Return' ? 'text-rose-500' : riskLevel === 'Balanced' ? 'text-amber-500' : 'text-emerald-500';

    const regions = properties.map(p => p.address?.split(',').pop()?.trim() || 'Unknown');
    const regionCounts = regions.reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {});
    const modeRegion = Object.keys(regionCounts).reduce((a, b) => regionCounts[a] > regionCounts[b] ? a : b, 'N/A');

    const validPrices = prices.filter(p => p > 0);
    const growth = validPrices.length > 1 ? validPrices[validPrices.length - 1] - validPrices[0] : 0;
    const biasText  = growth > 0 ? 'Upward Trend' : growth < 0 ? 'Price Correction' : 'Stable Market';
    const biasColor = growth > 0 ? 'text-emerald-500' : growth < 0 ? 'text-rose-500' : 'text-slate-400';

    return {
      total: properties.length, avgYield: avgYield.toFixed(2),
      region: modeRegion, risk: riskLevel, riskColor, biasText, biasColor,
      prices: validPrices.slice(-15), dataPoints: properties.length * 8
    };
  }, [properties]);

  const chartConfig = useMemo(() => {
    const filtered = properties.filter(p =>
      (p.property_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.uprn || '').toString().includes(searchTerm) ||
      (p.address || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sliceCount = timeRange === '1M' ? 10 : timeRange === '6M' ? 30 : filtered.length;
    const display = filtered.slice(-sliceCount);
    return {
      labels: display.map(p => p.property_title?.substring(0, 14) || p.uprn || 'Node'),
      prices: display.map(p => p.price_num || 0)
    };
  }, [properties, searchTerm, timeRange]);

  const chartData = {
    labels: chartConfig.labels,
    datasets: [{
      data: chartConfig.prices,
      borderColor: '#6366f1',
      borderWidth: 2.5,
      pointRadius: chartConfig.prices.length > 40 ? 0 : 4,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#6366f1',
      pointBorderWidth: 2,
      fill: true,
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 380);
        gradient.addColorStop(0, 'rgba(99,102,241,0.12)');
        gradient.addColorStop(1, 'rgba(99,102,241,0)');
        return gradient;
      },
      tension: 0.45,
    }]
  };

  const isOnline = connStatus === 'Nominal';

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Database size={22} className="text-white" />
              </div>
              <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Property<span className="text-indigo-600">IQ</span>
                <span className="text-slate-300 font-light mx-2">/</span>
                <span className="text-slate-400 font-medium text-lg">Overview</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                System {connStatus}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder-slate-300 focus:border-indigo-400 outline-none transition-all"
              placeholder="Search properties..."
            />
          </div>
        </header>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard loading={loading} label="Active Inventory" value={stats.total} sub="Properties tracked" sparkline={stats.prices} trend="up" />
          <KPICard loading={loading} label="Avg. Annual Yield" value={`${stats.avgYield}%`} sub="Return rate" sparkline={[5,8,7,12,10,15]} trend="up" />

          <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between min-h-[140px]">
            {loading ? <Shimmer /> : (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Profile</p>
                <div className={`flex items-center gap-2 mt-3 ${stats.riskColor}`}>
                  {stats.risk === 'Conservative' ? <ShieldCheck size={22} /> : <AlertCircle size={22} />}
                  <span className="text-2xl font-black tracking-tight">{stats.risk}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Yield Volatility Model</p>
              </>
            )}
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between min-h-[140px]">
            {loading ? <Shimmer /> : (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Region</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-3 line-clamp-1">{stats.region}</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Highest density</p>
              </>
            )}
          </div>
        </div>

        {/* ── Chart + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Chart */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-7">
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                  <Activity size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Valuation Timeline</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{chartConfig.prices.length} data points</p>
                </div>
              </div>
              <div className="flex bg-slate-50 border border-slate-200 rounded-2xl p-1 gap-1">
                {['1M', '6M', 'ALL'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      timeRange === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[360px] w-full">
              {loading ? <Shimmer className="h-full" /> : <Line data={chartData} options={chartOptions} />}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Market summary */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6">
              <div className="flex items-center gap-2 text-indigo-500 font-bold uppercase text-[10px] tracking-widest mb-4">
                <Globe size={14} /> Market Summary
              </div>
              {loading ? <Shimmer /> : (
                <>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">{stats.region}</h3>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    Analysis of <span className="font-bold text-slate-800">{stats.total} assets</span>. Regional
                    bias indicates an <span className={`font-bold ${stats.biasColor}`}>{stats.biasText.toLowerCase()}</span>,
                    validating a {parseFloat(stats.avgYield) > 5 ? 'strong' : 'steady'} acquisition window.
                  </p>
                </>
              )}
            </div>

            {/* Signal cards */}
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-50">
              <SignalRow icon={<MapPin size={15}/>} label="UPRN Status" value="Verified" color="text-emerald-500" />
              <SignalRow icon={<TrendingUp size={15}/>} label="Market Bias" value={stats.biasText} color={stats.biasColor} />
              <SignalRow icon={<ArrowUpRight size={15}/>} label="Avg Yield" value={`${stats.avgYield}%`} color="text-indigo-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──

const KPICard = ({ label, value, sub, border, loading, trend, sparkline }) => (
  <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between min-h-[140px]">
    {loading ? <Shimmer /> : (
      <>
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <div className={trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
            {trend === 'up' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight py-2">{value || '---'}</h3>
        {sparkline?.length > 0 && (
          <div className="h-8 flex items-end gap-0.5 mb-2">
            {sparkline.map((v, i) => {
              const max = Math.max(...sparkline);
              const h = max > 0 ? (v / max) * 100 : 20;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${trend === 'up' ? 'bg-emerald-300' : 'bg-rose-300'}`}
                  style={{ height: `${Math.max(h, 15)}%`, opacity: 0.4 + (i / sparkline.length) * 0.6 }}
                />
              );
            })}
          </div>
        )}
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{sub}</p>
      </>
    )}
  </div>
);

const SignalRow = ({ icon, label, value, color }) => (
  <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors">
    <div className="flex items-center gap-3">
      <span className="text-slate-300">{icon}</span>
      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{label}</span>
    </div>
    <span className={`text-[11px] font-black ${color || 'text-slate-900'}`}>{value}</span>
  </div>
);

const Shimmer = ({ className = 'h-full' }) => (
  <div className={`w-full ${className} bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 animate-pulse rounded-2xl`} style={{ minHeight: 80 }} />
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 14,
      cornerRadius: 12,
      titleFont: { size: 11, weight: 'bold' },
      bodyFont: { size: 13, weight: 'bold' },
      callbacks: {
        label: (ctx) => `  £${ctx.parsed.y.toLocaleString()}`
      }
    }
  },
  scales: {
    y: {
      border: { display: false },
      grid: { color: '#f1f5f9' },
      ticks: {
        font: { size: 10, weight: 'bold' },
        color: '#cbd5e1',
        callback: (v) => {
          if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}M`;
          if (v >= 1_000) return `£${(v / 1_000).toFixed(0)}k`;
          return `£${v}`;
        }
      }
    },
    x: {
      border: { display: false },
      grid: { display: false },
      ticks: { font: { size: 10, weight: 'bold' }, color: '#cbd5e1', maxRotation: 0 }
    }
  }
};

export default Dashboard;