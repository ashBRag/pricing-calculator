import type { PricingDocument } from "@/types/api";
import { formatCents } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function DocumentSummary({ document }: { document: PricingDocument }) {
  return (
    <Card>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit price</th>
            <th className="py-2 text-right">Discount</th>
            <th className="py-2 text-right">Tax</th>
            <th className="py-2 text-right">Line total</th>
          </tr>
        </thead>
        <tbody>
          {document.lineItems.map((item) => (
            <tr key={item._id} className="border-b border-slate-100 last:border-b-0">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatCents(item.unitPrice * 100)}</td>
              <td className="py-2 text-right">{formatCents(item.discountAmountCents)}</td>
              <td className="py-2 text-right">{formatCents(item.taxAmountCents)}</td>
              <td className="py-2 text-right font-medium">
                {formatCents(item.lineTotalCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex flex-col items-end gap-1 text-sm">
        <div className="flex w-48 justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatCents(document.subtotalCents)}</span>
        </div>
        <div className="flex w-48 justify-between text-slate-600">
          <span>Discount</span>
          <span>-{formatCents(document.totalDiscountCents)}</span>
        </div>
        <div className="flex w-48 justify-between text-slate-600">
          <span>Tax</span>
          <span>{formatCents(document.totalTaxCents)}</span>
        </div>
        <div className="flex w-48 justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
          <span>Grand total</span>
          <span>{formatCents(document.grandTotalCents)}</span>
        </div>
      </div>
    </Card>
  );
}
