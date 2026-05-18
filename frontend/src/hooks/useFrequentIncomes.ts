import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useFrequentIncomes() {
  return useQuery({ queryKey: ['frequentIncomes'], queryFn: api.listFrequentIncomes })
}

export function useCreateFrequentIncome() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createFrequentIncome,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['frequentIncomes'] }),
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteFrequentIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteFrequentIncome,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['frequentIncomes'] }),
  })
}
