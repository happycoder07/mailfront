'use client';

import { ReactNode } from 'react';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  return (
    <>
      {children}
      <KeyboardShortcutsHelp />
    </>
  );
}
