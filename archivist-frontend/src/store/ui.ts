import { create } from 'zustand'

interface Toast {
  message: string
  variant: 'success' | 'error' | 'info'
}

export interface Celebration {
  type: 'goal' | 'reward'
  title: string
  subtitle?: string
  icon?: string
  tier?: 'bronze' | 'silver' | 'gold' | 'diamond'
}

interface UiStore {
  activeTab: Record<string, string>
  openModal: string | null
  toast: Toast | null
  celebration: Celebration | null
  setActiveTab: (page: string, tab: string) => void
  openModalByName: (name: string) => void
  closeModal: () => void
  showToast: (message: string, variant?: Toast['variant']) => void
  dismissToast: () => void
  showCelebration: (data: Celebration) => void
  hideCelebration: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  activeTab: {},
  openModal: null,
  toast: null,
  celebration: null,
  setActiveTab: (page, tab) =>
    set(state => ({ activeTab: { ...state.activeTab, [page]: tab } })),
  openModalByName: (name) => set({ openModal: name }),
  closeModal: () => set({ openModal: null }),
  showToast: (message, variant = 'success') => {
    set({ toast: { message, variant } })
    setTimeout(() => set({ toast: null }), 4000)
  },
  dismissToast: () => set({ toast: null }),
  showCelebration: (data) => set({ celebration: data }),
  hideCelebration: () => set({ celebration: null }),
}))
