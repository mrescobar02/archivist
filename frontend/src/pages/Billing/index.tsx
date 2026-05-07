import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'

export function BillingPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading('checkout')
    setError(null)
    try {
      const { data } = await api.post<{ checkout_url: string }>('/billing/checkout')
      window.location.href = data.checkout_url
    } catch (err: any) {
      setError(err.message || 'Error al crear sesión de pago')
      setLoading(null)
    }
  }

  const handlePortal = async () => {
    setLoading('portal')
    setError(null)
    try {
      const { data } = await api.post<{ portal_url: string }>('/billing/portal')
      window.location.href = data.portal_url
    } catch (err: any) {
      setError(err.message || 'Error al abrir portal')
      setLoading(null)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold text-white mb-2">Plan y facturación</h1>
      <p className="text-neutral-400 text-sm mb-8">{user?.email}</p>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-white font-medium">Plan Pro</h2>
            <p className="text-neutral-400 text-sm mt-1">Asesor AI · Escáner de recibos</p>
          </div>
          <span className="text-white font-semibold">$3.99<span className="text-neutral-400 font-normal text-sm">/mes</span></span>
        </div>
        <ul className="space-y-2 text-sm text-neutral-300 mb-6">
          <li>✓ Chat con asesor financiero AI ilimitado</li>
          <li>✓ Escaneo de recibos con OCR</li>
          <li>✓ Reportes financieros automáticos</li>
          <li>✓ Acceso a todas las funciones</li>
        </ul>
        <button
          onClick={handleUpgrade}
          disabled={!!loading}
          className="w-full bg-white text-black font-medium rounded-lg py-2.5 text-sm hover:bg-neutral-200 disabled:opacity-50 transition-colors"
        >
          {loading === 'checkout' ? 'Redirigiendo...' : 'Activar Plan Pro'}
        </button>
      </div>

      <button
        onClick={handlePortal}
        disabled={!!loading}
        className="w-full text-sm text-neutral-400 hover:text-white py-2 transition-colors disabled:opacity-50"
      >
        {loading === 'portal' ? 'Cargando...' : 'Gestionar suscripción existente'}
      </button>

      {error && (
        <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}
