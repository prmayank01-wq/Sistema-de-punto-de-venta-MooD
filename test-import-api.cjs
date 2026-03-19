async function test() {
  const data = {
    inventory: [
      { id: 1, nombre: 'Test', contenido: 1000, peso_envase: 100, modo: 'GRAMOS', stock: 10 }
    ],
    products: [
      { id: 1, nombre: 'Test Prod', precio: 100, tipo: 'BOTELLA', imagen_path: null, componentes: [{ insumo_id: 1, cantidad: 1 }] }
    ]
  };
  
  const res = await fetch('http://localhost:3000/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  console.log(res.status);
  console.log(await res.text());
}
test();
