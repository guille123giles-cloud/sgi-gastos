"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  // Estado base del formulario
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    ingreso: "",
    ingresoConsorcio: "",
    ingresoOtro: "",
    ingresoConsorcioOtro: "",
    egreso: "",
    egresoOtro: "",
    tipoGasto: "",
    tipoGastoOtro: "",
    imputacionGasto: "",
    imputacionGastoOtro: "",
    categoriaGasto: "",
    descripcion: "",
    moneda: "",
    monto: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // --- NUEVO: Bloqueo estricto de scroll en móviles al abrir modal ---
  useEffect(() => {
    if (showModal) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [showModal]);
  // -------------------------------------------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "ingreso" && value !== "Consorcio") {
        updated.ingresoConsorcio = "";
        updated.ingresoConsorcioOtro = "";
      }
      if (name === "tipoGasto") {
        updated.imputacionGasto = "";
        updated.imputacionGastoOtro = "";
        updated.categoriaGasto = "";
      }
      if (name === "imputacionGasto" && !["Jose luis", "Tainara", "Ednaldo"].includes(value)) {
        updated.categoriaGasto = "";
      }
      return updated;
    });
  };

  const formatearFechaEs = (fechaStr: string) => {
    if (!fechaStr) return "";
    const partes = fechaStr.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  };

  const getFinalValues = () => {
    let finalIngreso = formData.ingreso;
    if (formData.ingreso === "Consorcio") {
      const subConsorcio = formData.ingresoConsorcio === "Otros" ? formData.ingresoConsorcioOtro : formData.ingresoConsorcio;
      finalIngreso = `Consorcio (${subConsorcio})`;
    } else if (formData.ingreso === "Otros") {
      finalIngreso = formData.ingresoOtro;
    }

    const finalEgreso = formData.egreso === "Otro" ? formData.egresoOtro : formData.egreso;
    const finalTipoGasto = formData.tipoGasto === "Otros" ? formData.tipoGastoOtro : formData.tipoGasto;
    const finalImputacion = formData.imputacionGasto === "Otro" ? formData.imputacionGastoOtro : formData.imputacionGasto;

    return {
      fecha: formData.fecha,
      ingreso: finalIngreso,
      egreso: finalEgreso,
      tipoGasto: finalTipoGasto,
      imputacionGasto: ["Obra", "Persona", "Viaje"].includes(formData.tipoGasto) ? finalImputacion : "N/A",
      categoriaGasto: formData.categoriaGasto || "N/A",
      descripcion: formData.descripcion || "Sin descripción",
      moneda: formData.moneda,
      monto: parseFloat(formData.monto),
    };
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMonto = parseFloat(formData.monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      alert("Por favor, ingrese un monto numérico válido.");
      return;
    }
    setShowModal(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setStatusMessage("");
    const finalData = getFinalValues();

    try {
      const { error } = await supabase.from("gastos").insert([
        {
          fecha: finalData.fecha,
          ingreso: finalData.ingreso,
          egreso: finalData.egreso,
          tipo_gasto: finalData.tipoGasto,
          imputacion_gasto: finalData.imputacionGasto,
          categoria_gasto: finalData.categoriaGasto,
          descripcion: finalData.descripcion,
          moneda: finalData.moneda,
          monto: finalData.monto,
        },
      ]);

      if (error) throw error;

      setFormData((prev) => ({
        ...prev,
        descripcion: "",
        monto: "",
      }));
      setStatusMessage("Movimiento registrado con éxito.");
      setShowModal(false);
    } catch (error: any) {
      console.error(error);
      setStatusMessage("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const finalSummary = getFinalValues();
  const inputBaseClass = "w-full p-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all text-sm";
  const inputSubClass = "w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all text-sm";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center p-4 sm:p-6 font-sans overflow-x-hidden w-full max-w-[100vw]">
      <style>{`
        .custom-date-input::before { color: #111827 !important; }
        .custom-date-input:disabled::before { color: #9ca3af !important; }
      `}</style>
      
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 shadow-xl mt-2 relative">

        <div className="flex justify-between items-start mb-1 pt-1">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-green-800 tracking-wide">
              CONSTRUCOES DO SUL
            </h1>
            <h2 className="text-base font-semibold text-gray-800 -mt-1">
              Gastos Corporativos
            </h2>
          </div>
          
          <button 
            onClick={handleSignOut} 
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors shadow-inner"
            title="Cerrar Sesión"
          >
            Salir
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mb-6 uppercase font-semibold text-left">
          Carga de Movimientos
        </p>

        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg mb-6 border border-gray-200">
          <button className="py-2 text-sm font-bold rounded-md bg-white text-green-800 shadow-sm border border-gray-200 transition-all">
            Cargar
          </button>
          <Link href="/visualizar" className="py-2 text-sm font-semibold rounded-md text-gray-500 hover:text-green-700 text-center transition-all">
            Visualizar
          </Link>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center font-medium ${statusMessage.includes("éxito") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {statusMessage}
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha <span className="text-red-500">*</span></label>
            <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required data-date={formatearFechaEs(formData.fecha)} className={`${inputBaseClass} custom-date-input`} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Ingreso <span className="text-red-500">*</span></label>
            <select name="ingreso" value={formData.ingreso} onChange={handleChange} required className={inputBaseClass}>
              <option value="">Seleccione...</option>
              <option value="Consorcio">Consorcio</option>
              <option value="Aldo">Aldo</option>
              <option value="Diego">Diego</option>
              <option value="Otros">Otros</option>
            </select>

            {formData.ingreso === "Consorcio" && (
              <div className="mt-2 pl-3 border-l-2 border-green-500 space-y-2">
                <select name="ingresoConsorcio" value={formData.ingresoConsorcio} onChange={handleChange} required className={inputSubClass}>
                  <option value="">Tipo de Consorcio...</option>
                  <option value="Guaruya">Guaruya</option>
                  <option value="Santos">Santos</option>
                  <option value="Otros">Otros</option>
                </select>
                {formData.ingresoConsorcio === "Otros" && (
                  <input type="text" name="ingresoConsorcioOtro" value={formData.ingresoConsorcioOtro} onChange={handleChange} placeholder="Especifique consorcio..." required className={inputSubClass} />
                )}
              </div>
            )}

            {formData.ingreso === "Otros" && (
              <input type="text" name="ingresoOtro" value={formData.ingresoOtro} onChange={handleChange} placeholder="Especifique ingreso..." required className={`mt-2 ${inputBaseClass}`} />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Egreso <span className="text-red-500">*</span></label>
            <select name="egreso" value={formData.egreso} onChange={handleChange} required className={inputBaseClass}>
              <option value="">Seleccione...</option>
              <option value="Aldo">Aldo</option>
              <option value="Diego">Diego</option>
              <option value="Banco">Banco</option>
              <option value="Jose Luis">Jose Luis</option>
              <option value="Otro">Otro</option>
            </select>
            {formData.egreso === "Otro" && (
              <input type="text" name="egresoOtro" value={formData.egresoOtro} onChange={handleChange} placeholder="Especifique egreso..." required className={`mt-2 ${inputBaseClass}`} />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Gasto <span className="text-red-500">*</span></label>
            <select name="tipoGasto" value={formData.tipoGasto} onChange={handleChange} required className={inputBaseClass}>
              <option value="">Seleccione...</option>
              <option value="Obra">Obra</option>
              <option value="Persona">Persona</option>
              <option value="Viaje">Viaje</option>
              <option value="Contador">Contador</option>
              <option value="Administración">Administración</option>
              <option value="Otros">Otros</option>
            </select>
            {formData.tipoGasto === "Otros" && (
              <input type="text" name="tipoGastoOtro" value={formData.tipoGastoOtro} onChange={handleChange} placeholder="Especifique tipo de gasto..." required className={`mt-2 ${inputBaseClass}`} />
            )}
          </div>

          {formData.tipoGasto === "Obra" && (
            <div>
              <label className="block text-xs font-bold text-orange-600 mb-1">Imputación de Gasto (Obra) <span className="text-red-500">*</span></label>
              <select name="imputacionGasto" value={formData.imputacionGasto} onChange={handleChange} required className={`border-orange-300 focus:border-orange-500 focus:ring-orange-500 ${inputBaseClass}`}>
                <option value="">Seleccione...</option>
                <option value="Guaruya">Guaruya</option>
                <option value="Santos">Santos</option>
                <option value="Otro">Otro</option>
              </select>
              {formData.imputacionGasto === "Otro" && (
                <input type="text" name="imputacionGastoOtro" value={formData.imputacionGastoOtro} onChange={handleChange} placeholder="Especifique obra..." required className={`mt-2 ${inputBaseClass}`} />
              )}
            </div>
          )}

          {formData.tipoGasto === "Persona" && (
            <div>
              <label className="block text-xs font-bold text-blue-600 mb-1">Imputación de Gasto (Persona) <span className="text-red-500">*</span></label>
              <select name="imputacionGasto" value={formData.imputacionGasto} onChange={handleChange} required className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 ${inputBaseClass}`}>
                <option value="">Seleccione...</option>
                <option value="Aldo">Aldo</option>
                <option value="Diego">Diego</option>
                <option value="Lucas">Lucas</option>
                <option value="Jose luis">Jose luis</option>
                <option value="Tainara">Tainara</option>
                <option value="Ednaldo">Ednaldo</option>
                <option value="Otro">Otro</option>
              </select>
              {formData.imputacionGasto === "Otro" && (
                <input type="text" name="imputacionGastoOtro" value={formData.imputacionGastoOtro} onChange={handleChange} placeholder="Especifique persona..." required className={`mt-2 ${inputBaseClass}`} />
              )}
            </div>
          )}

          {formData.tipoGasto === "Viaje" && (
            <div>
              <label className="block text-xs font-bold text-teal-600 mb-1">Imputación de Gasto (Viaje) <span className="text-red-500">*</span></label>
              <select name="imputacionGasto" value={formData.imputacionGasto} onChange={handleChange} required className={`border-teal-300 focus:border-teal-500 focus:ring-teal-500 ${inputBaseClass}`}>
                <option value="">Seleccione...</option>
                <option value="hotel">hotel</option>
                <option value="vuelo">vuelo</option>
                <option value="cena">cena</option>
                <option value="Otro">Otro</option>
              </select>
              {formData.imputacionGasto === "Otro" && (
                <input type="text" name="imputacionGastoOtro" value={formData.imputacionGastoOtro} onChange={handleChange} placeholder="Especifique detalle de viaje..." required className={`mt-2 ${inputBaseClass}`} />
              )}
            </div>
          )}

          {formData.tipoGasto === "Persona" && ["Jose luis", "Tainara", "Ednaldo"].includes(formData.imputacionGasto) && (
            <div>
              <label className="block text-xs font-bold text-purple-600 mb-1">Categoría de Gasto <span className="text-red-500">*</span></label>
              <select name="categoriaGasto" value={formData.categoriaGasto} onChange={handleChange} required className={`border-purple-300 focus:border-purple-500 focus:ring-purple-500 ${inputBaseClass}`}>
                <option value="">Seleccione...</option>
                <option value="obra">Obra</option>
                <option value="caja chica">Caja Chica</option>
                <option value="sueldo">Sueldo</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Descripción (Opcional)</label>
            <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Detalle adicional..." className={inputBaseClass} />
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Moneda <span className="text-red-500">*</span></label>
              <select name="moneda" value={formData.moneda} onChange={handleChange} required className={inputBaseClass}>
                <option value="">—</option>
                <option value="USD">USD</option>
                <option value="Pesos">Pesos</option>
                <option value="Reales">Reales</option>
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">Monto <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" name="monto" value={formData.monto} onChange={handleChange} placeholder="0.00" required className={`font-bold text-green-700 ${inputBaseClass}`} />
            </div>
          </div>

          <button type="submit" className="w-full bg-green-700 text-white p-3 rounded-lg font-bold border border-green-800 hover:bg-green-800 active:scale-[0.99] transition-all mt-4 shadow-sm">
            Ingresar Movimiento
          </button>
        </form>
      </div>

      {/* MODAL DE CONFIRMACIÓN - Añadido overscroll-none */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto overscroll-none">
          <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 p-6 text-left shadow-2xl">
            <h2 className="text-lg font-bold text-green-800 mb-1">Confirmar Registro</h2>
            <p className="text-xs text-gray-500 mb-4">Verifique la información antes de guardar:</p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-800 mb-5 border border-gray-200">
              <p><strong className="text-gray-500">Fecha:</strong> {formatearFechaEs(finalSummary.fecha)}</p>
              <p><strong className="text-gray-500">Ingreso:</strong> {finalSummary.ingreso}</p>
              <p><strong className="text-gray-500">Egreso:</strong> {finalSummary.egreso}</p>
              <p><strong className="text-gray-500">Tipo:</strong> {finalSummary.tipoGasto}</p>
              <p><strong className="text-gray-500">Imputación:</strong> {finalSummary.imputacionGasto}</p>
              <p><strong className="text-gray-500">Categoría:</strong> {finalSummary.categoriaGasto}</p>
              <p><strong className="text-gray-500">Detalle:</strong> {finalSummary.descripcion}</p>
              <div className="pt-3 mt-1 border-t border-gray-200 flex justify-between text-base text-gray-900">
                <strong>Total a cargar:</strong>
                <span className="font-bold text-green-700">{finalSummary.moneda} {finalSummary.monto.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3 text-sm">
              <button onClick={() => setShowModal(false)} disabled={loading} className="flex-1 bg-white text-gray-600 font-semibold p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                Modificar
              </button>
              <button onClick={handleConfirmSubmit} disabled={loading} className="flex-1 bg-green-700 text-white font-bold p-2.5 rounded-lg hover:bg-green-800 transition-colors shadow-sm">
                {loading ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}