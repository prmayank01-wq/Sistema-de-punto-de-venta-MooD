import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function MesasPos() {
  const [mesas, setMesas] = useState<any[]>([]);

  useEffect(() => {
    fetchTables();
    
    const newSocket = io();
    
    newSocket.on('tables_updated', () => {
      fetchTables();
    });

    return () => {
      newSocket.disconnect();
    };
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

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Estado de Mesas</h1>
        <div className="flex gap-4 text-sm font-bold">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary"></span> Ocupada</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Libre</div>
        </div>
      </div>

      <div className="flex-1 bg-theme-1 border border-zinc-800 rounded-xl relative overflow-hidden shadow-inner min-h-[500px]" style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {mesas.map(m => {
          const mx = m.x !== undefined ? m.x : (m.rect_x || 0);
          const my = m.y !== undefined ? m.y : (m.rect_y || 0);
          const mw = m.w !== undefined ? m.w : (m.rect_w || 120);
          const mh = m.h !== undefined ? m.h : (m.rect_h || 80);
          const mcolor = m.color !== undefined ? m.color : (m.color_rgb || '#ef4444');
          
          return (
            <div 
              key={m.id} 
              className={`absolute rounded-lg shadow-lg flex flex-col items-center justify-center cursor-pointer border-2 transition-colors border-emerald-500 bg-emerald-500/10`}
              style={{ 
                left: mx, top: my, width: mw, height: mh,
                borderColor: mcolor,
                backgroundColor: `${mcolor}20`
              }}
            >
              <span className="font-bold text-white drop-shadow-md">{m.nombre}</span>
              {m.pedido && <span className="text-xs font-mono text-zinc-300 mt-1">{m.pedido}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
