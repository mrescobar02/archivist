import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'
import { useCheckRewards } from './useCheckRewards'

export function useSavingsFunds() {
  return useQuery({ queryKey: ['savings-funds'], queryFn: api.listSavingsFunds })
}

export function useContributions(fund_id?: number) {
  return useQuery({
    queryKey: ['contributions', fund_id],
    queryFn: () => api.listContributions(fund_id),
  })
}

export function useCreateSavingsFund() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.createSavingsFund,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings-funds'] }); showToast('Savings fund created') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteSavingsFund() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteSavingsFund,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings-funds'] }); showToast('Fund deleted') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useCreateContribution() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  const checkRewards = useCheckRewards()
  return useMutation({
    mutationFn: api.createContribution,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savings-funds'] })
      qc.invalidateQueries({ queryKey: ['contributions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('Contribution added')
      checkRewards()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteContribution() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteContribution,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savings-funds'] })
      qc.invalidateQueries({ queryKey: ['contributions'] })
      showToast('Contribution deleted')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
