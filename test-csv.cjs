const text = `id,nombre,precio,tipo
1,Vodka,100,BOTELLA
2,Ron,80,BOTELLA`;

const lines = text.split('\n').map(l => l.trim()).filter(l => l);
const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
const isProducts = headers.includes('precio') || headers.includes('tipo');

if (isProducts) {
  const products = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i]; });
    return {
      id: obj.id ? parseInt(obj.id) : undefined,
      nombre: obj.nombre || obj.name,
      precio: parseFloat(obj.precio || obj.price || 0),
      tipo: obj.tipo || obj.type || 'OTROS',
      imagen_path: obj.imagen_path || null,
      componentes: []
    };
  });
  console.log(products);
}
