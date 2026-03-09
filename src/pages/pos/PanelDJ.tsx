import { useState, useEffect } from 'react';
import { Send, Mic, Music, Play, CheckCircle2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../../store/useStore';

export default function PanelDJ() {
  const [activeTab, setActiveTab] = useState('CHAT');
  const [mesas, setMesas] = useState<{id: number, nombre: string}[]>([]);
  const [activeMesa, setActiveMesa] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const setUnreadNotifications = useStore(state => state.setUnreadNotifications);
  
  useEffect(() => {
    // Clear notifications when entering DJ panel
    setUnreadNotifications(false);
    
    // Connect to Socket.IO
    const newSocket = io(import.meta.env.VITE_BASE_URL_PEDIDOS || 'http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_dj');
    });

    newSocket.on('new_message', (data) => {
      // Set unread notification if we receive a message
      if (data.fromRole === 'MESA') {
        setUnreadNotifications(true);
      }
    });

    newSocket.on('new_playlist_item', () => {
      setUnreadNotifications(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [setUnreadNotifications]);

  // Mock data for now
  const mockMesas = ['Mesa 01', 'Mesa 02', 'Mesa 03'];
  const [activeMockMesa, setActiveMockMesa] = useState('Mesa 01');

  return (
    <div className="flex h-full">
      {/* Sidebar Mesas */}
      <div className="w-64 bg-theme-1 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="font-bold text-lg">Mesas Activas</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {mockMesas.map(m => (
            <button 
              key={m}
              onClick={() => {
                setActiveMockMesa(m);
                setUnreadNotifications(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-colors flex justify-between items-center ${activeMockMesa === m ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              {m}
              {m === 'Mesa 02' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-theme-2">
        <div className="flex border-b border-zinc-800 bg-theme-1">
          <button onClick={() => { setActiveTab('CHAT'); setUnreadNotifications(false); }} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'CHAT' ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>CHAT</button>
          <button onClick={() => { setActiveTab('PLAYLIST'); setUnreadNotifications(false); }} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'PLAYLIST' ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>PLAYLIST</button>
          <button onClick={() => { setActiveTab('KARAOKES'); setUnreadNotifications(false); }} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'KARAOKES' ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>KARAOKES</button>
        </div>

        {activeTab === 'CHAT' && (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-zinc-800 bg-theme-1 flex justify-between items-center">
              <h3 className="font-bold">{activeMockMesa}</h3>
              <button className="text-xs text-zinc-500 hover:text-white">Silenciar Mesa</button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col items-start">
                <div className="bg-zinc-800 text-white px-4 py-2 rounded-2xl rounded-tl-sm max-w-md">
                  <p className="text-sm">Hola, ¿pueden poner algo de rock nacional?</p>
                </div>
                <span className="text-xs text-zinc-600 mt-1 ml-1">22:15</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-primary text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-md">
                  <p className="text-sm">¡Claro! En un momento la ponemos.</p>
                </div>
                <span className="text-xs text-zinc-600 mt-1 mr-1">22:16</span>
              </div>
            </div>
            <div className="p-4 bg-theme-1 border-t border-zinc-800">
              <div className="flex gap-2">
                <input type="text" placeholder="Escribe un mensaje..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-primary text-sm" />
                <button className="bg-primary hover:bg-primary/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PLAYLIST' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="bg-theme-1 p-4 rounded-xl border border-zinc-800 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
                      <Music size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Canción Solicitada {i}</h4>
                      <p className="text-xs text-zinc-500">Pedida por Mesa 0{i}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg transition-colors" title="Abrir en YouTube">
                      <Play size={16} />
                    </button>
                    <button className="bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 p-2 rounded-lg transition-colors" title="Marcar como hecha">
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'KARAOKES' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-2">
              {[1,2].map(i => (
                <div key={i} className="bg-theme-1 p-4 rounded-xl border border-zinc-800 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-900/20 rounded-lg flex items-center justify-center text-primary">
                      <Mic size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Karaoke Solicitado {i}</h4>
                      <p className="text-xs text-zinc-500">Pedida por Mesa 0{i}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg transition-colors" title="Abrir en YouTube">
                      <Play size={16} />
                    </button>
                    <button className="bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 p-2 rounded-lg transition-colors" title="Marcar como hecha">
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
