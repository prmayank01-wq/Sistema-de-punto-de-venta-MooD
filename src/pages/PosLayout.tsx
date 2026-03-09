import { useEffect, useRef } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { LogOut, MonitorSmartphone, Music, LayoutGrid } from 'lucide-react';
import { io } from 'socket.io-client';

export default function PosLayout() {
  const user = useStore(state => state.user);
  const setUser = useStore(state => state.setUser);
  const unreadNotifications = useStore(state => state.unreadNotifications);
  const setUnreadNotifications = useStore(state => state.setUnreadNotifications);
  const location = useLocation();
  const locationRef = useRef(location.pathname);

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!user || user.role !== 'CAJERO') return;

    const newSocket = io(import.meta.env.VITE_BASE_URL_PEDIDOS || 'http://localhost:3000');

    newSocket.on('connect', () => {
      newSocket.emit('join_dj');
    });

    newSocket.on('new_message', (data) => {
      // Set unread notification if we receive a message from a table
      // and we are not currently looking at the DJ panel
      if (data.fromRole === 'MESA' && !locationRef.current.includes('/pos/dj')) {
        setUnreadNotifications(true);
      }
    });

    newSocket.on('new_playlist_item', () => {
      if (!locationRef.current.includes('/pos/dj')) {
        setUnreadNotifications(true);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, setUnreadNotifications]);

  if (!user || user.role !== 'CAJERO') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <header className="h-16 bg-theme-1 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <img src="/assets/logo.png" alt="Logo" className="w-10 h-10 rounded-full bg-zinc-800" />
          <nav className="flex gap-2 ml-4">
            <NavLink to="/pos/caja" className={({isActive}) => `px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${isActive ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>
              <MonitorSmartphone size={18} /> CAJA
            </NavLink>
            <NavLink to="/pos/mesas" className={({isActive}) => `px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${isActive ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>
              <LayoutGrid size={18} /> MESAS
            </NavLink>
            <NavLink to="/pos/dj" className={({isActive}) => `relative px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${isActive ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>
              <Music size={18} /> PANEL DJ
              {unreadNotifications && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              )}
            </NavLink>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-white">{user.username.toUpperCase()}</div>
            <div className="text-xs text-zinc-500">Turno Activo</div>
          </div>
          <button onClick={() => setUser(null)} className="px-6 py-3 text-red-500 hover:text-white hover:bg-red-600 bg-red-950/50 border border-red-900 rounded-lg transition-colors flex items-center justify-center">
            <LogOut size={24} />
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden bg-theme-2">
        <Outlet />
      </main>
    </div>
  );
}
