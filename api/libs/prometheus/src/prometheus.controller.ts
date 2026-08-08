import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import { PrometheusService } from './prometheus.service'

@Controller('metrics')
export class PrometheusController {
  constructor(private readonly svc: PrometheusService) {}

  @Get()
  async metrics(@Res() res: Response) {
    res.set('Content-Type', this.svc.registry.contentType)
    res.end(await this.svc.registry.metrics())
  }
}
