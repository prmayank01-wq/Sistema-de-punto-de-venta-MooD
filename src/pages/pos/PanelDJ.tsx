import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Music, Play, CheckCircle2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../../store/useStore';

export default function PanelDJ() {
  const [activeTab, setActiveTab] = useState('CHAT');
  const [mesas, setMesas] = useState<{id: number, nombre: string}[]>([]);
  const [activeMesa, setActiveMesa] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const setUnreadNotifications = useStore(state => state.setUnreadNotifications);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleSort = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    let _mesas = [...mesas];
    const draggedItemContent = _mesas.splice(dragItem.current, 1)[0];
    _mesas.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setMesas(_mesas);

    // Save order to backend
    const orders = _mesas.map((m, index) => ({ id: m.id, orden: index }));
    try {
      await fetch('/api/tables/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders })
      });
    } catch (err) {
      console.error('Error saving order', err);
    }
  };

  useEffect(() => {
    // Clear notifications when entering DJ panel
    setUnreadNotifications(false);
    
    // Fetch initial data
    fetch('/api/tables').then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        setMesas(data);
        if (data.length > 0) setActiveMesa(data[0].id);
      }
    });
    fetch('/api/chats/active').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setChats(data);
    });
    fetch('/api/playlist/active').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setPlaylist(data);
    });
    
    // Connect to Socket.IO
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_dj');
    });

    newSocket.on('tables_updated', () => {
      fetch('/api/tables').then(res => res.json()).then(data => {
        if (Array.isArray(data)) {
          setMesas(data);
          // If active mesa is no longer in the list, switch to the first one
          if (data.length > 0) {
            setActiveMesa(current => {
              if (!data.find((m: any) => m.id === current)) {
                return data[0].id;
              }
              return current;
            });
          }
        }
      });
    });

    newSocket.on('new_message', (data) => {
      setChats(prev => [...prev, {
        id: Date.now(),
        table_id: data.tableId,
        message: data.message,
        from_role: data.fromRole,
        ts: new Date().toISOString()
      }]);
      
      // Set unread notification if we receive a message
      if (data.fromRole === 'MESA') {
        setUnreadNotifications(true);
      }
    });

    newSocket.on('new_playlist_item', (data) => {
      setPlaylist(prev => [...prev, {
        id: Date.now(),
        table_id: data.tableId,
        title: data.title,
        tipo: data.tipo,
        thumbnail: data.thumbnail,
        youtube_id: data.youtubeId,
        ts: new Date().toISOString()
      }]);
      setUnreadNotifications(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [setUnreadNotifications]);

  useEffect(() => {
    if (activeTab === 'CHAT') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats, activeTab, activeMesa]);

  const sendMessage = () => {
    if (!inputMsg.trim() || !socket || !activeMesa) return;
    socket.emit('chat_message', {
      tableId: activeMesa,
      message: inputMsg,
      fromRole: 'DJ'
    });
    setInputMsg('');
  };

  const addToPlaylist = (data: any, tableId: number) => {
    if (!socket) return;
    socket.emit('add_playlist', {
      tableId,
      title: data.title,
      youtubeId: data.url || 'dummy_id',
      tipo: data.tipo,
      thumbnail: data.thumbnail
    });
    setToast(`${data.tipo === 'CANCION' ? 'Canción' : 'Karaoke'} añadido a la lista!`);
    setTimeout(() => setToast(null), 3000);
  };

  const activeMesaName = mesas.find(m => m.id === activeMesa)?.nombre || 'Mesa';
  const activeMesaChats = chats.filter(c => c.table_id == activeMesa);
  const activePlaylist = playlist.filter(p => p.tipo === 'CANCION');
  const activeKaraokes = playlist.filter(p => p.tipo === 'KARAOKE');

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {toast && (
        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold z-50 animate-in fade-in slide-in-from-top-4">
          {toast}
        </div>
      )}
      {/* Sidebar Mesas */}
      <div className="w-64 bg-theme-1 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800 shrink-0">
          <h2 className="font-bold text-lg">Mesas Activas</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {mesas.map((m, index) => {
            const hasUnread = chats.some(c => c.table_id == m.id && c.from_role === 'MESA' && new Date(c.ts).getTime() > Date.now() - 60000); // Simple unread logic
            return (
              <button 
                key={m.id}
                draggable
                onDragStart={(e) => (dragItem.current = index)}
                onDragEnter={(e) => (dragOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => {
                  setActiveMesa(m.id);
                  setUnreadNotifications(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-colors flex justify-between items-center cursor-grab active:cursor-grabbing ${activeMesa === m.id ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
              >
                {m.nombre}
                {hasUnread && activeMesa !== m.id && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-theme-2 overflow-hidden min-h-0">
        <div className="flex border-b border-zinc-800 bg-theme-1 shrink-0">
          <button onClick={() => { setActiveTab('CHAT'); setUnreadNotifications(false); }} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'CHAT' ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>CHAT</button>
          <button onClick={() => { setActiveTab('PLAYLIST'); setUnreadNotifications(false); }} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'PLAYLIST' ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>PLAYLIST</button>
          <button onClick={() => { setActiveTab('KARAOKES'); setUnreadNotifications(false); }} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'KARAOKES' ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>KARAOKES</button>
        </div>

        {activeTab === 'CHAT' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-4 border-b border-zinc-800 bg-theme-1 flex justify-between items-center shrink-0">
              <h3 className="font-bold">{activeMesaName}</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {activeMesaChats.map((msg, idx) => {
                let content = <p className="text-sm">{msg.message}</p>;
                try {
                  if (msg.message.startsWith('{')) {
                    const data = JSON.parse(msg.message);
                    if (data.type === 'song_request') {
                      content = (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            {data.thumbnail && <img src={data.thumbnail} alt="Cover" className="w-12 h-12 rounded object-cover" />}
                            <div>
                              <div className="text-xs font-bold text-white mb-1">
                                {data.tipo === 'KARAOKE' ? '🎤 Pedido de Karaoke' : '🎵 Pedido de Canción'}
                              </div>
                              <div className="text-sm font-bold">{data.title}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => addToPlaylist(data, msg.table_id)}
                            className="bg-primary/20 hover:bg-primary/40 text-white w-full py-2 rounded-lg text-xs font-bold transition-colors mt-2"
                          >
                            Añadir a {data.tipo === 'KARAOKE' ? 'Karaokes' : 'Playlist'}
                          </button>
                        </div>
                      );
                    } else if (data.type === 'product_request') {
                      content = (
                        <div className="flex flex-col gap-4 p-2">
                          <div className="text-xl font-bold text-emerald-400 mb-1">🍹 Pedido de Menú</div>
                          <div className="flex items-center gap-6">
                            {data.imagen_path && <img src={data.imagen_path} alt="Product" className="w-48 h-48 rounded-xl object-cover shadow-lg" />}
                            <div className="flex flex-col justify-center">
                              <div className="text-4xl font-bold leading-tight">{data.nombre}</div>
                              <div className="text-3xl font-black text-amber-400 mt-4">Bs. {data.precio}</div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                } catch (e) {}

                return (
                  <div key={idx} className={`flex flex-col ${msg.from_role === 'MESA' ? 'items-start' : 'items-end'}`}>
                    <div className={`${msg.from_role === 'MESA' ? 'bg-zinc-800 text-white rounded-tl-sm' : 'bg-primary text-white rounded-tr-sm'} px-4 py-2 rounded-2xl max-w-2xl`}>
                      {content}
                    </div>
                    <span className={`text-xs text-zinc-600 mt-1 ${msg.from_role === 'MESA' ? 'ml-1' : 'mr-1'}`}>
                      {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-theme-1 border-t border-zinc-800 shrink-0">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje..." 
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-primary text-sm" 
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} className="bg-primary hover:bg-primary/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PLAYLIST' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-2">
              {activePlaylist.map((item, i) => {
                const mesaName = mesas.find(m => m.id == item.table_id)?.nombre || 'Mesa';
                const linkUrl = item.youtube_id !== 'dummy_id' ? item.youtube_id : `https://duckduckgo.com/?q=${encodeURIComponent('!yt ' + item.title)}`;
                return (
                  <div 
                    key={i} 
                    onClick={() => window.open(linkUrl, '_blank')}
                    className="bg-theme-1 p-4 rounded-xl border border-zinc-800 flex items-center justify-between group hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="Cover" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
                          <Music size={20} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-xs text-zinc-500">Pedida por {mesaName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-zinc-800 group-hover:bg-primary text-white p-2 rounded-lg transition-colors">
                        <Play size={16} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {activePlaylist.length === 0 && <p className="text-zinc-500 text-center py-8">No hay canciones solicitadas.</p>}
            </div>
          </div>
        )}

        {activeTab === 'KARAOKES' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-2">
              {activeKaraokes.map((item, i) => {
                const mesaName = mesas.find(m => m.id == item.table_id)?.nombre || 'Mesa';
                const linkUrl = item.youtube_id !== 'dummy_id' ? item.youtube_id : `https://duckduckgo.com/?q=${encodeURIComponent('!yt ' + item.title + ' karaoke')}`;
                return (
                  <div 
                    key={i} 
                    onClick={() => window.open(linkUrl, '_blank')}
                    className="bg-theme-1 p-4 rounded-xl border border-zinc-800 flex items-center justify-between group hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="Cover" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-red-900/20 rounded-lg flex items-center justify-center text-white">
                          <Mic size={20} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-xs text-zinc-500">Pedida por {mesaName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-zinc-800 group-hover:bg-primary text-white p-2 rounded-lg transition-colors">
                        <Play size={16} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeKaraokes.length === 0 && <p className="text-zinc-500 text-center py-8">No hay karaokes solicitados.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
