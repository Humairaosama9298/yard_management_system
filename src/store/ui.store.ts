import { create } from "zustand";

interface UiState {
  /** Whether the sidebar is open */
  sidebarOpen: boolean;
  /** Toggle the sidebar open/closed */
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
