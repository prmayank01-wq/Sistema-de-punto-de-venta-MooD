import React, { useState, useRef, useEffect } from 'react';
import { Save, Plus, QrCode, X, Edit2, Palette, Link as LinkIcon } from 'lucide-react';
import { ConfirmModal, AlertModal, PromptModal } from '../../components/Modals';

export default function Mesas() {
  const [mesas, setMesas] = useState<any[]>([]);
  const [nombreMesa, setNombreMesa] = useState('');
  const [colorMesa, setColorMesa] = useState('#10b981');
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: number | null}>({isOpen: false, id: null});
  const [alert, setAlert] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});
  const [promptName, setPromptName] = useState<{isOpen: boolean, id: number | null, defaultValue: string}>({isOpen: false, id: null, defaultValue: ''});
  const [promptIp, setPromptIp] = useState<{isOpen: boolean, id: number | null, defaultValue: string}>({isOpen: false, id: null, defaultValue: ''});

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      setMesas(data);
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 30); // 70-100%
    const lightness = 40 + Math.floor(Math.random() * 20); // 40-60%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleCrear = async () => {
    const newNombre = nombreMesa.trim() || `Mesa ${mesas.length + 1}`;
    const newColor = generateRandomColor();
    const payload = {
      nombre: newNombre,
      color: newColor,
      x: 50 + (mesas.length * 20) % 200,
      y: 50 + (mesas.length * 20) % 200,
      w: 120,
      h: 80
    };

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setMesas([...mesas, created]);
        setNombreMesa('');
        setColorMesa(generateRandomColor());
      }
    } catch (err) {
      console.error('Error creating table:', err);
    }
  };

  const handleDeleteClick = (id: number) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleDeleteConfirm = async () => {
    const id = confirmDelete.id;
    if (id === null) return;
    
    setConfirmDelete({ isOpen: false, id: null });
    try {
      const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMesas(mesas.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Error deleting table:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Error al eliminar la mesa' });
    }
  };

  const handleEditNameClick = (id: number) => {
    const mesa = mesas.find(m => m.id === id);
    if (!mesa) return;
    setPromptName({ isOpen: true, id, defaultValue: mesa.nombre });
  };

  const handleEditNameConfirm = async (newName: string) => {
    const id = promptName.id;
    setPromptName({ isOpen: false, id: null, defaultValue: '' });
    
    if (id === null || !newName.trim()) return;
    
    const mesa = mesas.find(m => m.id === id);
    if (!mesa) return;
    
    const updatedMesa = { ...mesa, nombre: newName.trim() };
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMesa)
      });
      if (res.ok) {
        setMesas(mesas.map(m => m.id === id ? updatedMesa : m));
      }
    } catch (err) {
      console.error('Error updating table name:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Error al actualizar el nombre' });
    }
  };

  const handleChangeColor = (id: number) => {
    const mesa = mesas.find(m => m.id === id);
    if (!mesa) return;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = mesa.color || '#000000';
    input.onchange = async (e) => {
      const newColor = (e.target as HTMLInputElement).value;
      const updatedMesa = { ...mesa, color: newColor };
      try {
        const res = await fetch(`/api/tables/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedMesa)
        });
        if (res.ok) {
          setMesas(mesas.map(m => m.id === id ? updatedMesa : m));
        }
      } catch (err) {
        console.error('Error updating table color:', err);
      }
    };
    input.click();
  };

  const handleSavePositions = async () => {
    try {
      // Save all tables sequentially to update their positions
      for (const mesa of mesas) {
        await fetch(`/api/tables/${mesa.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mesa)
        });
      }
      setAlert({ isOpen: true, title: 'Éxito', message: 'Posiciones guardadas correctamente' });
    } catch (err) {
      console.error('Error saving table positions:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Error al guardar posiciones' });
    }
  };

  const handleCopyLinkClick = (id: number) => {
    const currentOrigin = window.location.origin;
    const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
    
    if (isLocalhost) {
      setPromptIp({ isOpen: true, id, defaultValue: '192.168.1.' });
    } else {
      copyLinkToClipboard(id, currentOrigin);
    }
  };

  const handleCopyLinkConfirm = (lanIp: string) => {
    const id = promptIp.id;
    setPromptIp({ isOpen: false, id: null, defaultValue: '' });
    
    let baseUrl = window.location.origin;
    if (lanIp) {
      baseUrl = `http://${lanIp}:${window.location.port || '3000'}`;
    }
    
    if (id === null) {
      // It was generate all links
      generateAllLinks(baseUrl);
    } else {
      copyLinkToClipboard(id, baseUrl);
    }
  };

  const copyLinkToClipboard = (id: number, baseUrl: string) => {
    const mesa = mesas.find(m => m.id === id);
    if (!mesa) return;
    const token = btoa(mesa.nombre);
    const link = `${baseUrl}/pedidos?table=${id}&t=${token}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link)
        .then(() => setAlert({ isOpen: true, title: 'Enlace Copiado', message: `Enlace copiado al portapapeles:\n${link}` }))
        .catch(() => setAlert({ isOpen: true, title: 'Error', message: 'No se pudo copiar el enlace. Cópialo manualmente: ' + link }));
    } else {
      setAlert({ isOpen: true, title: 'Enlace', message: 'Copia este enlace manualmente: ' + link });
    }
  };

  const handleGenerateLinksClick = () => {
    const currentOrigin = window.location.origin;
    const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
    
    if (isLocalhost) {
      setPromptIp({ isOpen: true, id: null, defaultValue: '192.168.1.' });
    } else {
      generateAllLinks(currentOrigin);
    }
  };

  const generateAllLinks = (baseUrl: string) => {
    let linksText = 'Enlaces de Mesas:\n\n';
    mesas.forEach(m => {
      const token = btoa(m.nombre);
      linksText += `${m.nombre}: ${baseUrl}/pedidos?table=${m.id}&t=${token}\n`;
    });

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(linksText).then(() => {
        setAlert({ isOpen: true, title: 'Enlaces Copiados', message: 'Lista de enlaces copiada al portapapeles.' });
      }).catch(() => {
        setAlert({ isOpen: true, title: 'Enlaces', message: linksText });
      });
    } else {
      setAlert({ isOpen: true, title: 'Enlaces', message: linksText });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    if (e.button !== 0) return; // Only left click
    const mesa = mesas.find(m => m.id === id);
    if (!mesa || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    setDraggingId(id);
    setDragOffset({
      x: e.clientX - containerRect.left - mesa.x,
      y: e.clientY - containerRect.top - mesa.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingId === null || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      let newX = e.clientX - containerRect.left - dragOffset.x;
      let newY = e.clientY - containerRect.top - dragOffset.y;

      // Snap to grid (20px)
      newX = Math.round(newX / 20) * 20;
      newY = Math.round(newY / 20) * 20;

      // Boundaries
      newX = Math.max(0, Math.min(newX, containerRect.width - 120));
      newY = Math.max(0, Math.min(newY, containerRect.height - 80));

      setMesas(prev => prev.map(m => 
        m.id === draggingId ? { ...m, x: newX, y: newY } : m
      ));
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    if (draggingId !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dragOffset]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Mesas (Planta)</h1>
        <div className="flex gap-3">
          <button onClick={handleGenerateLinksClick} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
            <QrCode size={16} />
            GENERAR LISTA QR / ENLACES
          </button>
          <button onClick={handleSavePositions} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold">
            <Save size={16} />
            GUARDAR
          </button>
        </div>
      </div>

      <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre Mesa</label>
          <input 
            type="text" 
            value={nombreMesa}
            onChange={(e) => setNombreMesa(e.target.value)}
            className="w-48 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" 
            placeholder="Ej: Mesa 03" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Color</label>
          <input 
            type="color" 
            value={colorMesa}
            onChange={(e) => setColorMesa(e.target.value)}
            className="w-12 h-10 bg-zinc-800 border border-zinc-700 rounded-lg p-1 cursor-pointer" 
          />
        </div>
        <button 
          onClick={handleCrear}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold h-10"
        >
          <Plus size={18} /> CREAR
        </button>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 bg-theme-2 border border-zinc-800 rounded-xl relative overflow-hidden shadow-inner" 
        style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {mesas.map(m => (
          <div 
            key={m.id} 
            onMouseDown={(e) => handleMouseDown(e, m.id)}
            onDoubleClick={() => handleEditNameClick(m.id)}
            className={`absolute rounded-lg shadow-lg flex items-center justify-center group border-2 transition-colors ${draggingId === m.id ? 'cursor-grabbing border-white z-50' : 'cursor-grab border-transparent hover:border-white/50 z-10'}`}
            style={{ 
              left: m.x, top: m.y, width: m.w, height: m.h, 
              backgroundColor: m.color 
            }}
          >
            <span className="font-bold text-white drop-shadow-md select-none pointer-events-none">{m.nombre}</span>
            
            {/* Controls */}
            <div 
              onClick={(e) => { e.stopPropagation(); handleCopyLinkClick(m.id); }}
              className="absolute -top-3 -left-3 w-6 h-6 bg-theme-1 border border-zinc-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-zinc-800 z-20"
              title="Copiar enlace"
            >
              <LinkIcon size={12} className="text-zinc-300" />
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); handleDeleteClick(m.id); }}
              className="absolute -top-3 -right-3 w-6 h-6 bg-primary border border-red-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-primary z-20"
              title="Eliminar mesa"
            >
              <X size={12} className="text-white" />
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); handleEditNameClick(m.id); }}
              className="absolute -bottom-3 -left-3 w-6 h-6 bg-theme-1 border border-zinc-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-zinc-800 z-20"
              title="Editar nombre"
            >
              <Edit2 size={12} className="text-zinc-300" />
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); handleChangeColor(m.id); }}
              className="absolute -bottom-3 -right-3 w-6 h-6 bg-theme-1 border border-zinc-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-zinc-800 z-20"
              title="Cambiar color"
            >
              <Palette size={12} className="text-zinc-300" />
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar Mesa"
        message="¿Estás seguro de que deseas eliminar esta mesa?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />

      <PromptModal
        isOpen={promptName.isOpen}
        title="Editar Nombre"
        message="Ingrese el nuevo nombre para la mesa:"
        defaultValue={promptName.defaultValue}
        onConfirm={handleEditNameConfirm}
        onCancel={() => setPromptName({ isOpen: false, id: null, defaultValue: '' })}
      />

      <PromptModal
        isOpen={promptIp.isOpen}
        title="Configurar IP LAN"
        message="Para dispositivos móviles, ingresa la IP LAN de esta computadora (ej: 192.168.1.51):"
        defaultValue={promptIp.defaultValue}
        onConfirm={handleCopyLinkConfirm}
        onCancel={() => setPromptIp({ isOpen: false, id: null, defaultValue: '' })}
      />

      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />
    </div>
  );
}
