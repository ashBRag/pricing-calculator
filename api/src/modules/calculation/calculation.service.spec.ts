import { CalculationService } from './calculation.service';
import { CreateLineItemDto } from '../../schemas/line-item.dto';
import { ValidationError } from '../../errors/app-errors';

function lineItem(overrides: Partial<CreateLineItemDto>): CreateLineItemDto {
  return {
    description: 'Item',
    quantity: 1,
    unitPrice: 0,
    ...overrides,
  };
}

describe('CalculationService', () => {
  let service: CalculationService;

  beforeEach(() => {
    service = new CalculationService();
  });

  describe('money handling (cents conversion & rounding)', () => {
    it('converts unit price to integer cents without float drift', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 1, unitPrice: 0.1 })
      );
      expect(result.subtotalCents).toBe(10);
      expect(Number.isInteger(result.subtotalCents)).toBe(true);
    });

    it('avoids classic 0.1 + 0.2 float drift across quantity multiplication', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 3, unitPrice: 0.1 })
      );
      // 3 * 0.1 in raw floating point is 0.30000000000000004
      expect(result.subtotalCents).toBe(30);
    });

    it('rounds percentage discount to the nearest cent', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 1, unitPrice: 10, discountPercent: 33.33 })
      );
      // 1000 * 33.33 / 100 = 333.3 -> rounds to 333
      expect(result.discountAmountCents).toBe(333);
    });

    it('rounds tax to the nearest cent on the discounted amount', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 1, unitPrice: 10, taxPercent: 12.5 })
      );
      // 1000 * 12.5 / 100 = 125.0 exactly
      expect(result.taxAmountCents).toBe(125);
    });

    it('converts fixed discount to cents consistently with unit price', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 1, unitPrice: 5.5, fixedDiscount: 2.25 })
      );
      expect(result.discountAmountCents).toBe(225);
      expect(result.discountedAmountCents).toBe(325);
    });

    it('never produces fractional cent values in any output field', () => {
      const result = service.calculateLineItem(
        lineItem({
          quantity: 7,
          unitPrice: 19.99,
          discountPercent: 17.5,
          taxPercent: 8.25,
        })
      );
      for (const value of Object.values(result)) {
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  describe('line item calculation rules', () => {
    it('computes subtotal as quantity x unit price', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 4, unitPrice: 25 })
      );
      expect(result.subtotalCents).toBe(10000);
    });

    it('applies percentage discount off the subtotal', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 1, unitPrice: 100, discountPercent: 10 })
      );
      expect(result.discountAmountCents).toBe(1000);
      expect(result.discountedAmountCents).toBe(9000);
    });

    it('applies fixed discount as a flat cent deduction', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 1, unitPrice: 100, fixedDiscount: 20 })
      );
      expect(result.discountAmountCents).toBe(2000);
      expect(result.discountedAmountCents).toBe(8000);
    });

    it('applies tax on the discounted amount, not the original subtotal', () => {
      const result = service.calculateLineItem(
        lineItem({
          quantity: 2,
          unitPrice: 100,
          discountPercent: 10,
          taxPercent: 5,
        })
      );
      // subtotal 200, discount 20 -> discounted 180, tax = 5% of 180 = 9, not 5% of 200
      expect(result.subtotalCents).toBe(20000);
      expect(result.discountAmountCents).toBe(2000);
      expect(result.discountedAmountCents).toBe(18000);
      expect(result.taxAmountCents).toBe(900);
    });

    it('computes line total as discounted amount plus tax', () => {
      const result = service.calculateLineItem(
        lineItem({
          quantity: 2,
          unitPrice: 100,
          discountPercent: 10,
          taxPercent: 5,
        })
      );
      expect(result.lineTotalCents).toBe(18900);
    });

    it('treats an absent discount as zero discount', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 1, unitPrice: 50, taxPercent: 5 })
      );
      expect(result.discountAmountCents).toBe(0);
      expect(result.discountedAmountCents).toBe(5000);
      expect(result.taxAmountCents).toBe(250);
    });

    it('treats an absent tax as zero tax', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 1, unitPrice: 200, fixedDiscount: 20 })
      );
      expect(result.taxAmountCents).toBe(0);
      expect(result.lineTotalCents).toBe(result.discountedAmountCents);
    });

    it('rejects a fixed discount that exceeds the line subtotal', () => {
      expect(() =>
        service.calculateLineItem(
          lineItem({ quantity: 1, unitPrice: 10, fixedDiscount: 10.01 })
        )
      ).toThrow(ValidationError);
    });

    it('allows a fixed discount exactly equal to the line subtotal', () => {
      const result = service.calculateLineItem(
        lineItem({ quantity: 1, unitPrice: 10, fixedDiscount: 10 })
      );
      expect(result.discountedAmountCents).toBe(0);
      expect(result.lineTotalCents).toBe(0);
    });
  });

  describe('document totals', () => {
    it('sums subtotal, discount, tax, and grand total across all lines', () => {
      const { totals } = service.calculateDocumentTotals([
        lineItem({ quantity: 1, unitPrice: 100, discountPercent: 10, taxPercent: 5 }),
        lineItem({ quantity: 1, unitPrice: 50 }),
      ]);
      // line 1: subtotal 100, discount 10, discounted 90, tax 4.5 -> 5 (round), total 95
      // line 2: subtotal 50, discount 0, discounted 50, tax 0, total 50
      expect(totals.subtotalCents).toBe(15000);
      expect(totals.totalDiscountCents).toBe(1000);
      expect(totals.totalTaxCents).toBe(450);
      expect(totals.grandTotalCents).toBe(14450);
    });

    it('grand total equals subtotal minus total discount plus total tax', () => {
      const { totals } = service.calculateDocumentTotals([
        lineItem({ quantity: 3, unitPrice: 33.33, discountPercent: 15, taxPercent: 7 }),
        lineItem({ quantity: 1, unitPrice: 9.99, fixedDiscount: 1 }),
      ]);
      expect(totals.grandTotalCents).toBe(
        totals.subtotalCents - totals.totalDiscountCents + totals.totalTaxCents
      );
    });

    it('returns zeroed totals for an empty line item list', () => {
      const { totals, lines } = service.calculateDocumentTotals([]);
      expect(lines).toEqual([]);
      expect(totals).toEqual({
        subtotalCents: 0,
        totalDiscountCents: 0,
        totalTaxCents: 0,
        grandTotalCents: 0,
      });
    });

    it('propagates a fixed-discount-exceeds-subtotal rejection from any line', () => {
      expect(() =>
        service.calculateDocumentTotals([
          lineItem({ quantity: 1, unitPrice: 100 }),
          lineItem({ quantity: 1, unitPrice: 10, fixedDiscount: 50 }),
        ])
      ).toThrow(ValidationError);
    });
  });

  describe('assignment sample document', () => {
    it('matches the worked example from the spec exactly', () => {
      const { totals, lines } = service.calculateDocumentTotals([
        lineItem({
          description: 'Widget A',
          quantity: 2,
          unitPrice: 100.0,
          discountPercent: 10,
          taxPercent: 5,
        }),
        lineItem({
          description: 'Widget B',
          quantity: 1,
          unitPrice: 50.0,
          taxPercent: 5,
        }),
        lineItem({
          description: 'Service fee',
          quantity: 1,
          unitPrice: 200.0,
          fixedDiscount: 20,
        }),
      ]);

      expect(lines[0]).toEqual({
        subtotalCents: 20000,
        discountAmountCents: 2000,
        discountedAmountCents: 18000,
        taxAmountCents: 900,
        lineTotalCents: 18900,
      });
      expect(lines[1]).toEqual({
        subtotalCents: 5000,
        discountAmountCents: 0,
        discountedAmountCents: 5000,
        taxAmountCents: 250,
        lineTotalCents: 5250,
      });
      expect(lines[2]).toEqual({
        subtotalCents: 20000,
        discountAmountCents: 2000,
        discountedAmountCents: 18000,
        taxAmountCents: 0,
        lineTotalCents: 18000,
      });

      expect(totals).toEqual({
        subtotalCents: 45000,
        totalDiscountCents: 4000,
        totalTaxCents: 1150,
        grandTotalCents: 42150,
      });
    });
  });
});
