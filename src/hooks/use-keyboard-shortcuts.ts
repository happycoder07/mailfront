'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  global?: boolean; // Whether this shortcut works globally or only in specific contexts
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check if any shortcut matches
      for (const shortcut of shortcuts) {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.metaKey === !!shortcut.metaKey &&
          !!event.shiftKey === !!shortcut.shiftKey &&
          !!event.altKey === !!shortcut.altKey
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Global shortcuts that work throughout the application
export function useGlobalShortcuts() {
  const router = useRouter();
  const { logout } = useAuth();

  const globalShortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      ctrlKey: true,
      action: () => router.push('/emails'),
      description: 'Go to Emails',
      global: true,
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => router.push('/contacts'),
      description: 'Go to Contacts',
      global: true,
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => router.push('/contact-lists'),
      description: 'Go to Contact Lists',
      global: true,
    },
    {
      key: '4',
      ctrlKey: true,
      action: () => router.push('/queue'),
      description: 'Go to Queue',
      global: true,
    },
    {
      key: '5',
      ctrlKey: true,
      action: () => router.push('/monitoring'),
      description: 'Go to Monitoring',
      global: true,
    },
    {
      key: '6',
      ctrlKey: true,
      action: () => router.push('/users'),
      description: 'Go to Users',
      global: true,
    },
    {
      key: '7',
      ctrlKey: true,
      action: () => router.push('/profile'),
      description: 'Go to Profile',
      global: true,
    },
    {
      key: 'n',
      altKey: true,
      action: () => router.push('/emails/new'),
      description: 'Create New Email',
      global: true,
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => {
        // Focus search input if available
        const searchInput = document.querySelector(
          'input[placeholder*="search" i], input[placeholder*="Search" i]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: 'Focus Search',
      global: true,
    },
    {
      key: 'r',
      altKey: true,
      action: () => {
        // Trigger refresh for current page
        window.location.reload();
      },
      description: 'Refresh Page',
      global: true,
    },
    {
      key: 'h',
      altKey: true,
      action: () => router.push('/emails'),
      description: 'Go to Home',
      global: true,
    },
    {
      key: 'q',
      ctrlKey: true,
      action: async () => {
        try {
          await logout();
          router.push('/auth/login');
        } catch (error) {
          console.error('Logout failed:', error);
          router.push('/auth/login');
        }
      },
      description: 'Logout',
      global: true,
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open dialogs or modals
        const closeButtons = document.querySelectorAll(
          '[data-radix-collection-item] button[aria-label*="Close"], [role="dialog"] button[aria-label*="Close"]'
        );
        if (closeButtons.length > 0) {
          (closeButtons[0] as HTMLButtonElement).click();
        }
      },
      description: 'Close Dialog/Modal',
      global: true,
    },
    {
      key: 'k',
      altKey: true,
      action: () => {
        // Show keyboard shortcuts help
        showKeyboardShortcutsHelp();
      },
      description: 'Show Keyboard Shortcuts',
      global: true,
    },
  ];

  useKeyboardShortcuts(globalShortcuts);
}

// Email-specific shortcuts
export function useEmailShortcuts(
  onApprove?: () => void,
  onReject?: () => void,
  onSign?: () => void,
  onView?: () => void
) {
  const emailShortcuts: KeyboardShortcut[] = [
    {
      key: 'a',
      altKey: true,
      action: () => onApprove?.(),
      description: 'Approve Email',
    },
    {
      key: 'r',
      altKey: true,
      action: () => onReject?.(),
      description: 'Reject Email',
    },
    {
      key: 's',
      altKey: true,
      action: () => onSign?.(),
      description: 'Sign Email',
    },
    {
      key: 'v',
      altKey: true,
      action: () => onView?.(),
      description: 'View Email',
    },
  ];

  useKeyboardShortcuts(emailShortcuts);
}

// Table navigation shortcuts
export function useTableShortcuts(
  onNextPage?: () => void,
  onPrevPage?: () => void,
  onFirstPage?: () => void,
  onLastPage?: () => void
) {
  const tableShortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowRight',
      ctrlKey: true,
      action: () => onNextPage?.(),
      description: 'Next Page',
    },
    {
      key: 'ArrowLeft',
      ctrlKey: true,
      action: () => onPrevPage?.(),
      description: 'Previous Page',
    },
    {
      key: 'Home',
      ctrlKey: true,
      action: () => onFirstPage?.(),
      description: 'First Page',
    },
    {
      key: 'End',
      ctrlKey: true,
      action: () => onLastPage?.(),
      description: 'Last Page',
    },
  ];

  useKeyboardShortcuts(tableShortcuts);
}

// Form shortcuts
export function useFormShortcuts(
  onSubmit?: () => void,
  onCancel?: () => void,
  onSave?: () => void
) {
  const formShortcuts: KeyboardShortcut[] = [
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => onSubmit?.(),
      description: 'Submit Form',
    },
    {
      key: 'Escape',
      action: () => onCancel?.(),
      description: 'Cancel Form',
    },
    {
      key: 's',
      altKey: true,
      action: () => onSave?.(),
      description: 'Save Form',
    },
  ];

  useKeyboardShortcuts(formShortcuts);
}

// Function to show keyboard shortcuts help
function showKeyboardShortcutsHelp() {
  // Create a custom event to trigger the help modal
  const event = new CustomEvent('show-keyboard-shortcuts-help');
  window.dispatchEvent(event);
}
