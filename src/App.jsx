import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

// Páginas
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AlertsPage from './pages/alerts/AlertsPage';
import OrdersPage from './pages/orders/OrdersPage';
import ReceptionPage from './pages/reception/ReceptionPage';
import InventoryPage from './pages/inventory/InventoryPage';
import SalesPage from './pages/sales/SalesPage';

function RoleRedirect() {
  const { role } = useAuth();
  if (role === 'sector_ventas') {
    return <Navigate to="/ventas" replace />;
  }
  if (role === 'auxiliar_logistico') {
    return <Navigate to="/recepcion" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública de acceso */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas dentro del Layout principal */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<RoleRedirect />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="alertas" element={<AlertsPage />} />
            <Route path="ordenes" element={<OrdersPage />} />
            <Route path="recepcion" element={<ReceptionPage />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="ventas" element={<SalesPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

