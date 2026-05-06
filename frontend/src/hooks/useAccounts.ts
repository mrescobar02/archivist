import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: api.listAccounts })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); showToast('Account created') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateAccount>[1] }) =>
      api.updateAccount(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); showToast('Account updated') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); showToast('Account deleted') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
