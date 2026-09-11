'use client';
import { useAppStore } from './store';

export function getCurrentView() {
  return useAppStore((s) => s.currentView);
}
