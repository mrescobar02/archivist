import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: api.getRewards,
    staleTime: 30_000,
  })
}

export function useMarkRewardsSeen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.markRewardsSeen,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rewards'] }),
  })
}

export function useUpdateRewardSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => api.updateRewardSettings(enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rewards'] }),
  })
}
