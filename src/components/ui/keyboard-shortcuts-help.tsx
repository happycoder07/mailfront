'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Keyboard, HelpCircle } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { key: 'Ctrl + 1', description: 'Go to Emails', category: 'Navigation' },
  { key: 'Ctrl + 2', description: 'Go to Contacts', category: 'Navigation' },
  { key: 'Ctrl + 3', description: 'Go to Contact Lists', category: 'Navigation' },
  { key: 'Ctrl + 4', description: 'Go to Queue', category: 'Navigation' },
  { key: 'Ctrl + 5', description: 'Go to Monitoring', category: 'Navigation' },
  { key: 'Ctrl + 6', description: 'Go to Users', category: 'Navigation' },
  { key: 'Ctrl + 7', description: 'Go to Profile', category: 'Navigation' },
  { key: 'Alt + H', description: 'Go to Home', category: 'Navigation' },

  // Actions
  { key: 'Alt + N', description: 'Create New Email', category: 'Actions' },
  { key: 'Ctrl + F', description: 'Focus Search Input', category: 'Actions' },
  { key: 'Alt + R', description: 'Refresh Page', category: 'Actions' },
  { key: 'Ctrl + Q', description: 'Logout', category: 'Actions' },

  // Email Management
  { key: 'Alt + A', description: 'Approve Email (first pending)', category: 'Email Management' },
  { key: 'Alt + R', description: 'Reject Email (first pending)', category: 'Email Management' },
  { key: 'Alt + S', description: 'Sign Email (first pending)', category: 'Email Management' },
  { key: 'Alt + V', description: 'View Email (first in list)', category: 'Email Management' },

  // Table Navigation
  { key: 'Ctrl + →', description: 'Next Page', category: 'Table Navigation' },
  { key: 'Ctrl + ←', description: 'Previous Page', category: 'Table Navigation' },
  { key: 'Ctrl + Home', description: 'First Page', category: 'Table Navigation' },
  { key: 'Ctrl + End', description: 'Last Page', category: 'Table Navigation' },

  // Forms
  { key: 'Ctrl + Enter', description: 'Submit Form', category: 'Forms' },
  { key: 'Escape', description: 'Cancel Form / Close Dialog', category: 'Forms' },
  { key: 'Alt + S', description: 'Save Form', category: 'Forms' },

  // General
  { key: 'Escape', description: 'Close Dialog/Modal', category: 'General' },
  { key: 'Alt + K', description: 'Show Keyboard Shortcuts', category: 'General' },
];

const categories = [
  'Navigation',
  'Actions',
  'Email Management',
  'Table Navigation',
  'Forms',
  'General',
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  // Listen for the custom event to show the help modal
  useEffect(() => {
    const handleShowHelp = () => {
      setOpen(true);
    };

    window.addEventListener('show-keyboard-shortcuts-help', handleShowHelp);
    return () => {
      window.removeEventListener('show-keyboard-shortcuts-help', handleShowHelp);
    };
  }, []);

  const groupedShortcuts = categories.map(category => ({
    category,
    shortcuts: shortcuts.filter(s => s.category === category),
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground"
          aria-label="Show keyboard shortcuts"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-foreground">
            Use these keyboard shortcuts to navigate and perform actions quickly. Shortcuts are
            context-aware and may not work when typing in input fields.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {groupedShortcuts.map(({ category, shortcuts: categoryShortcuts }) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">{category}</h3>
              <div className="grid gap-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Use Alt + K anytime to show this help dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to show keyboard shortcuts help programmatically
export function useShowKeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);

  const showKeyboardShortcuts = () => {
    setShowHelp(true);
  };

  return { showHelp, setShowHelp, showKeyboardShortcuts };
}
