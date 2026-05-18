import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConversations, useDeleteConversation } from '@/hooks/useChat'
import { cn } from '@/lib/utils'
import { ChatTab } from './ChatTab'

function groupByDay(items: { id: number; title: string; created_at: string }[], t: (k: string) => string) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const groups: Record<string, typeof items> = {}
  for (const item of items) {
    const d = new Date(item.created_at).toDateString()
    const label = d === today ? t('assistant.history.today') : d === yesterday ? t('assistant.history.yesterday') : new Date(item.created_at).toLocaleDateString()
    ;(groups[label] ??= []).push(item)
  }
  return groups
}

export function AssistantPage() {
  const { t } = useTranslation()
  const { data: conversations = [] } = useConversations()
  const deleteConversation = useDeleteConversation()
  const [activeConvId, setActiveConvId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleNewChat = () => setActiveConvId(null)
  const handleConvCreated = (id: number) => setActiveConvId(id)

  const groups = groupByDay(conversations, t)

  return (
    <div className="flex h-[calc(100dvh-4rem)] md:h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'flex-shrink-0 flex flex-col bg-neutral-50 border-r border-outline/10 transition-all duration-200 overflow-hidden',
        sidebarOpen ? 'w-56' : 'w-0'
      )}>
        <div className="p-3 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-on-surface text-surface-container-lowest text-sm font-medium hover:bg-on-surface/90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            {t('assistant.history.newChat')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
          {conversations.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center px-3 pt-2">{t('assistant.history.empty')}</p>
          ) : (
            Object.entries(groups).map(([label, items]) => (
              <div key={label}>
                <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider px-2 mb-1">{label}</p>
                <div className="space-y-0.5">
                  {items.map(conv => (
                    <div key={conv.id} className="group flex items-center gap-1">
                      <button
                        onClick={() => setActiveConvId(conv.id)}
                        className={cn(
                          'flex-1 min-w-0 text-left px-2 py-1.5 rounded-lg text-xs transition-colors truncate',
                          activeConvId === conv.id
                            ? 'bg-white shadow-sm text-on-surface font-medium'
                            : 'text-on-surface-variant hover:bg-neutral-200/50 hover:text-on-surface'
                        )}
                      >
                        {conv.title}
                      </button>
                      <button
                        onClick={() => {
                          deleteConversation.mutate(conv.id)
                          if (activeConvId === conv.id) setActiveConvId(null)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-on-surface-variant hover:text-error transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 p-8 overflow-hidden">
        <div className="mb-6 flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">{t('assistant.title')}</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">{t('assistant.subtitle')}</p>
          </div>
        </div>
        <ChatTab
          conversationId={activeConvId}
          onConversationCreated={handleConvCreated}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  )
}
