import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { DocumentsService } from './documents.service';
import { DocumentPrintService } from './document-print.service';
import { CreateDocumentDto, UpdateDocumentDto } from '../../schemas/document.dto';
import { ReportQueryDto } from '../../schemas/report-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentPrintService: DocumentPrintService
  ) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.documentsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto
  ) {
    return this.documentsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.documentsService.remove(user.id, id);
  }

  @Post(':id/finalize')
  finalize(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.documentsService.finalize(user.id, id);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.documentsService.duplicate(user.id, id);
  }

  @Get(':id/print')
  async print(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() reply: FastifyReply
  ) {
    const document = await this.documentsService.findOne(user.id, id);
    const html = this.documentPrintService.render(document);
    reply.header('Content-Type', 'text/html; charset=utf-8').send(html);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportQueryDto
  ) {
    return this.documentsService.reportSummary(user.id, query.from, query.to);
  }
}
