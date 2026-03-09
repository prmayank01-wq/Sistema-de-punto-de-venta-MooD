import { Download, Upload, Trash2, AlertTriangle, MessageSquare } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useState } from 'react';

export default function Herramientas() {
  const { customTheme, setCustomTheme } = useStore();
  const [showChat, setShowChat] = useState(false);

  const presetThemes = [
    { name: 'Oscuro (Por defecto)', primary: '#ef4444', secondary: '#3b82f6', tertiary: '#10b981', bg1: '#18181b', bg2: '#09090b', text: '#ffffff', textSecondary: '#a1a1aa' },
    { name: 'Claro', primary: '#ef4444', secondary: '#3b82f6', tertiary: '#10b981', bg1: '#f4f4f5', bg2: '#ffffff', text: '#000000', textSecondary: '#52525b' },
    { name: 'Orange Teal', primary: '#f97316', secondary: '#14b8a6', tertiary: '#eab308', bg1: '#1c1917', bg2: '#0c0a09', text: '#ffffff', textSecondary: '#a8a29e' },
    { name: 'Neon Cyber', primary: '#06b6d4', secondary: '#d946ef', tertiary: '#22c55e', bg1: '#0f172a', bg2: '#020617', text: '#ffffff', textSecondary: '#94a3b8' },
    { name: 'Bosque', primary: '#10b981', secondary: '#f59e0b', tertiary: '#84cc16', bg1: '#14532d', bg2: '#064e3b', text: '#ffffff', textSecondary: '#a7f3d0' },
    { name: 'Océano', primary: '#3b82f6', secondary: '#06b6d4', tertiary: '#6366f1', bg1: '#1e3a8a', bg2: '#172554', text: '#ffffff', textSecondary: '#bfdbfe' },
    { name: 'Púrpura', primary: '#8b5cf6', secondary: '#ec4899', tertiary: '#d946ef', bg1: '#2e1065', bg2: '#170533', text: '#ffffff', textSecondary: '#e9d5ff' },
  ];

  const [tempTheme, setTempTheme] = useState(customTheme);

  const handleApplyTheme = () => {
    setCustomTheme(tempTheme);
    document.documentElement.style.setProperty('--color-primary', tempTheme.primary);
    document.documentElement.style.setProperty('--color-secondary', tempTheme.secondary);
    document.documentElement.style.setProperty('--color-tertiary', tempTheme.tertiary);
    document.documentElement.style.setProperty('--color-bg1', tempTheme.bg1);
    document.documentElement.style.setProperty('--color-bg2', tempTheme.bg2);
    document.documentElement.style.setProperty('--color-text', tempTheme.text);
    document.documentElement.style.setProperty('--color-text-secondary', tempTheme.textSecondary || '#a1a1aa');
  };

  const handleExport = () => {
    const data = {
      // Mock data export
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        alert(`Archivo ${file.name} seleccionado para importar.`);
      }
    };
    input.click();
  };

  const handleClearHistory = () => {
    if (confirm('¿Estás seguro de que deseas borrar todo el historial de ventas y reportes? Esta acción no se puede deshacer.')) {
      alert('Historial borrado exitosamente.');
    }
  };

  const handleFactoryReset = () => {
    if (confirm('¡ADVERTENCIA! Esto borrará ABSOLUTAMENTE TODO excepto los usuarios. ¿Estás completamente seguro?')) {
      if (confirm('Por favor, confirma una vez más. Esta acción es IRREVERSIBLE.')) {
        alert('Reset de fábrica completado.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Herramientas</h1>
        <button 
          onClick={() => setShowChat(!showChat)}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <MessageSquare size={16} />
          {showChat ? 'OCULTAR CHAT' : 'VER CHAT'}
        </button>
      </div>

      {showChat && (
        <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800 h-64 flex flex-col">
          <h2 className="text-xl font-bold border-b border-zinc-800 pb-3 mb-4">Chat del Sistema</h2>
          <div className="flex-1 overflow-y-auto space-y-2 text-sm text-zinc-300">
            <p><span className="text-blue-400 font-bold">Sistema:</span> Chat inicializado.</p>
            <p><span className="text-green-400 font-bold">Mesa 01:</span> Necesitamos más servilletas.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800 space-y-6">
          <h2 className="text-xl font-bold border-b border-zinc-800 pb-3">Temas Personalizados</h2>
          <p className="text-sm text-zinc-400">Configura los colores de la interfaz a tu gusto.</p>
          
          <div className="space-y-4">
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Temas Predefinidos</label>
              <div className="grid grid-cols-2 gap-2">
                {presetThemes.map(theme => (
                  <button
                    key={theme.name}
                    onClick={() => setTempTheme({ primary: theme.primary, secondary: theme.secondary, tertiary: theme.tertiary, bg1: theme.bg1, bg2: theme.bg2, text: theme.text, textSecondary: theme.textSecondary })}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs py-2 px-3 rounded text-left transition-colors truncate"
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Texto</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-transparent hover:border-white/50">
                    <input 
                      type="color" 
                      value={tempTheme.text || '#ffffff'}
                      onChange={(e) => setTempTheme({ ...tempTheme, text: e.target.value })}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={tempTheme.text || '#ffffff'}
                    onChange={(e) => setTempTheme({ ...tempTheme, text: e.target.value })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Color Primario</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-transparent hover:border-white/50">
                    <input 
                      type="color" 
                      value={tempTheme.primary}
                      onChange={(e) => setTempTheme({ ...tempTheme, primary: e.target.value })}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={tempTheme.primary}
                    onChange={(e) => setTempTheme({ ...tempTheme, primary: e.target.value })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Texto Secundario</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-transparent hover:border-white/50">
                    <input 
                      type="color" 
                      value={tempTheme.textSecondary || '#a1a1aa'}
                      onChange={(e) => setTempTheme({ ...tempTheme, textSecondary: e.target.value })}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={tempTheme.textSecondary || '#a1a1aa'}
                    onChange={(e) => setTempTheme({ ...tempTheme, textSecondary: e.target.value })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Color Secundario</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-transparent hover:border-white/50">
                    <input 
                      type="color" 
                      value={tempTheme.secondary}
                      onChange={(e) => setTempTheme({ ...tempTheme, secondary: e.target.value })}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={tempTheme.secondary}
                    onChange={(e) => setTempTheme({ ...tempTheme, secondary: e.target.value })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Fondo 1</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-transparent hover:border-white/50">
                    <input 
                      type="color" 
                      value={tempTheme.bg1}
                      onChange={(e) => setTempTheme({ ...tempTheme, bg1: e.target.value })}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={tempTheme.bg1}
                    onChange={(e) => setTempTheme({ ...tempTheme, bg1: e.target.value })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Color Terciario</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-transparent hover:border-white/50">
                    <input 
                      type="color" 
                      value={tempTheme.tertiary || '#10b981'}
                      onChange={(e) => setTempTheme({ ...tempTheme, tertiary: e.target.value })}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={tempTheme.tertiary || '#10b981'}
                    onChange={(e) => setTempTheme({ ...tempTheme, tertiary: e.target.value })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Fondo 2</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-transparent hover:border-white/50">
                    <input 
                      type="color" 
                      value={tempTheme.bg2}
                      onChange={(e) => setTempTheme({ ...tempTheme, bg2: e.target.value })}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={tempTheme.bg2}
                    onChange={(e) => setTempTheme({ ...tempTheme, bg2: e.target.value })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleApplyTheme}
              className="w-full bg-primary hover:bg-primary/80 text-white px-4 py-3 rounded-lg transition-colors font-bold mt-4"
            >
              APLICAR TEMA
            </button>
          </div>
        </div>

        <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800 space-y-6">
          <h2 className="text-xl font-bold border-b border-zinc-800 pb-3">Datos</h2>
          
          <div className="space-y-4">
            <button 
              onClick={handleExport}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Upload size={18} />
              Exportar Inventario/Productos (JSON)
            </button>
            <button 
              onClick={handleImport}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Download size={18} />
              Importar Datos (JSON/CSV)
            </button>
            <button 
              onClick={() => alert('Exportar Base de Datos completa')}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Upload size={18} />
              Exportar Base de Datos (DB)
            </button>
            <button 
              onClick={() => alert('Importar Base de Datos completa')}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Download size={18} />
              Importar Base de Datos (DB)
            </button>
          </div>
        </div>

        <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800 space-y-6 md:col-span-2">
          <h2 className="text-xl font-bold border-b border-zinc-800 pb-3">Personalización de Marca</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-theme-2 p-4 rounded-lg border border-zinc-800">
              <h3 className="font-bold text-white mb-2">Logo del Sistema</h3>
              <p className="text-sm text-zinc-400 mb-4">Sube un logo para mostrar en la pantalla de inicio de sesión.</p>
              <button 
                onClick={() => alert('Subir logo')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm w-full justify-center"
              >
                <Upload size={16} />
                SUBIR LOGO
              </button>
            </div>
            
            <div className="bg-theme-2 p-4 rounded-lg border border-zinc-800">
              <h3 className="font-bold text-white mb-2">Fondo de Inicio</h3>
              <p className="text-sm text-zinc-400 mb-4">Sube una imagen de fondo para la pantalla de inicio de sesión.</p>
              <button 
                onClick={() => alert('Subir fondo')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm w-full justify-center"
              >
                <Upload size={16} />
                SUBIR FONDO
              </button>
            </div>
          </div>
        </div>

        <div className="bg-theme-1 p-6 rounded-xl border border-red-900/50 space-y-6 md:col-span-2">
          <h2 className="text-xl font-bold border-b border-zinc-800 pb-3 text-primary flex items-center gap-2">
            <AlertTriangle size={20} />
            Zona de Peligro
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-theme-2 p-4 rounded-lg border border-zinc-800">
              <h3 className="font-bold text-white mb-2">Borrar Historial</h3>
              <p className="text-sm text-zinc-400 mb-4">Elimina todas las ventas, reportes y gastos. El inventario y productos se mantienen.</p>
              <button 
                onClick={handleClearHistory}
                className="bg-red-950 hover:bg-red-900 text-red-400 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm w-full justify-center border border-red-900"
              >
                <Trash2 size={16} />
                BORRAR HISTORIAL
              </button>
            </div>
            
            <div className="bg-theme-2 p-4 rounded-lg border border-zinc-800">
              <h3 className="font-bold text-white mb-2">Reset de Fábrica</h3>
              <p className="text-sm text-zinc-400 mb-4">Borra ABSOLUTAMENTE TODO excepto los usuarios. Requiere confirmación doble.</p>
              <button 
                onClick={handleFactoryReset}
                className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm w-full justify-center"
              >
                <AlertTriangle size={16} />
                RESET DE FÁBRICA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
