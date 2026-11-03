import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ADJUSTMENT_REASONS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_ADJUSTMENT,
  INITIAL_STOCK_IN,
  INITIAL_STOCK_LEDGER,
  INITIAL_STOCK_OUT,
  INITIAL_STOCK_TRANSFER,
  INVENTORY_CATEGORIES,
  INVENTORY_LOCATIONS,
  INVENTORY_UNITS,
  USAGE_PURPOSES,
} from './inventoryMockData.js'

const STORAGE_KEY_PRODUCTS = 'agriman_inventory_products_v3'
const STORAGE_KEY_STOCK_IN = 'agriman_inventory_stock_in_v3'
const STORAGE_KEY_STOCK_OUT = 'agriman_inventory_stock_out_v3'
const STORAGE_KEY_STOCK_TRANSFER = 'agriman_inventory_stock_transfer_v3'
const STORAGE_KEY_STOCK_ADJUSTMENT = 'agriman_inventory_stock_adjustment_v3'
const STORAGE_KEY_STOCK_LEDGER = 'agriman_inventory_stock_ledger_v3'

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (err) {
    console.warn(`[InventoryStorage] Failed reading ${key}:`, err)
  }
  return fallback
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[InventoryStorage] Failed writing ${key}:`, err)
  }
}

const InventoryContext = createContext(null)

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState(() => loadFromStorage(STORAGE_KEY_PRODUCTS, INITIAL_PRODUCTS))
  const [stockInRecords, setStockInRecords] = useState(() => loadFromStorage(STORAGE_KEY_STOCK_IN, INITIAL_STOCK_IN))
  const [stockOutRecords, setStockOutRecords] = useState(() => loadFromStorage(STORAGE_KEY_STOCK_OUT, INITIAL_STOCK_OUT))
  const [stockTransferRecords, setStockTransferRecords] = useState(() => loadFromStorage(STORAGE_KEY_STOCK_TRANSFER, INITIAL_STOCK_TRANSFER))
  const [stockAdjustmentRecords, setStockAdjustmentRecords] = useState(() => loadFromStorage(STORAGE_KEY_STOCK_ADJUSTMENT, INITIAL_STOCK_ADJUSTMENT))
  const [stockLedgerRecords, setStockLedgerRecords] = useState(() => loadFromStorage(STORAGE_KEY_STOCK_LEDGER, INITIAL_STOCK_LEDGER))
  const [prefilledStockInProduct, setPrefilledStockInProduct] = useState(null)

  // Persist state changes
  useEffect(() => { saveToStorage(STORAGE_KEY_PRODUCTS, products) }, [products])
  useEffect(() => { saveToStorage(STORAGE_KEY_STOCK_IN, stockInRecords) }, [stockInRecords])
  useEffect(() => { saveToStorage(STORAGE_KEY_STOCK_OUT, stockOutRecords) }, [stockOutRecords])
  useEffect(() => { saveToStorage(STORAGE_KEY_STOCK_TRANSFER, stockTransferRecords) }, [stockTransferRecords])
  useEffect(() => { saveToStorage(STORAGE_KEY_STOCK_ADJUSTMENT, stockAdjustmentRecords) }, [stockAdjustmentRecords])
  useEffect(() => { saveToStorage(STORAGE_KEY_STOCK_LEDGER, stockLedgerRecords) }, [stockLedgerRecords])

  // Low stock products automatically identified
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => p.status === 'Active' && Number(p.currentStock) <= Number(p.minimumStockLevel))
      .map((p) => {
        const cur = Number(p.currentStock)
        const min = Number(p.minimumStockLevel)
        const deficit = Math.max(0, min - cur)
        let severity = 'Low Stock'
        if (cur <= 0) severity = 'Out of Stock'
        else if (cur <= min * 0.5) severity = 'Critical Low'
        return {
          ...p,
          deficit,
          severity,
          healthPercent: min > 0 ? Math.min(100, Math.round((cur / min) * 100)) : 100,
        }
      })
      .sort((a, b) => {
        // Sort out of stock first, then critical, then low
        const weight = { 'Out of Stock': 0, 'Critical Low': 1, 'Low Stock': 2 }
        return (weight[a.severity] ?? 3) - (weight[b.severity] ?? 3) || a.currentStock - b.currentStock
      })
  }, [products])

  // Add Product
  const addProduct = useCallback((productData) => {
    const opening = Number(productData.openingStock) || 0
    const minLevel = Number(productData.minimumStockLevel) || 0
    const category = productData.category || 'Other Consumables'
    const catCode = category.slice(0, 3).toUpperCase()
    const newId = Date.now()
    const productCode = productData.productCode?.trim() || `PRD-${catCode}-${String(newId).slice(-4)}`

    const newProduct = {
      id: newId,
      productCode,
      productName: productData.productName.trim(),
      category,
      unit: productData.unit || 'Piece',
      minimumStockLevel: minLevel,
      openingStock: opening,
      currentStock: opening,
      costPrice: Number(productData.costPrice) || 0,
      supplier: productData.supplier?.trim() || '',
      description: productData.description?.trim() || '',
      status: productData.status || 'Active',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    setProducts((prev) => [newProduct, ...prev])

    // Create an Opening Stock entry in Stock Ledger if opening > 0
    if (opening > 0) {
      const ledgerEntry = {
        id: `LED-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        transactionId: `OPN-${String(newId).slice(-4)}`,
        productCode: newProduct.productCode,
        productName: newProduct.productName,
        category: newProduct.category,
        type: 'Opening Stock',
        inwardQty: opening,
        outwardQty: 0,
        balance: opening,
        unit: newProduct.unit,
        partyOrLocation: 'Initial Inventory Setup',
        remarks: 'Opening stock recorded upon product creation',
      }
      setStockLedgerRecords((prev) => [ledgerEntry, ...prev])
    }

    return newProduct
  }, [])

  // Update Product
  const updateProduct = useCallback((id, updatedData) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        return {
          ...p,
          ...updatedData,
          minimumStockLevel: Number(updatedData.minimumStockLevel ?? p.minimumStockLevel),
          costPrice: Number(updatedData.costPrice ?? p.costPrice),
        }
      })
    )
  }, [])

  // Delete Product
  const deleteProduct = useCallback((id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Stock In: increases available stock
  const recordStockIn = useCallback((entry) => {
    const qty = Number(entry.quantity)
    const unitPrice = Number(entry.unitPrice) || 0
    const totalAmount = qty * unitPrice
    const transactionId = `SIN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const date = entry.purchaseDate || new Date().toISOString().slice(0, 10)

    let updatedProduct = null

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === Number(entry.productId) || p.productCode === entry.productCode) {
          const newCurrent = Number(p.currentStock) + qty
          updatedProduct = { ...p, currentStock: newCurrent }
          return updatedProduct
        }
        return p
      })
    )

    const newRecord = {
      id: transactionId,
      productId: entry.productId,
      productCode: entry.productCode,
      productName: entry.productName,
      category: entry.category,
      quantity: qty,
      unit: entry.unit,
      unitPrice,
      totalAmount,
      supplierName: entry.supplierName,
      purchaseDate: date,
      invoiceNumber: entry.invoiceNumber,
      remarks: entry.remarks || '',
      createdAt: new Date().toISOString(),
    }

    setStockInRecords((prev) => [newRecord, ...prev])

    // Update Stock Ledger
    setStockLedgerRecords((prev) => {
      const priorBalance = updatedProduct ? updatedProduct.currentStock : qty
      const ledgerEntry = {
        id: `LED-${Date.now()}`,
        date,
        transactionId,
        productCode: entry.productCode,
        productName: entry.productName,
        category: entry.category,
        type: 'Stock In',
        inwardQty: qty,
        outwardQty: 0,
        balance: priorBalance,
        unit: entry.unit,
        partyOrLocation: entry.supplierName || 'Supplier Inward',
        remarks: `Invoice #${entry.invoiceNumber || '—'}. ${entry.remarks || ''}`.trim(),
      }
      return [ledgerEntry, ...prev]
    })

    return newRecord
  }, [])

  // Stock Out: decreases available stock with validation
  const recordStockOut = useCallback((entry) => {
    const qty = Number(entry.quantity)
    const targetProduct = products.find((p) => p.id === Number(entry.productId) || p.productCode === entry.productCode)

    if (!targetProduct) {
      throw new Error('Please select a valid inventory product.')
    }

    if (qty <= 0) {
      throw new Error('Issued quantity must be greater than zero.')
    }

    if (qty > Number(targetProduct.currentStock)) {
      throw new Error(
        `Insufficient stock! Requested ${qty} ${targetProduct.unit}, but only ${targetProduct.currentStock} ${targetProduct.unit} available in inventory.`
      )
    }

    const transactionId = `SOUT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const date = entry.issueDate || new Date().toISOString().slice(0, 10)
    let newBalance = 0

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === targetProduct.id) {
          newBalance = Math.max(0, Number(p.currentStock) - qty)
          return { ...p, currentStock: newBalance }
        }
        return p
      })
    )

    const newRecord = {
      id: transactionId,
      productId: targetProduct.id,
      productCode: targetProduct.productCode,
      productName: targetProduct.productName,
      category: targetProduct.category,
      quantity: qty,
      unit: targetProduct.unit,
      usagePurpose: entry.usagePurpose,
      issueDate: date,
      issuedTo: entry.issuedTo || 'Field Operation',
      referenceNumber: entry.referenceNumber || '',
      remarks: entry.remarks || '',
      createdAt: new Date().toISOString(),
    }

    setStockOutRecords((prev) => [newRecord, ...prev])

    // Update Stock Ledger
    setStockLedgerRecords((prev) => {
      const ledgerEntry = {
        id: `LED-${Date.now()}`,
        date,
        transactionId,
        productCode: targetProduct.productCode,
        productName: targetProduct.productName,
        category: targetProduct.category,
        type: 'Stock Out',
        inwardQty: 0,
        outwardQty: qty,
        balance: newBalance,
        unit: targetProduct.unit,
        partyOrLocation: `${entry.issuedTo || 'Field'}${entry.usagePurpose ? ` (${entry.usagePurpose})` : ''}`,
        remarks: `Ref #${entry.referenceNumber || '—'}. ${entry.remarks || ''}`.trim(),
      }
      return [ledgerEntry, ...prev]
    })

    return newRecord
  }, [products])

  // Stock Transfer: transfers stock between locations
  const recordStockTransfer = useCallback((entry) => {
    const qty = Number(entry.quantity)
    const targetProduct = products.find((p) => p.id === Number(entry.productId) || p.productCode === entry.productCode)

    if (!targetProduct) {
      throw new Error('Please select a valid product to transfer.')
    }

    if (qty <= 0) {
      throw new Error('Transfer quantity must be greater than zero.')
    }

    if (qty > Number(targetProduct.currentStock)) {
      throw new Error(
        `Cannot transfer ${qty} ${targetProduct.unit}. Available system stock is only ${targetProduct.currentStock} ${targetProduct.unit}.`
      )
    }

    if (!entry.sourceLocation || !entry.destinationLocation) {
      throw new Error('Source location and destination location are both required.')
    }

    if (entry.sourceLocation === entry.destinationLocation) {
      throw new Error('Source location and destination location cannot be the same.')
    }

    const transactionId = `TRF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const date = entry.transferDate || new Date().toISOString().slice(0, 10)

    const newRecord = {
      id: transactionId,
      productId: targetProduct.id,
      productCode: targetProduct.productCode,
      productName: targetProduct.productName,
      category: targetProduct.category,
      quantity: qty,
      unit: targetProduct.unit,
      sourceLocation: entry.sourceLocation,
      destinationLocation: entry.destinationLocation,
      transferDate: date,
      referenceNumber: entry.referenceNumber || '',
      remarks: entry.remarks || '',
      createdAt: new Date().toISOString(),
    }

    setStockTransferRecords((prev) => [newRecord, ...prev])

    // Update Stock Ledger
    setStockLedgerRecords((prev) => {
      const ledgerEntry = {
        id: `LED-${Date.now()}`,
        date,
        transactionId,
        productCode: targetProduct.productCode,
        productName: targetProduct.productName,
        category: targetProduct.category,
        type: 'Stock Transfer',
        inwardQty: 0,
        outwardQty: 0,
        balance: targetProduct.currentStock,
        unit: targetProduct.unit,
        partyOrLocation: `${entry.sourceLocation} ➔ ${entry.destinationLocation}`,
        remarks: `Transferred ${qty} ${targetProduct.unit}. Ref: ${entry.referenceNumber || '—'}`,
      }
      return [ledgerEntry, ...prev]
    })

    return newRecord
  }, [products])

  // Stock Adjustment: reconciles physical stock with system stock
  const recordStockAdjustment = useCallback((entry) => {
    const physical = Number(entry.physicalStock)
    const targetProduct = products.find((p) => p.id === Number(entry.productId) || p.productCode === entry.productCode)

    if (!targetProduct) {
      throw new Error('Please select a valid inventory product.')
    }

    if (physical < 0 || Number.isNaN(physical)) {
      throw new Error('Actual physical stock count cannot be negative.')
    }

    const currentSys = Number(targetProduct.currentStock)
    const difference = physical - currentSys
    const adjustmentType = difference >= 0 ? 'Increase' : 'Decrease'
    const transactionId = `ADJ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const date = entry.adjustmentDate || new Date().toISOString().slice(0, 10)

    // Update product current stock to physical count
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === targetProduct.id) {
          return { ...p, currentStock: physical }
        }
        return p
      })
    )

    const newRecord = {
      id: transactionId,
      productId: targetProduct.id,
      productCode: targetProduct.productCode,
      productName: targetProduct.productName,
      category: targetProduct.category,
      systemStock: currentSys,
      physicalStock: physical,
      difference,
      adjustmentType,
      reason: entry.reason || 'Physical Count Discrepancy',
      adjustmentDate: date,
      remarks: entry.remarks || '',
      createdAt: new Date().toISOString(),
    }

    setStockAdjustmentRecords((prev) => [newRecord, ...prev])

    // Update Stock Ledger
    setStockLedgerRecords((prev) => {
      const inwardQty = difference > 0 ? difference : 0
      const outwardQty = difference < 0 ? Math.abs(difference) : 0
      const ledgerEntry = {
        id: `LED-${Date.now()}`,
        date,
        transactionId,
        productCode: targetProduct.productCode,
        productName: targetProduct.productName,
        category: targetProduct.category,
        type: 'Stock Adjustment',
        inwardQty,
        outwardQty,
        balance: physical,
        unit: targetProduct.unit,
        partyOrLocation: 'Inventory Reconciliation Audit',
        remarks: `${adjustmentType} of ${Math.abs(difference)} ${targetProduct.unit} (${entry.reason || 'Audit'}). ${entry.remarks || ''}`.trim(),
      }
      return [ledgerEntry, ...prev]
    })

    return newRecord
  }, [products])

  // Reset all inventory to original mock defaults
  const resetToDefaults = useCallback(() => {
    setProducts(INITIAL_PRODUCTS)
    setStockInRecords(INITIAL_STOCK_IN)
    setStockOutRecords(INITIAL_STOCK_OUT)
    setStockTransferRecords(INITIAL_STOCK_TRANSFER)
    setStockAdjustmentRecords(INITIAL_STOCK_ADJUSTMENT)
    setStockLedgerRecords(INITIAL_STOCK_LEDGER)
  }, [])

  const value = {
    products,
    categories: INVENTORY_CATEGORIES,
    locations: INVENTORY_LOCATIONS,
    units: INVENTORY_UNITS,
    usagePurposes: USAGE_PURPOSES,
    adjustmentReasons: ADJUSTMENT_REASONS,
    stockInRecords,
    stockOutRecords,
    stockTransferRecords,
    stockAdjustmentRecords,
    stockLedgerRecords,
    lowStockProducts,
    prefilledStockInProduct,
    setPrefilledStockInProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    recordStockIn,
    recordStockOut,
    recordStockTransfer,
    recordStockAdjustment,
    resetToDefaults,
  }

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventoryContext() {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error('useInventoryContext must be used within an InventoryProvider')
  }
  return context
}
