import { Injectable } from '@nestjs/common';
import { PricingDocument } from './document.schema';

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class DocumentPrintService {
  render(document: PricingDocument): string {
    const rows = document.lineItems
      .map(
        (li) => `
      <tr>
        <td>${escapeHtml(li.description)}</td>
        <td class="num">${li.quantity}</td>
        <td class="num">${li.unitPrice.toFixed(2)}</td>
        <td class="num">${centsToDisplay(li.discountAmountCents)}</td>
        <td class="num">${centsToDisplay(li.taxAmountCents)}</td>
        <td class="num">${centsToDisplay(li.lineTotalCents)}</td>
      </tr>`
      )
      .join('');

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(document.title)}</title>
<style>
  body { font-family: sans-serif; margin: 2rem; color: #111; }
  h1 { margin-bottom: 0; }
  .meta { color: #555; margin-bottom: 1.5rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
  .num { text-align: right; }
  tfoot td { font-weight: bold; }
  .status { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
</style>
</head>
<body>
  <h1>${escapeHtml(document.title)}</h1>
  <div class="meta">
    <div>Customer: ${escapeHtml(document.customer)}</div>
    <div>Issue date: ${document.issueDate.toISOString().slice(0, 10)}</div>
    <div class="status">Status: ${document.status}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty</th>
        <th class="num">Unit price</th>
        <th class="num">Discount</th>
        <th class="num">Tax</th>
        <th class="num">Line total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3"></td>
        <td class="num">${centsToDisplay(document.totalDiscountCents)}</td>
        <td class="num">${centsToDisplay(document.totalTaxCents)}</td>
        <td class="num">${centsToDisplay(document.grandTotalCents)}</td>
      </tr>
      <tr>
        <td colspan="5">Subtotal</td>
        <td class="num">${centsToDisplay(document.subtotalCents)}</td>
      </tr>
      <tr>
        <td colspan="5">Grand total</td>
        <td class="num">${centsToDisplay(document.grandTotalCents)}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
  }
}
