import { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reportes, setReportes] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let queryParams = '';
      if (fechaInicio && fechaFin) {
        queryParams = `?start=${fechaInicio}&end=${fechaFin}`;
      } else if (fechaInicio) {
        queryParams = `?start=${fechaInicio}`;
      } else if (fechaFin) {
        queryParams = `?end=${fechaFin}`;
      }

      const [reportsRes, salesRes, topRes] = await Promise.all([
        fetch('/api/reports'),
        fetch(`/api/reports/sales${queryParams}`),
        fetch(`/api/reports/top-products${queryParams}`)
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReportes(data);
      }
      
      if (salesRes.ok) {
        const data = await salesRes.json();
        setVentas(data);
      }

      if (topRes.ok) {
        const data = await topRes.json();
        setTopProducts(data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleFiltrar = () => {
    fetchData();
  };

  const handleCrearPDF = (id?: number) => {
    const doc = new jsPDF();
    
    if (id) {
      // Specific report
      const reporte = reportes.find(r => r.id === id);
      if (!reporte) return;
      
      doc.setFontSize(20);
      doc.text(`Reporte de Turno #${reporte.id}`, 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Fecha: ${reporte.fecha}`, 14, 32);
      doc.text(`Cajero: ${reporte.cajero}`, 14, 40);
      
      autoTable(doc, {
        startY: 50,
        head: [['Método', 'Monto']],
        body: [
          ['QR', `$${reporte.qr.toFixed(2)}`],
          ['Efectivo', `$${reporte.efectivo.toFixed(2)}`],
          ['Total', `$${reporte.total.toFixed(2)}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] } // Red-600
      });
      
      doc.save(`Reporte_Turno_${reporte.id}.pdf`);
    } else {
      // General report
      doc.setFontSize(20);
      doc.text('Reporte General de Ventas', 14, 22);
      
      if (fechaInicio || fechaFin) {
        doc.setFontSize(12);
        doc.text(`Filtro: ${fechaInicio || 'Inicio'} al ${fechaFin || 'Fin'}`, 14, 32);
      }
      
      const tableData = ventas.map(v => [
        v.hora_venta,
        v.producto,
        v.cajero,
        v.metodo_pago,
        `$${v.total.toFixed(2)}`
      ]);
      
      const totalGeneral = ventas.reduce((sum, v) => sum + v.total, 0);
      
      tableData.push([
        'TOTAL',
        '-',
        '-',
        '-',
        `$${totalGeneral.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: fechaInicio || fechaFin ? 40 : 32,
        head: [['Hora de Venta', 'Producto', 'Cajero', 'Efectivo o QR', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        footStyles: { fillColor: [40, 40, 40] }
      });
      
      doc.save('Reporte_General.pdf');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <button 
          onClick={() => handleCrearPDF()}
          className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
        >
          <Download size={16} />
          CREAR PDF GENERAL
        </button>
      </div>

      <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800">
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Fecha Inicio</label>
            <input type="date" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Fecha Fin</label>
            <input type="date" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleFiltrar}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-sm uppercase tracking-wider">
                <th className="pb-3 font-medium">Fecha/Hora</th>
                <th className="pb-3 font-medium">Cajero/Turno</th>
                <th className="pb-3 font-medium">QR</th>
                <th className="pb-3 font-medium">Efectivo</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-800/50">
              {reportes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">No hay reportes para las fechas seleccionadas</td>
                </tr>
              ) : (
                reportes.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="py-4">{r.fecha}</td>
                    <td className="py-4">{r.cajero}</td>
                    <td className="py-4 text-emerald-400">${r.qr.toFixed(2)}</td>
                    <td className="py-4 text-emerald-400">${r.efectivo.toFixed(2)}</td>
                    <td className="py-4 font-bold">${r.total.toFixed(2)}</td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => handleCrearPDF(r.id)}
                        className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-800 rounded-md"
                        title="Descargar PDF"
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-lg font-bold mb-4 text-emerald-400">MÁS VENDIDOS</h2>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((p, i) => {
              const maxVendido = topProducts[0]?.total_vendido || 1;
              const width = `${(p.total_vendido / maxVendido) * 100}%`;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{p.nombre}</span>
                    <span className="font-mono">{p.total_vendido}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width }}></div>
                  </div>
                </div>
              );
            })}
            {topProducts.length === 0 && <p className="text-zinc-500 text-sm">No hay datos de ventas.</p>}
          </div>
        </div>

        <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-lg font-bold mb-4 text-red-400">MENOS VENDIDOS</h2>
          <div className="space-y-3">
            {[...topProducts].reverse().slice(0, 5).map((p, i) => {
              const maxVendido = topProducts[0]?.total_vendido || 1;
              const width = `${(p.total_vendido / maxVendido) * 100}%`;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{p.nombre}</span>
                    <span className="font-mono">{p.total_vendido}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width }}></div>
                  </div>
                </div>
              );
            })}
            {topProducts.length === 0 && <p className="text-zinc-500 text-sm">No hay datos de ventas.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
