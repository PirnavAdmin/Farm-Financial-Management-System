import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createMovement,
  createPurchase,
  deletePurchase,
  loadInventory,
  updatePurchase
} from '../services/inventoryService'

export default function useInventory(screen) {
  const [records, setRecords] = useState([])
  const [inventory, setInventory] = useState([])
  const [farms, setFarms] = useState([])
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLocalFallback, setIsLocalFallback] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  const reload = useCallback(async () => {
    try {
      setError('')
      const data = await loadInventory(screen)
      setRecords(data.records || [])
      setInventory(data.inventory || [])
      setFarms(data.farms || [])
      setCrops(data.crops || [])
      setIsLocalFallback(Boolean(data.isLocalFallback))
      return data
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Unable to load inventory records.')
      throw err
    }
  }, [screen])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    loadInventory(screen)
      .then((data) => {
        if (active) {
          setRecords(data.records || [])
          setInventory(data.inventory || [])
          setFarms(data.farms || [])
          setCrops(data.crops || [])
          setIsLocalFallback(Boolean(data.isLocalFallback))
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.friendlyMessage || err.message || 'Unable to load inventory records.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [screen])

  async function save(values, rawRecord) {
    if (savingRef.current) return false
    savingRef.current = true
    setSaving(true)
    try {
      if (screen === 'Purchases') {
        const purchaseId = rawRecord?.purchaseId || values['Purchase No']
        if (purchaseId && (rawRecord || values['Purchase No'])) {
          await updatePurchase(purchaseId, values, inventory, farms, crops, rawRecord)
        } else {
          await createPurchase(values, inventory, farms, crops)
        }
      } else {
        await createMovement(screen, values, inventory)
      }
      await reload()
      setError('')
      return true
    } catch (err) {
      throw err
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function remove(id) {
    if (screen === 'Purchases') {
      await deletePurchase(id)
      await reload()
      return true
    }
    throw new Error('Delete is not supported for this inventory screen.')
  }

  return { records, inventory, farms, crops, loading, error, isLocalFallback, saving, save, remove, reload }
}
