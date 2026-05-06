import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useIncomes(params?: Parameters<typeof api.listIncomes>[0]) {
  return useQuery({ queryKey: ['incomes', params], queryFn: () => api.listIncomes(params) })
}

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['incomes'] })
  qc.invalidateQueries({ queryKey: ['accounts'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useCreateIncome() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createIncome,
    onSuccess: () => { invalidate(qc); showToast('Income added') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useUpdateIncome() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateIncome>[1] }) =>
      api.updateIncome(id, data),
    onSuccess: () => { invalidate(qc); showToast('Income updated') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteIncome() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteIncome,
    onSuccess: () => { invalidate(qc); showToast('Income deleted') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
