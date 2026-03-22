import { create } from 'zustand'

interface UIState {
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  activeModal: string | null
  modalData: Record<string, unknown>
  openModal: (id: string, data?: Record<string, unknown>) => void
  closeModal: () => void
}

export const useUI = create<UIState>((set) => ({
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  activeModal: null,
  modalData: {},
  openModal: (id, data = {}) => set({ activeModal: id, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),
}))
