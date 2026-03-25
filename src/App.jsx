import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Lenis from '@studio-freight/lenis'; 
import Sidebar from './components/layout/Sidebar';
import AppRoutes from './routes/AppRoutes';

function App() {
  const scrollRef = useRef(null);

  useEffect(() => {
    
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      infinite: false,
    });

    
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

  
    
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <Router>
      <div className="flex min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-100 selection:text-blue-600 antialiased">
        
        {/* Sidebar */}
        <Sidebar />

       
        <main className="flex-1 w-full ml-0 lg:ml-64 p-5 md:p-10 pt-24 lg:pt-10 transition-all duration-300 ease-in-out">
          <div className="max-w-[1400px] mx-auto">
            
            <AppRoutes />
            
          </div>
        </main>

      </div>
    </Router>
  );
}

export default App;