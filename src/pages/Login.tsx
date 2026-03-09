import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setUser = useStore(state => state.setUser);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        if (data.user.role === 'ADMIN') {
          navigate('/admin/reportes');
        } else {
          navigate('/pos/caja');
        }
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative" style={{ backgroundImage: 'url(/assets/fondo.png)', backgroundSize: 'cover' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 bg-theme-1/80 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800">
        <div className="text-center mb-8">
          <img src="/assets/logo.png" alt="Logo" className="w-24 h-24 mx-auto mb-4 rounded-full bg-zinc-800" />
          <h1 className="text-2xl font-bold text-white tracking-wider">BIENVENIDO</h1>
        </div>

        {error && <div className="bg-primary/20 border border-primary text-red-200 p-3 rounded mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-lg transition-colors mt-4"
          >
            INGRESAR
          </button>
        </form>
      </div>
    </div>
  );
}
