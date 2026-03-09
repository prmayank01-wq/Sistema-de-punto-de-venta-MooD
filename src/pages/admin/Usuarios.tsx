import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { ConfirmModal, AlertModal } from '../../components/Modals';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'CAJERO' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState({ username: '', role: 'CAJERO', password: '' });

  // Modals state
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: number | null}>({isOpen: false, id: null});
  const [alert, setAlert] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      setAlert({ isOpen: true, title: 'Error', message: 'Usuario y contraseña son requeridos' });
      return;
    }
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        const createdUser = await res.json();
        setUsuarios([...usuarios, createdUser]);
        setNewUser({ username: '', password: '', role: 'CAJERO' });
        setAlert({ isOpen: true, title: 'Éxito', message: 'Usuario creado exitosamente' });
      } else {
        setAlert({ isOpen: true, title: 'Error', message: 'Error al crear el usuario' });
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Error de conexión al crear el usuario' });
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
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsuarios(usuarios.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        setAlert({ isOpen: true, title: 'Error', message: data.error || 'Error al eliminar el usuario' });
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Error de conexión al eliminar el usuario' });
    }
  };

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setEditUser({ username: user.username, role: user.role, password: '' });
  };

  const saveEdit = async () => {
    if (!editUser.username) {
      setAlert({ isOpen: true, title: 'Error', message: 'El nombre de usuario no puede estar vacío' });
      return;
    }
    
    const payload = { ...editUser };
    if (!payload.password) {
      delete payload.password; // Don't send empty password if not changing
    }

    try {
      const res = await fetch(`/api/users/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setUsuarios(usuarios.map(u => u.id === editingId ? { ...u, username: editUser.username, role: editUser.role } : u));
        setEditingId(null);
        setAlert({ isOpen: true, title: 'Éxito', message: 'Usuario actualizado exitosamente' });
      } else {
        setAlert({ isOpen: true, title: 'Error', message: 'Error al actualizar el usuario' });
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setAlert({ isOpen: true, title: 'Error', message: 'Error de conexión al actualizar el usuario' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
      </div>

      <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800">
        <h2 className="text-lg font-bold mb-4">Crear Usuario</h2>
        <form onSubmit={handleCreate} className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Usuario</label>
            <input 
              type="text" 
              value={newUser.username}
              onChange={e => setNewUser({...newUser, username: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" 
              required 
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" 
              required 
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo</label>
            <select 
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
            >
              <option value="CAJERO">CAJERO</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button type="submit" className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 h-[42px]">
            <Plus size={18} />
            CREAR
          </button>
        </form>
      </div>

      <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-sm uppercase tracking-wider">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">Usuario</th>
                <th className="pb-3 font-medium">Rol</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-800/50">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4 font-mono text-zinc-500">#{u.id}</td>
                  
                  {editingId === u.id ? (
                    <>
                      <td className="py-2">
                        <div className="flex flex-col gap-2">
                          <input 
                            type="text" 
                            value={editUser.username}
                            onChange={e => setEditUser({...editUser, username: e.target.value})}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                            placeholder="Usuario"
                          />
                          <input 
                            type="password" 
                            value={editUser.password}
                            onChange={e => setEditUser({...editUser, password: e.target.value})}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                            placeholder="Nueva Contraseña (opcional)"
                          />
                        </div>
                      </td>
                      <td className="py-2 align-top pt-3">
                        <select 
                          value={editUser.role}
                          onChange={e => setEditUser({...editUser, role: e.target.value})}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                        >
                          <option value="CAJERO">CAJERO</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="py-2 text-right space-x-2 align-top pt-3">
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
                      <td className="py-4 font-medium">{u.username}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-primary/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button onClick={() => startEdit(u)} className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-800 rounded-md" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(u.id)} className="text-red-400 hover:text-red-300 transition-colors p-2 bg-red-950 rounded-md" title="Eliminar">
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
        title="Eliminar Usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
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
