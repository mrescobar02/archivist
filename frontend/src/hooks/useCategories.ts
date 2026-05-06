import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: api.listCategories })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
