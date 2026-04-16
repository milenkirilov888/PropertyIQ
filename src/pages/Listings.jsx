import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, ArrowUpRight, Search, X,
  Database, ChevronLeft, ChevronRight,
  Building2, SearchX, ShieldAlert,
  CheckCircle2, ListFilter, Bed, Activity, Sparkles,
  ArrowRight, Zap
} from 'lucide-react';
import PredictModal from '../components/PredictModal';

const Highlight = ({ text, highlight }) => {
  if (!highlight?.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = String(text).split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-amber-200/70 text-slate-900 rounded px-0.5">{part}</mark>
          : part
      )}
    </span>
  );
};

const SkeletonCard = () => (
  <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
    <div className="h-52 bg-gradient-to-br from-slate-50 to-slate-100 animate-pulse" />
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-3 bg-slate-100 rounded-full w-1/3" />
      <div className="h-5 bg-slate-100 rounded-full w-4/5" />
      <div className="h-5 bg-slate-100 rounded-full w-3/5" />
      <div className="pt-4 border-t border-slate-50 flex gap-3">
        <div className="h-10 bg-slate-100 rounded-2xl flex-1" />
        <div className="h-10 bg-slate-100 rounded-2xl flex-1" />
      </div>
    </div>
  </div>
);

const EPC_COLORS = {
  A: 'bg-emerald-500', B: 'bg-emerald-400', C: 'bg-lime-400',
  D: 'bg-amber-400',   E: 'bg-orange-400',  F: 'bg-red-400', G: 'bg-red-600'
};

const Listings = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredId, setHoveredId] = useState(null);
  const itemsPerPage = 12;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const calculateStability = (prop) => {
    let score = 70;
    const epc = String(prop.ecp_rating || 'N/A').toUpperCase();
    if (epc.includes('A')) score += 25;
    else if (epc.includes('B')) score += 18;
    else if (epc.includes('C')) score += 10;
    if (String(prop.tenure || '').toLowerCase().includes('freehold')) score += 4;
    return Math.min(score, 99);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const base_url = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${base_url.replace(/\/$/, '')}/api/properties`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch {
        setError(true);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };
    fetchData();
  }, []);

  const filteredData = properties.filter(p =>
    (p.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.property_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.uprn || '').toString().includes(searchTerm)
  );

  const totalInventory = filteredData.length;
  const highYield = filteredData.filter(p =>
    ['A', 'B', 'C'].includes(String(p.ecp_rating || '').toUpperCase())
  ).length;

  const totalPages = Math.ceil(totalInventory / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-24 text-slate-900 font-sans">

      <PredictModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyData={selectedProperty}
        simpleMode={!!selectedProperty}
      />

      {/* Sticky Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Building2 size={20} className="text-white" />
              </div>
              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${error ? 'bg-red-400' : 'bg-emerald-400'}`} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900">
                PropertyIQ <span className="text-indigo-600">Core</span>
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                {error ? '⚠ Offline' : `${totalInventory} assets loaded`}
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-[480px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input
              type="text"
              placeholder="Search by location, title or UPRN..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder-slate-300 focus:bg-white focus:border-indigo-400 outline-none transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 cursor-pointer transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 mt-8 space-y-8">

        {/* Stats Bar */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={<ListFilter size={18} />}
              iconBg="bg-slate-100 text-slate-500"
              label="Total Inventory"
              value={totalInventory}
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              iconBg="bg-emerald-50 text-emerald-500"
              label="High-Grade Assets"
              value={highYield}
              valueColor="text-emerald-600"
            />
            <StatCard
              icon={<Database size={18} />}
              iconBg="bg-indigo-50 text-indigo-500"
              label="System Status"
              value={error ? 'Offline' : 'Nominal'}
              valueColor={error ? 'text-red-500' : 'text-indigo-600'}
            />
          </div>
        )}

        {/* Property Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading
            ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
            : currentItems.map((prop) => {
                const stability = calculateStability(prop);
                const imgUrl = prop.property_images?.[0];
                const pId = prop.id;
                const epc = String(prop.ecp_rating || '').toUpperCase();
                const epcColor = EPC_COLORS[epc[0]] || 'bg-slate-300';
                // Bedrooms as integer
                const bedrooms = Math.floor(parseFloat(prop.bedrooms)) || 0;

                return (
                  <article
                    key={pId}
                    onMouseEnter={() => setHoveredId(pId)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => navigate(`/property/${pId}`)}
                    className="group bg-white border border-slate-100 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 hover:-translate-y-1 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-52 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          alt="Property"
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-200">
                          <Building2 size={36} strokeWidth={1} />
                          <span className="text-[9px] font-bold mt-2 uppercase tracking-widest">No Preview</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-tight text-slate-700 border border-white/50">
                        {prop.tenure || 'N/A'}
                      </div>
                      <div className={`absolute top-3 right-3 ${epcColor} w-7 h-7 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-sm`}>
                        {epc[0] || '?'}
                      </div>
                      <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <div className="bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700">View full profile</span>
                          <ArrowUpRight size={15} className="text-indigo-500" />
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors flex-1">
                          <Highlight text={prop.property_title || 'Market Asset'} highlight={searchTerm} />
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 mb-4">
                        <MapPin size={11} className="shrink-0" />
                        <p className="text-[11px] font-medium truncate">
                          <Highlight text={prop.address || 'Location pending'} highlight={searchTerm} />
                        </p>
                      </div>

                      {/* Specs row (kept) */}
                      <div className="flex items-center gap-3 py-3 border-y border-slate-50">
                        <div className="flex items-center gap-1.5">
                          <Bed size={13} className="text-slate-300" />
                          <span className="text-[11px] font-bold text-slate-600">{bedrooms} Bed</span>
                        </div>
                        <span className="text-slate-200">·</span>
                        <div className="flex items-center gap-1.5">
                          <Zap size={13} className="text-slate-300" />
                          <span className="text-[11px] font-bold text-slate-600">EPC {epc[0] || 'N/A'}</span>
                        </div>
                        <span className="text-slate-200">·</span>
                        <div className="flex items-center gap-1.5">
                          <Activity size={13} className="text-slate-300" />
                          <span className={`text-[11px] font-bold ${stability > 85 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                            {stability}%
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mt-4 mb-5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Valuation</p>
                        <p className="text-xl font-black text-slate-900 tracking-tight">{prop.price?.replace(/\.00$/, '') || 'POA'}</p>
                      </div>

                      {/* Stability bar */}
                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Stability Index</span>
                          <span className={`text-[10px] font-black ${stability > 85 ? 'text-emerald-500' : 'text-indigo-500'}`}>{stability}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${stability > 85 ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                            style={{ width: `${stability}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions - Only Predict button remains */}
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedProperty(prop); setIsModalOpen(true); }}
                          className="flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles size={13} /> Predict
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
        </div>

        {/* Empty State */}
        {!loading && filteredData.length === 0 && (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
            <SearchX size={48} className="mx-auto text-slate-200 mb-5" />
            <h3 className="text-lg font-bold text-slate-800">No results for "{searchTerm}"</h3>
            <p className="text-sm text-slate-400 mt-2 mb-6">Try adjusting your search term.</p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-indigo-600 transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer bg-white"
            >
              <ChevronLeft size={17} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, i, arr) => (
                <React.Fragment key={page}>
                  {i > 0 && arr[i - 1] !== page - 1 && (
                    <span className="text-slate-300 font-bold px-1">…</span>
                  )}
                  <button
                    onClick={() => { setCurrentPage(page); window.scrollTo(0, 0); }}
                    className={`w-10 h-10 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}

            <button
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer bg-white"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, iconBg, label, value, valueColor = 'text-slate-900' }) => (
  <div className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center gap-4">
    <div className={`p-2.5 rounded-2xl ${iconBg}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-xl font-black ${valueColor}`}>{value}</p>
    </div>
  </div>
);

export default Listings;
