import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PricingDocument } from './document.schema';
import { CalculationService } from '../calculation/calculation.service';
import { CreateDocumentDto, UpdateDocumentDto } from '../../schemas/document.dto';
import { DocumentStatus, ReportSummary } from '../../types';
import {
  NotFoundError,
  DocumentFinalizedError,
  ValidationError,
  ConflictError,
} from '../../errors/app-errors';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(PricingDocument.name)
    private readonly documentModel: Model<PricingDocument>,
    private readonly calculationService: CalculationService
  ) {}

  private buildLineItems(dto: CreateDocumentDto | UpdateDocumentDto) {
    const { totals, lines } = this.calculationService.calculateDocumentTotals(
      dto.lineItems
    );

    const lineItems = dto.lineItems.map((li, i) => ({
      ...li,
      ...lines[i],
    }));

    return { lineItems, totals };
  }

  async create(userId: string, dto: CreateDocumentDto) {
    const { lineItems, totals } = this.buildLineItems(dto);

    return this.documentModel.create({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      customer: dto.customer,
      issueDate: new Date(dto.issueDate),
      status: DocumentStatus.DRAFT,
      lineItems,
      subtotalCents: totals.subtotalCents,
      totalDiscountCents: totals.totalDiscountCents,
      totalTaxCents: totals.totalTaxCents,
      grandTotalCents: totals.grandTotalCents,
    });
  }

  async findAll(userId: string) {
    return this.documentModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ issueDate: -1 })
      .exec();
  }

  private async findOwned(userId: string, id: string) {
    const document = await this.documentModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    if (!document) {
      throw new NotFoundError('Document not found.');
    }
    return document;
  }

  async findOne(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateDocumentDto) {
    const document = await this.findOwned(userId, id);
    if (document.status === DocumentStatus.FINALIZED) {
      throw new DocumentFinalizedError();
    }

    const { lineItems, totals } = this.buildLineItems(dto);

    document.title = dto.title;
    document.customer = dto.customer;
    document.issueDate = new Date(dto.issueDate);
    document.lineItems = lineItems as PricingDocument['lineItems'];
    document.subtotalCents = totals.subtotalCents;
    document.totalDiscountCents = totals.totalDiscountCents;
    document.totalTaxCents = totals.totalTaxCents;
    document.grandTotalCents = totals.grandTotalCents;

    return document.save();
  }

  async remove(userId: string, id: string) {
    const document = await this.findOwned(userId, id);
    if (document.status === DocumentStatus.FINALIZED) {
      throw new DocumentFinalizedError(
        'Finalized documents cannot be deleted.'
      );
    }
    await document.deleteOne();
  }

  /**
   * Stretch goal: finalize validation. Even though line items were valid
   * at save time, re-check quantity/price invariants immediately before
   * locking the document, since this is the last point mutation is possible.
   */
  private assertFinalizable(document: PricingDocument) {
    const invalidLine = document.lineItems.find(
      (li) => li.quantity <= 0 || li.unitPrice < 0
    );
    if (invalidLine) {
      throw new ValidationError(
        `Cannot finalize: line item "${invalidLine.description}" has an invalid quantity or price.`
      );
    }
  }

  async finalize(userId: string, id: string) {
    const document = await this.findOwned(userId, id);
    if (document.status === DocumentStatus.FINALIZED) {
      throw new ConflictError('Document is already finalized.');
    }
    this.assertFinalizable(document);
    document.status = DocumentStatus.FINALIZED;
    return document.save();
  }

  /**
   * Stretch goal: duplicate a finalized document into a new draft.
   * Recalculates totals rather than copying stored cents, so the copy
   * stays correct even if calculation rules change between duplications.
   */
  async duplicate(userId: string, id: string) {
    const source = await this.findOwned(userId, id);

    const dto: CreateDocumentDto = {
      title: `${source.title} (copy)`,
      customer: source.customer,
      issueDate: source.issueDate.toISOString(),
      lineItems: source.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discountPercent: li.discountPercent,
        fixedDiscount: li.fixedDiscount,
        taxPercent: li.taxPercent,
      })),
    };

    return this.create(userId, dto);
  }

  async reportSummary(
    userId: string,
    from: string,
    to: string
  ): Promise<ReportSummary> {
    const [result] = await this.documentModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          issueDate: { $gte: new Date(from), $lte: new Date(to) },
        },
      },
      {
        $group: {
          _id: null,
          documentCount: { $sum: 1 },
          sumGrandTotalCents: { $sum: '$grandTotalCents' },
          sumTotalTaxCents: { $sum: '$totalTaxCents' },
          sumTotalDiscountCents: { $sum: '$totalDiscountCents' },
        },
      },
    ]);

    return {
      documentCount: result?.documentCount ?? 0,
      sumGrandTotalCents: result?.sumGrandTotalCents ?? 0,
      sumTotalTaxCents: result?.sumTotalTaxCents ?? 0,
      sumTotalDiscountCents: result?.sumTotalDiscountCents ?? 0,
    };
  }
}
