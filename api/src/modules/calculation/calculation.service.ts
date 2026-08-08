import { Injectable } from '@nestjs/common';
import { CreateLineItemDto } from '../../schemas/line-item.dto';
import { LineItemCalculation, DocumentTotals } from '../../types';
import { ValidationError } from '../../errors/app-errors';

/**
 * Pure calculation module. No DB or HTTP access.
 * Money is handled in integer cents throughout to avoid float drift;
 * unitPrice/fixedDiscount are accepted in decimal currency units and
 * converted to cents immediately via toCents.
 */
@Injectable()
export class CalculationService {
  private toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  calculateLineItem(lineItem: CreateLineItemDto): LineItemCalculation {
    const unitPriceCents = this.toCents(lineItem.unitPrice);
    const subtotalCents = lineItem.quantity * unitPriceCents;

    let discountAmountCents = 0;
    if (lineItem.discountPercent !== undefined) {
      discountAmountCents = Math.round(
        (subtotalCents * lineItem.discountPercent) / 100
      );
    } else if (lineItem.fixedDiscount !== undefined) {
      discountAmountCents = this.toCents(lineItem.fixedDiscount);
      if (discountAmountCents > subtotalCents) {
        throw new ValidationError(
          'Fixed discount must not exceed the line subtotal.'
        );
      }
    }

    const discountedAmountCents = subtotalCents - discountAmountCents;

    const taxAmountCents = lineItem.taxPercent
      ? Math.round((discountedAmountCents * lineItem.taxPercent) / 100)
      : 0;

    const lineTotalCents = discountedAmountCents + taxAmountCents;

    return {
      subtotalCents,
      discountAmountCents,
      discountedAmountCents,
      taxAmountCents,
      lineTotalCents,
    };
  }

  calculateDocumentTotals(lineItems: CreateLineItemDto[]): {
    totals: DocumentTotals;
    lines: LineItemCalculation[];
  } {
    const lines = lineItems.map((li) => this.calculateLineItem(li));

    const totals = lines.reduce<DocumentTotals>(
      (acc, line) => ({
        subtotalCents: acc.subtotalCents + line.subtotalCents,
        totalDiscountCents:
          acc.totalDiscountCents + line.discountAmountCents,
        totalTaxCents: acc.totalTaxCents + line.taxAmountCents,
        grandTotalCents: acc.grandTotalCents + line.lineTotalCents,
      }),
      {
        subtotalCents: 0,
        totalDiscountCents: 0,
        totalTaxCents: 0,
        grandTotalCents: 0,
      }
    );

    return { totals, lines };
  }
}
