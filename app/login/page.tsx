"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            // Si el login es exitoso, forzamos un refresco para que el middleware lea la cookie y nos deje pasar al inicio
            router.push('/')
            router.refresh()
        } catch (error: any) {
            setError(error.message === "Invalid login credentials" 
                ? "Correo o contraseña incorrectos" 
                : error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-green-800">SGI Gastos Corporativos</h1>
                    <p className="text-sm text-gray-500 mt-1">Acceso restringido para socios</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm font-semibold rounded-lg border border-red-200 text-center">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Correo Electrónico</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all"
                            placeholder="socio@empresa.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Contraseña</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 px-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Validando credenciales...' : 'Ingresar al Sistema'}
                    </button>
                </form>
            </div>
        </div>
    )
}