import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useExpenses(params?: Parameters<typeof api.listExpenses>[0]) {
  return useQuery({ queryKey: ['expenses', params], queryFn: () => api.listExpenses(params) })
}

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['expenses'] })
  qc.invalidateQueries({ queryKey: ['accounts'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => { invalidate(qc); showToast('Expense added') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateExpense>[1] }) =>
      api.updateExpense(id, data),
    onSuccess: () => { invalidate(qc); showToast('Expense updated') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => { invalidate(qc); showToast('Expense deleted') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
