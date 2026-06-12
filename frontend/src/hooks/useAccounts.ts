import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: api.listAccounts })
}

const invalidateAccounts = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['accounts'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createAccount,
    onSuccess: () => { invalidateAccounts(qc); showToast('Account created') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateAccount>[1] }) =>
      api.updateAccount(id, data),
    onSuccess: () => { invalidateAccounts(qc); showToast('Account updated') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => { invalidateAccounts(qc); showToast('Account deleted') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
