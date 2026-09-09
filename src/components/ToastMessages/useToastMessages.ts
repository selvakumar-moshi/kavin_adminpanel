/*
 * Copyright (c) 2024 Payhuddle. All rights reserved.
 *
 * This software and associated documentation files are the intellectual
 * property of Payhuddle. Use of this software is governed by the terms
 * of the applicable license agreement.
 *
 * No part of this software may be reproduced, distributed, or transmitted
 * in any form or by any means without the prior written permission of Payhuddle.
 */
import { useState, useCallback } from 'react';
import type { ToastMessage, ToastType } from './ToastMessages';
import { DEFAULT_TOAST_DURATION_MS } from './ToastMessages';

export const useToastMessages = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const resolvedDuration =
      typeof duration === 'number' && duration > 0 ? duration : DEFAULT_TOAST_DURATION_MS;
    const id = Math.random().toString(36).substr(2, 9);
    const newMessage: ToastMessage = {
      id,
      type,
      message,
      duration: resolvedDuration,
    };

    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }, resolvedDuration);
  }, []);

  const hideToast = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast('success', message, duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast('error', message, duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast('warning', message, duration);
  }, [showToast]);

  const clearAll = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    clearAll,
  };
};
