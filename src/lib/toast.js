let counter = 0
let toasts = []
const listeners = new Set()
const timers = new Map()

function emit() {
  for (const listener of listeners) listener([...toasts])
}

export function dismissToast(id) {
  toasts = toasts.filter((item) => item.id !== id)
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  emit()
}

function push(type, message, duration = 4200) {
  const id = ++counter
  toasts = [...toasts, { id, type, message }]
  emit()
  timers.set(
    id,
    setTimeout(() => dismissToast(id), duration),
  )
  return id
}

export const toast = {
  success: (message) => push('success', message),
  error: (message) => push('error', message, 5600),
  info: (message) => push('info', message),
}

export function subscribeToasts(listener) {
  listeners.add(listener)
  listener([...toasts])
  return () => listeners.delete(listener)
}
