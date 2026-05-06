import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/services/api'

export function useConversations() {
  return useQuery({ queryKey: ['chat-conversations'], queryFn: api.listConversations })
}

export function useChatMessages(conv_id: number | null) {
  return useQuery({
    queryKey: ['chat-messages', conv_id],
    queryFn: () => api.listChatMessages(conv_id!),
    enabled: conv_id !== null,
  })
}

export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.createConversation(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-conversations'] }),
  })
}

export function useDeleteConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteConversation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-conversations'] }),
  })
}

export function useAddChatMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ conv_id, data }: { conv_id: number; data: { role: string; content: string; kind?: string } }) =>
      api.addChatMessage(conv_id, data),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ['chat-messages', vars.conv_id] }),
  })
}
