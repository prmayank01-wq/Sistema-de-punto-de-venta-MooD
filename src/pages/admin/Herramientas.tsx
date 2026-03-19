import { Download, Upload, Trash2, AlertTriangle, MessageSquare, ArrowLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useState, useEffect } from 'react';
import { ConfirmModal, AlertModal } from '../../components/Modals';

export default function Herramientas() {
  const { customTheme, setCustomTheme, setLogoUrl, setBackgroundUrl, setUser } = useStore();
  const [showChat, setShowChat] = useState(false);
  
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showFactoryResetModal1, setShowFactoryResetModal1] = useState(false);
  const [showFactoryResetModal2, setShowFactoryResetModal2] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ title: string; message: string } | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  const [showImportDBModal, setShowImportDBModal] = useState(false);
  const [importDBFile, setImportDBFile] = useState<File | null>(null);

  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [shiftChats, setShiftChats] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  useEffect(() => {
    if (showChat) {
      fetch('/api/shifts')
        .then(res => res.json())
        .then(data => setShifts(data))
        .catch(err => console.error('Error fetching shifts:', err));
    } else {
      setSelectedShiftId(null);
      setSelectedTableId(null);
      setShiftChats([]);
    }
  }, [showChat]);

  const handleViewShiftChats = async (shiftId: number) => {
    try {
      const res = await fetch(`/api/shifts/${shiftId}/chats`);
      if (res.ok) {
        const data = await res.json();
        setShiftChats(data);
        setSelectedShiftId(shiftId);
        setSelectedTableId(null);
      }
    } catch (err) {
      console.error('Error fetching shift chats:', err);
    }
  };

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const url = event.target.result as string;
            setLogoUrl(url);
            try {
              await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'logoUrl', value: url })
              });
              alert('Logo actualizado exitosamente.');
            } catch (err) {
              console.error(err);
              alert('Logo actualizado localmente, pero falló al guardar en el servidor.');
            }
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleBackgroundUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const url = event.target.result as string;
            setBackgroundUrl(url);
            try {
              await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'backgroundUrl', value: url })
              });
              alert('Fondo actualizado exitosamente.');
            } catch (err) {
              console.error(err);
              alert('Fondo actualizado localmente, pero falló al guardar en el servidor.');
            }
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

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

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportFileName, setExportFileName] = useState(`pos-export-${new Date().toISOString().split('T')[0]}`);

  const [showExportDBModal, setShowExportDBModal] = useState(false);
  const [exportDBFileName, setExportDBFileName] = useState(`pos-database-${new Date().toISOString().split('T')[0]}`);

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

  const handleExport = async () => {
    try {
      const format = exportFormat;
      const fileName = exportFileName || `pos-export-${new Date().toISOString().split('T')[0]}`;

      const [invRes, prodRes, tablesRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/products'),
        fetch('/api/tables')
      ]);
      
      if (!invRes.ok || !prodRes.ok || !tablesRes.ok) throw new Error('Error al obtener datos');
      
      const inventory = await invRes.json();
      const products = await prodRes.json();
      const tables = await tablesRes.json();

      if (format === 'json') {
        const data = {
          exportDate: new Date().toISOString(),
          version: '1.0',
          inventory,
          products,
          tables
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Export Inventory
        if (inventory.length > 0) {
          const invHeaders = Object.keys(inventory[0]).join(',');
          const invRows = inventory.map((item: any) => Object.values(item).map(v => `"${v}"`).join(',')).join('\n');
          const invCsv = `${invHeaders}\n${invRows}`;
          const invBlob = new Blob([invCsv], { type: 'text/csv' });
          const invUrl = URL.createObjectURL(invBlob);
          const invA = document.createElement('a');
          invA.href = invUrl;
          invA.download = `${fileName}-inventario.csv`;
          invA.click();
          URL.revokeObjectURL(invUrl);
        }

        // Export Products
        if (products.length > 0) {
          const prodHeaders = Object.keys(products[0]).filter(k => k !== 'componentes').join(',');
          const prodRows = products.map((item: any) => {
            const row = { ...item };
            delete row.componentes;
            return Object.values(row).map(v => `"${v}"`).join(',');
          }).join('\n');
          const prodCsv = `${prodHeaders}\n${prodRows}`;
          const prodBlob = new Blob([prodCsv], { type: 'text/csv' });
          const prodUrl = URL.createObjectURL(prodBlob);
          const prodA = document.createElement('a');
          prodA.href = prodUrl;
          prodA.download = `${fileName}-productos.csv`;
          prodA.click();
          URL.revokeObjectURL(prodUrl);
        }

        // Export Tables
        if (tables.length > 0) {
          const tableHeaders = Object.keys(tables[0]).join(',');
          const tableRows = tables.map((item: any) => Object.values(item).map(v => `"${v}"`).join(',')).join('\n');
          const tableCsv = `${tableHeaders}\n${tableRows}`;
          const tableBlob = new Blob([tableCsv], { type: 'text/csv' });
          const tableUrl = URL.createObjectURL(tableBlob);
          const tableA = document.createElement('a');
          tableA.href = tableUrl;
          tableA.download = `${fileName}-mesas.csv`;
          tableA.click();
          URL.revokeObjectURL(tableUrl);
        }
      }
      setShowExportModal(false);
    } catch (err) {
      console.error('Error exportando:', err);
      alert('Hubo un error al exportar los datos.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const text = event.target?.result as string;
            let data: any = { inventory: [], products: [] };
            
            if (file.name.toLowerCase().endsWith('.csv')) {
              const lines = text.split('\n').map(l => l.trim()).filter(l => l);
              if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const isInventory = headers.includes('stock') || headers.includes('modo_stock');
                const isProducts = headers.includes('precio') || headers.includes('tipo');
                const isTables = headers.includes('numero') || headers.includes('grid_x');
                
                if (isInventory) {
                  data.inventory = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const obj: any = {};
                    headers.forEach((h, i) => { obj[h] = values[i].replace(/^"|"$/g, ''); });
                    return {
                      id: obj.id ? parseInt(obj.id) : undefined,
                      nombre: obj.nombre || obj.name,
                      contenido: parseFloat(obj.contenido || obj.contenido_gramos || 0),
                      peso_envase: parseFloat(obj.peso_envase || obj.peso_envase_gramos || 0),
                      modo: obj.modo || obj.modo_stock || 'UNIDADES',
                      stock: parseFloat(obj.stock || 0)
                    };
                  });
                  data.products = undefined;
                  data.tables = undefined;
                } else if (isProducts) {
                  data.products = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const obj: any = {};
                    headers.forEach((h, i) => { obj[h] = values[i].replace(/^"|"$/g, ''); });
                    return {
                      id: obj.id ? parseInt(obj.id) : undefined,
                      nombre: obj.nombre || obj.name,
                      precio: parseFloat(obj.precio || obj.price || 0),
                      tipo: obj.tipo || obj.type || 'OTROS',
                      imagen_path: obj.imagen_path || null,
                      componentes: []
                    };
                  });
                  data.inventory = undefined;
                  data.tables = undefined;
                } else if (isTables) {
                  data.tables = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const obj: any = {};
                    headers.forEach((h, i) => { obj[h] = values[i].replace(/^"|"$/g, ''); });
                    return {
                      id: obj.id ? parseInt(obj.id) : undefined,
                      nombre: obj.nombre || obj.numero,
                      color_rgb: obj.color_rgb || obj.color || '#ffffff',
                      rect_x: parseFloat(obj.rect_x || obj.x || obj.grid_x || 0),
                      rect_y: parseFloat(obj.rect_y || obj.y || obj.grid_y || 0),
                      rect_w: parseFloat(obj.rect_w || obj.w || obj.grid_w || 120),
                      rect_h: parseFloat(obj.rect_h || obj.h || obj.grid_h || 80),
                      estado: obj.estado || 'LIBRE'
                    };
                  });
                  data.inventory = undefined;
                  data.products = undefined;
                } else {
                  setAlertMessage({ title: 'Error', message: 'El archivo CSV no tiene las columnas requeridas.' });
                  return;
                }
              }
            } else {
              data = JSON.parse(text);
              if (!data.inventory && !data.products) {
                setAlertMessage({ title: 'Error', message: 'El archivo no tiene el formato correcto.' });
                return;
              }
            }
            
            setImportData(data);
            setShowImportModal(true);
          } catch (err) {
            console.error('Error parseando archivo:', err);
            setAlertMessage({ title: 'Error', message: 'Error al leer el archivo.' });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const confirmImport = async () => {
    if (!importData) return;
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData)
      });
      
      if (res.ok) {
        setAlertMessage({ title: 'Éxito', message: 'Datos importados exitosamente.' });
      } else {
        const err = await res.json();
        setAlertMessage({ title: 'Error', message: `Error al importar: ${err.error || 'Desconocido'}` });
      }
    } catch (err) {
      console.error('Error importando:', err);
      setAlertMessage({ title: 'Error', message: 'Error de conexión.' });
    }
    setShowImportModal(false);
    setImportData(null);
  };

  const handleExportDB = async () => {
    const fileName = exportDBFileName || `pos-database-${new Date().toISOString().split('T')[0]}`;

    try {
      const res = await fetch('/api/export-db');
      if (!res.ok) throw new Error('Error al exportar la base de datos');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.db`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportDBModal(false);
    } catch (err) {
      console.error('Error exportando DB:', err);
      alert('Hubo un error al exportar la base de datos.');
    }
  };

  const handleImportDB = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.db,.sqlite';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImportDBFile(file);
        setShowImportDBModal(true);
      }
    };
    input.click();
  };

  const confirmImportDB = async () => {
    if (!importDBFile) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const res = await fetch('/api/import-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: arrayBuffer
        });
        
        if (res.ok) {
          setAlertMessage({ title: 'Éxito', message: 'Base de datos importada exitosamente. La aplicación se reiniciará.' });
          setTimeout(() => window.location.reload(), 2000);
        } else {
          const err = await res.json();
          setAlertMessage({ title: 'Error', message: `Error al importar: ${err.error || 'Desconocido'}` });
        }
      } catch (err) {
        console.error('Error importando DB:', err);
        setAlertMessage({ title: 'Error', message: 'Error al subir el archivo de base de datos.' });
      }
      setShowImportDBModal(false);
      setImportDBFile(null);
    };
    reader.readAsArrayBuffer(importDBFile);
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/clear-history', { method: 'POST' });
      if (res.ok) {
        setAlertMessage({ title: 'Éxito', message: 'Historial borrado exitosamente.' });
      } else {
        setAlertMessage({ title: 'Error', message: 'Error al borrar el historial.' });
      }
    } catch (err) {
      console.error(err);
      setAlertMessage({ title: 'Error', message: 'Error de conexión.' });
    }
    setShowClearHistoryModal(false);
  };

  const handleFactoryReset = async () => {
    try {
      const res = await fetch('/api/factory-reset', { method: 'POST' });
      if (res.ok) {
        setAlertMessage({ title: 'Éxito', message: 'Reset de fábrica completado. Redirigiendo...' });
        setUser(null);
        setTimeout(() => window.location.href = '/', 2000);
      } else {
        setAlertMessage({ title: 'Error', message: 'Error al hacer el reset de fábrica.' });
      }
    } catch (err) {
      console.error(err);
      setAlertMessage({ title: 'Error', message: 'Error de conexión.' });
    }
    setShowFactoryResetModal2(false);
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
        <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
            <h2 className="text-xl font-bold">Chat del Sistema</h2>
            {selectedShiftId && (
              <button
                onClick={() => {
                  if (selectedTableId) {
                    setSelectedTableId(null);
                  } else {
                    setSelectedShiftId(null);
                    setShiftChats([]);
                  }
                }}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                {selectedTableId ? 'Volver a Mesas' : 'Volver a Turnos'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedShiftId ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                      <th className="p-3 font-medium">FECHA/HORA</th>
                      <th className="p-3 font-medium">CAJERO/TURNO</th>
                      <th className="p-3 font-medium text-right">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map(shift => (
                      <tr key={shift.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                        <td className="p-3 text-sm">
                          {new Date(shift.start_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm font-medium text-white">
                          {shift.cajero}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleViewShiftChats(shift.id)}
                            className="bg-primary/20 text-primary hover:bg-primary hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                          >
                            VER
                          </button>
                        </td>
                      </tr>
                    ))}
                    {shifts.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-zinc-500 italic">
                          No hay turnos registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : !selectedTableId ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 mb-4">Mesas con actividad de chat en este turno:</p>
                <div className="flex flex-wrap gap-3">
                  {Array.from(new Set(shiftChats.map(c => c.table_id))).map(tableId => {
                    const tableName = shiftChats.find(c => c.table_id === tableId)?.table_name;
                    return (
                      <button
                        key={tableId}
                        onClick={() => setSelectedTableId(tableId)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                      >
                        {tableName || `Mesa ${tableId}`}
                      </button>
                    );
                  })}
                  {shiftChats.length === 0 && (
                    <p className="text-zinc-500 italic w-full text-center py-8">No hubo chats en este turno.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  {shiftChats.filter(c => c.table_id === selectedTableId).map(chat => (
                    <div 
                      key={chat.id} 
                      className={`p-3 rounded-lg max-w-[80%] ${
                        chat.from_role === 'MESA' 
                          ? 'bg-zinc-800 self-start' 
                          : 'bg-primary/20 border border-primary/30 self-end'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-4 mb-1">
                        <span className={`text-xs font-bold ${chat.from_role === 'MESA' ? 'text-zinc-400' : 'text-primary'}`}>
                          {chat.from_role}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(chat.ts).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-white">{chat.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              onClick={() => setShowExportModal(true)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Upload size={18} />
              Exportar Datos (JSON/CSV)
            </button>
            <button 
              onClick={handleImport}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Download size={18} />
              Importar Datos (JSON/CSV)
            </button>
            <button 
              onClick={() => setShowExportDBModal(true)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Upload size={18} />
              Exportar Base de Datos (DB)
            </button>
            <button 
              onClick={handleImportDB}
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
                onClick={handleLogoUpload}
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
                onClick={handleBackgroundUpload}
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
                onClick={() => setShowClearHistoryModal(true)}
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
                onClick={() => setShowFactoryResetModal1(true)}
                className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm w-full justify-center"
              >
                <AlertTriangle size={16} />
                RESET DE FÁBRICA
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearHistoryModal}
        title="Borrar Historial"
        message="¿Estás seguro de que deseas borrar todo el historial de ventas y reportes? Esta acción no se puede deshacer."
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearHistoryModal(false)}
        confirmText="Borrar Historial"
      />

      <ConfirmModal
        isOpen={showFactoryResetModal1}
        title="¡ADVERTENCIA!"
        message="Esto borrará ABSOLUTAMENTE TODO excepto los usuarios. ¿Estás completamente seguro?"
        onConfirm={() => {
          setShowFactoryResetModal1(false);
          setShowFactoryResetModal2(true);
        }}
        onCancel={() => setShowFactoryResetModal1(false)}
        confirmText="Sí, estoy seguro"
      />

      <ConfirmModal
        isOpen={showFactoryResetModal2}
        title="Confirmación Final"
        message="Por favor, confirma una vez más. Esta acción es IRREVERSIBLE."
        onConfirm={handleFactoryReset}
        onCancel={() => setShowFactoryResetModal2(false)}
        confirmText="RESET DE FÁBRICA"
      />

      <AlertModal
        isOpen={!!alertMessage}
        title={alertMessage?.title || ''}
        message={alertMessage?.message || ''}
        onClose={() => setAlertMessage(null)}
      />

      <ConfirmModal
        isOpen={showImportModal}
        title="Importar Datos"
        message="Esto reemplazará todo el inventario y productos actuales. ¿Deseas continuar?"
        onConfirm={confirmImport}
        onCancel={() => {
          setShowImportModal(false);
          setImportData(null);
        }}
        confirmText="Importar"
      />

      <ConfirmModal
        isOpen={showImportDBModal}
        title="Importar Base de Datos"
        message="¡ADVERTENCIA! Esto reemplazará toda la base de datos y la aplicación se reiniciará. ¿Estás seguro?"
        onConfirm={confirmImportDB}
        onCancel={() => {
          setShowImportDBModal(false);
          setImportDBFile(null);
        }}
        confirmText="Importar DB"
      />

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-theme-1 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Exportar Datos</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Formato</label>
                <select 
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                >
                  <option value="json">JSON (Recomendado para respaldos)</option>
                  <option value="csv">CSV (Para Excel/Hojas de cálculo)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre del archivo</label>
                <input 
                  type="text" 
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/80 text-white font-bold transition-colors"
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export DB Modal */}
      {showExportDBModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-theme-1 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Exportar Base de Datos</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre del archivo</label>
                <input 
                  type="text" 
                  value={exportDBFileName}
                  onChange={(e) => setExportDBFileName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExportDBModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportDB}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/80 text-white font-bold transition-colors"
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
