import { create } from "zustand";

export const useGameStore = create((set) => ({
  selectedCard: null,

  selectCard: (card) => {
    set({ selectedCard: card });
    console.log("Selected card:", card);
  },
}));
