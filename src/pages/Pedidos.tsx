import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Menu, Mic, Music, MessageSquare, Send, Search } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';

export default function Pedidos() {
  const [searchParams] = useSearchParams();
  const tableToken = searchParams.get('t');
  const tableId = searchParams.get('table');
  const [tableName, setTableName] = useState('Mesa Desconocida');
  const [tableColor, setTableColor] = useState('#ffffff');
  const [activeTab, setActiveTab] = useState('HOME');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<{from: string, text: string}[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const logoUrl = useStore(state => state.logoUrl);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!logoUrl) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const logoSetting = data.find((s: any) => s.key === 'logoUrl');
            if (logoSetting && logoSetting.value) {
              useStore.getState().setLogoUrl(logoSetting.value);
            }
          }
        })
        .catch(err => console.error('Error loading settings:', err));
    }
  }, [logoUrl]);

  useEffect(() => {
    if (tableToken) {
      try {
        setTableName(atob(tableToken));
      } catch (e) {
        console.error('Invalid token');
      }
    }

    // Fetch menu
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMenu(data);
          const cats = Array.from(new Set(data.map((p: any) => p.tipo))).filter(Boolean);
          setCategories(cats as string[]);
        }
      })
      .catch(err => console.error('Error fetching products:', err));

    if (tableId) {
      fetch('/api/chats/active')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const tableChats = data.filter((c: any) => c.table_id == tableId);
            setMessages(tableChats.map((c: any) => ({ from: c.from_role, text: c.message })));
          }
        })
        .catch(err => console.error('Error fetching chats:', err));

      fetch('/api/tables')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const table = data.find((t: any) => t.id == tableId);
            if (table) {
              setTableColor(table.color);
            }
          }
        })
        .catch(err => console.error('Error fetching tables:', err));
    }

    // Connect to Socket.IO
    const newSocket = io();
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const term = activeTab === 'KARAOKE' ? `${searchQuery} karaoke` : searchQuery;
      const res = await fetch(`/api/search-youtube?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const requestSong = (title: string, artist: string, tipo: 'CANCION' | 'KARAOKE', thumbnail: string, url: string) => {
    if (!socket) return;
    const fullTitle = `${title} - ${artist}`;
    
    const payload = JSON.stringify({
      type: 'song_request',
      title: fullTitle,
      tipo,
      thumbnail,
      url
    });

    socket.emit('chat_message', {
      tableId: tableId,
      message: payload,
      fromRole: 'MESA'
    });
    
    setActiveTab('CHAT');
  };

  const requestProduct = (product: any) => {
    if (!socket) return;
    
    const payload = JSON.stringify({
      type: 'product_request',
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen_path: product.imagen_path
    });

    socket.emit('chat_message', {
      tableId: tableId,
      message: payload,
      fromRole: 'MESA'
    });
    
    setActiveTab('CHAT');
  };

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 flex justify-center items-center shrink-0">
        <div className="flex flex-row items-center gap-4">
          <img src={logoUrl || "/assets/logo.png"} alt="Logo" className="w-auto h-20 max-w-[200px] object-contain" />
          <h1 
            className="font-bold text-6xl tracking-wider m-0 drop-shadow-md"
            style={{ textDecoration: 'underline', textDecorationColor: tableColor, textDecorationThickness: '6px', textUnderlineOffset: '8px' }}
          >
            {tableName}
          </h1>
        </div>
      </header>

      {/* Top Navigation */}
      <nav className="bg-zinc-900 border-b border-zinc-800 flex overflow-x-auto p-2 shrink-0 gap-2">
        <button onClick={() => { setActiveTab('MENU'); setSearchResults([]); setSearchQuery(''); }} className={`flex-1 min-w-fit flex flex-row justify-center items-center gap-2 p-3 rounded-lg transition-colors bg-red-600 text-white ${activeTab === 'MENU' ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}>
          <Menu size={24} />
          <span className="text-[20px] font-bold whitespace-nowrap">MENÚ</span>
        </button>
        <button onClick={() => { setActiveTab('KARAOKE'); setSearchResults([]); setSearchQuery(''); }} className={`flex-1 min-w-fit flex flex-row justify-center items-center gap-2 p-3 rounded-lg transition-colors bg-green-600 text-white ${activeTab === 'KARAOKE' ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}>
          <Mic size={24} />
          <span className="text-[20px] font-bold whitespace-nowrap">KARAOKE</span>
        </button>
        <button onClick={() => { setActiveTab('CANCIONES'); setSearchResults([]); setSearchQuery(''); }} className={`flex-1 min-w-fit flex flex-row justify-center items-center gap-2 p-3 rounded-lg transition-colors bg-blue-600 text-white ${activeTab === 'CANCIONES' ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}>
          <Music size={24} />
          <span className="text-[20px] font-bold whitespace-nowrap">CANCIONES</span>
        </button>
        <button onClick={() => { setActiveTab('CHAT'); setSearchResults([]); setSearchQuery(''); }} className={`flex-1 min-w-fit flex flex-row justify-center items-center gap-2 p-3 rounded-lg transition-colors bg-yellow-500 text-black ${activeTab === 'CHAT' ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}>
          <MessageSquare size={24} />
          <span className="text-[20px] font-bold whitespace-nowrap">CHAT</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden bg-zinc-950 p-4 flex flex-col">
        {activeTab === 'HOME' && (
          <div className="h-full flex flex-col justify-center gap-4 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-h-[50vh]">
              <button 
                onClick={() => setActiveTab('MENU')}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-row items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
                style={{ color: 'white' }}
              >
                <Menu size={48} color="white" />
                <span className="font-bold text-3xl" style={{ color: 'white' }}>MENÚ</span>
              </button>
              <button 
                onClick={() => setActiveTab('CHAT')}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-row items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
                style={{ color: 'white' }}
              >
                <MessageSquare size={48} color="white" />
                <span className="font-bold text-3xl" style={{ color: 'white' }}>CHAT</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-h-[50vh]">
              <button 
                onClick={() => setActiveTab('KARAOKE')}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-row items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
                style={{ color: 'white' }}
              >
                <Mic size={48} color="white" />
                <span className="font-bold text-3xl" style={{ color: 'white' }}>KARAOKE</span>
              </button>
              <button 
                onClick={() => setActiveTab('CANCIONES')}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-row items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
                style={{ color: 'white' }}
              >
                <Music size={48} color="white" />
                <span className="font-bold text-3xl" style={{ color: 'white' }}>CANCIONES</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'MENU' && (
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            <h2 className="text-2xl font-bold mb-4">Nuestro Menú</h2>
            {categories.map(categoria => (
              <div key={categoria} className="space-y-3">
                <h3 className="text-primary font-bold text-lg border-b border-zinc-800 pb-2">{categoria}</h3>
                <div className="flex flex-wrap gap-4 content-start">
                  {menu.filter(m => m.tipo === categoria).map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => requestProduct(item)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-primary hover:scale-110 transition-all group flex flex-col w-[140px] h-[200px]"
                    >
                      <div className="h-24 bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 w-full">
                        {item.imagen_path ? (
                          <img src={item.imagen_path} alt={item.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-zinc-600 text-xs">IMG</span>
                        )}
                      </div>
                      <div className="p-3 flex flex-col justify-between flex-1 w-full">
                        <div className="font-bold text-sm text-center group-hover:text-primary transition-colors leading-tight line-clamp-3">{item.nombre}</div>
                        <div className="text-emerald-400 font-mono text-2xl font-bold text-right mt-2">{Math.round(item.precio)} Bs</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {menu.length === 0 && <p className="text-zinc-500">No hay productos disponibles.</p>}
          </div>
        )}

        {(activeTab === 'KARAOKE' || activeTab === 'CANCIONES') && (
          <div className="space-y-6 h-full flex flex-col overflow-hidden">
            <div className="shrink-0">
              <h2 className="text-2xl font-bold mb-2">Pedir {activeTab === 'KARAOKE' ? 'Karaoke' : 'Canción'}</h2>
              <p className="text-sm text-zinc-400 mb-4">
                {activeTab === 'KARAOKE' 
                  ? 'Aquí busca la canción de tu artista favorito para cantarla. (Se añadirá "karaoke" a tu búsqueda)' 
                  : 'Aquí busca la canción de tu artista favorito para escucharla.'}
              </p>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 bg-zinc-900 px-4 py-3 rounded-xl border border-zinc-800">
                  <Search size={20} className="text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Artista o canción..." 
                    className="bg-transparent border-none text-zinc-100 focus:outline-none w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-zinc-100 px-6 rounded-xl font-bold transition-colors"
                >
                  {isSearching ? '...' : 'Buscar'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
              {searchResults.map((result, i) => (
                <div 
                  key={i} 
                  className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex gap-4 items-center cursor-pointer hover:bg-zinc-800 transition-colors" 
                  onClick={() => requestSong(result.title, result.artist, activeTab === 'KARAOKE' ? 'KARAOKE' : 'CANCION', result.thumbnail, result.url)}
                >
                  <img src={result.thumbnail} alt="Cover" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm line-clamp-2">{result.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{result.artist}</p>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && !isSearching && searchQuery && (
                <p className="text-zinc-500 text-center py-8">No se encontraron resultados.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'CHAT' && (
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-3xl font-bold mb-4 shrink-0">Chatea con la Barra</h2>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800 min-h-0">
              {messages.map((msg, i) => {
                let content = <p className="text-lg">{msg.text}</p>;
                try {
                  if (msg.text.startsWith('{')) {
                    const data = JSON.parse(msg.text);
                    if (data.type === 'song_request') {
                      content = (
                        <div className="flex items-center gap-3">
                          {data.thumbnail && <img src={data.thumbnail} alt="Cover" className="w-16 h-16 rounded object-cover" />}
                          <div>
                            <div className="text-sm font-bold text-white mb-1">
                              {data.tipo === 'KARAOKE' ? '🎤 Pedido de Karaoke' : '🎵 Pedido de Canción'}
                            </div>
                            <div className="text-lg font-bold">{data.title}</div>
                          </div>
                        </div>
                      );
                    } else if (data.type === 'product_request') {
                      content = (
                        <div className="flex items-center gap-4">
                          {data.imagen_path && <img src={data.imagen_path} alt="Product" className="w-24 h-24 rounded-lg object-cover shadow-md" />}
                          <div>
                            <div className="text-base font-bold text-emerald-400 mb-1">🍹 Pedido de Menú</div>
                            <div className="text-2xl font-bold">{data.nombre}</div>
                            <div className="text-xl font-bold text-yellow-400 mt-2">Bs. {data.precio}</div>
                          </div>
                        </div>
                      );
                    }
                  }
                } catch (e) {}

                return (
                  <div key={i} className={`flex flex-col ${msg.from === 'MESA' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.from === 'MESA' ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' : 'bg-primary text-zinc-100 rounded-tl-sm'}`}>
                      {content}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && <p className="text-zinc-500 text-center py-8">No hay mensajes aún.</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <input 
                type="text" 
                placeholder="Escribe un mensaje..." 
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-3 text-zinc-100 focus:outline-none focus:border-primary"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button 
                onClick={sendMessage}
                className="bg-primary hover:bg-primary/80 text-zinc-100 w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
