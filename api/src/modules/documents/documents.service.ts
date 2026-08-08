import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PricingDocument } from './document.schema';
import { CalculationService } from '../calculation/calculation.service';
import { CreateDocumentDto, UpdateDocumentDto } from '../../schemas/document.dto';
import { DocumentStatus, ReportSummary } from '../../types';

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
      throw new NotFoundException('Document not found.');
    }
    return document;
  }

  async findOne(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateDocumentDto) {
    const document = await this.findOwned(userId, id);
    if (document.status === DocumentStatus.FINALIZED) {
      throw new ConflictException('Finalized documents cannot be modified.');
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
      throw new ConflictException('Finalized documents cannot be deleted.');
    }
    await document.deleteOne();
  }

  async finalize(userId: string, id: string) {
    const document = await this.findOwned(userId, id);
    if (document.status === DocumentStatus.FINALIZED) {
      throw new ConflictException('Document is already finalized.');
    }
    document.status = DocumentStatus.FINALIZED;
    return document.save();
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
