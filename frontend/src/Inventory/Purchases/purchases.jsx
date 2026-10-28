import { useEffect, useMemo, useState } from 'react'
import useInventory from '../useInventory'
import './purchases.css'

const screenName = 'Purchases'
const fields = [
  'Purchase No',
  'Purchase Date',
  'Supplier',
  'Farm',
  'Crop',
  'Product',
  'Quantity',
  'Rate',
  'Discount',
  'Tax',
  'Total',
  'Payment Status'
]
const description = 'Record agricultural input purchases, quantities, costs, and payment status.'

function InventoryField({ field, formValues, setFormValues, inventory, farms = [], crops = [] }) {
  const rawValue = formValues[field]
  const value = rawValue === '\u2014' || rawValue === '-' ? '' : (rawValue ?? '')

  const handleChange = (e) => {
    const val = e.target.value
    setFormValues((prev) => {
      const next = { ...prev, [field]: val }
      if (field === 'Quantity' || field === 'Rate') {
        const q = Number(field === 'Quantity' ? val : next.Quantity) || 0
        const r = Number(field === 'Rate' ? val : next.Rate) || 0
        next.Total = q && r ? String((q * r).toFixed(2)) : (q && r === 0 ? '0' : '')
      }
      if (field === 'Product') {
        const matched = inventory.find((item) => item.itemName === val || String(item.inventoryId) === val)
        if (matched?.supplier && !next.Supplier) {
          next.Supplier = matched.supplier
        }
      }
      return next
    })
  }

  if (field === 'Product') {
    return (
      <select name={field} value={value} required onChange={handleChange}>
        <option value="">Select product</option>
        {inventory.map((item) => (
          <option key={item.inventoryId} value={item.itemName}>
            {item.itemName} (#{item.inventoryId})
          </option>
        ))}
      </select>
    )
  }

  if (field === 'Farm') {
    return (
      <select name={field} value={value} onChange={handleChange}>
        <option value="">Select farm (optional)</option>
        {farms.map((f) => (
          <option key={f.farmId} value={f.farmName}>
            {f.farmName}
          </option>
        ))}
      </select>
    )
  }

  if (field === 'Crop') {
    return (
      <select name={field} value={value} onChange={handleChange}>
        <option value="">Select crop (optional)</option>
        {crops.map((c) => (
          <option key={c.cropId} value={c.cropName}>
            {c.cropName} {c.cropType ? `(${c.cropType})` : ''}
          </option>
        ))}
      </select>
    )
  }

  if (field === 'Payment Status') {
    return (
      <select name={field} value={value || 'Pending'} onChange={handleChange}>
        <option value="Pending">Pending</option>
        <option value="Paid">Paid</option>
        <option value="Part Paid">Part Paid</option>
        <option value="Overdue">Overdue</option>
      </select>
    )
  }

  if (field === 'Purchase No') {
    return <input name={field} value={value} readOnly placeholder="Generated on save" />
  }

  if (field === 'Total') {
    return <input name={field} value={value} readOnly placeholder="Auto calculated (Qty × Rate)" />
  }

  if (field === 'Quantity' || field === 'Rate') {
    return (
      <input
        name={field}
        type="number"
        step="any"
        min="0"
        value={value}
        required
        placeholder={`Enter ${field.toLowerCase()}`}
        onChange={handleChange}
      />
    )
  }

  const dateValue = /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : value

  return (
    <input
      name={field}
      type={field.toLowerCase().includes('date') ? 'date' : 'text'}
      value={field.toLowerCase().includes('date') ? dateValue : value}
      placeholder={`Enter ${field.toLowerCase()}`}
      onChange={handleChange}
    />
  )
}

function InventoryModal({ values, editing, onClose, onSave, inventory, farms, crops, saving }) {
  const [formValues, setFormValues] = useState(() => ({ ...values }))

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form
        className="user-modal"
        onSubmit={(event) => {
          event.preventDefault()
          onSave(formValues)
        }}
      >
        <header className="modal-header">
          <div>
            <span>INVENTORY / {screenName.toUpperCase()}</span>
            <h2>{editing ? `Edit Purchase #${values['Purchase No'] || ''}` : 'Add Purchase Record'}</h2>
            <p>Enter purchase details, farm, crop, costs, and payment status.</p>
          </div>
          <button type="button" className="modal-close" aria-label="Close dialog" onClick={onClose}>
            &times;
          </button>
        </header>
        <div className="modal-body">
          <div className="form-section">
            <div className="form-grid">
              {fields.map((field) => (
                <label
                  className={['Description', 'Remarks', 'Reason'].includes(field) ? 'field-wide' : ''}
                  key={field}
                >
                  {field}
                  <InventoryField
                    field={field}
                    formValues={formValues}
                    setFormValues={setFormValues}
                    inventory={inventory}
                    farms={farms}
                    crops={crops}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
        <footer className="modal-footer">
          <span>Fields follow the backend purchase schema.</span>
          <div>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="save-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : (editing ? 'Update Purchase' : 'Save Record')}
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}

export default function Purchases() {
  const { records, inventory, farms, crops, loading, error, isLocalFallback, saving, save, remove, reload } = useInventory(screenName)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [paymentStatus, setPaymentStatus] = useState('All payment statuses')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const matchesText = fields
        .map((field) => record[field] ?? '')
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase())
      return matchesText && (paymentStatus === 'All payment statuses' || record['Payment Status'] === paymentStatus)
    })
  }, [records, query, paymentStatus])

  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  async function saveRecord(values) {
    try {
      const isEdit = Boolean(modal?.isEdit)
      const success = await save(values, modal?.rawRecord)
      if (success) {
        setModal(null)
        setToast(isEdit ? `Purchase #${modal?.rawRecord?.purchaseId || values['Purchase No']} updated successfully.` : 'Purchase record saved successfully.')
      }
    } catch (err) {
      setToast(err.friendlyMessage || err.message)
    }
  }

  async function deleteRecord(record) {
    const purchaseId = record['Purchase No'] || record._raw?.purchaseId
    if (!purchaseId) return
    const confirmMsg = `Are you sure you want to delete Purchase #${purchaseId} (${record.Product})?`
    if (!window.confirm(confirmMsg)) return
    try {
      await remove(purchaseId)
      setToast(`Purchase #${purchaseId} deleted successfully.`)
    } catch (err) {
      setToast(err.friendlyMessage || err.message)
    }
  }

  return (
    <div className="users-page inventory-screen">
      <div className="users-title-row">
        <div>
          <div className="users-eyebrow">
            INVENTORY <span>/</span> {screenName.toUpperCase()}
          </div>
          <h1>
            {screenName}
            {isLocalFallback ? (
              <span className="inventory-mode-badge offline" title="Backend endpoint is offline. Using local development data source.">
                Demo Mode
              </span>
            ) : (
              <span className="inventory-mode-badge" title="Connected to live backend.">
                Live API
              </span>
            )}
          </h1>
          <p>{description}</p>
        </div>
        <button
          className="users-add"
          type="button"
          onClick={() => {
            setModal({
              isEdit: false,
              rawRecord: null,
              values: {
                'Purchase No': '',
                'Purchase Date': new Date().toISOString().slice(0, 10),
                Supplier: '',
                Farm: farms[0]?.farmName || '',
                Crop: crops[0]?.cropName || '',
                Product: inventory[0]?.itemName || '',
                Quantity: '',
                Rate: '',
                Discount: '—',
                Tax: '—',
                Total: '',
                'Payment Status': 'Pending'
              }
            })
          }}
        >
          <span>+</span> Add Purchase
        </button>
      </div>

      <div className="users-stats">
        <article>
          <span className="stat-symbol">&#128230;</span>
          <div>
            <small>TOTAL RECORDS</small>
            <strong>{records.length}</strong>
            <span className="stat-hint">In this workspace</span>
          </div>
          <b className="stat-arrow">&#8599;</b>
        </article>
        <article>
          <span className="stat-symbol active-symbol">&#128196;</span>
          <div>
            <small>ROWS ON PAGE</small>
            <strong>{pageRows.length}</strong>
            <span className="stat-hint">Currently displayed</span>
          </div>
        </article>
        <article>
          <span className="stat-symbol inactive-symbol">&#128269;</span>
          <div>
            <small>MATCHING FILTERS</small>
            <strong>{filtered.length}</strong>
            <span className="stat-hint">Search results</span>
          </div>
        </article>
      </div>

      <section className="users-panel">
        <div className="users-toolbar">
          <div className="user-search">
            <span>&#128269;</span>
            <input
              aria-label={`Search ${screenName}`}
              placeholder={`Search ${screenName.toLowerCase()}...`}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </div>
          {fields.includes('Payment Status') && (
            <select
              aria-label="Filter by payment status"
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value)
                setPage(1)
              }}
            >
              <option>All payment statuses</option>
              {[...new Set(records.map((record) => record['Payment Status']).filter(Boolean))].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          )}
          <button
            className="reset-button"
            type="button"
            onClick={() => {
              setQuery('')
              setPaymentStatus('All payment statuses')
              setPage(1)
            }}
          >
            &#8634; <span>Reset Filters</span>
          </button>
        </div>

        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                {fields.map((field) => (
                  <th key={field} style={{ fontWeight: 'bold' }}>
                    {field.toUpperCase()}
                  </th>
                ))}
                <th style={{ fontWeight: 'bold' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={fields.length + 1}>
                    <div className="users-empty">
                      <span>&#128269;</span>
                      <strong>Loading purchases records...</strong>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={fields.length + 1}>
                    <div className="users-empty">
                      <span style={{ color: '#c46c5b' }}>&#9888;</span>
                      <strong style={{ color: '#c46c5b' }}>Unable to load inventory</strong>
                      <p>{error}</p>
                      <button type="button" onClick={() => reload()}>
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1}>
                    <div className="users-empty">
                      <span>&#128269;</span>
                      <strong>No {screenName.toLowerCase()} records found</strong>
                      <p>Try clearing your search or filters.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('')
                          setPaymentStatus('All payment statuses')
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((record) => {
                  const index = records.indexOf(record)
                  const st = String(record['Payment Status'] || 'Pending').toLowerCase().replace(/\s+/g, '-')
                  return (
                    <tr key={`${screenName}-${index}`}>
                      {fields.map((field, fieldIndex) => (
                        <td className={fieldIndex === 0 ? 'user-id' : ''} key={field}>
                          {field === 'Payment Status' ? (
                            <span className={`status-badge ${st === 'paid' ? 'active' : st === 'pending' ? 'inactive' : st}`}>
                              <i />
                              {record[field] || 'Pending'}
                            </span>
                          ) : (
                            record[field] !== undefined && record[field] !== null && record[field] !== ''
                              ? record[field]
                              : '\u2014'
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="user-actions">
                          <button
                            type="button"
                            title="Edit"
                            aria-label={`Edit ${screenName} record`}
                            onClick={() => {
                              setModal({
                                isEdit: true,
                                rawRecord: record._raw,
                                values: { ...record }
                              })
                            }}
                          >
                            &#9998;
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete ${screenName} record`}
                            onClick={() => deleteRecord(record)}
                          >
                            &#128465;
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="users-table-footer">
          <span>
            Showing{' '}
            <strong>
              {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}&ndash;
              {Math.min(currentPage * pageSize, filtered.length)}
            </strong>{' '}
            of <strong>{filtered.length}</strong> records
          </span>
          <div className="pagination">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              &lsaquo;
            </button>
            {Array.from({ length: pageCount }, (_, idx) => (
              <button
                type="button"
                className={currentPage === idx + 1 ? 'current' : ''}
                key={idx}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              &rsaquo;
            </button>
          </div>
        </div>
      </section>

      <div className="users-disclaimer">
        {isLocalFallback ? (
          <span>
            Local Development Data Source <span>&bull;</span> Backend is offline. Realistic demo records loaded. Full CRUD (Add, Edit, Delete) is operational.
          </span>
        ) : (
          <span>
            Live Backend Connected <span>&bull;</span> Inventory records synchronized with backend server.
          </span>
        )}
      </div>

      {modal && (
        <InventoryModal
          values={modal.values}
          editing={modal.isEdit}
          onClose={() => setModal(null)}
          onSave={saveRecord}
          inventory={inventory}
          farms={farms}
          crops={crops}
          saving={saving}
        />
      )}

      {toast && (
        <div className="user-toast" role="status">
          <span>&#10003;</span>
          {toast}
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>
            &times;
          </button>
        </div>
      )}
    </div>
  )
}
