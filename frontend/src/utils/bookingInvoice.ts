import type { ApiBookingResponse } from '@/types';
import {
  BOOKING_STATUS_META,
  DEPOSIT_STATUS_META,
  getBookingDurationLabel,
  getBookingExtraServiceSummary,
  getBookingVehicleName,
} from '@/utils/bookingMapper';
import { formatDateTime, formatVND } from '@/utils/formatters';

interface InvoiceCustomer {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildInvoiceHtml(booking: ApiBookingResponse, customer: InvoiceCustomer) {
  const bookingStatus = BOOKING_STATUS_META[booking.status];
  const depositStatus = DEPOSIT_STATUS_META[booking.depositStatus];
  const vehicleName = getBookingVehicleName(booking);
  const durationLabel = getBookingDurationLabel(booking);
  const generatedAt = formatDateTime(new Date().toISOString());

  const rows = [
    ['Booking Code', booking.bookingCode],
    ['Booking Status', bookingStatus.label],
    ['Reservation Fee Status', depositStatus.label],
    ['Customer', customer.fullName ?? 'Guest'],
    ['Email', customer.email ?? '-'],
    ['Phone Number', customer.phone ?? '-'],
    ['Vehicle', vehicleName],
    ['License Plate', booking.vehicleLicensePlate ?? '-'],
    ['Pick-up', formatDateTime(booking.startTime)],
    ['Return', formatDateTime(booking.endTime)],
    ['Rental Duration', durationLabel],
    ['Pricing Mode', booking.pricingMode],
    ['Free Cancellation Until', formatDateTime(booking.freeCancelUntil)],
    ['Rental Price', formatVND(booking.baseAmount)],
    ['Extra services', `${getBookingExtraServiceSummary(booking)} - ${formatVND(booking.extraServicesAmount)}`],
    ['Delivery Fee', formatVND(booking.deliveryFeeAmount)],
    ['Reservation Fee (30%)', formatVND(booking.reservationFeeAmount)],
    ['Vehicle deposit', formatVND(booking.securityDepositAmount)],
    ['Vehicle deposit status', booking.securityDepositStatus.replaceAll('_', ' ')],
    ['Rental payment due on return', formatVND(booking.finalRentalAmount)],
    ['Booking Total', formatVND(booking.totalAmount)],
  ];

  const tableRows = rows
    .map(([label, value]) => `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td>${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${escapeHtml(booking.bookingCode)}</title>
    <style>
      :root {
        --brand: #78ad44;
        --brand-soft: #eef6e5;
        --ink: #1f2937;
        --muted: #6b7280;
        --line: #e5e7eb;
        --panel: #f8faf8;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f3f5f6;
        color: var(--ink);
        font-family: "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }

      .page {
        max-width: 920px;
        margin: 32px auto;
        background: #ffffff;
        border-radius: 28px;
        padding: 36px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
      }

      .header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: flex-start;
        padding-bottom: 24px;
        margin-bottom: 28px;
        border-bottom: 2px solid var(--line);
      }

      .brand {
        margin: 0 0 8px;
        font-size: 30px;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--brand);
      }

      .title {
        margin: 0 0 10px;
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      .muted {
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }

      .header-meta {
        min-width: 240px;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 18px;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 18px;
      }

      .card-label {
        margin-bottom: 8px;
        font-size: 12px;
        font-weight: 700;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .card-value {
        font-size: 22px;
        font-weight: 800;
        line-height: 1.3;
      }

      .card-value.brand {
        color: var(--brand);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 20px;
      }

      td {
        padding: 15px 18px;
        border-bottom: 1px solid var(--line);
        font-size: 14px;
        line-height: 1.5;
      }

      tr:last-child td {
        border-bottom: none;
      }

      td:first-child {
        width: 32%;
        background: #fbfcfb;
        color: #4b5563;
        font-weight: 700;
      }

      td:last-child {
        font-weight: 700;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
        margin-top: 28px;
        padding-top: 20px;
        border-top: 2px solid var(--line);
      }

      .footer-note {
        max-width: 520px;
      }

      .total {
        padding: 16px 20px;
        border-radius: 18px;
        background: var(--brand-soft);
        color: var(--brand);
        font-size: 28px;
        font-weight: 800;
        white-space: nowrap;
      }

      @media (max-width: 760px) {
        .page {
          margin: 0;
          border-radius: 0;
          padding: 22px;
        }

        .header,
        .footer {
          flex-direction: column;
        }

        .summary {
          grid-template-columns: 1fr;
        }

        .header-meta {
          width: 100%;
        }

        .total {
          width: 100%;
          text-align: center;
        }

        td:first-child,
        td:last-child {
          display: block;
          width: 100%;
        }

        td:first-child {
          border-bottom: none;
          padding-bottom: 6px;
        }

        td:last-child {
          padding-top: 0;
        }
      }

      @media print {
        body {
          background: #ffffff;
        }

        .page {
          margin: 0;
          max-width: none;
          border-radius: 0;
          box-shadow: none;
          padding: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="header">
        <div>
          <p class="brand">RentCity</p>
          <h1 class="title">Booking Invoice</h1>
          <p class="muted">Invoice information is generated directly from the current booking in RentCity.</p>
        </div>
        <div class="header-meta muted">
          <div><strong>Invoice created date:</strong> ${escapeHtml(generatedAt)}</div>
          <div><strong>Booking Code:</strong> ${escapeHtml(booking.bookingCode)}</div>
        </div>
      </section>

      <section class="summary">
        <div class="card">
          <div class="card-label">Booking Status</div>
          <div class="card-value">${escapeHtml(bookingStatus.label)}</div>
        </div>
        <div class="card">
          <div class="card-label">Reservation Fee (30%)</div>
          <div class="card-value brand">${escapeHtml(formatVND(booking.reservationFeeAmount))}</div>
        </div>
        <div class="card">
          <div class="card-label">Booking Total</div>
          <div class="card-value brand">${escapeHtml(formatVND(booking.totalAmount))}</div>
        </div>
      </section>

      <section>
        <table>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </section>

      <section class="footer">
        <div class="footer-note muted">
          Please keep this invoice for reference when you need booking support or customer service assistance.
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export function downloadBookingInvoice(booking: ApiBookingResponse, customer: InvoiceCustomer) {
  const html = buildInvoiceHtml(booking, customer);
  const blob = new Blob(['\uFEFF', html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hoa-don-${booking.bookingCode}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
