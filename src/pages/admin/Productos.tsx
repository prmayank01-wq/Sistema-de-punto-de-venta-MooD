import React, { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  Image as ImageIcon,
  Save,
  X,
} from "lucide-react";
import { ConfirmModal, AlertModal } from "../../components/Modals";

export default function Productos() {
  const [productos, setProductos] = useState<any[]>([]);
  const [insumos, setInsumos] = useState<any[]>([]);

  const [newProducto, setNewProducto] = useState({
    nombre: "",
    precio: "",
    tipo: "BOTELLA",
    imagen_path: "",
  });
  const [newComponentes, setNewComponentes] = useState<
    { insumo_id: number; cantidad: number }[]
  >([]);
  const [currentComponente, setCurrentComponente] = useState({
    insumo_id: "",
    cantidad: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("TODOS");

  // Modals state
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: number | null;
  }>({ isOpen: false, id: null });
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "", message: "" });

  useEffect(() => {
    fetchProducts();
    fetchInventory();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProductos(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (Array.isArray(data)) {
        setInsumos(data);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProducto.nombre || !newProducto.precio) {
      setAlert({
        isOpen: true,
        title: "Error",
        message: "Nombre y precio son requeridos",
      });
      return;
    }

    const payload = {
      nombre: newProducto.nombre,
      precio: Number(newProducto.precio) || 0,
      tipo: newProducto.tipo,
      imagen_path: newProducto.imagen_path,
      costo: Number(newProducto.precio) || 0, // Costo is same as precio as requested
      componentes: newComponentes,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setProductos(
            productos.map((p) =>
              p.id === editingId ? { ...p, ...payload } : p,
            ),
          );
          cancelEdit();
          setAlert({
            isOpen: true,
            title: "Éxito",
            message: "Producto actualizado exitosamente",
          });
        } else {
          setAlert({
            isOpen: true,
            title: "Error",
            message: "Error al actualizar el producto",
          });
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setProductos([...productos, created]);
          cancelEdit();
          setAlert({
            isOpen: true,
            title: "Éxito",
            message: "Producto creado exitosamente",
          });
        } else {
          setAlert({
            isOpen: true,
            title: "Error",
            message: "Error al crear el producto",
          });
        }
      }
    } catch (err) {
      console.error("Error saving product:", err);
      setAlert({
        isOpen: true,
        title: "Error",
        message: "Error de conexión al guardar el producto",
      });
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
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProductos(productos.filter((p) => p.id !== id));
      } else {
        const data = await res.json();
        setAlert({
          isOpen: true,
          title: "Error",
          message: data.error || "Error al eliminar el producto",
        });
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setAlert({
        isOpen: true,
        title: "Error",
        message: "Error de conexión al eliminar el producto",
      });
    }
  };

  const startEdit = (producto: any) => {
    setEditingId(producto.id);
    setNewProducto({
      nombre: producto.nombre,
      precio: producto.precio.toString(),
      tipo: producto.tipo,
      imagen_path: producto.imagen_path || "",
    });
    setNewComponentes(producto.componentes || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewProducto({
      nombre: "",
      precio: "",
      tipo: "BOTELLA",
      imagen_path: "",
    });
    setNewComponentes([]);
    setCurrentComponente({ insumo_id: "", cantidad: "" });
  };

  const filteredProductos = productos.filter((p) => {
    const matchesSearch = p.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "TODOS" || p.tipo === filterType.replace(/S$/, ""); // Basic plural to singular mapping
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
      </div>

      <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800">
        <h2 className="text-lg font-bold mb-4">
          {editingId ? "Editar Producto" : "Nuevo Producto"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="space-y-4 col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newProducto.nombre}
                  onChange={(e) =>
                    setNewProducto({ ...newProducto, nombre: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Precio (Bs.)
                </label>
                <input
                  type="number"
                  value={newProducto.precio}
                  onChange={(e) =>
                    setNewProducto({ ...newProducto, precio: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Tipo
                </label>
                <select
                  value={newProducto.tipo}
                  onChange={(e) =>
                    setNewProducto({ ...newProducto, tipo: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                >
                  <option value="BOTELLA">BOTELLA</option>
                  <option value="JARRA">JARRA</option>
                  <option value="SHOT">SHOT</option>
                  <option value="PACK">PACK</option>
                  <option value="PROMOCION">PROMOCION</option>
                  <option value="VASO">VASO</option>
                  <option value="OTROS">OTROS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Imagen
                </label>
                <div className="flex items-center gap-2">
                  <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm w-full justify-center border border-zinc-700 cursor-pointer">
                    <ImageIcon size={16} />
                    Seleccionar Archivo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewProducto({
                              ...newProducto,
                              imagen_path: reader.result as string,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-300 mb-3">
                Receta (Componentes)
              </h3>

              {newComponentes.length > 0 && (
                <div className="mb-3 space-y-2">
                  {newComponentes.map((comp, idx) => {
                    const insumo = insumos.find((i) => i.id === comp.insumo_id);
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-zinc-800 px-3 py-2 rounded-lg text-sm border border-zinc-700"
                      >
                        <span className="text-white">{insumo?.nombre}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400 font-mono">
                            {newProducto.tipo === "BOTELLA" &&
                            insumo?.modo === "GRAMOS"
                              ? `${comp.cantidad / (insumo.contenido || 1)} u`
                              : `${comp.cantidad} ${insumo?.modo === "GRAMOS" ? "g" : "u"}`}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewComponentes(
                                newComponentes.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 items-end mb-3">
                <div className="flex-1">
                  <select
                    value={currentComponente.insumo_id}
                    onChange={(e) =>
                      setCurrentComponente({
                        ...currentComponente,
                        insumo_id: e.target.value,
                        cantidad: newProducto.tipo === "BOTELLA" && !currentComponente.cantidad ? "1" : currentComponente.cantidad
                      })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                  >
                    <option value="">Seleccionar Insumo...</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    placeholder={`Cant. (${newProducto.tipo === "BOTELLA" ? "u" : insumos.find((i) => i.id === Number(currentComponente.insumo_id))?.modo === "GRAMOS" ? "g" : "u"})`}
                    value={currentComponente.cantidad}
                    onChange={(e) =>
                      setCurrentComponente({
                        ...currentComponente,
                        cantidad: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      currentComponente.insumo_id &&
                      currentComponente.cantidad
                    ) {
                      const insumo = insumos.find(
                        (i) => i.id === Number(currentComponente.insumo_id),
                      );
                      let cantidadFinal = Number(currentComponente.cantidad);

                      // Si el producto es BOTELLA y el insumo es GRAMOS, el usuario ingresó unidades (botellas),
                      // así que multiplicamos por el contenido neto para guardar los gramos totales.
                      if (
                        newProducto.tipo === "BOTELLA" &&
                        insumo?.modo === "GRAMOS"
                      ) {
                        cantidadFinal = cantidadFinal * (insumo.contenido || 0);
                      }

                      setNewComponentes([
                        ...newComponentes,
                        {
                          insumo_id: Number(currentComponente.insumo_id),
                          cantidad: cantidadFinal,
                        },
                      ]);
                      setCurrentComponente({ insumo_id: "", cantidad: "" });
                    }
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg transition-colors border border-zinc-700"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/80 text-white py-3 rounded-lg font-bold transition-colors"
              >
                {editingId ? "GUARDAR CAMBIOS" : "GUARDAR NUEVO"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg font-bold transition-colors border border-zinc-700"
                >
                  CANCELAR
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-center items-start">
            <div className="bg-theme-2 rounded-lg border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 w-[100px] h-[100px] overflow-hidden relative">
              {newProducto.imagen_path ? (
                <>
                  <img
                    src={newProducto.imagen_path}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNewProducto({ ...newProducto, imagen_path: "" })
                    }
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <>
                  <ImageIcon size={24} className="mb-1 opacity-50" />
                  <span className="text-[10px]">Vista previa</span>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="bg-theme-1 p-6 rounded-xl border border-zinc-800">
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
          <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700 w-full md:max-w-xs">
            <Search size={18} className="text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none w-full text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "TODOS",
              "BOTELLAS",
              "JARRAS",
              "SHOTS",
              "PACKS",
              "PROMOS",
              "VASOS",
              "OTROS",
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${filterType === f ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-sm uppercase tracking-wider">
                <th className="pb-3 font-medium">Nombre</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Precio</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-800/50">
              {filteredProductos.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="py-4 font-medium">{p.nombre}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-zinc-800 text-zinc-300">
                      {p.tipo}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-emerald-400 font-mono">
                    {p.precio.toFixed(2)} Bs.
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-zinc-400 hover:text-white transition-colors p-2 bg-zinc-800 rounded-md"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(p.id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-2 bg-red-950 rounded-md"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
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
