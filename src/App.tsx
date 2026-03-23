import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import AdminLayout from './pages/AdminLayout';
import PosLayout from './pages/PosLayout';
import Pedidos from './pages/Pedidos';

import Reportes from './pages/admin/Reportes';
import Usuarios from './pages/admin/Usuarios';
import Inventario from './pages/admin/Inventario';
import Productos from './pages/admin/Productos';
import Mesas from './pages/admin/Mesas';
import Herramientas from './pages/admin/Herramientas';

import Caja from './pages/pos/Caja';
import MesasPos from './pages/pos/MesasPos';
import PanelDJ from './pages/pos/PanelDJ';

export default function App() {
  const customTheme = useStore((state) => state.customTheme);
  const setLogoUrl = useStore((state) => state.setLogoUrl);
  const setBackgroundUrl = useStore((state) => state.setBackgroundUrl);

  useEffect(() => {
    if (customTheme) {
      document.documentElement.style.setProperty('--color-primary', customTheme.primary || '#ef4444');
      document.documentElement.style.setProperty('--color-secondary', customTheme.secondary || '#3b82f6');
      document.documentElement.style.setProperty('--color-bg1', customTheme.bg1 || '#18181b');
      document.documentElement.style.setProperty('--color-bg2', customTheme.bg2 || '#09090b');
      document.documentElement.style.setProperty('--color-text', customTheme.text || '#ffffff');
      document.documentElement.style.setProperty('--color-text-secondary', customTheme.textSecondary || '#a1a1aa');
    }
  }, [customTheme]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const logoSetting = data.find((s: any) => s.key === 'logoUrl');
          const bgSetting = data.find((s: any) => s.key === 'backgroundUrl');
          if (logoSetting) setLogoUrl(logoSetting.value);
          if (bgSetting) setBackgroundUrl(bgSetting.value);
        }
      })
      .catch(err => console.error('Error loading settings:', err));
  }, [setLogoUrl, setBackgroundUrl]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="reportes" element={<Reportes />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="productos" element={<Productos />} />
          <Route path="mesas" element={<Mesas />} />
          <Route path="herramientas" element={<Herramientas />} />
        </Route>

        <Route path="/pos" element={<PosLayout />}>
          <Route path="caja" element={<Caja />} />
          <Route path="mesas" element={<MesasPos />} />
          <Route path="dj" element={<PanelDJ />} />
        </Route>

        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
