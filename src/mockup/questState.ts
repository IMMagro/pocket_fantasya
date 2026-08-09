// Progresso della campagna (missioni completate), persistito in localStorage.
// Usa lo stesso event-bus di playerState per la reattività degli hook.
import { useState, useEffect, useCallback } from 'react'

const KEY = 'pocket_fantasya_missions_v1'
const EVENT_NAME = 'pocket_fantasya_state_change'

interface MissionState { completed: number[] }

function notify() {
  try { window.dispatchEvent(new CustomEvent(EVENT_NAME)) } catch {}
}

export function getStoredMissions(): MissionState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.completed)) return { completed: parsed.completed }
    }
  } catch {}
  return { completed: [] }
}

export function saveMissions(state: MissionState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    notify()
  } catch {}
}

export function usePlayerMissions() {
  const [completed, setCompleted] = useState<number[]>(() => getStoredMissions().completed)

  useEffect(() => {
    const handle = () => setCompleted(getStoredMissions().completed)
    window.addEventListener(EVENT_NAME, handle)
    window.addEventListener('storage', handle)
    return () => {
      window.removeEventListener(EVENT_NAME, handle)
      window.removeEventListener('storage', handle)
    }
  }, [])

  // Segna una missione come completata (idempotente). Ritorna true se era nuova.
  const completeMission = useCallback((id: number): boolean => {
    const cur = getStoredMissions().completed
    if (cur.includes(id)) return false
    saveMissions({ completed: [...cur, id] })
    return true
  }, [])

  const isCompleted = useCallback((id: number) => completed.includes(id), [completed])
  // La missione 1 è sempre sbloccata; le altre richiedono la precedente completata.
  const isUnlocked = useCallback((id: number) => id <= 1 || completed.includes(id - 1), [completed])

  return { completed, completeMission, isCompleted, isUnlocked }
}
