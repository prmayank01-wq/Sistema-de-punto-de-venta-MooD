import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Menu, Mic, Music, MessageSquare, Send, Search } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function Pedidos() {
  const [searchParams] = useSearchParams();
  const tableToken = searchParams.get('t');
  const tableId = searchParams.get('table');
  const [tableName, setTableName] = useState('Mesa Desconocida');
  const [activeTab, setActiveTab] = useState('HOME');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<{from: string, text: string}[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (tableToken) {
      try {
        setTableName(atob(tableToken));
      } catch (e) {
        console.error('Invalid token');
      }
    }

    // Connect to Socket.IO
    const newSocket = io(import.meta.env.VITE_BASE_URL_PEDIDOS || 'http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (tableId) {
        newSocket.emit('join_table', tableId);
      }
    });

    newSocket.on('new_message', (data) => {
      setMessages(prev => [...prev, { from: data.fromRole, text: data.message }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [tableToken, tableId]);

  const sendMessage = () => {
    if (!inputMsg.trim() || !socket) return;
    socket.emit('chat_message', {
      tableId: tableId,
      message: inputMsg,
      fromRole: 'MESA'
    });
    setInputMsg('');
  };

  const requestSong = (title: string, tipo: 'CANCION' | 'KARAOKE') => {
    if (!socket) return;
    socket.emit('add_playlist', {
      tableId: tableId,
      title,
      youtubeId: 'dummy_id', // In a real app, get from YouTube API
      tipo
    });
    
    // Also send as a chat message
    const icon = tipo === 'KARAOKE' ? '🎤' : '🎵';
    socket.emit('chat_message', {
      tableId: tableId,
      message: `${icon} [${tipo}] ${title}`,
      fromRole: 'MESA'
    });
    
    alert(`${tipo === 'CANCION' ? 'Canción' : 'Karaoke'} solicitado con éxito!`);
    setActiveTab('CHAT');
  };

  // Mock Menu
  const menu = [
    { id: 1, nombre: 'Cerveza Artesanal IPA', precio: 1200, tipo: 'BOTELLA' },
    { id: 2, nombre: 'Fernet con Cola', precio: 1500, tipo: 'JARRA' },
    { id: 3, nombre: 'Tequila Jose Cuervo', precio: 800, tipo: 'SHOT' },
  ];

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-theme-1 p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 rounded-full bg-zinc-800" />
          <h1 className="font-bold text-lg tracking-wider">{tableName}</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-theme-2 p-4 pb-24">
        {activeTab === 'HOME' && (
          <div className="h-full flex flex-col justify-center gap-4">
            <div className="grid grid-cols-2 gap-4 flex-1 max-h-[50vh]">
              <button 
                onClick={() => setActiveTab('MENU')}
                className="bg-theme-1 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
              >
                <Menu size={48} className="text-primary" />
                <span className="font-bold text-xl">MENÚ</span>
              </button>
              <button 
                onClick={() => setActiveTab('CHAT')}
                className="bg-theme-1 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
              >
                <MessageSquare size={48} className="text-primary" />
                <span className="font-bold text-xl">CHAT</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1 max-h-[50vh]">
              <button 
                onClick={() => setActiveTab('KARAOKE')}
                className="bg-theme-1 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
              >
                <Mic size={48} className="text-primary" />
                <span className="font-bold text-xl">KARAOKE</span>
              </button>
              <button 
                onClick={() => setActiveTab('CANCIONES')}
                className="bg-theme-1 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
              >
                <Music size={48} className="text-primary" />
                <span className="font-bold text-xl">CANCIONES</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'MENU' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Nuestro Menú</h2>
            {['BOTELLA', 'JARRA', 'SHOT'].map(tipo => (
              <div key={tipo} className="space-y-3">
                <h3 className="text-primary font-bold text-lg border-b border-zinc-800 pb-2">{tipo}S</h3>
                <div className="grid grid-cols-1 gap-3">
                  {menu.filter(m => m.tipo === tipo).map(item => (
                    <div key={item.id} className="bg-theme-1 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{item.nombre}</h4>
                        <p className="text-emerald-400 font-mono text-sm mt-1">${item.precio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {(activeTab === 'KARAOKE' || activeTab === 'CANCIONES') && (
          <div className="space-y-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-2">Pedir {activeTab === 'KARAOKE' ? 'Karaoke' : 'Canción'}</h2>
            <p className="text-sm text-zinc-400 mb-4">
              {activeTab === 'KARAOKE' 
                ? 'Aquí busca la canción de tu artista favorito para cantarla. (Se añadirá "karaoke" a tu búsqueda)' 
                : 'Aquí busca la canción de tu artista favorito para escucharla.'}
            </p>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-theme-1 px-4 py-3 rounded-xl border border-zinc-800">
                <Search size={20} className="text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Artista o canción..." 
                  className="bg-transparent border-none text-white focus:outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="bg-primary hover:bg-primary/80 text-white px-6 rounded-xl font-bold transition-colors">
                Buscar
              </button>
            </div>

            {/* Mock Results */}
            {searchQuery && (
              <div className="flex-1 overflow-y-auto space-y-3">
                {[1, 2, 3].map(i => {
                  const displayQuery = activeTab === 'KARAOKE' ? `${searchQuery} Karaoke` : searchQuery;
                  return (
                    <div key={i} className="bg-theme-1 p-3 rounded-xl border border-zinc-800 flex gap-4 items-center" onClick={() => requestSong(`${displayQuery} - Resultado ${i}`, activeTab === 'KARAOKE' ? 'KARAOKE' : 'CANCION')}>
                      <div className="w-24 h-16 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 text-xs">
                        Miniatura
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm line-clamp-2">{displayQuery} - Resultado de búsqueda {i}</h4>
                        <p className="text-xs text-zinc-500 mt-1">Canal de YouTube</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'CHAT' && (
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4 shrink-0">Chat con DJ/Caja</h2>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-theme-1 p-4 rounded-xl border border-zinc-800">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.from === 'MESA' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.from === 'MESA' ? 'bg-primary text-white rounded-tr-sm' : 'bg-zinc-800 text-white rounded-tl-sm'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 shrink-0">
              <input 
                type="text" 
                placeholder="Escribe un mensaje..." 
                className="flex-1 bg-theme-1 border border-zinc-800 rounded-full px-4 py-3 text-white focus:outline-none focus:border-primary"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button 
                onClick={sendMessage}
                className="bg-primary hover:bg-primary/80 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-theme-1 border-t border-zinc-800 flex justify-around p-2 pb-safe">
        <button onClick={() => setActiveTab('MENU')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'MENU' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Menu size={24} />
          <span className="text-[10px] font-bold mt-1">MENÚ</span>
        </button>
        <button onClick={() => setActiveTab('KARAOKE')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'KARAOKE' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Mic size={24} />
          <span className="text-[10px] font-bold mt-1">KARAOKE</span>
        </button>
        <button onClick={() => setActiveTab('CANCIONES')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'CANCIONES' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Music size={24} />
          <span className="text-[10px] font-bold mt-1">CANCIONES</span>
        </button>
        <button onClick={() => setActiveTab('CHAT')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'CHAT' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <MessageSquare size={24} />
          <span className="text-[10px] font-bold mt-1">CHAT</span>
        </button>
      </nav>
    </div>
  );
}
