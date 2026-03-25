import React, { useState, useEffect } from 'react';
import { 
  Server, Code2, Database, Zap, 
  BrainCircuit, BarChart3, Activity, 
  CheckCircle2, Timer, Globe, Layers,
  FileSpreadsheet
} from 'lucide-react';

/**
 * @component Explain
 * @description System Documentation & Architecture page with Skeleton loading states.
 */
const Explain = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating architecture data resolution
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // --- SKELETON LOADER UI ---
  if (loading) return (
    <div className="min-h-screen bg-white p-6 md:p-20 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <div className="h-4 w-24 bg-slate-100 rounded"></div>
          <div className="h-10 w-64 bg-slate-100 rounded-xl"></div>
          <div className="h-20 w-full bg-slate-50 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-32 bg-slate-50 rounded-2xl"></div>
          <div className="h-32 bg-slate-50 rounded-2xl"></div>
        </div>
        <div className="h-64 bg-slate-50 rounded-3xl"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-700 selection:bg-slate-100">
      
      {/* --- HERO SECTION --- */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12">
        <div className="flex items-center gap-2 text-slate-400 font-medium text-[11px] uppercase tracking-widest mb-4">
          <Activity size={14} /> Project Documentation
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
          PropertyIQ Architecture
        </h1>
        <p className="text-base text-slate-500 max-w-2xl leading-relaxed">
          An explainable decision-support system designed to evaluate UK residential property investments through transparent data analytics.
        </p>
      </section>

      {/* --- CORE OBJECTIVES --- */}
      <section className="max-w-4xl mx-auto px-6 py-10 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">The Problem</h2>
          <h3 className="text-lg font-medium text-slate-900">Information Asymmetry</h3>
          <p className="text-[13px] leading-relaxed text-slate-500">
            Current platforms often present "black-box" scores. We address this by breaking down socio-economic factors like industry dependency and income-to-price ratios.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">The Solution</h2>
          <h3 className="text-lg font-medium text-slate-900">Explainable Analytics</h3>
          <p className="text-[13px] leading-relaxed text-slate-500">
            Our approach prioritizes interpretability over mere prediction. We identify structural vulnerabilities that headline performance metrics often miss.
          </p>
        </div>
      </section>

      {/* --- TECH STACK SECTION --- */}
      <section className="max-w-4xl mx-auto px-6 py-12 border-t border-slate-50">
        <div className="mb-10">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
            <Layers size={14}/> Engineering Foundation
          </h2>
          <h3 className="text-xl font-bold text-slate-900">Technology Stack</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { name: 'Django', icon: <Server size={20} />, label: 'Backend Framework', color: 'text-emerald-700' },
            { name: 'React', icon: <Code2 size={20} />, label: 'Frontend Interface', color: 'text-indigo-600' },
            { name: 'Pandas', icon: <Database size={20} />, label: 'Data Processing', color: 'text-amber-600' },
            { name: 'Chart.js', icon: <BarChart3 size={20} />, label: 'Visual Analytics', color: 'text-rose-600' }
          ].map((tech, i) => (
            <div key={i} className="group p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-default">
              <div className={`${tech.color} mb-4 transition-transform group-hover:scale-110 duration-300`}>
                {tech.icon}
              </div>
              <h5 className="text-[14px] font-bold text-slate-800">{tech.name}</h5>
              <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight mt-1">{tech.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- DEVELOPMENT TIMELINE --- */}
      <section className="max-w-4xl mx-auto px-6 py-12 border-t border-slate-50">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-8">Project Milestones</h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { date: "March 2026", title: "Interface & UI Framework", status: "Active", icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
            { date: "In Progress", title: "Explainable ML Logic", status: "Ongoing", icon: <BrainCircuit size={16} className="text-indigo-500" /> },
            { date: "April 2026", title: "Final Backend & ONS Data", status: "Planned", icon: <Timer size={16} className="text-slate-300" /> }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                {item.icon}
                <div>
                  <h4 className="text-[13px] font-medium text-slate-800">{item.title}</h4>
                  <p className="text-[11px] text-slate-400">{item.status}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{item.date}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- FUTURE SCOPE --- */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="p-8 border border-slate-100 rounded-[2rem] bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-[10px] uppercase tracking-widest">
              <Globe size={14} /> Data Intelligence
            </div>
            <h3 className="text-lg font-medium text-slate-900">ONS & CSV Dataset Integration</h3>
            <p className="text-[12px] text-slate-500 max-w-sm leading-relaxed">
              The system is being architected to integrate <strong>Office for National Statistics (ONS)</strong> APIs alongside proprietary <strong>CSV datasets</strong> for high-fidelity regional analysis, property size metrics, and predictive modeling.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-100">
                <FileSpreadsheet size={24} className="text-emerald-500 mb-2"/>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Static CSV</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100">
                <Globe size={24} className="text-blue-500 mb-2"/>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Live ONS</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-slate-50 flex justify-between items-center text-[11px] text-slate-400">
        <p>© 2026 PropertyIQ</p>
        <div className="flex gap-4">
          <span className="hover:text-slate-600 cursor-pointer">System Documentation</span>
        </div>
      </footer>
    </div>
  );
};

export default Explain;