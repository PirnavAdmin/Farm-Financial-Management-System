import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';

export default function AddExpenseModal({ isOpen, onClose }) {
  const { addExpense, farms, crops, suppliers, farmers } = useFarm();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    farmer: farmers[0]?.name || 'Shyam Reddy',
    farm: farms[0]?.farmName || 'Farm 1 (South Block)',
    crop: crops[0]?.name || 'Cotton',
    category: 'Fertilizers',
    supplier: suppliers[0]?.name || 'Kisan Agro Traders & Chemicals',
    description: 'Purchase of micronutrient sprays',
    amount: '12500',
    paymentMode: 'UPI / PhonePe',
    referenceNumber: '',
    remarks: 'For second vegetative booster application'
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addExpense(formData);
    onClose();
  };

  const expenseCategories = [
    'Seeds',
    'Fertilizers',
    'Pesticides',
    'Labour',
    'Machinery',
    'Diesel',
    'Electricity',
    'Water & Irrigation',
    'Transportation',
    'Land Preparation',
    'Harvesting',
    'Rent / Land Lease',
    'Repairs & Maintenance',
    'Loan Interest',
    'Other Expenses'
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Record Farm Expenditure</h3>
            <p className="modal-subtitle">Log crop input costs, labour wages, fuel, or machinery maintenance</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-3">
            <div className="form-group">
              <label>Expense Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Expense Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                {expenseCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
              <label>Farm</label>
              <select name="farm" value={formData.farm} onChange={handleChange}>
                {farms.map((f) => (
                  <option key={f.id} value={f.farmName}>{f.farmName}</option>
                ))}
                <option value="All Farms / Central Equipment">All Farms / Central Equipment</option>
              </select>
            </div>

            <div className="form-group">
              <label>Crop Allocated</label>
              <select name="crop" value={formData.crop} onChange={handleChange}>
                {crops.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="General Farm Overhead">General Farm Overhead</option>
              </select>
            </div>

            <div className="form-group">
              <label>Supplier / Vendor</label>
              <select name="supplier" value={formData.supplier} onChange={handleChange}>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
                <option value="Local Fuel Station">Local Fuel Station</option>
                <option value="Local Labour Contractor">Local Labour Contractor</option>
                <option value="Direct Purchase / Market">Direct Purchase / Market</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" required />
            </div>

            <div className="form-group">
              <label>Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                <option value="UPI / PhonePe">UPI / PhonePe</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Supplier Credit (Pay Later)">Supplier Credit (Pay Later)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description / Item Details</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Specific purpose of expense" required />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Reference No / Receipt No</label>
              <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} placeholder="Invoice or voucher number" />
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Additional notes" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary btn-danger-action">
              Record Expense (- ₹{Number(formData.amount || 0).toLocaleString('en-IN')})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
