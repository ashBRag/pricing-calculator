import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { PricingDocument } from "./document.schema";
import { CalculationService } from "../calculation/calculation.service";
import {
  CreateDocumentDto,
  UpdateDocumentDto,
} from "../../schemas/document.dto";
import { DocumentStatus, ReportSummary } from "../../types";
import {
  NotFoundError,
  DocumentFinalizedError,
  ValidationError,
  ConflictError,
} from "../../errors/app-errors";

/**
 * Service for managing pricing documents, including creation, retrieval,
 * updating, deletion, finalization, duplication, and reporting.
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectModel(PricingDocument.name)
    private readonly documentModel: Model<PricingDocument>,
    private readonly calculationService: CalculationService
  ) {}

  /**
   * Builds line items and calculates totals for a document based on the provided DTO.
   * @param dto - The DTO containing line item data.
   * @returns An object containing the processed line items and calculated totals.
   */
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

  /**
   * The following methods implement the core CRUD operations for pricing documents:
   * - create: Creates a new document for a user.
   * - findAll: Retrieves all documents for a user.
   * - findOne: Retrieves a specific document by ID for a user.
   * - update: Updates an existing document, ensuring it is not finalized.
   * - remove: Deletes a document, ensuring it is not finalized.
   *
   * Each method ensures that the document belongs to the specified user and handles
   * errors appropriately, such as not found or finalized document errors.
   */

  async create(userId: string, dto: CreateDocumentDto) {
    const { lineItems, totals } = this.buildLineItems(dto);

    const document = await this.documentModel.create({
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

    this.logger.log(
      `Created document ${document._id} for user ${userId} (grandTotal=${totals.grandTotalCents}c)`
    );

    return document;
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
      this.logger.warn(`Document ${id} not found for user ${userId}`);
      throw new NotFoundError("Document not found.");
    }
    return document;
  }

  async findOne(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateDocumentDto) {
    const document = await this.findOwned(userId, id);
    if (document.status === DocumentStatus.FINALIZED) {
      this.logger.warn(`Rejected update on finalized document ${id}`);
      throw new DocumentFinalizedError();
    }

    const { lineItems, totals } = this.buildLineItems(dto);

    document.title = dto.title;
    document.customer = dto.customer;
    document.issueDate = new Date(dto.issueDate);
    document.lineItems = lineItems as PricingDocument["lineItems"];
    document.subtotalCents = totals.subtotalCents;
    document.totalDiscountCents = totals.totalDiscountCents;
    document.totalTaxCents = totals.totalTaxCents;
    document.grandTotalCents = totals.grandTotalCents;

    const saved = await document.save();
    this.logger.log(`Updated document ${id} for user ${userId}`);
    return saved;
  }

  async remove(userId: string, id: string) {
    const document = await this.findOwned(userId, id);
    if (document.status === DocumentStatus.FINALIZED) {
      this.logger.warn(`Rejected delete on finalized document ${id}`);
      throw new DocumentFinalizedError(
        "Finalized documents cannot be deleted."
      );
    }
    await document.deleteOne();
    this.logger.log(`Deleted document ${id} for user ${userId}`);
  }

  /**
   * at save time, re-check quantity/price invariants immediately before
   * locking the document, since this is the last point mutation is possible.
   *
   * @param document - The pricing document to validate.
   * @throws ValidationError if any line item has invalid quantity or price.
   */
  private assertFinalizable(document: PricingDocument) {
    const invalidLine = document.lineItems.find(
      (li) => li.quantity <= 0 || li.unitPrice < 0
    );
    if (invalidLine) {
      this.logger.warn(
        `Cannot finalize document ${document._id}: invalid line item "${invalidLine.description}"`
      );
      throw new ValidationError(
        `Cannot finalize: line item "${invalidLine.description}" has an invalid quantity or price.`
      );
    }
  }

  /**
   * Finalizes a document, preventing further edits. Validates line items before finalization.
   * @param userId - The ID of the user who owns the document.
   * @param id - The ID of the document to finalize.
   * @returns The finalized document.
   * @throws ConflictError if the document is already finalized.
   * @throws ValidationError if any line item has invalid quantity or price.
   */

  async finalize(userId: string, id: string) {
    const document = await this.findOwned(userId, id);
    if (document.status === DocumentStatus.FINALIZED) {
      this.logger.warn(`Document ${id} is already finalized`);
      throw new ConflictError("Document is already finalized.");
    }
    this.assertFinalizable(document);
    document.status = DocumentStatus.FINALIZED;
    const saved = await document.save();
    this.logger.log(`Finalized document ${id} for user ${userId}`);
    return saved;
  }

  /**
   * Recalculates totals rather than copying stored cents, so the copy
   * stays correct even if calculation rules change between duplications.
   */
  async duplicate(userId: string, id: string) {
    const source = await this.findOwned(userId, id);
    this.logger.log(`Duplicating document ${id} for user ${userId}`);

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

  /**
   * Generates a summary report of documents for a user within a specified date range.
   * @param userId - The ID of the user for whom to generate the report.
   * @param from - The start date of the report range (inclusive).
   * @param to - The end date of the report range (inclusive).
   * @returns A summary report containing document count and total amounts.
   */
  async reportSummary(
    userId: string,
    from: string,
    to: string
  ): Promise<ReportSummary> {
    this.logger.log(
      `Generating report summary for user ${userId} from ${from} to ${to}`
    );

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
          sumGrandTotalCents: { $sum: "$grandTotalCents" },
          sumTotalTaxCents: { $sum: "$totalTaxCents" },
          sumTotalDiscountCents: { $sum: "$totalDiscountCents" },
        },
      },
    ]);

    const summary = {
      documentCount: result?.documentCount ?? 0,
      sumGrandTotalCents: result?.sumGrandTotalCents ?? 0,
      sumTotalTaxCents: result?.sumTotalTaxCents ?? 0,
      sumTotalDiscountCents: result?.sumTotalDiscountCents ?? 0,
    };

    this.logger.log(
      `Report summary for user ${userId}: ${summary.documentCount} document(s), grandTotal=${summary.sumGrandTotalCents}c`
    );

    return summary;
  }
}
