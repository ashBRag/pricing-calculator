import "reflect-metadata";
import * as dotenv from "dotenv";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { LoggerService } from "@libs/logger";
import { setupSwagger } from "@libs/swagger";
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(LoggerService));
  app.enableCors();
  setupSwagger(app, "Elder Care");
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
