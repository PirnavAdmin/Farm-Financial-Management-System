import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';

export default function ReorderModal({ item, isOpen, onClose }) {
  const { reorderStock } = useFarm();
  const [quantity, setQuantity] = useState(20);

  if (!isOpen || !item) return null;

  const totalCost = (Number(quantity) || 0) * (item.unitCost || 0);

  const handleReorder = (e) => {
    e.preventDefault();
    reorderStock(item.id, Number(quantity) || 1);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Reorder Agricultural Input</h3>
            <p className="modal-subtitle">Replenish stock directly from preferred supplier</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleReorder} className="modal-form">
          <div className="stock-info-card">
            <div className="stock-info-name">{item.productName}</div>
            <div className="stock-info-meta">
              <span>Category: <strong>{item.category}</strong></span>
              <span>Supplier: <strong>{item.supplier}</strong></span>
            </div>
            <div className="stock-info-stats">
              <div>
                <small>Current Stock</small>
                <span className="text-red-600 font-bold">{item.currentStock} {item.unit}</span>
              </div>
              <div>
                <small>Reorder Threshold</small>
                <span>{item.reorderLevel} {item.unit}</span>
              </div>
              <div>
                <small>Unit Cost</small>
                <span>₹ {item.unitCost.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="form-group mt-4">
            <label>Order Quantity ({item.unit})</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              required
            />
          </div>

          <div className="calculation-preview">
            <div className="calc-row">
              <span>Total Purchase Invoiced:</span>
              <strong className="text-emerald-700">₹ {totalCost.toLocaleString('en-IN')}</strong>
            </div>
            <div className="calc-row">
              <span>New Stock Level after delivery:</span>
              <strong>{item.currentStock + Number(quantity)} {item.unit}</strong>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Confirm & Restock</button>
          </div>
        </form>
      </div>
    </div>
  );
}
