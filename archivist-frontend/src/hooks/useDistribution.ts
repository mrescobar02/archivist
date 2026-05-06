import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useDistribution() {
  return useQuery({ queryKey: ['distribution'], queryFn: api.getDistribution })
}

export function useUpdateDistribution() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.updateDistribution,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['distribution'] }); showToast('Distribution saved') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
