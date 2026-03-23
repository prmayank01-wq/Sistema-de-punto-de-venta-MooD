import { useState, useEffect } from 'react';
import { Search, Minus, Trash2, Clock, DollarSign, QrCode, CreditCard, Image as ImageIcon, AlertTriangle } from 'lucide-react';

export default function Caja() {
  const [productos, setProductos] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TODOS');

  const [ticket, setTicket] = useState<any[]>([]);
  const [showPending, setShowPending] = useState(false);
  const [pendingTickets, setPendingTickets] = useState<any[]>([]);
  const [showPendingPrompt, setShowPendingPrompt] = useState(false);
  const [pendingJustification, setPendingJustification] = useState('');
  const [showMixtoPrompt, setShowMixtoPrompt] = useState(false);
  const [showMixtoEditPrompt, setShowMixtoEditPrompt] = useState(false);
  const [mixtoEfectivo, setMixtoEfectivo] = useState('');
  const [activeMixtoInput, setActiveMixtoInput] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');
  const [mixtoQr, setMixtoQr] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<any>(null);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteJustification, setDeleteJustification] = useState('');
  const [modifiedSales, setModifiedSales] = useState<number[]>([]);
  const [inventoryUsed, setInventoryUsed] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchRecentSales();
    const savedPending = localStorage.getItem('pendingTickets');
    if (savedPending) {
      setPendingTickets(JSON.parse(savedPending));
    }
  }, []);

  const fetchInventoryUsed = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1 };
      const res = await fetch(`/api/sales/current-shift/inventory?user_id=${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setInventoryUsed(data);
    } catch (err) {
      console.error('Error fetching inventory used:', err);
    }
  };

  const savePendingTicket = (justification: string) => {
    if (ticket.length === 0) return;
    const newPending = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      items: ticket,
      total: total,
      justification: justification
    };
    const updated = [...pendingTickets, newPending];
    setPendingTickets(updated);
    localStorage.setItem('pendingTickets', JSON.stringify(updated));
    clearTicket();
    setShowPendingPrompt(false);
    setPendingJustification('');
  };

  const loadPendingTicket = (pendingTicket: any) => {
    setTicket(pendingTicket.items);
    const updated = pendingTickets.filter(pt => pt.id !== pendingTicket.id);
    setPendingTickets(updated);
    localStorage.setItem('pendingTickets', JSON.stringify(updated));
    setShowPending(false);
  };

  const deletePendingTicket = async (id: number) => {
    const ticketToDelete = pendingTickets.find(pt => pt.id === id);
    if (!ticketToDelete) return;

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1 };
      
      const total = ticketToDelete.items.reduce((acc: number, item: any) => acc + (item.precio * item.cant), 0);
      
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          total: total,
          metodo_pago: 'EFECTIVO', // Doesn't matter, it's deleted
          items: ticketToDelete.items,
          is_deleted: true
        })
      });
      
      if (res.ok) {
        const updated = pendingTickets.filter(pt => pt.id !== id);
        setPendingTickets(updated);
        localStorage.setItem('pendingTickets', JSON.stringify(updated));
        fetchRecentSales();
      } else {
        alert('Error al eliminar pendiente');
      }
    } catch (err) {
      console.error('Error deleting pending ticket:', err);
      alert('Error de conexión');
    }
  };

  const fetchRecentSales = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1 };
      const res = await fetch(`/api/sales/current-shift?user_id=${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setRecentSales(data);
    } catch (err) {
      console.error('Error fetching recent sales:', err);
    }
  };

  const updateSaleMethod = async (id: number, method: string, monto_efectivo?: number, monto_qr?: number) => {
    try {
      const res = await fetch(`/api/sales/${id}/method`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metodo_pago: method, monto_efectivo, monto_qr })
      });
      if (res.ok) {
        setModifiedSales(prev => [...prev, id]);
        setSaleToEdit(null);
        fetchRecentSales();
      } else {
        alert('Error al actualizar la venta');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const processSale = async (metodo: string, montoEfectivo?: number, montoQr?: number) => {
    if (ticket.length === 0) return;
    
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1 }; // Fallback
      
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          total: total,
          metodo_pago: metodo,
          items: ticket,
          monto_efectivo: montoEfectivo,
          monto_qr: montoQr
        })
      });
      
      if (res.ok) {
        clearTicket();
        fetchRecentSales();
      } else {
        alert('Error al procesar la venta');
      }
    } catch (err) {
      console.error('Error processing sale:', err);
      alert('Error de conexión');
    }
  };

  const addToTicket = (producto: any) => {
    const existing = ticket.find(item => item.id === producto.id);
    if (existing) {
      setTicket(ticket.map(item => 
        item.id === producto.id ? { ...item, cant: item.cant + 1 } : item
      ));
    } else {
      setTicket([...ticket, { ...producto, cant: 1 }]);
    }
  };

  const removeFromTicket = (id: number) => {
    const existing = ticket.find(item => item.id === id);
    if (existing && existing.cant > 1) {
      setTicket(ticket.map(item => 
        item.id === id ? { ...item, cant: item.cant - 1 } : item
      ));
    } else {
      setTicket(ticket.filter(item => item.id !== id));
    }
  };

  const clearTicket = () => {
    setTicket([]);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) setProductos(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const filteredProductos = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const tipo = p.tipo?.toUpperCase() || '';
    const matchesFilter = filterType === 'TODOS' || 
                          tipo === filterType || 
                          tipo === filterType.replace(/S$/, '') ||
                          (filterType === 'PROMOS' && tipo === 'PROMOCION') ||
                          (filterType === 'OTROS' && (tipo === 'OTRO' || !['BOTELLA', 'JARRA', 'SHOT', 'PACK', 'PROMOCION', 'VASO'].includes(tipo)));
    return matchesSearch && matchesFilter;
  });

  const total = ticket.reduce((acc, item) => acc + (item.precio * item.cant), 0);

  return (
    <div className="flex h-full">
      {/* Left side - Products */}
      <div className="flex-1 flex flex-col border-r border-zinc-800">
        <div className="p-3 bg-theme-1 border-b border-zinc-800 flex flex-row items-center gap-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 bg-zinc-800 px-3 rounded-lg border border-zinc-700 w-[250px] shrink-0 h-10">
            <Search size={18} className="text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none w-full text-sm h-full" 
            />
          </div>
          <div className="flex flex-nowrap gap-2 items-center shrink-0">
            {['TODOS', 'BOTELLAS', 'JARRAS', 'SHOTS', 'PACKS', 'PROMOS', 'VASOS', 'OTROS'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilterType(f)}
                className={`px-4 h-10 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filterType === f ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-wrap gap-4 content-start">
          {filteredProductos.map(p => (
            <div 
              key={p.id} 
              onClick={() => addToTicket(p)}
              className="bg-theme-1 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-primary hover:scale-110 transition-all group flex flex-col w-[140px] h-[180px]"
            >
              <div className="h-24 bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                {p.imagen_path ? (
                  <img src={p.imagen_path} alt={p.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-600 text-xs">IMG</span>
                )}
              </div>
              <div className="p-2 flex flex-col justify-between flex-1">
                <div className="font-bold text-sm text-center group-hover:text-primary transition-colors leading-tight line-clamp-3">{p.nombre}</div>
                <div className="text-emerald-400 font-mono text-xl font-bold text-right mt-1">{Math.round(p.precio)} Bs</div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-[200px] bg-theme-1 border-t border-zinc-800 flex flex-col shrink-0">
          <div className="p-2 border-b border-zinc-800 bg-zinc-900/50">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ventas Recientes</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800/50">
                  <th className="pb-1 font-medium">FECHA Y HORA</th>
                  <th className="pb-1 font-medium">PRODUCTO VENDIDO</th>
                  <th className="pb-1 font-medium">PAGO</th>
                  <th className="pb-1 font-medium text-right">TOTAL</th>
                  <th className="pb-1 font-medium text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {recentSales.slice(0, 4).map((sale, idx) => (
                  <tr key={idx} className={`hover:bg-zinc-800/30 ${sale.is_deleted ? 'bg-red-900/20 text-red-400' : modifiedSales.includes(sale.id) ? 'bg-blue-900/20 text-blue-200' : ''}`}>
                    <td className={`py-2 ${sale.is_deleted ? 'text-red-400/70' : 'text-zinc-400'}`}>
                      {new Date(sale.hora_venta).toLocaleDateString()} {new Date(sale.hora_venta).toLocaleTimeString()}
                    </td>
                    <td className={`py-2 font-medium ${sale.is_deleted ? 'line-through' : ''}`}>
                      {sale.is_deleted && <span className="text-xs font-bold mr-2 bg-red-950 px-1 rounded">ELIMINADO</span>}
                      {sale.producto}
                    </td>
                    <td className={`py-2 font-medium ${sale.is_deleted ? 'text-red-400/70' : 'text-zinc-300'}`}>
                      {sale.is_deleted ? 'ANULADO' : (sale.metodo_pago === 'EFECTIVO' ? 'CASH' : sale.metodo_pago)}
                    </td>
                    <td className={`py-2 text-right font-mono ${sale.is_deleted ? 'text-red-400 line-through' : 'text-emerald-400'}`}>{Math.round(sale.total)} Bs</td>
                    <td className="py-2 text-center">
                      {!sale.is_deleted && (
                        <button 
                          onClick={() => setSaleToEdit(sale)}
                          className="text-blue-500 hover:text-blue-400 font-bold text-xs bg-blue-950/30 px-2 py-1 rounded border border-blue-900"
                        >
                          CORREGIR
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-zinc-500">No hay ventas recientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <div className="flex gap-4">
              <div className="text-sm">
                <span className="text-zinc-500 block">Ventas Efectivo</span>
                <span className="font-mono font-bold text-emerald-400">
                  {Math.round(recentSales.filter(s => !s.is_deleted && (s.metodo_pago === 'EFECTIVO' || s.metodo_pago === 'MIXTO')).reduce((acc, s) => acc + (s.metodo_pago === 'MIXTO' ? (s.monto_efectivo || 0) : s.total), 0))} Bs
                </span>
              </div>
              <div className="text-sm">
                <span className="text-zinc-500 block">Ventas QR</span>
                <span className="font-mono font-bold text-blue-400">
                  {Math.round(recentSales.filter(s => !s.is_deleted && (s.metodo_pago === 'QR' || s.metodo_pago === 'MIXTO')).reduce((acc, s) => acc + (s.metodo_pago === 'MIXTO' ? (s.monto_qr || 0) : s.total), 0))} Bs
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                if (pendingTickets.length > 0) {
                  setShowPendingAlert(true);
                } else {
                  fetchInventoryUsed();
                  setShowCloseModal(true);
                }
              }}
              className="bg-red-950 hover:bg-red-900 text-red-400 px-4 py-2 rounded-lg transition-colors font-bold text-sm border border-red-900"
            >
              CERRAR CAJA
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Ticket */}
      <div className="w-80 bg-theme-1 flex flex-col">
        <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-bold text-lg">TICKET</h2>
          <button 
            onClick={() => setShowPending(true)}
            className="text-white hover:bg-orange-600 transition-colors bg-orange-500 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold"
          >
            <Clock size={16} /> PENDIENTES {pendingTickets.length > 0 && `(${pendingTickets.length})`}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {ticket.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-theme-2 p-3 rounded-lg border border-zinc-800">
              <div className="flex-1">
                <div className="font-bold text-base">{item.nombre}</div>
                <div className="text-zinc-400 text-sm font-mono">{Math.round(item.precio)} Bs x <span className="text-emerald-400 text-xl font-bold">{item.cant}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-bold font-mono text-emerald-400 text-xl">{Math.round(item.precio * item.cant)} Bs</div>
                <button 
                  onClick={() => removeFromTicket(item.id)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-md transition-colors"
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-black border-t border-zinc-800">
          <div className="flex justify-between items-end mb-4">
            <span className="text-zinc-400 font-bold">TOTAL</span>
            <span className="text-4xl font-bold font-mono text-white">{Math.round(total)} Bs</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button 
              onClick={() => processSale('EFECTIVO')}
              disabled={ticket.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <DollarSign size={18} /> EFECTIVO
            </button>
            <button 
              onClick={() => processSale('QR')}
              disabled={ticket.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <QrCode size={18} /> QR
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setShowMixtoPrompt(true)}
              disabled={ticket.length === 0}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 col-span-2"
            >
              <CreditCard size={18} /> MIXTO
            </button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setShowPendingPrompt(true)}
              disabled={ticket.length === 0}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold transition-colors text-sm"
            >
              PENDIENTE
            </button>
            <button 
              onClick={clearTicket}
              className="flex-1 bg-red-950 hover:bg-red-900 text-red-400 py-2 rounded-lg font-bold transition-colors text-sm border border-red-900 flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> BORRAR
            </button>
          </div>
        </div>
      </div>

      {/* Pending Tickets Modal */}
      {showPending && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-1 rounded-xl border border-zinc-800 w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Tickets Pendientes</h2>
              <button onClick={() => setShowPending(false)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg font-bold text-lg transition-colors">
                Cerrar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {pendingTickets.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">No hay tickets pendientes</div>
              ) : (
                pendingTickets.map(pt => (
                  <div key={pt.id} className="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg text-white mb-1">{pt.justification}</div>
                      <div className="text-sm text-zinc-400 mb-1">
                        {new Date(pt.timestamp).toLocaleString()}
                      </div>
                      <div className="font-bold text-emerald-400 text-xl">{Math.round(pt.total)} Bs</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {pt.items.map((i: any) => `${i.cant}x ${i.nombre}`).join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => loadPendingTicket(pt)}
                        className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                        PAGAR
                      </button>
                      <button 
                        onClick={() => deletePendingTicket(pt.id)}
                        className="bg-red-950 hover:bg-red-900 text-red-400 p-2 rounded-lg transition-colors border border-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Ticket Prompt Modal */}
      {showPendingPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-1 rounded-xl border border-zinc-800 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Justificativo de ticket pendiente</h2>
            <input
              type="text"
              autoFocus
              value={pendingJustification}
              onChange={e => setPendingJustification(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && pendingJustification.trim()) {
                  savePendingTicket(pendingJustification);
                }
              }}
              placeholder="Ej: Mesa 4, Juan..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary mb-6"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowPendingPrompt(false);
                  setPendingJustification('');
                }}
                className="px-4 py-2 rounded-lg font-bold text-zinc-400 hover:text-white transition-colors"
              >
                CANCELAR
              </button>
              <button 
                onClick={() => savePendingTicket(pendingJustification)}
                disabled={!pendingJustification.trim()}
                className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mixto Payment Modal */}
      {showMixtoPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-1 rounded-xl border border-zinc-800 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6 text-center">Pago Mixto</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Total a cobrar</label>
                <div className="text-3xl font-bold font-mono text-white">{Math.round(total)} Bs</div>
              </div>
              
              <div 
                onClick={() => setActiveMixtoInput('EFECTIVO')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${activeMixtoInput === 'EFECTIVO' ? 'border-primary bg-primary/10' : 'border-zinc-700 bg-zinc-900'}`}
              >
                <label className="block text-sm text-zinc-400 mb-1">Efectivo</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={mixtoEfectivo}
                    className="w-full bg-transparent border-none pr-12 pl-4 py-1 text-2xl font-mono text-emerald-400 focus:outline-none pointer-events-none text-right"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400">Bs</span>
                </div>
              </div>
              
              <div 
                onClick={() => setActiveMixtoInput('QR')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${activeMixtoInput === 'QR' ? 'border-primary bg-primary/10' : 'border-zinc-700 bg-zinc-900'}`}
              >
                <label className="block text-sm text-zinc-400 mb-1">QR</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={mixtoQr}
                    className="w-full bg-transparent border-none pr-12 pl-4 py-1 text-2xl font-mono text-blue-400 focus:outline-none pointer-events-none text-right"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400">Bs</span>
                </div>
              </div>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (activeMixtoInput === 'EFECTIVO') {
                      let newEfectivo = mixtoEfectivo;
                      if (key === '⌫') {
                        newEfectivo = newEfectivo.slice(0, -1);
                      } else if (key === '.') {
                        if (!newEfectivo.includes('.')) newEfectivo += key;
                      } else {
                        newEfectivo += key;
                      }
                      setMixtoEfectivo(newEfectivo);
                      
                      const val = parseFloat(newEfectivo) || 0;
                      if (val <= total) {
                        setMixtoQr((total - val).toFixed(2));
                      } else {
                        setMixtoQr('0.00');
                      }
                    } else {
                      let newQr = mixtoQr;
                      if (key === '⌫') {
                        newQr = newQr.slice(0, -1);
                      } else if (key === '.') {
                        if (!newQr.includes('.')) newQr += key;
                      } else {
                        newQr += key;
                      }
                      setMixtoQr(newQr);
                      
                      const val = parseFloat(newQr) || 0;
                      if (val <= total) {
                        setMixtoEfectivo((total - val).toFixed(2));
                      } else {
                        setMixtoEfectivo('0.00');
                      }
                    }
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xl font-bold py-4 rounded-lg transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowMixtoPrompt(false);
                  setMixtoEfectivo('');
                  setMixtoQr('');
                }}
                className="flex-1 py-3 rounded-lg font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                CANCELAR
              </button>
              <button 
                onClick={() => {
                  const efe = parseFloat(mixtoEfectivo) || 0;
                  const qr = parseFloat(mixtoQr) || 0;
                  processSale('MIXTO', efe, qr);
                  setShowMixtoPrompt(false);
                  setMixtoEfectivo('');
                  setMixtoQr('');
                }}
                disabled={!mixtoEfectivo || !mixtoQr || Math.abs((parseFloat(mixtoEfectivo) || 0) + (parseFloat(mixtoQr) || 0) - total) > 0.01}
                className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-1 rounded-xl border border-zinc-800 w-full max-w-4xl p-6 flex gap-6">
            {/* Left Column: Totals */}
            <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-center">Cerrar Caja</h2>
              <div className="space-y-4 mb-8 flex-1">
                <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <span className="text-zinc-400 text-lg">Ventas en Efectivo:</span>
                  <span className="font-mono font-bold text-emerald-400 text-2xl">
                    {Math.round(recentSales.filter(s => !s.is_deleted && (s.metodo_pago === 'EFECTIVO' || s.metodo_pago === 'MIXTO')).reduce((acc, s) => acc + (s.metodo_pago === 'MIXTO' ? (s.monto_efectivo || 0) : s.total), 0))} Bs
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <span className="text-zinc-400 text-lg">Ventas en QR:</span>
                  <span className="font-mono font-bold text-blue-400 text-2xl">
                    {Math.round(recentSales.filter(s => !s.is_deleted && (s.metodo_pago === 'QR' || s.metodo_pago === 'MIXTO')).reduce((acc, s) => acc + (s.metodo_pago === 'MIXTO' ? (s.monto_qr || 0) : s.total), 0))} Bs
                  </span>
                </div>
                <p className="text-center text-zinc-300 mt-6 text-lg">¿Está seguro de cerrar la caja?</p>
              </div>
              <div className="flex gap-4 mt-auto">
                <button 
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-4 rounded-lg font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors text-lg"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const userStr = localStorage.getItem('user');
                      const user = userStr ? JSON.parse(userStr) : { id: 1 };
                      const res = await fetch('/api/shifts/close', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: user.id })
                      });
                      if (res.ok) {
                        alert('Caja cerrada exitosamente');
                        setShowCloseModal(false);
                        setRecentSales([]);
                        localStorage.removeItem('user');
                        window.location.href = '/';
                      } else {
                        alert('Error al cerrar caja');
                      }
                    } catch (err) {
                      console.error('Error closing shift:', err);
                      alert('Error de conexión');
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold transition-colors text-lg"
                >
                  CERRAR CAJA
                </button>
              </div>
            </div>

            {/* Right Column: Inventory */}
            <div className="flex-1 border-l border-zinc-800 pl-6 flex flex-col max-h-[60vh]">
              <h2 className="text-xl font-bold mb-4 text-zinc-300">Inventario Vendido</h2>
              <div className="overflow-y-auto flex-1 pr-2 space-y-2">
                {new Date().getHours() >= 3 && new Date().getHours() < 12 ? (
                  <>
                    {inventoryUsed.map((item, idx) => {
                      let displayValue = item.cantidad_usada.toString();
                      if (item.modo_stock === 'GRAMOS' && item.contenido_gramos > 0) {
                        const unidades = Math.floor(item.cantidad_usada / item.contenido_gramos);
                        const gramos = Math.round(item.cantidad_usada % item.contenido_gramos);
                        displayValue = `${unidades} u + ${gramos} g`;
                      } else if (item.modo_stock === 'GRAMOS') {
                        displayValue = `${item.cantidad_usada} g`;
                      } else {
                        displayValue = `${item.cantidad_usada} u`;
                      }
                      
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                          <span className="text-zinc-300">{item.insumo}</span>
                          <span className="font-mono font-bold text-primary text-lg">{displayValue}</span>
                        </div>
                      );
                    })}
                    {inventoryUsed.length === 0 && (
                      <div className="text-center text-zinc-500 py-8">
                        No hay insumos gastados en este turno
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-zinc-500 py-8 flex flex-col items-center justify-center h-full">
                    <Clock size={48} className="mb-4 opacity-20" />
                    <p>El inventario gastado solo está disponible<br/>a partir de las 3:00 AM</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mixto Edit Modal */}
      {showMixtoEditPrompt && saleToEdit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-1 rounded-xl border border-zinc-800 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6 text-center">Corregir a Pago Mixto</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Total a cobrar</label>
                <div className="text-3xl font-bold font-mono text-white">{Math.round(saleToEdit.total)} Bs</div>
              </div>
              
              <div 
                onClick={() => setActiveMixtoInput('EFECTIVO')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${activeMixtoInput === 'EFECTIVO' ? 'border-primary bg-primary/10' : 'border-zinc-700 bg-zinc-900'}`}
              >
                <label className="block text-sm text-zinc-400 mb-1">Efectivo</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={mixtoEfectivo}
                    className="w-full bg-transparent border-none pr-12 pl-4 py-1 text-2xl font-mono text-emerald-400 focus:outline-none pointer-events-none text-right"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400">Bs</span>
                </div>
              </div>
              
              <div 
                onClick={() => setActiveMixtoInput('QR')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${activeMixtoInput === 'QR' ? 'border-primary bg-primary/10' : 'border-zinc-700 bg-zinc-900'}`}
              >
                <label className="block text-sm text-zinc-400 mb-1">QR</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={mixtoQr}
                    className="w-full bg-transparent border-none pr-12 pl-4 py-1 text-2xl font-mono text-blue-400 focus:outline-none pointer-events-none text-right"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400">Bs</span>
                </div>
              </div>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    const totalAmount = saleToEdit.total;
                    if (activeMixtoInput === 'EFECTIVO') {
                      let newEfectivo = mixtoEfectivo;
                      if (key === '⌫') {
                        newEfectivo = newEfectivo.slice(0, -1);
                      } else if (key === '.') {
                        if (!newEfectivo.includes('.')) newEfectivo += key;
                      } else {
                        newEfectivo += key;
                      }
                      setMixtoEfectivo(newEfectivo);
                      
                      const val = parseFloat(newEfectivo) || 0;
                      if (val <= totalAmount) {
                        setMixtoQr((totalAmount - val).toFixed(2));
                      } else {
                        setMixtoQr('0.00');
                      }
                    } else {
                      let newQr = mixtoQr;
                      if (key === '⌫') {
                        newQr = newQr.slice(0, -1);
                      } else if (key === '.') {
                        if (!newQr.includes('.')) newQr += key;
                      } else {
                        newQr += key;
                      }
                      setMixtoQr(newQr);
                      
                      const val = parseFloat(newQr) || 0;
                      if (val <= totalAmount) {
                        setMixtoEfectivo((totalAmount - val).toFixed(2));
                      } else {
                        setMixtoEfectivo('0.00');
                      }
                    }
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xl font-bold py-4 rounded-lg transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowMixtoEditPrompt(false);
                  setMixtoEfectivo('');
                  setMixtoQr('');
                }}
                className="flex-1 py-3 rounded-lg font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                CANCELAR
              </button>
              <button 
                onClick={() => {
                  const efe = parseFloat(mixtoEfectivo) || 0;
                  const qr = parseFloat(mixtoQr) || 0;
                  updateSaleMethod(saleToEdit.id, 'MIXTO', efe, qr);
                  setShowMixtoEditPrompt(false);
                  setMixtoEfectivo('');
                  setMixtoQr('');
                }}
                disabled={!mixtoEfectivo || !mixtoQr || Math.abs((parseFloat(mixtoEfectivo) || 0) + (parseFloat(mixtoQr) || 0) - saleToEdit.total) > 0.01}
                className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Edit Modal */}
      {saleToEdit && !showMixtoEditPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-1 rounded-xl border border-zinc-800 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Corregir Venta</h2>
            <p className="mb-4 text-zinc-300">Venta de <span className="font-bold text-white">{saleToEdit.producto}</span> por <span className="font-mono text-emerald-400 font-bold">{Math.round(saleToEdit.total)} Bs</span></p>
            
            {showDeletePrompt ? (
              <div className="space-y-4">
                <p className="text-red-400 font-bold">¿Estás seguro de eliminar esta venta permanentemente?</p>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Justificación de la eliminación</label>
                  <input 
                    type="text" 
                    value={deleteJustification}
                    onChange={(e) => setDeleteJustification(e.target.value)}
                    placeholder="Ej. Error al cobrar, cliente canceló..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setShowDeletePrompt(false);
                      setDeleteJustification('');
                    }}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold text-zinc-400 transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={async () => {
                      if (!deleteJustification.trim()) {
                        alert('Debes ingresar una justificación');
                        return;
                      }
                      try {
                        // In a real app, send the justification to the backend
                        const res = await fetch(`/api/sales/${saleToEdit.id}`, { method: 'DELETE' });
                        if (res.ok) {
                          setSaleToEdit(null);
                          setShowDeletePrompt(false);
                          setDeleteJustification('');
                          fetchRecentSales();
                        }
                      } catch (err) { console.error(err); }
                    }}
                    disabled={!deleteJustification.trim()}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold transition-colors"
                  >
                    CONFIRMAR
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  <button 
                    onClick={() => updateSaleMethod(saleToEdit.id, 'EFECTIVO')} 
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-white transition-colors"
                  >
                    Cambiar a EFECTIVO
                  </button>
                  <button 
                    onClick={() => updateSaleMethod(saleToEdit.id, 'QR')} 
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors"
                  >
                    Cambiar a QR
                  </button>
                  <button 
                    onClick={() => {
                      setMixtoEfectivo('');
                      setMixtoQr('');
                      setActiveMixtoInput('EFECTIVO');
                      setShowMixtoEditPrompt(true);
                    }} 
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard size={18} /> Cambiar a MIXTO
                  </button>
                  
                  <div className="pt-4 border-t border-zinc-800">
                    <button 
                      onClick={() => setShowDeletePrompt(true)} 
                      className="w-full py-3 bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} /> ELIMINAR VENTA
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSaleToEdit(null)} 
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold text-zinc-400 transition-colors"
                >
                  CANCELAR
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pending Alert Modal */}
      {showPendingAlert && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-1 rounded-xl border border-red-900/50 w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">No puedes cerrar la caja</h2>
            <p className="mb-6 text-zinc-400">Hay tickets pendientes que debes cobrar o eliminar antes de poder cerrar el turno.</p>
            <button 
              onClick={() => setShowPendingAlert(false)}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold transition-colors"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
