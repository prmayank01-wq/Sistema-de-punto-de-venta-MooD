import { useState } from 'react';

export default function MesasPos() {
  const [mesas] = useState([
    { id: 1, nombre: 'Mesa 01', color: '#ef4444', x: 50, y: 50, w: 120, h: 80, estado: 'OCUPADO', pedido: '$4500' },
    { id: 2, nombre: 'Mesa 02', color: '#3b82f6', x: 200, y: 50, w: 120, h: 80, estado: 'LIBRE', pedido: null },
  ]);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Estado de Mesas</h1>
        <div className="flex gap-4 text-sm font-bold">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary"></span> Ocupada</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Libre</div>
        </div>
      </div>

      <div className="flex-1 bg-theme-1 border border-zinc-800 rounded-xl relative overflow-hidden shadow-inner" style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {mesas.map(m => (
          <div 
            key={m.id} 
            className={`absolute rounded-lg shadow-lg flex flex-col items-center justify-center cursor-pointer border-2 transition-colors ${m.estado === 'OCUPADO' ? 'border-primary bg-primary/10' : 'border-emerald-500 bg-emerald-500/10'}`}
            style={{ 
              left: m.x, top: m.y, width: m.w, height: m.h
            }}
          >
            <span className="font-bold text-white drop-shadow-md">{m.nombre}</span>
            {m.pedido && <span className="text-xs font-mono text-zinc-300 mt-1">{m.pedido}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
