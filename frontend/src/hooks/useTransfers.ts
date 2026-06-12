import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useTransfers(params?: { account_id?: number }) {
  return useQuery({ queryKey: ['transfers', params], queryFn: () => api.listTransfers(params) })
}

const invalidateTransfers = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['transfers'] })
  qc.invalidateQueries({ queryKey: ['accounts'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useCreateTransfer() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createTransfer,
    onSuccess: () => {
      invalidateTransfers(qc)
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
      invalidateTransfers(qc)
      showToast('Transfer deleted')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
