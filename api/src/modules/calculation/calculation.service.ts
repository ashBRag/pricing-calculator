import { Injectable, Logger } from "@nestjs/common";
import { CreateLineItemDto } from "../../schemas/line-item.dto";
import { LineItemCalculation, DocumentTotals } from "../../types";
import { ValidationError } from "../../errors/app-errors";

/**
 * Pure calculation module. No DB or HTTP access.
 * Money is handled in integer cents throughout to avoid float drift;
 * unitPrice/fixedDiscount are accepted in decimal currency units and
 * converted to cents immediately via toCents.
 */
@Injectable()
export class CalculationService {
  private readonly logger = new Logger(CalculationService.name);

  private toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Calculates the subtotal, discount, tax, and total for a single line item.
   * @param lineItem
   * @returns LineItemCalculation object containing the calculated values in cents.
   */
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
        this.logger.warn(
          `Rejected line item "${lineItem.description}": fixed discount ${discountAmountCents}c exceeds subtotal ${subtotalCents}c`
        );
        throw new ValidationError(
          "Fixed discount must not exceed the line subtotal."
        );
      }
    }

    const discountedAmountCents = subtotalCents - discountAmountCents;

    const taxAmountCents = lineItem.taxPercent
      ? Math.round((discountedAmountCents * lineItem.taxPercent) / 100)
      : 0;

    const lineTotalCents = discountedAmountCents + taxAmountCents;

    this.logger.debug(
      `Calculated line item "${lineItem.description}": subtotal=${subtotalCents}c discount=${discountAmountCents}c tax=${taxAmountCents}c total=${lineTotalCents}c`
    );

    return {
      subtotalCents,
      discountAmountCents,
      discountedAmountCents,
      taxAmountCents,
      lineTotalCents,
    };
  }

  /**
   * Calculates the totals for a document based on its line items.
   * @param lineItems
   * @returns { totals: DocumentTotals; lines: LineItemCalculation[] } object containing the document totals and individual line calculations.
   */
  calculateDocumentTotals(lineItems: CreateLineItemDto[]): {
    totals: DocumentTotals;
    lines: LineItemCalculation[];
  } {
    this.logger.log(
      `Calculating document totals for ${lineItems.length} line item(s)`
    );

    const lines = lineItems.map((li) => this.calculateLineItem(li));

    const totals = lines.reduce<DocumentTotals>(
      (acc, line) => ({
        subtotalCents: acc.subtotalCents + line.subtotalCents,
        totalDiscountCents: acc.totalDiscountCents + line.discountAmountCents,
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

    this.logger.log(
      `Document totals: subtotal=${totals.subtotalCents}c discount=${totals.totalDiscountCents}c tax=${totals.totalTaxCents}c grandTotal=${totals.grandTotalCents}c`
    );

    return { totals, lines };
  }
}
