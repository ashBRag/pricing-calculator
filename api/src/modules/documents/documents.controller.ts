import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from '../../schemas/document.dto';
import { ReportQueryDto } from '../../schemas/report-query.dto';

/**
 * userId currently comes off req.user, populated by the auth guard once
 * authentication is wired in. Never trust a client-supplied userId.
 */
function userIdFrom(req: FastifyRequest): string {
  return (req as FastifyRequest & { user?: { id: string } }).user?.id ?? '';
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Req() req: FastifyRequest, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(userIdFrom(req), dto);
  }

  @Get()
  findAll(@Req() req: FastifyRequest) {
    return this.documentsService.findAll(userIdFrom(req));
  }

  @Get(':id')
  findOne(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.documentsService.findOne(userIdFrom(req), id);
  }

  @Patch(':id')
  update(
    @Req() req: FastifyRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto
  ) {
    return this.documentsService.update(userIdFrom(req), id, dto);
  }

  @Delete(':id')
  remove(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.documentsService.remove(userIdFrom(req), id);
  }

  @Post(':id/finalize')
  finalize(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.documentsService.finalize(userIdFrom(req), id);
  }
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('summary')
  summary(@Req() req: FastifyRequest, @Query() query: ReportQueryDto) {
    return this.documentsService.reportSummary(
      userIdFrom(req),
      query.from,
      query.to
    );
  }
}
