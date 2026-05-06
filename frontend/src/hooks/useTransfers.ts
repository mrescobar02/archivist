import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useTransfers(params?: { account_id?: number }) {
  return useQuery({ queryKey: ['transfers', params], queryFn: () => api.listTransfers(params) })
}

export function useCreateTransfer() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      showToast('Transfer completed')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteTransfer() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      showToast('Transfer deleted')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
