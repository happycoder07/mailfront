import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS, EmailResponseDto } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

interface EmailNotificationSettings {
  enabled: boolean;
  browserNotifications: boolean;
  toastNotifications: boolean;
  soundEnabled: boolean;
  checkInterval: number; // in milliseconds
}

interface UseEmailNotificationsReturn {
  settings: EmailNotificationSettings;
  updateSettings: (newSettings: Partial<EmailNotificationSettings>) => void;
  pendingEmailCount: number;
  lastChecked: Date | null;
  isChecking: boolean;
  manuallyCheck: () => Promise<void>;
  resetNotifications: () => void;
  hasInitialized: boolean;
}

const DEFAULT_SETTINGS: EmailNotificationSettings = {
  enabled: true,
  browserNotifications: true,
  toastNotifications: true,
  soundEnabled: false,
  checkInterval: 60000, // 1 minute (changed from 30 seconds)
};

export function useEmailNotifications(): UseEmailNotificationsReturn {
  const { hasPermission, getCSRFToken } = useAuth();
  const [settings, setSettings] = useState<EmailNotificationSettings>(DEFAULT_SETTINGS);
  const [pendingEmailCount, setPendingEmailCount] = useState<number>(0);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef<boolean>(false);
  const previousPendingEmailsRef = useRef<Set<number>>(new Set());
  const isFirstCheckRef = useRef<boolean>(true);
  const hasInitializedRef = useRef<boolean>(false);

  // Check if user has permission to view emails
  const canViewEmails = hasPermission(PERMISSIONS.VIEW_EMAILS);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('email-notification-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } else {
        // If no saved settings, use defaults and save them
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem('email-notification-settings', JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      // Fallback to default settings if there's an error
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<EmailNotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('email-notification-settings', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save notification settings:', error);
      }
      return updated;
    });
  }, []);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return Notification.permission === 'granted';
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!settings.soundEnabled) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification-sound.mp3');
        audioRef.current.volume = 0.5;
      }
      audioRef.current.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    } catch (error) {
      console.warn('Failed to create audio element:', error);
    }
  }, [settings.soundEnabled]);

  // Show browser notification
  const showBrowserNotification = useCallback((email: EmailResponseDto) => {
    if (!settings.browserNotifications) return;

    requestNotificationPermission().then(hasPermission => {
      if (hasPermission) {
        const notification = new Notification('New Email Pending Approval', {
          body: `From: ${email.from}\nSubject: ${email.subject}`,
          icon: '/favicon.ico',
          tag: `email-${email.id}`,
          requireInteraction: false,
          silent: !settings.soundEnabled,
        });

        notification.onclick = () => {
          window.focus();
          window.open(`/emails/${email.id}`, '_blank');
          notification.close();
        };

        // Auto-close after 10 seconds
        setTimeout(() => {
          notification.close();
        }, 10000);
      }
    });
  }, [settings.browserNotifications, settings.soundEnabled, requestNotificationPermission]);

  // Show toast notification
  const showToastNotification = useCallback((email: EmailResponseDto) => {
    if (!settings.toastNotifications) return;

    toast({
      title: 'New Email Pending Approval',
      description: `From: ${email.from}\nSubject: ${email.subject}\nReceived at ${new Date(email.createdAt).toLocaleTimeString()}`,
      duration: 8000,
    });
  }, [settings.toastNotifications]);

  // Check for new pending emails with debouncing
  const checkForNewEmails = useCallback(async () => {
    if (!canViewEmails || !settings.enabled) return;

    // Prevent multiple simultaneous checks
    if (isCheckingRef.current) return;

    // Debounce: don't check more frequently than every 5 seconds
    const now = Date.now();
    if (now - lastCheckRef.current < 5000) return;

    isCheckingRef.current = true;
    lastCheckRef.current = now;
    setIsChecking(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.MAIL.LIST}?status=PENDING&pageSize=50`, {
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending emails');
      }

      const data = await response.json();
      const pendingEmails = data.items || [];
      const currentPendingIds = new Set(pendingEmails.map((email: EmailResponseDto) => email.id));

      setPendingEmailCount(pendingEmails.length);
      setLastChecked(new Date());

      // Check for new emails (emails that weren't in the previous check)
      const newEmails = pendingEmails.filter((email: EmailResponseDto) =>
        !previousPendingEmailsRef.current.has(email.id)
      );

      // Update previous pending emails set
      previousPendingEmailsRef.current = currentPendingIds as Set<number>;

      // Show notifications for new emails (skip on first check)
      if (newEmails.length > 0 && !isFirstCheckRef.current) {
        playNotificationSound();

        newEmails.forEach((email: EmailResponseDto) => {
          showBrowserNotification(email);
          showToastNotification(email);
        });
      }

      // Mark that we've done the first check
      if (isFirstCheckRef.current) {
        isFirstCheckRef.current = false;
      }

      // Mark that we've initialized (after first successful check)
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
      }
    } catch (error) {
      console.error('Error checking for new emails:', error);
    } finally {
      setIsChecking(false);
      isCheckingRef.current = false;
    }
  }, [
    canViewEmails,
    settings.enabled,
    getCSRFToken,
    playNotificationSound,
    showBrowserNotification,
    showToastNotification
  ]);

  // Manual check function
  const manuallyCheck = useCallback(async () => {
    await checkForNewEmails();
  }, [checkForNewEmails]);

  // Reset notifications function
  const resetNotifications = useCallback(() => {
    previousPendingEmailsRef.current.clear();
    isFirstCheckRef.current = true;
    hasInitializedRef.current = false;
  }, []);

  // Set up interval for checking emails
  useEffect(() => {
    if (!settings.enabled || !canViewEmails) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear previous emails when notifications are disabled
      previousPendingEmailsRef.current.clear();
      hasInitializedRef.current = false;
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial check (with delay to avoid immediate check on mount)
    const initialCheck = setTimeout(() => {
      checkForNewEmails();
    }, 1000);

    // Set up interval
    intervalRef.current = setInterval(checkForNewEmails, settings.checkInterval);

    return () => {
      clearTimeout(initialCheck);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings.enabled, settings.checkInterval, canViewEmails, checkForNewEmails]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Clear previous emails on unmount
      previousPendingEmailsRef.current.clear();
    };
  }, []);

  return {
    settings,
    updateSettings,
    pendingEmailCount,
    lastChecked,
    isChecking,
    manuallyCheck,
    resetNotifications,
    hasInitialized: hasInitializedRef.current,
  };
}
