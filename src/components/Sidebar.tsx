import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BarChart3, Users, Package, Wine, LayoutGrid, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const setUser = useStore(state => state.setUser);

  const links = [
    { to: '/admin/reportes', label: 'Reportes', icon: <BarChart3 size={20} /> },
    { to: '/admin/usuarios', label: 'Usuarios', icon: <Users size={20} /> },
    { to: '/admin/inventario', label: 'Inventario', icon: <Package size={20} /> },
    { to: '/admin/productos', label: 'Productos', icon: <Wine size={20} /> },
    { to: '/admin/mesas', label: 'Mesas', icon: <LayoutGrid size={20} /> },
    { to: '/admin/herramientas', label: 'Herramientas', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-theme-1 border-r border-zinc-800 flex flex-col h-full">
      <div className="p-6 flex items-center justify-center border-b border-zinc-800">
        <img src="/assets/logo.png" alt="Logo" className="w-12 h-12 rounded-full bg-zinc-800" />
        <span className="ml-3 font-bold text-xl tracking-wider text-white">ADMIN</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-white font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`
            }
          >
            {link.icon}
            <span className="ml-3">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={() => setUser(null)}
          className="flex items-center w-full px-4 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="ml-3">Salir</span>
        </button>
      </div>
    </div>
  );
}
