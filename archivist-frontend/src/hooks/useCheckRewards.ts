import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'
import type { RewardsResponse } from '@/types'

export function useCheckRewards() {
  const qc = useQueryClient()
  const { showCelebration } = useUiStore()
  const { t } = useTranslation()

  return useCallback(async () => {
    try {
      const result = await api.checkRewards()
      if (!result.newly_earned.length) return

      const key = result.newly_earned[0]

      // Fetch fresh rewards data to get icon and name
      const data = await qc.fetchQuery<RewardsResponse>({
        queryKey: ['rewards'],
        queryFn: api.getRewards,
        staleTime: 0,
      })
      const reward = data.rewards.find(r => r.key === key)
      if (!reward) return

      showCelebration({
        type: 'reward',
        title: t(`rewards.keys.${key}.name`, { defaultValue: reward.name }),
        subtitle: t(`rewards.keys.${key}.gift`, { defaultValue: reward.gift }),
        icon: reward.icon,
        tier: reward.tier,
      })
    } catch {
      // silent — celebrations are non-critical
    }
  }, [qc, showCelebration, t])
}
