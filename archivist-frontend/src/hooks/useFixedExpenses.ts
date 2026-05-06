import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useFixedExpenses() {
  return useQuery({ queryKey: ['fixed-expenses'], queryFn: api.listFixedExpenses })
}

export function useUpcomingFixedExpenses() {
  return useQuery({ queryKey: ['fixed-expenses-upcoming'], queryFn: () => api.getUpcomingFixedExpenses() })
}

export function useCreateFixedExpense() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createFixedExpense,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fixed-expenses'] }); showToast('Fixed expense added') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useUpdateFixedExpense() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateFixedExpense>[1] }) =>
      api.updateFixedExpense(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fixed-expenses'] }); showToast('Fixed expense updated') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteFixedExpense() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteFixedExpense,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fixed-expenses'] }); showToast('Fixed expense deleted') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
