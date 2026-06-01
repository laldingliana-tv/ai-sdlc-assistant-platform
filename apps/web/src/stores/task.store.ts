// Option A chosen: Retained for integration with task list filter/search UI.
// This store provides centralized filter state management for the TaskList component.
// Wire into <TaskList> when filter controls are added to the tasks page.
import { create } from 'zustand';

interface TaskStoreState {
  selectedTaskId: string | null;
  statusFilter: string | null;
  searchQuery: string;
  setSelectedTaskId: (id: string | null) => void;
  setStatusFilter: (status: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useTaskStore = create<TaskStoreState>((set) => ({
  selectedTaskId: null,
  statusFilter: null,
  searchQuery: '',
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
