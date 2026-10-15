import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';

export default function AddIncomeModal({ isOpen, onClose }) {
  const { addIncome, farms, crops, buyers, farmers } = useFarm();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    farmer: farmers[0]?.name || 'Shyam Reddy',
    farm: farms[0]?.farmName || 'Farm 1 (South Block)',
    crop: crops[0]?.name || 'Cotton',
    incomeType: 'Crop Sales',
    buyer: buyers[0]?.name || 'Siddipet APMC Cotton & Grain Mandi',
    quantity: '10',
    unit: 'Quintal',
    rate: '7000',
    discount: '0',
    otherCharges: '0',
    paymentMode: 'Bank Transfer (NEFT)',
    bankCash: 'State Bank of India',
    referenceNumber: '',
    remarks: 'Produce delivered to mandi'
  });

  if (!isOpen) return null;

  const grossAmount = (Number(formData.quantity) || 0) * (Number(formData.rate) || 0);
  const netAmount = Math.max(0, grossAmount - (Number(formData.discount) || 0) + (Number(formData.otherCharges) || 0));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addIncome({
      ...formData,
      amount: netAmount,
      grossAmount
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Record Farm Income</h3>
            <p className="modal-subtitle">Add crop sales, dairy, subsidy, or other income streams</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-3">
            <div className="form-group">
              <label>Income Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Income Type</label>
              <select name="incomeType" value={formData.incomeType} onChange={handleChange}>
                <option value="Crop Sales">Crop Sales</option>
                <option value="Milk Sales">Milk Sales</option>
                <option value="Animal Sales">Animal Sales</option>
                <option value="Government Subsidy">Government Subsidy</option>
                <option value="Loan Received">Loan Received</option>
                <option value="Rental Income">Rental Income</option>
                <option value="Other Income">Other Income</option>
              </select>
            </div>

            <div className="form-group">
              <label>Farmer</label>
              <select name="farmer" value={formData.farmer} onChange={handleChange}>
                {farmers.map((f) => (
                  <option key={f.id} value={f.name}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Farm / Land</label>
              <select name="farm" value={formData.farm} onChange={handleChange}>
                {farms.map((f) => (
                  <option key={f.id} value={f.farmName}>{f.farmName} ({f.landArea} Ac)</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Crop</label>
              <select name="crop" value={formData.crop} onChange={handleChange}>
                {crops.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="N/A (General / Farm Level)">N/A (Dairy / Subsidy)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Buyer / Payee</label>
              <select name="buyer" value={formData.buyer} onChange={handleChange}>
                {buyers.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
                <option value="Direct Cash Trader">Direct Cash Trader</option>
                <option value="Government DBT Scheme">Government DBT Scheme</option>
              </select>
            </div>
          </div>

          <div className="form-grid-4">
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" step="any" name="quantity" value={formData.quantity} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Unit</label>
              <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="Quintal / Bags / Tonnes" required />
            </div>

            <div className="form-group">
              <label>Rate (₹ / Unit)</label>
              <input type="number" step="any" name="rate" value={formData.rate} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Discount (₹)</label>
              <input type="number" step="any" name="discount" value={formData.discount} onChange={handleChange} />
            </div>
          </div>

          <div className="calculation-preview">
            <div className="calc-row">
              <span>Gross Amount:</span>
              <strong>₹ {grossAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div className="calc-row">
              <span>Net Receivable Amount:</span>
              <strong className="text-emerald-700">₹ {netAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI / PhonePe / GPay">UPI / PhonePe / GPay</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reference Number / Chalan</label>
              <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} placeholder="e.g. UTR-981248" />
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Transaction notes" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Income (+ ₹{netAmount.toLocaleString('en-IN')})</button>
          </div>
        </form>
      </div>
    </div>
  );
}
