import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Search, FileDown, Save, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmModal, AlertModal } from '../../components/Modals';

export default function Inventario() {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [newInsumo, setNewInsumo] = useState({ nombre: '', contenido: '', peso_envase: '', modo: 'GRAMOS', unidades: '', gramos_abiertos: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editInsumo, setEditInsumo] = useState({ nombre: '', contenido: '', peso_envase: '', modo: 'GRAMOS', unidades: 0, gramos_abiertos: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: number | null}>({isOpen: false, id: null});
  const [alert, setAlert] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (Array.isArray(data)) {
        setInsumos(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInsumo.nombre) {
      setAlert({ isOpen: true, title: 'Error', message: 'El nombre es requerido' });
      return;
    }
    
    const contenido = Number(newInsumo.contenido) || 0;
    let stock = 0;
    if (newInsumo.modo === 'GRAMOS') {
      stock = (Number(newInsumo.unidades) || 0) * contenido + (Number(newInsumo.gramos_abiertos) || 0);
    } else {
      stock = Number(newInsumo.unidades) || 0;
    }

    const payload = { 
      nombre: newInsumo.nombre, 
      contenido: contenido, 
      peso_envase: Number(newInsumo.peso_envase) || 0, 
      modo: newInsumo.modo,
      stock: stock
    };

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setInsumos([...insumos, created]);
        setNewInsumo({ nombre: '', contenido: '', peso_envase: '', modo: 'GRAMOS', unidades: '', gramos_abiertos: '' });
        setAlert({ isOpen: true, title: 'Éxito', message: 'Insumo añadido exitosamente' });
      }
    } catch (err) {
      console.error('Error creating inventory item:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Error de conexión al añadir el insumo' });
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
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInsumos(insumos.filter(i => i.id !== id));
      } else {
        const data = await res.json();
        setAlert({ isOpen: true, title: 'Error', message: data.error || 'Error al eliminar el insumo' });
      }
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Error de conexión al eliminar el insumo' });
    }
  };

  const startEdit = (insumo: any) => {
    setEditingId(insumo.id);
    let unidades = 0;
    let gramos_abiertos = 0;
    if (insumo.modo === 'GRAMOS' && insumo.contenido > 0) {
      unidades = Math.floor(insumo.stock / insumo.contenido);
      gramos_abiertos = insumo.stock % insumo.contenido;
    } else {
      unidades = insumo.stock;
    }

    setEditInsumo({ 
      nombre: insumo.nombre, 
      contenido: insumo.contenido.toString(), 
      peso_envase: insumo.peso_envase.toString(), 
      modo: insumo.modo,
      unidades: unidades,
      gramos_abiertos: gramos_abiertos
    });
  };

  const saveEdit = async () => {
    if (!editInsumo.nombre) {
      setAlert({ isOpen: true, title: 'Error', message: 'El nombre no puede estar vacío' });
      return;
    }

    const contenido = Number(editInsumo.contenido) || 0;
    let stock = 0;
    if (editInsumo.modo === 'GRAMOS') {
      stock = (Number(editInsumo.unidades) || 0) * contenido + (Number(editInsumo.gramos_abiertos) || 0);
    } else {
      stock = Number(editInsumo.unidades) || 0;
    }

    const payload = {
      nombre: editInsumo.nombre,
      contenido: contenido,
      peso_envase: Number(editInsumo.peso_envase) || 0,
      modo: editInsumo.modo,
      stock: stock
    };

    try {
      const res = await fetch(`/api/inventory/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setInsumos(insumos.map(i => i.id === editingId ? { ...i, ...payload } : i));
        setEditingId(null);
        setAlert({ isOpen: true, title: 'Éxito', message: 'Insumo actualizado exitosamente' });
      } else {
        setAlert({ isOpen: true, title: 'Error', message: 'Error al actualizar el insumo' });
      }
    } catch (err) {
      console.error('Error updating inventory item:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Error de conexión al actualizar el insumo' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleCrearPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Inventario', 14, 15);
    
    const tableData = insumos.map(i => {
      let stockStr = i.stock.toString();
      if (i.modo === 'GRAMOS' && i.contenido > 0) {
        const botellas = Math.floor(i.stock / i.contenido);
        const gramos = i.stock % i.contenido;
        stockStr = `${botellas} Botellas${gramos > 0 ? ` + ${gramos}g` : ''}`;
      }
      return [
        i.nombre,
        `${i.contenido} g/ml`,
        `${i.peso_envase} g`,
        i.modo,
        stockStr
      ];
    });

    autoTable(doc, {
      startY: 20,
      head: [['Nombre', 'Contenido', 'Envase', 'Modo', 'Stock']],
      body: tableData,
    });

    doc.save('inventario.pdf');
  };

  const filteredInsumos = insumos.filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <button 
          onClick={handleCrearPDF}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <FileDown size={16} />
          PDF STOCK
        </button>
      </div>

      <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800">
        <h2 className="text-lg font-bold mb-4">Nuevo Insumo</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre</label>
            <input 
              type="text" 
              value={newInsumo.nombre}
              onChange={e => setNewInsumo({...newInsumo, nombre: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Cont. Neto (g/ml)</label>
            <input 
              type="number" 
              value={newInsumo.contenido}
              onChange={e => setNewInsumo({...newInsumo, contenido: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Peso Envase (g)</label>
            <input 
              type="number" 
              value={newInsumo.peso_envase}
              onChange={e => setNewInsumo({...newInsumo, peso_envase: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Modo Stock</label>
            <select 
              value={newInsumo.modo}
              onChange={e => setNewInsumo({...newInsumo, modo: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
            >
              <option value="GRAMOS">GRAMOS</option>
              <option value="UNIDADES">UNIDADES</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Unidades</label>
            <input 
              type="number" 
              value={newInsumo.unidades}
              onChange={e => setNewInsumo({...newInsumo, unidades: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" 
            />
          </div>
          {newInsumo.modo === 'GRAMOS' && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Gramos Abiertos</label>
              <input 
                type="number" 
                value={newInsumo.gramos_abiertos}
                onChange={e => setNewInsumo({...newInsumo, gramos_abiertos: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" 
              />
            </div>
          )}
          <div>
            <button type="submit" className="w-full bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 h-[42px]">
              <Plus size={18} />
              AÑADIR
            </button>
          </div>
        </form>
      </div>

      <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 mb-6 bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700 w-full max-w-md">
          <Search size={18} className="text-zinc-400" />
          <input 
            type="text" 
            placeholder="BUSCAR INSUMO..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-white focus:outline-none w-full text-sm" 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-sm uppercase tracking-wider">
                <th className="pb-3 font-medium">Nombre</th>
                <th className="pb-3 font-medium">Contenido</th>
                <th className="pb-3 font-medium">Envase</th>
                <th className="pb-3 font-medium">Modo</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-800/50">
              {filteredInsumos.map(i => (
                <tr key={i.id} className="hover:bg-zinc-800/50 transition-colors">
                  {editingId === i.id ? (
                    <>
                      <td className="py-2">
                        <input 
                          type="text" 
                          value={editInsumo.nombre}
                          onChange={e => setEditInsumo({...editInsumo, nombre: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                        />
                      </td>
                      <td className="py-2">
                        <input 
                          type="number" 
                          value={editInsumo.contenido}
                          onChange={e => setEditInsumo({...editInsumo, contenido: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                        />
                      </td>
                      <td className="py-2">
                        <input 
                          type="number" 
                          value={editInsumo.peso_envase}
                          onChange={e => setEditInsumo({...editInsumo, peso_envase: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                        />
                      </td>
                      <td className="py-2">
                        <select 
                          value={editInsumo.modo}
                          onChange={e => setEditInsumo({...editInsumo, modo: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                        >
                          <option value="GRAMOS">GRAMOS</option>
                          <option value="UNIDADES">UNIDADES</option>
                        </select>
                      </td>
                      <td className="py-2 flex gap-2">
                        <input 
                          type="number" 
                          value={editInsumo.unidades}
                          onChange={e => setEditInsumo({...editInsumo, unidades: Number(e.target.value)})}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                          title="Unidades"
                        />
                        {editInsumo.modo === 'GRAMOS' && (
                          <input 
                            type="number" 
                            value={editInsumo.gramos_abiertos}
                            onChange={e => setEditInsumo({...editInsumo, gramos_abiertos: Number(e.target.value)})}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                            title="Gramos Abiertos"
                          />
                        )}
                      </td>
                      <td className="py-2 text-right space-x-2">
                        <button onClick={saveEdit} className="text-green-400 hover:text-green-300 transition-colors p-2 bg-green-950 rounded-md" title="Guardar">
                          <Save size={16} />
                        </button>
                        <button onClick={cancelEdit} className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-800 rounded-md" title="Cancelar">
                          <X size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-4 font-medium">{i.nombre}</td>
                      <td className="py-4 text-zinc-400">{i.contenido} {i.modo === 'GRAMOS' ? 'g' : 'ml'}</td>
                      <td className="py-4 text-zinc-400">{i.peso_envase} g</td>
                      <td className="py-4">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-zinc-800 text-zinc-300">
                          {i.modo}
                        </span>
                      </td>
                      <td className="py-4 font-mono font-bold text-emerald-400">
                        {i.modo === 'GRAMOS' && i.contenido > 0 ? (
                          <div className="flex flex-col">
                            <span>{Math.floor(i.stock / i.contenido)} Botellas</span>
                            {i.stock % i.contenido > 0 && (
                              <span className="text-xs text-zinc-400">
                                {i.stock % i.contenido} gr (+ {i.peso_envase}g envase)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>{i.stock}</span>
                        )}
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button onClick={() => startEdit(i)} className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-800 rounded-md" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(i.id)} className="text-red-400 hover:text-red-300 transition-colors p-2 bg-red-950 rounded-md" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar Insumo"
        message="¿Estás seguro de que deseas eliminar este insumo? Esta acción no se puede deshacer."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
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
