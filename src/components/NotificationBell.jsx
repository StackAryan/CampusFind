import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeTable,
} from '../lib/api'
import { cn, timeAgo } from '../lib/utils'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)

  const load = useCallback(() => {
    if (!user) return undefined
    return listNotifications()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    let active = true
    if (!user) return undefined
    listNotifications()
      .then((notifications) => {
        if (active) setItems(notifications)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => subscribeTable('notifications', load), [load])

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (!user) return null

  const unread = items.filter((notification) => !notification.read).length

  const openNotification = async (notification) => {
    setOpen(false)
    if (!notification.read) {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      )
      markNotificationRead(notification.id).catch(() => {})
    }
    if (notification.link) navigate(notification.link)
  }

  const markAll = () => {
    markAllNotificationsRead()
      .then(() => setItems((current) => current.map((item) => ({ ...item, read: true }))))
      .catch(() => {})
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className={cn(
          'relative grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-ink/65 transition hover:border-ink/20 hover:text-ink',
          open && 'border-ink/25 text-ink',
        )}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-rise absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold">Notifications</h3>
              {unread > 0 && (
                <span className="chip bg-coral-soft !px-2 !py-0.5 text-coral">{unread} new</span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-moss hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-ink/45">Loading…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="h-7 w-7 text-ink/25" />
                <p className="text-sm text-ink/50">No notifications yet.</p>
                <p className="text-xs text-ink/35">
                  We will let you know when a claim or report changes.
                </p>
              </div>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => openNotification(notification)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-line/70 px-4 py-3 text-left transition last:border-b-0 hover:bg-cream/70',
                    !notification.read && 'bg-moss-soft/25',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      notification.read ? 'bg-line' : 'bg-moss',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold leading-snug text-ink">
                        {notification.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-ink/35">
                        {timeAgo(notification.created_at)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink/55">
                      {notification.body}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
