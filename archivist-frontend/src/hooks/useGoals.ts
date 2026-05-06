import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'
import { useCheckRewards } from './useCheckRewards'
import type { Goal } from '@/types'

export function useGoalContributions(goal_id: number) {
  return useQuery({
    queryKey: ['goal-contributions', goal_id],
    queryFn: () => api.listGoalContributions(goal_id),
  })
}

export function useCreateGoalContribution() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  const checkRewards = useCheckRewards()
  return useMutation({
    mutationFn: ({ goal_id, data }: { goal_id: number; data: { amount: number; date: string; note?: string } }) =>
      api.createGoalContribution(goal_id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['goal-contributions', vars.goal_id] })
      qc.invalidateQueries({ queryKey: ['goals'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('Contribution added')
      checkRewards()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteGoalContribution() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: ({ goal_id, contribution_id }: { goal_id: number; contribution_id: number }) =>
      api.deleteGoalContribution(goal_id, contribution_id),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['goal-contributions', vars.goal_id] })
      qc.invalidateQueries({ queryKey: ['goals'] })
      showToast('Contribution deleted')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useGoals() {
  return useQuery({ queryKey: ['goals'], queryFn: api.listGoals })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  const checkRewards = useCheckRewards()
  return useMutation({
    mutationFn: api.createGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      showToast('Goal created')
      checkRewards()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  const { showToast, showCelebration } = useUiStore()
  const checkRewards = useCheckRewards()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateGoal>[1] }) =>
      api.updateGoal(id, data),
    onSuccess: (updated: Goal) => {
      const prev = qc.getQueryData<Goal[]>(['goals'])?.find(g => g.id === updated.id)
      const wasComplete = prev ? Number(prev.current_amount) >= Number(prev.target_amount) : false
      const isNowComplete = Number(updated.current_amount) >= Number(updated.target_amount)

      qc.invalidateQueries({ queryKey: ['goals'] })
      showToast('Goal updated')

      if (!wasComplete && isNowComplete) {
        showCelebration({
          type: 'goal',
          title: updated.name,
          subtitle: t('celebration.goalSubtitle'),
          icon: '🎯',
        })
      } else {
        checkRewards()
      }
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.deleteGoal,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); showToast('Goal deleted') },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
