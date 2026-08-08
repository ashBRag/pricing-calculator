import { Module } from "@nestjs/common";
import { LoggerModule } from "@libs/logger";
import { MongooseModule } from "@libs/mongoose";
import { PrometheusModule } from "@libs/prometheus";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forRoot(),
    PrometheusModule.forRoot(),
    HealthModule,
  ],
})
export class AppModule {}
