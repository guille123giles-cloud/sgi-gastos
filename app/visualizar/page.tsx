"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function VisualizarBBDD() {
    const [movimientos, setMovimientos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const PAGE_SIZE = 100

    const [tasas, setTasas] = useState({ USD_en_ARS: 1000, BRL_en_ARS: 200 })
    const [loadingTasas, setLoadingTasas] = useState(true)

    const [isExporting, setIsExporting] = useState(false)

    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [editingRecord, setEditingRecord] = useState<any | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [showFilters, setShowFilters] = useState(false)
    const [filtros, setFiltros] = useState({
        fechaExacta: '', fechaDesde: '', fechaHasta: '',
        ingresoSelect: '', ingreso: '', ingresoConsorcioSelect: '', ingresoConsorcioOtro: '',
        egresoSelect: '', egreso: '',
        tipoSelect: '', tipo_gasto: '',
        imputacionSelect: '', imputacion_gasto: '',
        categoriaSelect: '', categoria_gasto: '',
        moneda: '', montoExacto: '', montoMin: '', montoMax: ''
    })

    // --- NUEVO: Bloqueo estricto de scroll en móviles al abrir cualquier modal ---
    useEffect(() => {
        const cualquierModalAbierto = showFilters || !!editingRecord || showDeleteModal;
        if (cualquierModalAbierto) {
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
    }, [showFilters, editingRecord, showDeleteModal]);
    // -----------------------------------------------------------------------------

    useEffect(() => {
        fetchMovimientos(0)
        fetchCotizaciones()
    }, [])

    const fetchCotizaciones = async () => {
        try {
            setLoadingTasas(true)
            const [resUsd, resBrl] = await Promise.all([
                fetch('https://dolarapi.com/v1/dolares/blue'),
                fetch('https://dolarapi.com/v1/cotizaciones/brl')
            ])

            if (!resUsd.ok || !resBrl.ok) {
                throw new Error('DolarAPI no respondió correctamente')
            }

            const usdData = await resUsd.json()
            const brlData = await resBrl.json()

            setTasas({
                USD_en_ARS: usdData.venta || 1000,
                BRL_en_ARS: brlData.venta || 200
            })
        } catch (err) {
            console.error('Aviso: Usando cotizaciones de respaldo. Error de API:', err)
        } finally {
            setLoadingTasas(false)
        }
    }

    const fetchMovimientos = async (pageIndex = 0) => {
        try {
            if (pageIndex === 0) setLoading(true)
            else setLoadingMore(true)

            const from = pageIndex * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            // Se mantiene el orden descendente original de la BBDD
            const { data, error, count } = await supabase
                .from('gastos')
                .select('*', { count: 'exact' })
                .order('fecha', { ascending: false })
                .range(from, to)

            if (error) throw error

            if (data) {
                if (pageIndex === 0) {
                    setMovimientos(data)
                } else {
                    setMovimientos(prev => [...prev, ...data])
                }

                if (count !== null && (pageIndex + 1) * PAGE_SIZE >= count) {
                    setHasMore(false)
                } else if (data.length < PAGE_SIZE) {
                    setHasMore(false)
                } else {
                    setHasMore(true)
                }
            }
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        fetchMovimientos(nextPage)
    }

    const formatearFecha = (fechaStr: string) => {
        if (!fechaStr) return '';
        const partes = fechaStr.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return fechaStr;
    };

    const getPlaceholderFecha = (fechaStr: string) => {
        if (!fechaStr) return 'dd/mm/aaaa';
        return formatearFecha(fechaStr);
    };

    const triggerDelete = (id: string) => {
        setRecordToDelete(id)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (!recordToDelete) return
        try {
            setIsDeleting(true)
            const { error } = await supabase.from('gastos').delete().eq('id', recordToDelete)
            if (error) throw error
            setMovimientos(movimientos.filter(m => m.id !== recordToDelete))
            setShowDeleteModal(false)
            setRecordToDelete(null)
        } catch (error: any) {
            setError("Error al eliminar: " + error.message)
        } finally {
            setIsDeleting(false)
        }
    }

    const parseMovToForm = (mov: any) => {
        let ingresoSelect = "Otros";
        let ingresoOtro = mov.ingreso;
        let ingresoConsorcioSelect = "";
        let ingresoConsorcioOtro = "";

        if (mov.ingreso === "Aldo" || mov.ingreso === "Diego") {
            ingresoSelect = mov.ingreso;
            ingresoOtro = "";
        } else if (mov.ingreso?.startsWith("Consorcio")) {
            ingresoSelect = "Consorcio";
            const match = mov.ingreso.match(/Consorcio \((.+)\)/);
            if (match) {
                const sub = match[1];
                if (["Guaruya", "Santos"].includes(sub)) {
                    ingresoConsorcioSelect = sub;
                } else {
                    ingresoConsorcioSelect = "Otros";
                    ingresoConsorcioOtro = sub;
                }
            } else {
                ingresoConsorcioSelect = "";
            }
        }

        let egresoSelect = "Otro";
        let egresoOtro = mov.egreso;
        if (["Aldo", "Diego", "Banco", "Jose Luis"].includes(mov.egreso)) {
            egresoSelect = mov.egreso;
            egresoOtro = "";
        }

        let tipoSelect = "Otros";
        let tipoOtro = mov.tipo_gasto;
        if (["Obra", "Persona", "Viaje", "Contador", "Administración"].includes(mov.tipo_gasto)) {
            tipoSelect = mov.tipo_gasto;
            tipoOtro = "";
        }

        let imputacionSelect = "Otro";
        let imputacionOtro = mov.imputacion_gasto;
        if (["Guaruya", "Santos", "Aldo", "Diego", "Lucas", "Jose luis", "Tainara", "Ednaldo", "hotel", "vuelo", "cena"].includes(mov.imputacion_gasto) || !mov.imputacion_gasto || mov.imputacion_gasto === 'N/A') {
            imputacionSelect = (mov.imputacion_gasto === 'N/A' || !mov.imputacion_gasto) ? "" : mov.imputacion_gasto;
            imputacionOtro = "";
        }

        let categoriaSelect = "Otros";
        let categoriaOtro = mov.categoria_gasto;
        if (["obra", "caja chica", "sueldo"].includes(mov.categoria_gasto) || !mov.categoria_gasto || mov.categoria_gasto === 'N/A') {
            categoriaSelect = (mov.categoria_gasto === 'N/A' || !mov.categoria_gasto) ? "" : mov.categoria_gasto;
            categoriaOtro = "";
        }

        return {
            id: mov.id,
            fecha: mov.fecha,
            ingresoSelect, ingresoOtro, ingresoConsorcioSelect, ingresoConsorcioOtro,
            egresoSelect, egresoOtro,
            tipoSelect, tipoOtro,
            imputacionSelect, imputacionOtro,
            categoriaSelect, categoriaOtro,
            descripcion: mov.descripcion || "",
            moneda: mov.moneda,
            monto: mov.monto
        };
    };

    const triggerEdit = (mov: any) => {
        setEditingRecord(parseMovToForm(mov))
    }

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setEditingRecord((prev: any) => {
            const updated = { ...prev, [name]: value };
            
            if (name === "ingresoSelect" && value !== "Consorcio") {
                updated.ingresoConsorcioSelect = "";
                updated.ingresoConsorcioOtro = "";
            }
            if (name === "tipoSelect") {
                updated.imputacionSelect = "";
                updated.imputacionOtro = "";
                updated.categoriaSelect = "";
                updated.categoriaOtro = "";
            }
            if (name === "imputacionSelect" && !["Jose luis", "Tainara", "Ednaldo"].includes(value)) {
                updated.categoriaSelect = "";
                updated.categoriaOtro = "";
            }
            return updated;
        });
    }

    const confirmEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingRecord) return
        try {
            setIsSaving(true)

            let finalIngreso = editingRecord.ingresoSelect;
            if (finalIngreso === "Consorcio") {
                const subConsorcio = editingRecord.ingresoConsorcioSelect === "Otros" ? editingRecord.ingresoConsorcioOtro : editingRecord.ingresoConsorcioSelect;
                finalIngreso = subConsorcio ? `Consorcio (${subConsorcio})` : 'Consorcio';
            } else if (finalIngreso === "Otros") {
                finalIngreso = editingRecord.ingresoOtro;
            }

            const finalEgreso = editingRecord.egresoSelect === "Otro" ? editingRecord.egresoOtro : editingRecord.egresoSelect;
            const finalTipo = editingRecord.tipoSelect === "Otros" ? editingRecord.tipoOtro : editingRecord.tipoSelect;
            
            let finalImputacion = editingRecord.imputacionSelect === "Otro" ? editingRecord.imputacionOtro : editingRecord.imputacionSelect;
            finalImputacion = ["Obra", "Persona", "Viaje"].includes(finalTipo) ? finalImputacion : "N/A";
            
            let finalCategoria = editingRecord.categoriaSelect === "Otros" ? editingRecord.categoriaOtro : editingRecord.categoriaSelect;
            finalCategoria = finalCategoria || "N/A";

            const updatedMov = {
                fecha: editingRecord.fecha,
                ingreso: finalIngreso,
                egreso: finalEgreso,
                tipo_gasto: finalTipo,
                imputacion_gasto: finalImputacion,
                categoria_gasto: finalCategoria,
                descripcion: editingRecord.descripcion,
                moneda: editingRecord.moneda,
                monto: parseFloat(editingRecord.monto)
            }

            const { error } = await supabase
                .from('gastos')
                .update(updatedMov)
                .eq('id', editingRecord.id)

            if (error) throw error
            setMovimientos(movimientos.map(m => m.id === editingRecord.id ? { ...m, ...updatedMov } : m))
            setEditingRecord(null)
        } catch (error: any) {
            setError("Error al guardar edición: " + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFiltros(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'ingresoSelect' && value !== 'Consorcio') {
                updated.ingresoConsorcioSelect = '';
                updated.ingresoConsorcioOtro = '';
            }
            return updated;
        })
    }

    const limpiarFiltros = () => {
        setFiltros({
            fechaExacta: '', fechaDesde: '', fechaHasta: '',
            ingresoSelect: '', ingreso: '', ingresoConsorcioSelect: '', ingresoConsorcioOtro: '',
            egresoSelect: '', egreso: '',
            tipoSelect: '', tipo_gasto: '',
            imputacionSelect: '', imputacion_gasto: '',
            categoriaSelect: '', categoria_gasto: '',
            moneda: '', montoExacto: '', montoMin: '', montoMax: ''
        })
    }

    // --- MODIFICADO: Se quitó el .reverse() para respetar el orden descendente de la BBDD (más recientes arriba) ---
    const movimientosFiltrados = [...movimientos].filter(mov => {
        let cumple = true;

        if (filtros.fechaExacta && mov.fecha !== filtros.fechaExacta) cumple = false;
        if (filtros.fechaDesde && mov.fecha < filtros.fechaDesde) cumple = false;
        if (filtros.fechaHasta && mov.fecha > filtros.fechaHasta) cumple = false;

        let valIngreso = '';
        if (filtros.ingresoSelect === 'Otros') {
            valIngreso = filtros.ingreso;
        } else if (filtros.ingresoSelect === 'Consorcio') {
            if (filtros.ingresoConsorcioSelect === 'Otros') {
                valIngreso = filtros.ingresoConsorcioOtro ? `Consorcio (${filtros.ingresoConsorcioOtro})` : 'Consorcio';
            } else if (filtros.ingresoConsorcioSelect) {
                valIngreso = `Consorcio (${filtros.ingresoConsorcioSelect})`;
            } else {
                valIngreso = 'Consorcio';
            }
        } else {
            valIngreso = filtros.ingresoSelect;
        }

        if (valIngreso && !(mov.ingreso?.toLowerCase().includes(valIngreso.toLowerCase()))) cumple = false;

        const valEgreso = filtros.egresoSelect === 'Otros' ? filtros.egreso : filtros.egresoSelect;
        if (valEgreso && !(mov.egreso?.toLowerCase().includes(valEgreso.toLowerCase()))) cumple = false;

        const valTipo = filtros.tipoSelect === 'Otros' ? filtros.tipo_gasto : filtros.tipoSelect;
        if (valTipo && !(mov.tipo_gasto?.toLowerCase().includes(valTipo.toLowerCase()))) cumple = false;

        const valImputacion = filtros.imputacionSelect === 'Otros' ? filtros.imputacion_gasto : filtros.imputacionSelect;
        if (valImputacion && !(mov.imputacion_gasto?.toLowerCase().includes(valImputacion.toLowerCase()))) cumple = false;

        const valCategoria = filtros.categoriaSelect === 'Otros' ? filtros.categoria_gasto : filtros.categoriaSelect;
        if (valCategoria && !(mov.categoria_gasto?.toLowerCase().includes(valCategoria.toLowerCase()))) cumple = false;

        if (filtros.moneda && mov.moneda !== filtros.moneda) cumple = false;
        if (filtros.montoExacto && Number(mov.monto) !== Number(filtros.montoExacto)) cumple = false;
        if (filtros.montoMin && Number(mov.monto) < Number(filtros.montoMin)) cumple = false;
        if (filtros.montoMax && Number(mov.monto) > Number(filtros.montoMax)) cumple = false;

        return cumple;
    });
    // -----------------------------------------------------------------------------

    const totalPesos = movimientosFiltrados.filter(m => m.moneda === 'Pesos').reduce((acc, curr) => acc + Number(curr.monto), 0)
    const totalDolares = movimientosFiltrados.filter(m => m.moneda === 'USD').reduce((acc, curr) => acc + Number(curr.monto), 0)
    const totalReales = movimientosFiltrados.filter(m => m.moneda === 'Reales').reduce((acc, curr) => acc + Number(curr.monto), 0)

    const totalDolaresEnPesos = totalDolares * tasas.USD_en_ARS;
    const totalRealesEnPesos = totalReales * tasas.BRL_en_ARS;
    const granTotalARS = totalPesos + totalDolaresEnPesos + totalRealesEnPesos;
    const granTotalUSD = granTotalARS / tasas.USD_en_ARS;
    const granTotalBRL = granTotalARS / tasas.BRL_en_ARS;

    const exportToExcel = async () => {
        try {
            setIsExporting(true);

            const { data: allData, error } = await supabase
                .from('gastos')
                .select('*')
                .order('fecha', { ascending: false });

            if (error) throw error;

            // --- MODIFICADO: Se quitó el .reverse() también en la exportación ---
            const datosAExportar = (allData || []).filter(mov => {
                let cumple = true;

                if (filtros.fechaExacta && mov.fecha !== filtros.fechaExacta) cumple = false;
                if (filtros.fechaDesde && mov.fecha < filtros.fechaDesde) cumple = false;
                if (filtros.fechaHasta && mov.fecha > filtros.fechaHasta) cumple = false;

                let valIngreso = '';
                if (filtros.ingresoSelect === 'Otros') {
                    valIngreso = filtros.ingreso;
                } else if (filtros.ingresoSelect === 'Consorcio') {
                    if (filtros.ingresoConsorcioSelect === 'Otros') {
                        valIngreso = filtros.ingresoConsorcioOtro ? `Consorcio (${filtros.ingresoConsorcioOtro})` : 'Consorcio';
                    } else if (filtros.ingresoConsorcioSelect) {
                        valIngreso = `Consorcio (${filtros.ingresoConsorcioSelect})`;
                    } else {
                        valIngreso = 'Consorcio';
                    }
                } else {
                    valIngreso = filtros.ingresoSelect;
                }
                if (valIngreso && !(mov.ingreso?.toLowerCase().includes(valIngreso.toLowerCase()))) cumple = false;

                const valEgreso = filtros.egresoSelect === 'Otros' ? filtros.egreso : filtros.egresoSelect;
                if (valEgreso && !(mov.egreso?.toLowerCase().includes(valEgreso.toLowerCase()))) cumple = false;

                const valTipo = filtros.tipoSelect === 'Otros' ? filtros.tipo_gasto : filtros.tipoSelect;
                if (valTipo && !(mov.tipo_gasto?.toLowerCase().includes(valTipo.toLowerCase()))) cumple = false;

                const valImputacion = filtros.imputacionSelect === 'Otros' ? filtros.imputacion_gasto : filtros.imputacionSelect;
                if (valImputacion && !(mov.imputacion_gasto?.toLowerCase().includes(valImputacion.toLowerCase()))) cumple = false;

                const valCategoria = filtros.categoriaSelect === 'Otros' ? filtros.categoria_gasto : filtros.categoriaSelect;
                if (valCategoria && !(mov.categoria_gasto?.toLowerCase().includes(valCategoria.toLowerCase()))) cumple = false;

                if (filtros.moneda && mov.moneda !== filtros.moneda) cumple = false;
                if (filtros.montoExacto && Number(mov.monto) !== Number(filtros.montoExacto)) cumple = false;
                if (filtros.montoMin && Number(mov.monto) < Number(filtros.montoMin)) cumple = false;
                if (filtros.montoMax && Number(mov.monto) > Number(filtros.montoMax)) cumple = false;

                return cumple;
            });
            // ----------------------------------------------------------------------

            if (datosAExportar.length === 0) {
                alert("No hay datos para exportar con los filtros actuales.");
                return;
            }

            const expTotalPesos = datosAExportar.filter(m => m.moneda === 'Pesos').reduce((acc, curr) => acc + Number(curr.monto), 0)
            const expTotalDolares = datosAExportar.filter(m => m.moneda === 'USD').reduce((acc, curr) => acc + Number(curr.monto), 0)
            const expTotalReales = datosAExportar.filter(m => m.moneda === 'Reales').reduce((acc, curr) => acc + Number(curr.monto), 0)

            const expTotalDolaresEnPesos = expTotalDolares * tasas.USD_en_ARS;
            const expTotalRealesEnPesos = expTotalReales * tasas.BRL_en_ARS;
            const expGranTotalARS = expTotalPesos + expTotalDolaresEnPesos + expTotalRealesEnPesos;
            const expGranTotalUSD = expGranTotalARS / tasas.USD_en_ARS;
            const expGranTotalBRL = expGranTotalARS / tasas.BRL_en_ARS;

            const tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th { background-color: #107c41; color: #ffffff; font-weight: bold; border: 1px solid #dddddd; padding: 10px; text-align: left; }
          td { border: 1px solid #dddddd; padding: 8px; vertical-align: middle; color: #1f2937; }
          .bg-light { background-color: #f3f4f6; }
          .bg-dark { background-color: #107c41; color: #ffffff; }
          .bold { font-weight: bold; }
          .right { text-align: right; }
          .center { text-align: center; }
          .text-green { color: #107c41; font-weight: bold; }
          .text-green-neon { color: #ffffff; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ingreso</th>
              <th>Egreso</th>
              <th>Tipo</th>
              <th>Imputación</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th class="center">Moneda</th>
              <th class="right">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${datosAExportar.map(mov => `
              <tr>
                <td>${formatearFecha(mov.fecha)}</td>
                <td>${mov.ingreso || ''}</td>
                <td>${mov.egreso || ''}</td>
                <td>${mov.tipo_gasto || ''}</td>
                <td>${mov.imputacion_gasto || ''}</td>
                <td>${mov.categoria_gasto !== 'N/A' ? mov.categoria_gasto : ''}</td>
                <td>${mov.descripcion || 'Sin descripción'}</td>
                <td class="center bold">${mov.moneda || ''}</td>
                <td class="right text-green">${Number(mov.monto).toFixed(2)}</td>
              </tr>
            `).join('')}
            
            <tr><td colspan="9"></td></tr>

            <tr class="bg-light">
              <td colspan="7" class="right bold">SUMATORIA POR DIVISA:</td>
              <td class="center bold">ARS</td>
              <td class="right text-green">${expTotalPesos.toFixed(2)}</td>
            </tr>
            <tr class="bg-light">
              <td colspan="7"></td>
              <td class="center bold">USD</td>
              <td class="right text-green">${expTotalDolares.toFixed(2)}</td>
            </tr>
            <tr class="bg-light">
              <td colspan="7"></td>
              <td class="center bold">BRL</td>
              <td class="right text-green">${expTotalReales.toFixed(2)}</td>
            </tr>

            <tr><td colspan="9"></td></tr>

            <tr>
              <td colspan="7" class="right bold bg-dark">
                GRAN TOTAL CONVERTIDO (API - Tasa USD: ${tasas.USD_en_ARS} | Tasa BRL: ${tasas.BRL_en_ARS})
              </td>
              <td class="center bold bg-dark">ARS</td>
              <td class="right text-green-neon bg-dark">${expGranTotalARS.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="7" class="bg-dark"></td>
              <td class="center bold bg-dark">USD</td>
              <td class="right text-green-neon bg-dark">${expGranTotalUSD.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="7" class="bg-dark"></td>
              <td class="center bold bg-dark">BRL</td>
              <td class="right text-green-neon bg-dark">${expGranTotalBRL.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

            const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fechaHoy = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
            link.setAttribute('download', `CDS_Gastos_${fechaHoy}.xls`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error al exportar:", error);
            alert("Ocurrió un error al intentar generar el archivo Excel.");
        } finally {
            setIsExporting(false);
        }
    };

    const inputBaseClass = "w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all disabled:opacity-40 disabled:bg-gray-100 disabled:cursor-not-allowed";

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-8 overflow-x-hidden w-full max-w-[100vw]">
            <style>{`
        .custom-date-input::before { color: #111827 !important; }
        .custom-date-input:disabled::before { color: #9ca3af !important; }
      `}</style>

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Encabezado y Controles */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-green-800">Movimientos</h1>
                        <p className="text-sm text-gray-500 font-medium">Visualización y gestión de gastos corporativos</p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            onClick={exportToExcel}
                            disabled={isExporting}
                            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            title="Descargar Excel con formato"
                        >
                            {isExporting ? 'Generando...' : 'Exportar Excel'}
                        </button>
                        
                        <button
                            onClick={() => setShowFilters(true)}
                            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors border flex-1 sm:flex-none justify-center bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm"
                        >
                            Filtrar Datos
                        </button>
                        
                        <Link href="/" className="w-full sm:w-auto">
                            <button className="w-full px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors shadow-sm">
                                Volver a Carga
                            </button>
                        </Link>
                    </div>
                </div>

                {error && <div className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

                {/* TOTALES */}
                <div className="bg-green-800 rounded-xl p-5 text-white shadow-md border border-green-900 flex flex-col md:flex-row justify-between gap-5 md:gap-8">
                    <div className="flex-1">
                        <p className="text-xs font-bold text-green-300 mb-2 uppercase tracking-wide">Sumatoria por Divisa:</p>
                        <div className="flex flex-col gap-1.5 text-sm font-semibold">
                            {totalPesos > 0 && <span>ARS {totalPesos.toFixed(2)}</span>}
                            {totalDolares > 0 && <span>USD {totalDolares.toFixed(2)}</span>}
                            {totalReales > 0 && <span>BRL {totalReales.toFixed(2)}</span>}
                            {totalPesos === 0 && totalDolares === 0 && totalReales === 0 && <span>0.00</span>}
                        </div>
                    </div>
                    <div className="flex-1 border-t border-green-700 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                        <p className="text-xs font-bold text-green-300 mb-2 uppercase tracking-wide">Gran Total Convertido:</p>
                        <div className="flex flex-col gap-1.5 text-base font-bold">
                            <span>ARS {granTotalARS.toFixed(2)}</span>
                            <span>USD {granTotalUSD.toFixed(2)}</span>
                            <span>BRL {granTotalBRL.toFixed(2)}</span>
                        </div>
                        {!loadingTasas && (
                            <p className="text-[10px] text-green-400 mt-3 font-medium uppercase tracking-wider bg-green-900/50 p-2 rounded border border-green-700/50 text-center md:text-left md:bg-transparent md:p-0 md:border-0 md:mt-3">
                                Tasa API: 1 USD = {tasas.USD_en_ARS} ARS | 1 BRL = {tasas.BRL_en_ARS} ARS
                            </p>
                        )}
                    </div>
                </div>

                {/* VISTA ESCRITORIO */}
                <div className="hidden md:block bg-white rounded-xl overflow-hidden overflow-x-auto border border-gray-200 shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-green-700 text-white font-semibold border-b border-green-800">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Ingreso</th>
                                <th className="p-4">Egreso</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Imputación</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Descripción</th>
                                <th className="p-4 text-center">Moneda</th>
                                <th className="p-4 text-right">Monto</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan={10} className="p-4 text-center text-gray-500 font-medium">Cargando BBDD...</td></tr>
                            ) : movimientosFiltrados.length === 0 ? (
                                <tr><td colSpan={10} className="p-4 text-center text-gray-500 font-medium">No hay registros que coincidan con la búsqueda.</td></tr>
                            ) : (
                                movimientosFiltrados.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-green-50 transition-colors text-gray-800">
                                        <td className="p-4 font-medium">{formatearFecha(mov.fecha) || '-'}</td>
                                        <td className="p-4">{mov.ingreso}</td>
                                        <td className="p-4">{mov.egreso}</td>
                                        <td className="p-4">{mov.tipo_gasto}</td>
                                        <td className="p-4">{mov.imputacion_gasto}</td>
                                        <td className="p-4">
                                            {mov.categoria_gasto !== 'N/A' && mov.categoria_gasto ? (
                                                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-md text-xs font-bold uppercase tracking-wider">
                                                    {mov.categoria_gasto}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 truncate max-w-[150px] text-gray-600">{mov.descripcion || 'Sin descripción'}</td>
                                        <td className="p-4 text-center font-bold text-gray-500">{mov.moneda}</td>
                                        <td className="p-4 text-right font-bold text-green-700">{Number(mov.monto).toFixed(2)}</td>
                                        <td className="p-4 text-center space-x-3">
                                            <button onClick={() => triggerEdit(mov)} className="text-gray-400 hover:text-green-700 transition-colors">✏️</button>
                                            <button onClick={() => triggerDelete(mov.id)} className="text-gray-400 hover:text-red-600 transition-colors">🗑️</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* VISTA CELULAR */}
                <div className="md:hidden flex flex-col space-y-4">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 font-medium bg-white rounded-xl border border-gray-200">Cargando BBDD...</div>
                    ) : movimientosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 font-medium bg-white rounded-xl border border-gray-200">No hay registros que coincidan con la búsqueda.</div>
                    ) : (
                        movimientosFiltrados.map((mov) => (
                            <div key={mov.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="font-bold text-gray-800">{formatearFecha(mov.fecha) || '-'}</span>
                                    <span className="font-bold text-green-700 text-lg">{mov.moneda} {Number(mov.monto).toFixed(2)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                                    <div><span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wide">Ingreso</span> {mov.ingreso}</div>
                                    <div><span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wide">Egreso</span> {mov.egreso}</div>
                                    <div><span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wide">Tipo</span> {mov.tipo_gasto}</div>
                                    <div><span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wide">Imputación</span> {mov.imputacion_gasto}</div>
                                </div>
                                {mov.categoria_gasto && mov.categoria_gasto !== 'N/A' && (
                                    <div className="pt-1">
                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                            {mov.categoria_gasto}
                                        </span>
                                    </div>
                                )}
                                {mov.descripcion && (
                                    <div className="bg-gray-50 p-2 rounded-md text-xs text-gray-600 mt-2 border border-gray-100">
                                        <span className="font-bold text-gray-400 uppercase text-[9px] block mb-1">Detalle</span>
                                        {mov.descripcion}
                                    </div>
                                )}
                                <div className="flex justify-end space-x-4 pt-3 border-t border-gray-100">
                                    <button onClick={() => triggerEdit(mov)} className="text-green-700 hover:text-green-800 font-semibold text-sm transition-colors">✏️ Editar</button>
                                    <button onClick={() => triggerDelete(mov.id)} className="text-red-500 font-semibold text-sm">🗑️ Eliminar</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* BOTÓN DE CARGAR MÁS */}
                {hasMore && !loading && (
                    <div className="flex justify-center mt-6 mb-8 w-full">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-8 py-3 bg-white border-2 border-green-700 text-green-800 font-bold rounded-xl hover:bg-green-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loadingMore ? <>Cargando lote...</> : <>⬇ Cargar más registros</>}
                        </button>
                    </div>
                )}

            </div>

            {/* MODAL DE FILTROS FLOTANTE */}
            {showFilters && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overscroll-none">
                    <div className="bg-white w-full max-w-5xl rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xl max-h-[88vh] overflow-y-auto relative my-auto">
                        
                        <button 
                            onClick={() => setShowFilters(false)}
                            className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 font-bold text-lg transition-colors"
                            title="Cerrar sin aplicar"
                        >
                            ✕
                        </button>

                        <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-3 pr-8">
                            <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">Filtros de Búsqueda</h2>
                            <button onClick={limpiarFiltros} className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                Limpiar filtros
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5 items-end">
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Exacta</label>
                                <input type="date" name="fechaExacta" value={filtros.fechaExacta} onChange={handleFiltroChange} data-date={getPlaceholderFecha(filtros.fechaExacta)} disabled={!!filtros.fechaDesde || !!filtros.fechaHasta} className={`custom-date-input ${inputBaseClass}`} />
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Desde</label>
                                <input type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleFiltroChange} data-date={getPlaceholderFecha(filtros.fechaDesde)} disabled={!!filtros.fechaExacta} className={`custom-date-input ${inputBaseClass}`} />
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Hasta</label>
                                <input type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleFiltroChange} data-date={getPlaceholderFecha(filtros.fechaHasta)} disabled={!!filtros.fechaExacta} className={`custom-date-input ${inputBaseClass}`} />
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-green-700 uppercase mb-1">Moneda</label>
                                <select name="moneda" value={filtros.moneda} onChange={handleFiltroChange} className={`border-green-300 ${inputBaseClass}`}>
                                    <option value="">Todas...</option><option value="Pesos">Pesos</option><option value="USD">USD</option><option value="Reales">Reales</option>
                                </select>
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monto Exacto</label>
                                <input type="number" name="montoExacto" placeholder="0.00" value={filtros.montoExacto} onChange={handleFiltroChange} disabled={!!filtros.montoMin || !!filtros.montoMax} className={inputBaseClass} />
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monto Mínimo</label>
                                <input type="number" name="montoMin" placeholder="0.00" value={filtros.montoMin} onChange={handleFiltroChange} disabled={!!filtros.montoExacto} className={inputBaseClass} />
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monto Máximo</label>
                                <input type="number" name="montoMax" placeholder="9999.00" value={filtros.montoMax} onChange={handleFiltroChange} disabled={!!filtros.montoExacto} className={inputBaseClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-5 border-t border-gray-100 items-start">
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ingreso</label>
                                <select name="ingresoSelect" value={filtros.ingresoSelect} onChange={handleFiltroChange} className={inputBaseClass}>
                                    <option value="">Todos...</option><option value="Consorcio">Consorcio</option><option value="Aldo">Aldo</option><option value="Diego">Diego</option><option value="Otros">Otro...</option>
                                </select>
                                {filtros.ingresoSelect === 'Consorcio' && (
                                    <div className="mt-2 pl-2 border-l-2 border-green-500 space-y-2">
                                        <select name="ingresoConsorcioSelect" value={filtros.ingresoConsorcioSelect} onChange={handleFiltroChange} className={`bg-gray-50 ${inputBaseClass}`}>
                                            <option value="">Cualquier Consorcio...</option><option value="Guaruya">Guaruya</option><option value="Santos">Santos</option><option value="Otros">Otro...</option>
                                        </select>
                                        {filtros.ingresoConsorcioSelect === 'Otros' && <input type="text" name="ingresoConsorcioOtro" placeholder="Especifique..." value={filtros.ingresoConsorcioOtro} onChange={handleFiltroChange} className={`bg-gray-50 ${inputBaseClass}`} />}
                                    </div>
                                )}
                                {filtros.ingresoSelect === 'Otros' && <input type="text" name="ingreso" placeholder="Especifique..." value={filtros.ingreso} onChange={handleFiltroChange} className={`mt-2 ${inputBaseClass}`} />}
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Egreso</label>
                                <select name="egresoSelect" value={filtros.egresoSelect} onChange={handleFiltroChange} className={inputBaseClass}>
                                    <option value="">Todos...</option><option value="Aldo">Aldo</option><option value="Diego">Diego</option><option value="Banco">Banco</option><option value="Jose Luis">Jose Luis</option><option value="Otros">Otro...</option>
                                </select>
                                {filtros.egresoSelect === 'Otros' && <input type="text" name="egreso" placeholder="Especifique..." value={filtros.egreso} onChange={handleFiltroChange} className={`mt-2 ${inputBaseClass}`} />}
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                <select name="tipoSelect" value={filtros.tipoSelect} onChange={handleFiltroChange} className={inputBaseClass}>
                                    <option value="">Todos...</option><option value="Obra">Obra</option><option value="Persona">Persona</option><option value="Viaje">Viaje</option><option value="Contador">Contador</option><option value="Administración">Administración</option><option value="Otros">Otro...</option>
                                </select>
                                {filtros.tipoSelect === 'Otros' && <input type="text" name="tipo_gasto" placeholder="Especifique..." value={filtros.tipo_gasto} onChange={handleFiltroChange} className={`mt-2 ${inputBaseClass}`} />}
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Imputación</label>
                                <select name="imputacionSelect" value={filtros.imputacionSelect} onChange={handleFiltroChange} className={inputBaseClass}>
                                    <option value="">Todas...</option><option value="Guaruya">Guaruya</option><option value="Santos">Santos</option><option value="Aldo">Aldo</option><option value="Diego">Diego</option><option value="Lucas">Lucas</option><option value="Jose luis">Jose luis</option><option value="Tainara">Tainara</option><option value="Ednaldo">Ednaldo</option><option value="hotel">Hotel</option><option value="vuelo">Vuelo</option><option value="cena">Cena</option><option value="Otros">Otro...</option>
                                </select>
                                {filtros.imputacionSelect === 'Otros' && <input type="text" name="imputacion_gasto" placeholder="Especifique..." value={filtros.imputacion_gasto} onChange={handleFiltroChange} className={`mt-2 ${inputBaseClass}`} />}
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                <select name="categoriaSelect" value={filtros.categoriaSelect} onChange={handleFiltroChange} className={inputBaseClass}>
                                    <option value="">Todas...</option><option value="obra">Obra</option><option value="caja chica">Caja Chica</option><option value="sueldo">Sueldo</option><option value="Otros">Otro...</option>
                                </select>
                                {filtros.categoriaSelect === 'Otros' && <input type="text" name="categoria_gasto" placeholder="Especifique..." value={filtros.categoria_gasto} onChange={handleFiltroChange} className={`mt-2 ${inputBaseClass}`} />}
                            </div>
                        </div>

                        <div className="pt-5 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 mt-6">
                            <button 
                                onClick={() => setShowFilters(false)} 
                                className="px-5 py-2.5 text-sm bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold transition-colors order-2 sm:order-1"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => setShowFilters(false)} 
                                className="px-6 py-2.5 text-sm bg-green-700 text-white rounded-lg border border-green-800 hover:bg-green-800 font-bold transition-colors shadow-sm order-1 sm:order-2"
                            >
                                Aplicar Filtros
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* MODAL DE EDICIÓN RÁPIDA */}
            {editingRecord && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto overscroll-none">
                    <div className="bg-white w-full max-w-2xl rounded-2xl border border-gray-200 p-6 shadow-2xl mt-10 mb-10">
                        <h2 className="text-xl font-bold text-green-800 mb-6 border-b border-gray-200 pb-3">Editar Registro</h2>
                        <form onSubmit={confirmEdit} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha</label>
                                <input type="date" name="fecha" value={editingRecord.fecha} onChange={handleEditChange} required data-date={getPlaceholderFecha(editingRecord.fecha)} className={`custom-date-input ${inputBaseClass}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Ingreso</label>
                                <select name="ingresoSelect" value={editingRecord.ingresoSelect} onChange={handleEditChange} required className={inputBaseClass}>
                                    <option value="">Seleccione...</option><option value="Consorcio">Consorcio</option><option value="Aldo">Aldo</option><option value="Diego">Diego</option><option value="Otros">Otros</option>
                                </select>
                                {editingRecord.ingresoSelect === "Consorcio" && (
                                    <div className="mt-2 pl-3 border-l-2 border-green-500 space-y-2">
                                        <select name="ingresoConsorcioSelect" value={editingRecord.ingresoConsorcioSelect} onChange={handleEditChange} required className={`bg-gray-50 ${inputBaseClass}`}>
                                            <option value="">Tipo de Consorcio...</option><option value="Guaruya">Guaruya</option><option value="Santos">Santos</option><option value="Otros">Otros</option>
                                        </select>
                                        {editingRecord.ingresoConsorcioSelect === "Otros" && (
                                            <input type="text" name="ingresoConsorcioOtro" value={editingRecord.ingresoConsorcioOtro} onChange={handleEditChange} placeholder="Especifique consorcio..." required className={`bg-white ${inputBaseClass}`} />
                                        )}
                                    </div>
                                )}
                                {editingRecord.ingresoSelect === "Otros" && (
                                    <div className="mt-2 pl-3 border-l-2 border-green-500">
                                        <input type="text" name="ingresoOtro" value={editingRecord.ingresoOtro} onChange={handleEditChange} placeholder="Especifique ingreso..." required className={`bg-gray-50 ${inputBaseClass}`} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Egreso</label>
                                <select name="egresoSelect" value={editingRecord.egresoSelect} onChange={handleEditChange} required className={inputBaseClass}>
                                    <option value="">Seleccione...</option><option value="Aldo">Aldo</option><option value="Diego">Diego</option><option value="Banco">Banco</option><option value="Jose Luis">Jose Luis</option><option value="Otro">Otro</option>
                                </select>
                                {editingRecord.egresoSelect === "Otro" && (
                                    <div className="mt-2 pl-3 border-l-2 border-green-500">
                                        <input type="text" name="egresoOtro" value={editingRecord.egresoOtro} onChange={handleEditChange} placeholder="Especifique egreso..." required className={`bg-gray-50 ${inputBaseClass}`} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Gasto</label>
                                <select name="tipoSelect" value={editingRecord.tipoSelect} onChange={handleEditChange} required className={inputBaseClass}>
                                    <option value="">Seleccione...</option><option value="Obra">Obra</option><option value="Persona">Persona</option><option value="Viaje">Viaje</option><option value="Contador">Contador</option><option value="Administración">Administración</option><option value="Otros">Otros</option>
                                </select>
                                {editingRecord.tipoSelect === "Otros" && (
                                    <div className="mt-2 pl-3 border-l-2 border-green-500">
                                        <input type="text" name="tipoOtro" value={editingRecord.tipoOtro} onChange={handleEditChange} placeholder="Especifique tipo de gasto..." required className={`bg-gray-50 ${inputBaseClass}`} />
                                    </div>
                                )}
                            </div>
                            {editingRecord.tipoSelect === "Obra" && (
                                <div>
                                    <label className="block text-xs font-bold text-orange-600 mb-1">Imputación de Gasto (Obra)</label>
                                    <select name="imputacionSelect" value={editingRecord.imputacionSelect} onChange={handleEditChange} required className={`border-orange-300 ${inputBaseClass}`}>
                                        <option value="">Seleccione...</option><option value="Guaruya">Guaruya</option><option value="Santos">Santos</option><option value="Otro">Otro</option>
                                    </select>
                                    {editingRecord.imputacionSelect === "Otro" && (
                                        <div className="mt-2 pl-3 border-l-2 border-orange-500">
                                            <input type="text" name="imputacionOtro" value={editingRecord.imputacionOtro} onChange={handleEditChange} placeholder="Especifique obra..." required className={`bg-gray-50 ${inputBaseClass}`} />
                                        </div>
                                    )}
                                </div>
                            )}
                            {editingRecord.tipoSelect === "Persona" && (
                                <div>
                                    <label className="block text-xs font-bold text-blue-600 mb-1">Imputación de Gasto (Persona)</label>
                                    <select name="imputacionSelect" value={editingRecord.imputacionSelect} onChange={handleEditChange} required className={`border-blue-300 ${inputBaseClass}`}>
                                        <option value="">Seleccione...</option><option value="Aldo">Aldo</option><option value="Diego">Diego</option><option value="Lucas">Lucas</option><option value="Jose luis">Jose luis</option><option value="Tainara">Tainara</option><option value="Ednaldo">Ednaldo</option><option value="Otro">Otro</option>
                                    </select>
                                    {editingRecord.imputacionSelect === "Otro" && (
                                        <div className="mt-2 pl-3 border-l-2 border-blue-500">
                                            <input type="text" name="imputacionOtro" value={editingRecord.imputacionOtro} onChange={handleEditChange} placeholder="Especifique persona..." required className={`bg-gray-50 ${inputBaseClass}`} />
                                        </div>
                                    )}
                                </div>
                            )}
                            {editingRecord.tipoSelect === "Viaje" && (
                                <div>
                                    <label className="block text-xs font-bold text-teal-600 mb-1">Imputación de Gasto (Viaje)</label>
                                    <select name="imputacionSelect" value={editingRecord.imputacionSelect} onChange={handleEditChange} required className={`border-teal-300 ${inputBaseClass}`}>
                                        <option value="">Seleccione...</option><option value="hotel">Hotel</option><option value="vuelo">Vuelo</option><option value="cena">Cena</option><option value="Otro">Otro</option>
                                    </select>
                                    {editingRecord.imputacionSelect === "Otro" && (
                                        <div className="mt-2 pl-3 border-l-2 border-teal-500">
                                            <input type="text" name="imputacionOtro" value={editingRecord.imputacionOtro} onChange={handleEditChange} placeholder="Especifique detalle..." required className={`bg-gray-50 ${inputBaseClass}`} />
                                        </div>
                                    )}
                                </div>
                            )}
                            {editingRecord.tipoSelect === "Persona" && ["Jose luis", "Tainara", "Ednaldo"].includes(editingRecord.imputacionSelect) && (
                                <div>
                                    <label className="block text-xs font-bold text-purple-600 mb-1">Categoría de Gasto</label>
                                    <select name="categoriaSelect" value={editingRecord.categoriaSelect} onChange={handleEditChange} required className={`border-purple-300 ${inputBaseClass}`}>
                                        <option value="">Seleccione...</option><option value="obra">Obra</option><option value="caja chica">Caja Chica</option><option value="sueldo">Sueldo</option><option value="Otros">Otro</option>
                                    </select>
                                    {editingRecord.categoriaSelect === "Otros" && (
                                        <div className="mt-2 pl-3 border-l-2 border-purple-500">
                                            <input type="text" name="categoriaOtro" value={editingRecord.categoriaOtro} onChange={handleEditChange} placeholder="Especifique categoría..." required className={`bg-gray-50 ${inputBaseClass}`} />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="md:col-span-2 grid grid-cols-5 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Moneda</label>
                                    <select name="moneda" value={editingRecord.moneda || ''} onChange={handleEditChange} required className={inputBaseClass}>
                                        <option value="Pesos">Pesos</option><option value="USD">USD</option><option value="Reales">Reales</option>
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Monto</label>
                                    <input type="number" step="0.01" name="monto" value={editingRecord.monto || ''} onChange={handleEditChange} required className={`font-bold text-green-700 ${inputBaseClass}`} />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
                                <input type="text" name="descripcion" value={editingRecord.descripcion || ''} onChange={handleEditChange} className={inputBaseClass} />
                            </div>
                            <div className="md:col-span-2 pt-4 border-t border-gray-200 flex justify-end space-x-3 mt-2">
                                <button type="button" onClick={() => setEditingRecord(null)} disabled={isSaving} className="px-5 py-2.5 bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-green-700 text-white rounded-lg border border-green-800 hover:bg-green-800 font-bold transition-colors shadow-sm">{isSaving ? "Guardando..." : "Guardar Cambios"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overscroll-none">
                    <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 p-6 text-center shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl border border-red-100">⚠️</div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">¿Está seguro?</h2>
                        <p className="text-sm text-gray-500 mb-6">Esta acción eliminará el registro de forma permanente de la BBDD. No se puede deshacer.</p>
                        <div className="flex space-x-3 text-sm">
                            <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 bg-white text-gray-600 font-semibold p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">Cancelar</button>
                            <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-600 text-white font-bold p-2.5 rounded-lg border border-red-700 hover:bg-red-700 transition-colors shadow-sm">{isDeleting ? "Eliminando..." : "Eliminar"}</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}