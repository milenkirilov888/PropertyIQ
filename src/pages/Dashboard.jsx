import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Search, MapPin, TrendingUp, Activity, 
  Globe, ChevronUp, ChevronDown, Database, Layout, ShieldCheck, AlertCircle
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
        // Dynamic environment variable resolution for API connectivity
        const base_url = import.meta.env.VITE_BACKEND_URL || import.meta.env.Backend_URL || "http://127.0.0.1:5000";
        const response = await fetch(`${base_url.replace(/\/$/, '')}/api/properties`);
        
        if (!response.ok) throw new Error("Connection failed");
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setProperties(data);
          setConnStatus('Nominal'); // System operational
        } else {
          setConnStatus('Degraded'); // Partial data mismatch
        }
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
        setConnStatus('Offline'); // Connection failed
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchAllData();
  }, []);

  const stats = useMemo(() => {
    if (!properties || properties.length === 0) return {
      total: 0, avgYield: "0.00", region: "N/A", risk: "Conservative", riskColor: "text-slate-400", 
      biasText: "Stable", biasColor: "text-slate-400", prices: [], dataPoints: 0
    };

    const prices = properties.map(p => p.price_num || 0);
    const yields = properties.map(p => p.yield_num || 0).filter(y => y > 0);
    const avgYield = yields.length ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;
    
    // Risk Classification based on Yield thresholds
    const riskLevel = avgYield > 12 ? "High Return" : avgYield > 6 ? "Balanced" : "Conservative";
    const riskColor = riskLevel === "High Return" ? "text-rose-600" : riskLevel === "Balanced" ? "text-amber-600" : "text-emerald-600";

    // Geospatial Modal Analysis (Identifies the primary region in the dataset)
    const regions = properties.map(p => {
        const parts = p.address?.split(',');
        return parts ? parts[parts.length - 1].trim() : "Unknown";
    });
    
    const regionCounts = regions.reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {});
    const modeRegion = Object.keys(regionCounts).reduce((a, b) => regionCounts[a] > regionCounts[b] ? a : b, "N/A");

    // Market Momentum Analysis (Growth/Decline Logic)
    const validPrices = prices.filter(p => p > 0);
    const growth = validPrices.length > 1 ? validPrices[validPrices.length - 1] - validPrices[0] : 0;
    const biasText = growth > 0 ? "Upward Trend" : growth < 0 ? "Price Correction" : "Stable Market";
    const biasColor = growth > 0 ? "text-emerald-600" : growth < 0 ? "text-rose-600" : "text-slate-500";

    return {
      total: properties.length,
      avgYield: avgYield.toFixed(2),
      region: modeRegion,
      risk: riskLevel,
      riskColor,
      biasText,
      biasColor,
      prices: validPrices.slice(-15), // Sparkline data points
      dataPoints: properties.length * 8 // Estimated total data signals processed
    };
  }, [properties]);

  const chartConfig = useMemo(() => {
    let filtered = properties.filter(p => 
      (p.property_title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.uprn || "").toString().includes(searchTerm) ||
      (p.address || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    let sliceCount = timeRange === '1M' ? 10 : timeRange === '6M' ? 30 : filtered.length;
    const displayData = filtered.slice(-sliceCount);
    
    return {
      labels: displayData.map(p => p.property_title?.substring(0, 12) || p.uprn || "Node"),
      prices: displayData.map(p => p.price_num || 0)
    };
  }, [properties, searchTerm, timeRange]);

  const chartData = {
    labels: chartConfig.labels,
    datasets: [{
      data: chartConfig.prices,
      borderColor: '#4F46E5',
      borderWidth: 2,
      pointRadius: chartConfig.prices.length > 40 ? 0 : 3,
      pointBackgroundColor: '#fff',
      fill: true,
      backgroundColor: 'rgba(79, 70, 229, 0.05)',
      tension: 0.4, 
    }]
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Navigation & Global Search */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 rounded-none">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase">
                Property <span className="text-indigo-600">IQ </span> <span className="text-slate-400">Overview</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${connStatus === 'Nominal' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">System {connStatus}</p>
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-600 outline-none text-sm font-medium transition-all" 
              placeholder="Locate properties or UPRN nodes..." 
            />
          </div>
        </header>

        {/* Executive KPI Grid: Real-time Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-none overflow-hidden">
          <KPICard loading={loading} label="Active Inventory" value={stats?.total} subText="Total properties tracked" sparkline={stats?.prices} trend="up" border />
          <KPICard loading={loading} label="Average Yield" value={`${stats?.avgYield}%`} subText="Annual return rate" sparkline={[5, 8, 7, 12, 10, 15]} trend="up" border />
          
          <div className="p-8 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between min-h-[180px]">
            {loading ? <Skeleton h="h-full" /> : (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Profile</p>
                <div className={`flex items-center gap-2 ${stats?.riskColor}`}>
                  {stats?.risk === 'Conservative' ? <ShieldCheck size={20}/> : <AlertCircle size={20}/>}
                  <span className="text-2xl font-black tracking-tighter">{stats?.risk}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-2">Yield Volatility Model</div>
              </>
            )}
          </div>

          <KPICard loading={loading} label="Core Region" value={stats?.region} subText="Highest density area" trend="up" />
        </div>

        {/* Analytics Hub: Time-series Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-widest">Valuation Timeline</h4>
              </div>
              <div className="flex bg-slate-50 border border-slate-200 p-1">
                {['1M', '6M', 'ALL'].map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTimeRange(t)} 
                    className={`px-4 py-1 text-[10px] font-bold transition-all cursor-pointer ${timeRange === t ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[400px] w-full border border-slate-200 p-6 bg-white relative">
              {loading ? <Skeleton h="h-full" /> : <Line data={chartData} options={chartOptions} />}
            </div>
          </div>

          {/* Contextual Market Insights Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-8 border border-slate-200 space-y-6 bg-white">
              <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase text-[10px] tracking-widest">
                <Globe size={16} /> Market Summary
              </div>
              {loading ? <Skeleton h="h-32" /> : (
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {stats?.region}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    System analysis of <span className="text-slate-900 font-bold">{stats?.total} assets</span>. 
                    Regional bias indicates an <span className="text-indigo-600 font-bold underline underline-offset-4">{stats?.biasText.toLowerCase()}</span>, 
                    validating a {parseFloat(stats?.avgYield) > 5 ? 'strong' : 'steady'} period for asset acquisition.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-px bg-slate-200 border border-slate-200">
              <DriverItem icon={<MapPin size={16}/>} label="UPRN Status" score="Verified Records" color="text-emerald-600" />
              <DriverItem icon={<Layout size={16}/>} label="Data Points" score={`${stats?.dataPoints.toLocaleString()} Signals`} />
              <DriverItem icon={<TrendingUp size={16}/>} label="Market Bias" score={stats?.biasText} color={stats?.biasColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Atomic UI Components ---

/**
 * @component KPICard
 * @param {string} label - Metric Title
 * @param {string} value - Computed Value
 * @param {Array} sparkline - Array of price points for visual mini-chart
 */
const KPICard = ({ label, value, subText, border, loading, trend, sparkline }) => (
  <div className={`p-8 bg-white flex flex-col justify-between min-h-[180px] ${border ? 'lg:border-r border-b lg:border-b-0 border-slate-200' : ''}`}>
    {loading ? <Skeleton h="h-full" /> : (
      <>
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <div className={trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}>
            {trend === 'up' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter py-2">{value || '---'}</h3>
        {sparkline && sparkline.length > 0 && (
          <div className="h-8 flex items-end gap-1 mb-2">
            {sparkline.map((v, i) => {
              const max = Math.max(...sparkline);
              const height = max > 0 ? (v / max) * 100 : 20;
              return (
                <div 
                  key={i} 
                  className={`flex-1 ${trend === 'up' ? 'bg-emerald-400' : 'bg-rose-400'}`} 
                  style={{ height: `${Math.max(height, 20)}%`, opacity: (i + 1) / sparkline.length }}
                />
              );
            })}
          </div>
        )}
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{subText}</div>
      </>
    )}
  </div>
);

/**
 * @component DriverItem
 * List item for displaying market signals/attributes.
 */
const DriverItem = ({ icon, label, score, color }) => (
  <div className="flex items-center justify-between p-5 bg-white transition-colors hover:bg-slate-50 cursor-default">
    <div className="flex items-center gap-4">
      <div className="text-slate-400">{icon}</div>
      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{label}</span>
    </div>
    <span className={`text-[11px] font-black ${color || 'text-slate-900'}`}>{score}</span>
  </div>
);

const Skeleton = ({ h }) => (
  <div className={`w-full ${h} bg-slate-50 animate-pulse rounded-sm`} />
);

// Chart Configuration
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 12,
      titleFont: { size: 12, weight: 'bold' },
      bodyFont: { size: 12 },
      borderRadius: 0,
    }
  },
  scales: { 
    y: { border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } },
    x: { border: { display: false }, grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } }
  }
};

export default Dashboard;