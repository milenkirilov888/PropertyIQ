import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  AlertCircle, 
  Search, 
  Menu, 
  X,
  Activity,
  Clock,
  Cpu
} from 'lucide-react';

const SidebarItem = ({ icon, label, path, active, onClick, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="w-5 h-5 bg-slate-100 rounded animate-pulse"></div>
        <div className="h-4 bg-slate-100 rounded w-24 animate-pulse"></div>
      </div>
    );
  }

  return (
    <Link 
      to={path} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
      <span className={`text-[13px] font-medium tracking-tight ${active ? 'font-semibold' : ''}`}>
        {label}
      </span>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ukTime, setUkTime] = useState('');
  const [ukDate, setUkDate] = useState('');

  
  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const dateOptions = {
        timeZone: 'Europe/London',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      };
      
      const now = new Date();
      setUkTime(now.toLocaleTimeString('en-GB', options));
      setUkDate(now.toLocaleDateString('en-GB', dateOptions));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

 
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { icon: <LayoutDashboard size={18} strokeWidth={2}/>, label: "Dashboard", path: "/" },
    { icon: <Search size={18} strokeWidth={2}/>, label: "Market Explorer", path: "/listings" },
    { icon: <BarChart3 size={18} strokeWidth={2}/>, label: "Market Analysis", path: "/analysis" },
    { icon: <AlertCircle size={18} strokeWidth={2}/>, label: "Risk Early Warning", path: "/risks" },
    { icon: <Cpu size={18} strokeWidth={2}/>, label: "System Documentation", path: "/explain" }, 
  ];

  return (
    <>
     
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 px-5 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">PropertyIQ</span>
        </div>
        <button onClick={toggleSidebar} className="p-1.5 text-slate-500 cursor-pointer">
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

     
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40 lg:hidden transition-opacity"
          onClick={toggleSidebar}
        ></div>
      )}

     
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-100 flex flex-col z-50 transition-transform duration-300 ease-in-out
        w-64 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
       
        <div className="h-16 flex items-center px-8 border-b border-slate-50 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 leading-none">PropertyIQ</h1>
            </div>
          </div>
        </div>
        
        
        <nav className="flex-1 px-4 space-y-1">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <SidebarItem key={i} loading={true} />
            ))
          ) : (
            menuItems.map((item) => (
              <SidebarItem 
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                active={location.pathname === item.path}
                onClick={() => setIsOpen(false)}
                loading={false}
              />
            ))
          )}
        </nav>

     
        <div className="p-4 border-t border-slate-50 bg-slate-50/30">
          {loading ? (
            <div className="h-14 bg-white border border-slate-100 rounded-xl animate-pulse"></div>
          ) : (
            <div className="flex flex-col gap-1.5 px-3 py-3 bg-white border border-slate-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live UK Sync</span>
                </div>
                <Clock size={12} className="text-slate-300" />
              </div>
              
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-slate-800 tabular-nums leading-tight">
                  {ukTime}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {ukDate}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;