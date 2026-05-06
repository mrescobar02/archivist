import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import i18n from '@/i18n'
import * as api from '@/services/api'
import { useUiStore } from '@/store/ui'

export function useProfile() {
  const query = useQuery({ queryKey: ['profile'], queryFn: api.getProfile })

  useEffect(() => {
    if (query.data?.language && query.data.language !== i18n.language) {
      i18n.changeLanguage(query.data.language)
    }
  }, [query.data?.language])

  return query
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const { showToast } = useUiStore()
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      if (updated?.language) i18n.changeLanguage(updated.language)
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
