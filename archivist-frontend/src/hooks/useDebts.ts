import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'
import { useCheckRewards } from './useCheckRewards'

export function useDebts() {
  return useQuery({ queryKey: ['debts'], queryFn: api.listDebts })
}

export function useDebtPayments(debt_id: number) {
  return useQuery({
    queryKey: ['debt-payments', debt_id],
    queryFn: () => api.listDebtPayments(debt_id),
    enabled: debt_id > 0,
  })
}

export function useCreateDebt() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createDebt,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); showToast('Debt added') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useUpdateDebt() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateDebt>[1] }) =>
      api.updateDebt(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); showToast('Debt updated') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteDebt() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteDebt,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); showToast('Debt deleted') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useCreateDebtPayment() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  const checkRewards = useCheckRewards()
  return useMutation({
    mutationFn: ({ debt_id, data }: { debt_id: number; data: Parameters<typeof api.createDebtPayment>[1] }) =>
      api.createDebtPayment(debt_id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] })
      qc.invalidateQueries({ queryKey: ['debt-payments'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('Payment logged')
      checkRewards()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
