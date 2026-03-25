import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Analysis from '../pages/Analysis';
import RiskAlerts from '../pages/RiskAlerts';
import Listings from '../pages/Listings'; 
import PropertyDetail from '../pages/PropertyDetail';
import Explain from '../pages/Explain';

/**
 * @component AppRoutes
 * @description Centralized routing engine for PropheticAI.
 * Handles dynamic data mapping, asset audits, and system documentation.
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Core Analytics & Overview */}
      <Route path="/" element={<Dashboard />} />
      
      {/* 2. Asset Explorer & Listings */}
      <Route path="/listings" element={<Listings />} />
      
      {/* 3. Financial Analysis Engine (Supports Global & ID-specific views) */}
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/analysis/:id" element={<Analysis />} /> 
      
      {/* 4. Single Asset Deep-Dive */}
      <Route path="/property/:id" element={<PropertyDetail />} />
      
      {/* 5. Risk Intelligence & Audit Nodes */}
      <Route path="/risks" element={<RiskAlerts />} />
      <Route path="/risks/:id" element={<RiskAlerts />} />

      {/* 6. System Architecture & Documentation */}
      <Route path="/explain" element={<Explain />} />

      {/* 7. Catch-all: Redirects invalid paths to Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;