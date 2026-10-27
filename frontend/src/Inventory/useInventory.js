import { useEffect, useRef, useState } from 'react'
import { createMovement, loadInventory } from '../services/inventoryService'

export default function useInventory(screen) {
  const [records, setRecords] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  useEffect(() => {
    let active = true
    loadInventory(screen).then((data) => {
      if (active) { setRecords(data.records); setInventory(data.inventory) }
    }).catch((err) => { if (active) setError(err.friendlyMessage || err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [screen])
  async function save(values) {
    if (savingRef.current) return false
    savingRef.current = true
    setSaving(true)
    try {
      await createMovement(screen, values, inventory)
      try {
        const data = await loadInventory(screen)
        setRecords(data.records)
        setInventory(data.inventory)
        setError('')
      } catch (err) {
        setError(`Record saved, but refresh failed. Reopen this screen to reload. ${err.friendlyMessage || err.message}`)
      }
      return true
    } finally { savingRef.current = false; setSaving(false) }
  }
  return { records, inventory, loading, error, saving, save }
}
