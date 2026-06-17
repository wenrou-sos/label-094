import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

import CustomerHome from '@/pages/customer/Home';
import Cart from '@/pages/customer/Cart';
import Checkout from '@/pages/customer/Checkout';

import Dashboard from '@/pages/admin/Dashboard';
import Analytics from '@/pages/admin/Analytics';
import Heatmap from '@/pages/admin/Heatmap';
import Export from '@/pages/admin/Export';

import NotFound from '@/pages/NotFound';

function AppRoutes() {
  const startAutoSimulation = useAppStore(s => s.startAutoSimulation);

  useEffect(() => {
    startAutoSimulation();
  }, [startAutoSimulation]);

  return (
    <Routes>
      <Route path="/" element={<CustomerHome />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/analytics" element={<Analytics />} />
      <Route path="/admin/heatmap" element={<Heatmap />} />
      <Route path="/admin/export" element={<Export />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
