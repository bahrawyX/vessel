import { useEffect, useState } from 'react'

const formatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Africa/Cairo',
})

/** Live HH:MM:SS in Cairo, ticking every second. */
export function useClock(): string {
  const [time, setTime] = useState(() => formatter.format(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatter.format(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return time
}
