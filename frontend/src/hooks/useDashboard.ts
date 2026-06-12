import { useQuery } from '@tanstack/react-query'
import * as api from '@/services/api'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboardSummary,
  })
}
