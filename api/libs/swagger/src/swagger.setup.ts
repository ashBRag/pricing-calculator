import { INestApplication } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

export function setupSwagger(app: INestApplication, title: string, version = '1.0') {
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(`${title} API docs`)
    .setVersion(version)
    .addBearerAuth()
    .build()
  const doc = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  })
}
