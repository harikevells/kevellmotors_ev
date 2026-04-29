import Share from 'react-native-share';
import type { Booking } from '../types';

function escapeHtml(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAmount(amount: number | undefined | null): string {
  return `₹${Number(amount ?? 0).toLocaleString('en-IN')}`;
}

function formatDate(value: string | undefined | null): string {
  if (!value) return 'Date pending';
  return new Date(value).toLocaleDateString('en-IN');
}

function invoiceHtml(booking: Booking): string {
  const items = booking.invoiceItems ?? [];
  const total = booking.finalAmount ?? items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const rows = items.length
    ? items.map((item) => `
      <tr>
        <td class="description-cell">
          <div class="item-name">${escapeHtml(item.description)}</div>
          <div class="item-type">${escapeHtml(item.type ?? 'item')}</div>
        </td>
        <td class="amount-cell">${formatAmount(item.amount)}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="2" class="empty-row">No invoice line items recorded</td>
      </tr>
    `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page {
            margin: 0;
            size: A4;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 40px;
            line-height: 1.5;
          }
          .invoice-container { max-width: 800px; margin: 0 auto; }

          /* Header & Logo */
          .header-main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 24px;
          }
          .brand-section { display: flex; align-items: center; gap: 16px; }
          .logo-box {
            width: 64px;
            height: 64px;
            background: #0066cc;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
            flex-shrink: 0;
          }
          .logo-svg { width: 40px; height: 40px; fill: white; }
          .brand-info h1 {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .brand-info p {
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .invoice-meta { text-align: right; }
          .invoice-title {
            font-size: 28px;
            font-weight: 800;
            color: #0066cc;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .meta-item { font-size: 13px; color: #475569; margin-bottom: 2px; }
          .meta-item strong { color: #0f172a; }

          /* Addresses */
          .address-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            gap: 40px;
          }
          .address-box { flex: 1; }
          .label-small {
            font-size: 11px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 4px;
          }
          .address-content { font-size: 14px; color: #334155; }
          .address-content strong { color: #0f172a; font-size: 16px; display: block; margin-bottom: 4px; }

          /* Table */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #f8fafc;
            padding: 12px 15px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
          }
          td {
            padding: 15px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          .description-cell { width: 70%; }
          .item-name { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
          .item-type { font-size: 12px; color: #94a3b8; text-transform: capitalize; }
          .amount-cell {
            width: 30%;
            text-align: right;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
          }
          .empty-row { text-align: center; color: #94a3b8; padding: 40px; font-style: italic; }

          /* Summary Box */
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .summary-box {
            width: 250px;
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .summary-label { font-size: 14px; font-weight: 600; color: #64748b; }
          .summary-total { font-size: 24px; font-weight: 800; color: #0066cc; }

          /* Notes */
          .notes-section {
            margin-bottom: 40px;
            padding: 20px;
            background: #fffcf0;
            border: 1px solid #f1e6c0;
            border-radius: 8px;
          }
          .notes-title { font-size: 12px; font-weight: 700; color: #854d0e; margin-bottom: 8px; text-transform: uppercase; }
          .notes-text { font-size: 13px; color: #92400e; }

          /* Footer */
          .footer {
            border-top: 2px solid #f1f5f9;
            padding-top: 30px;
            text-align: center;
          }
          .footer-text { font-size: 14px; color: #64748b; margin-bottom: 4px; font-weight: 600; }
          .footer-subtext { font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header-main">
            <div class="brand-section">
              <div class="logo-box" style="background:transparent;"><img src="data:image/png;base64,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810fOoGI4IPW2pLGvOxCBEtBSzEslNry0yZBKL3EBfTYea8dzfo9iWrgJSKhszJfXep5q0LfAiyPQEEASSLFHt/cafVz53oktV5cmUQCaNz3aXiIXtIvoTeyxGLba2rG7ckVeVSHZyUAGru6t6ePyGlpuFCdhgP+lAR8KVWjx49jc4N6e3JLN+JZ7lWto2Mf4I5HcZczlhbWg/4cpvXQCJR7QbmvkYjWJQdMqGpENkkeTC4IUqZmlNfBpRHV4+rLbf6iKXbvjfvY/u2wLWAjyCh7FGh8dV0Fh807PrjKtj62G+5vQPELax2ScOfshZNsxapjWfTZYDs2HECQs7vI2EL7zD+/wbatb7a7/riDsX8/jphBe91ls6y8NMFePj0EgxLowvr9ECqWscvetsj27url/T/dNnl6iZ1/0WjWCzA0OrPQb/XF+yMYCH7h6OfhhjOZlO22jqjtbkzalDlzeceAbH75/iXx+OR8AFIGeScTj2cePf744+WNOur0rAQQT2bX9/YNNmnJlFMx367MyevlJluKCNlSm8MLFR9+jAUSUK443YV9/1oCJrpZgTObpxgDeSRQO0hUzVxw+5jxUBspCAYOK+cU3ee6zv0T+qY3hZRXMiEztdyjcjXWyys2dmItm0U227//2yN27bcftht/eZ8riwgsF82nnbvA6qeW2m2/fQLv4SCiWyuYce2Or7ELL1lhOx/fxUYT262XAI8Yes2nQH4P7/69849bbeO6PSh0GZt73Dh77Rtm2+pb99v+vbwoog/fATJY/oVzXzfLatiS5t4/YXJ2H7Z3v/8YfisQhj7liF7oBre6oq/hFAhBsNAl5lcQWlu39rBCabSNGc/G06zLkLjXu5D17mM5grTNnYClpffsq3TncGFHefKsBPDat7zlMGPSA6I8ITBwKd9CDqJXv1M4OhaeuNQamhK2j7FPHrMYmRPZPZY8/JjFyuZbipcrRtFijyQ9qTK810cu58509c/vBeJhkEn02CWX1+PipW5JAYCWhDA2b+lgHv6Qc2YSM6wc75leMVvABoznXDjLdq7ba+se3mddvEha0kObjLztvRdY6779zumt7CaSJBT7fX97vo0aXWh/+vUW27HlgPVQVuWoAvvY351m6x9qRvnstsamQwzpxSwx67elJ4+1U06dxqrkfUjB/fbmd87AZGSFNITh28hiDQly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" style="width:64px;height:64px;object-fit:contain;" /></div>
              <div class="brand-info">
                <h1>Kevell Motors</h1>
                <p>EV Service Excellence</p>
              </div>
            </div>
            <div class="invoice-meta">
              <div class="invoice-title">Invoice</div>
              <div class="meta-item">Invoice No: <strong>#${escapeHtml(booking.invoiceNumber ?? 'Pending')}</strong></div>
              <div class="meta-item">Date: <strong>${formatDate(booking.invoiceDate)}</strong></div>
            </div>
          </div>

          <div class="address-section">
            <div class="address-box">
              <div class="label-small">From</div>
              <div class="address-content">
                <strong>${escapeHtml(booking.franchise?.name ?? 'EVserv Franchise')}</strong>
                ${escapeHtml(booking.franchise?.address?.street ?? '')}<br/>
                ${escapeHtml(booking.franchise?.address?.city ?? '')}
              </div>
            </div>
            <div class="address-box">
              <div class="label-small">Bill To</div>
              <div class="address-content">
                <strong>${escapeHtml(booking.owner?.name ?? 'Customer')}</strong>
                ${escapeHtml(booking.owner?.phone ?? '')}<br/>
                Vehicle: ${escapeHtml(booking.vehicle?.registrationNumber ?? '')}<br/>
                ${escapeHtml(booking.vehicle?.make ?? '')} ${escapeHtml(booking.vehicle?.model ?? '')}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description / Service</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="summary-section">
            <div class="summary-box">
              <div class="summary-row">
                <span class="summary-label">Total Amount</span>
                <span class="summary-total">${formatAmount(total)}</span>
              </div>
            </div>
          </div>

          ${booking.technicianNotes ? `
            <div class="notes-section">
              <div class="notes-title">Technician Notes</div>
              <div class="notes-text">${escapeHtml(booking.technicianNotes)}</div>
            </div>
          ` : ''}

          <div class="footer">
            <div class="footer-text">Thank you for choosing Kevell Motors for your EV service.</div>
            <div class="footer-subtext">For any queries, please contact your service center or visit our website.</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function generateAndShareInvoicePdf(booking: Booking): Promise<string> {
  let generatePDF: (options: {
    html: string;
    fileName?: string;
    directory?: string;
    width?: number;
    height?: number;
    base64?: boolean;
  }) => Promise<{ filePath: string; base64?: string }>;

  try {
    ({ generatePDF } = require('react-native-html-to-pdf'));
  } catch {
    throw new Error('PDF module unavailable');
  }

  try {
    const result = await generatePDF({
      html: invoiceHtml(booking),
      fileName: `invoice-${booking.invoiceNumber ?? booking._id.slice(-6)}`,
      directory: 'Documents',
      width: 612,
      height: 792,
    });

    if (!result || !result.filePath) {
      throw new Error('PDF generation failed to return a file path.');
    }

    await Share.open({
      title: 'Invoice PDF',
      url: `file://${result.filePath}`,
      type: 'application/pdf',
      filename: `invoice-${booking.invoiceNumber ?? booking._id.slice(-6)}`,
    });
  } catch (err: any) {
    if (err && err.message !== 'User did not share') {
      throw err;
    }
  }

  return 'done';
}