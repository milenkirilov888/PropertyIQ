import React, { useState, useEffect } from 'react';
import { 
  Server, Code2, Database, Zap, 
  BrainCircuit, BarChart3, Activity, 
  CheckCircle2, Timer, Globe, Layers,
  FileSpreadsheet, Cpu, TrendingUp
} from 'lucide-react';

const Explain = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="min-h-screen bg-white font-sans text-slate-700">
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

      <section className="max-w-4xl mx-auto px-6 py-10 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">The Problem</h2>
          <h3 className="text-lg font-medium text-slate-900">Information Asymmetry</h3>
          <p className="text-[13px] leading-relaxed text-slate-500">
            Current platforms often present "black-box" scores. We address this by breaking down property features like EPC ratings, tenure, location, and size-to-price ratios.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">The Solution</h2>
          <h3 className="text-lg font-medium text-slate-900">Explainable Analytics</h3>
          <p className="text-[13px] leading-relaxed text-slate-500">
            Our approach uses XGBoost with SHAP values to provide transparent, interpretable predictions. We identify which features drive property valuations.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12 border-t border-slate-50">
        <div className="mb-10">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
            <Layers size={14}/> Engineering Foundation
          </h2>
          <h3 className="text-xl font-bold text-slate-900">Technology Stack</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="group p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-default">
            <Server size={20} className="text-emerald-600 mb-4 transition-transform group-hover:scale-110" />
            <h5 className="text-[14px] font-bold text-slate-800">FastAPI</h5>
            <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight mt-1">Backend API</p>
          </div>
          <div className="group p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-default">
            <Code2 size={20} className="text-indigo-600 mb-4 transition-transform group-hover:scale-110" />
            <h5 className="text-[14px] font-bold text-slate-800">React</h5>
            <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight mt-1">Frontend UI</p>
          </div>
          <div className="group p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-default">
            <Cpu size={20} className="text-amber-600 mb-4 transition-transform group-hover:scale-110" />
            <h5 className="text-[14px] font-bold text-slate-800">XGBoost</h5>
            <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight mt-1">ML Model</p>
          </div>
          <div className="group p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-default">
            <BrainCircuit size={20} className="text-rose-600 mb-4 transition-transform group-hover:scale-110" />
            <h5 className="text-[14px] font-bold text-slate-800">SHAP</h5>
            <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight mt-1">Explainability</p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12 border-t border-slate-50">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-8">Project Milestones</h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <div><h4 className="text-[13px] font-medium text-slate-800">Interface & UI Framework</h4><p className="text-[11px] text-slate-400">Completed</p></div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">March 2026</span>
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <div><h4 className="text-[13px] font-medium text-slate-800">Explainable ML Logic</h4><p className="text-[11px] text-slate-400">Completed</p></div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">April 2026</span>
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <Timer size={16} className="text-slate-300" />
              <div><h4 className="text-[13px] font-medium text-slate-800">Final Backend & ONS Data</h4><p className="text-[11px] text-slate-400">Planned</p></div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">April 2026</span>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="p-8 border border-slate-100 rounded-[2rem] bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-[10px] uppercase tracking-widest">
              <Globe size={14} /> Data Intelligence
            </div>
            <h3 className="text-lg font-medium text-slate-900">CSV Dataset Integration</h3>
            <p className="text-[12px] text-slate-500 max-w-sm leading-relaxed">
              The system uses proprietary <strong>CSV datasets</strong> containing UK property listings with features like price, size, EPC rating, tenure, and location for high-fidelity predictive modeling.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-100">
              <FileSpreadsheet size={24} className="text-emerald-500 mb-2"/>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Static CSV</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100">
              <TrendingUp size={24} className="text-blue-500 mb-2"/>
              <p className="text-[10px] font-bold text-slate-400 uppercase">ML Predictions</p>
            </div>
          </div>
        </div>
      </section>

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