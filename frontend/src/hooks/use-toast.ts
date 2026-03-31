"use client"

import * as React from "react"

// Simple toast types
type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  title?: string
  description?: string
  type: ToastType
}

interface ToastOptions {
  title?: string
  description?: string
  type?: ToastType
}

// Global state
const listeners: Array<(toasts: ToastMessage[]) => void> = []
let toasts: ToastMessage[] = []

function notify() {
  listeners.forEach(listener => listener([...toasts]))
}

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

export function toast(options: ToastOptions) {
  const id = genId()
  const newToast: ToastMessage = {
    id,
    title: options.title,
    description: options.description,
    type: options.type || 'success',
  }

  toasts = [...toasts, newToast]
  notify()

  // Auto dismiss after 3 seconds
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    notify()
  }, 3000)

  return {
    id,
    dismiss: () => {
      toasts = toasts.filter(t => t.id !== id)
      notify()
    }
  }
}

export function useToast() {
  const [state, setState] = React.useState<ToastMessage[]>(toasts)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  const dismiss = React.useCallback((id?: string) => {
    if (id) {
      toasts = toasts.filter(t => t.id !== id)
    } else {
      toasts = []
    }
    notify()
  }, [])

  return {
    toasts: state,
    toast,
    dismiss,
  }
}
