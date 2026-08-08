import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';
import { DocumentStatus } from '../../types';

@Schema({ _id: true })
export class LineItem {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ min: 0, max: 100 })
  discountPercent?: number;

  @Prop({ min: 0 })
  fixedDiscount?: number;

  @Prop({ min: 0, max: 100 })
  taxPercent?: number;

  @Prop({ required: true })
  subtotalCents: number;

  @Prop({ required: true })
  discountAmountCents: number;

  @Prop({ required: true })
  discountedAmountCents: number;

  @Prop({ required: true })
  taxAmountCents: number;

  @Prop({ required: true })
  lineTotalCents: number;
}

export const LineItemSchema = SchemaFactory.createForClass(LineItem);

@Schema({ timestamps: true })
export class PricingDocument extends MongooseDocument {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  customer: string;

  @Prop({ required: true, index: true })
  issueDate: Date;

  @Prop({
    required: true,
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
    index: true,
  })
  status: DocumentStatus;

  @Prop({ type: [LineItemSchema], required: true })
  lineItems: LineItem[];

  @Prop({ required: true })
  subtotalCents: number;

  @Prop({ required: true })
  totalDiscountCents: number;

  @Prop({ required: true })
  totalTaxCents: number;

  @Prop({ required: true })
  grandTotalCents: number;
}

export const PricingDocumentSchema =
  SchemaFactory.createForClass(PricingDocument);

PricingDocumentSchema.index({ userId: 1, issueDate: 1 });
PricingDocumentSchema.index({ userId: 1, status: 1 });
