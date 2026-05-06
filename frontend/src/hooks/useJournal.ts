import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'
import { useCheckRewards } from './useCheckRewards'

export function useJournalEntries() {
  return useQuery({ queryKey: ['journal'], queryFn: api.listJournalEntries })
}

export function useCreateJournalEntry() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  const checkRewards = useCheckRewards()
  return useMutation({
    mutationFn: api.createJournalEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] })
      showToast('Entry saved')
      checkRewards()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useUpdateJournalEntry() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateJournalEntry>[1] }) =>
      api.updateJournalEntry(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); showToast('Entry updated') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteJournalEntry,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); showToast('Entry deleted') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
