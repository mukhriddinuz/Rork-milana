import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';

export const [NetworkProvider, useNetwork] = createContextHook(() => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkConnection = useCallback(async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      const online = navigator.onLine;
      console.log('[Network] Browser online status:', online);
      setIsOnline(online);
      if (!online) setWasOffline(true);
      return online;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log('[Network] Connection check passed');
      setIsOnline(true);
      return true;
    } catch {
      console.log('[Network] Connection check failed');
      setIsOnline(false);
      setWasOffline(true);
      return false;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        console.log('[Network] Browser went online');
        setIsOnline(true);

        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = setTimeout(() => {
          setWasOffline(false);
        }, 3000);
      };

      const handleOffline = () => {
        console.log('[Network] Browser went offline');
        setIsOnline(false);
        setWasOffline(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
      };
    }

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        checkConnection();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    checkConnection();

    return () => {
      sub.remove();
    };
  }, [checkConnection]);

  const dismissReconnected = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    isOnline,
    wasOffline,
    checkConnection,
    dismissReconnected,
  };
});
