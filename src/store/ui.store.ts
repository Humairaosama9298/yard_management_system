import { create } from "zustand";

type UiState = {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),
}));
