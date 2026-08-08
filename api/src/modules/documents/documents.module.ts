import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController, ReportsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentPrintService } from './document-print.service';
import { CalculationModule } from '../calculation/calculation.module';
import { PricingDocument, PricingDocumentSchema } from './document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PricingDocument.name, schema: PricingDocumentSchema },
    ]),
    CalculationModule,
  ],
  controllers: [DocumentsController, ReportsController],
  providers: [DocumentsService, DocumentPrintService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
