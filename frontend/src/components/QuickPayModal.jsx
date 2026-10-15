import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';

export default function QuickPayModal({ payment, isOpen, onClose }) {
  const { payUpcomingPayment } = useFarm();
  const [paymentMode, setPaymentMode] = useState(payment?.mode || 'Bank Transfer (NEFT)');
  const [bankAccount, setBankAccount] = useState('SBI Current A/C - ...4782');
  const [reference, setReference] = useState('');

  if (!isOpen || !payment) return null;

  const handlePay = (e) => {
    e.preventDefault();
    payUpcomingPayment(payment.id);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Settle Scheduled Payment</h3>
            <p className="modal-subtitle">Direct clearance of farm liability</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handlePay} className="modal-form">
          <div className="payment-summary-box">
            <div className="pay-type-tag">{payment.type}</div>
            <div className="pay-party-title">{payment.party}</div>
            <div className="pay-amount-huge">₹ {payment.amount.toLocaleString('en-IN')}</div>
            <div className="pay-meta-text">Scheduled Due Date: <strong>{payment.dueDate}</strong></div>
          </div>

          <div className="form-group mt-3">
            <label>Payment Mode</label>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="Auto-Debit ECS / Direct Transfer">Auto-Debit ECS / Direct Transfer</option>
              <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI (Instant)">UPI (Instant)</option>
              <option value="Cheque Clearance">Cheque Clearance</option>
              <option value="Cash Voucher">Cash Voucher</option>
            </select>
          </div>

          <div className="form-group">
            <label>Debit From Account</label>
            <select value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}>
              <option value="SBI Current A/C - ...4782">State Bank of India (Primary Farm A/c) - ₹3,40,000</option>
              <option value="Union Bank Kisan A/c - ...8571">Union Bank of India (Kisan A/c) - ₹1,85,000</option>
              <option value="Petty Cash Reserve">Farm Office Petty Cash - ₹45,000</option>
            </select>
          </div>

          <div className="form-group">
            <label>Bank Transaction UTR / Ref No</label>
            <input
              type="text"
              placeholder="e.g. UTR-SBI-89214798"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Confirm & Pay ₹{payment.amount.toLocaleString('en-IN')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
