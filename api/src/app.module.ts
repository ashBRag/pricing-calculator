import { Module } from "@nestjs/common";
import { LoggerModule } from "@libs/logger";
import { MongooseModule } from "@libs/mongoose";
import { PrometheusModule } from "@libs/prometheus";
import { HealthModule } from "./health/health.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forRoot(),
    PrometheusModule.forRoot(),
    HealthModule,
    AuthModule,
    DocumentsModule,
  ],
})
export class AppModule {}
