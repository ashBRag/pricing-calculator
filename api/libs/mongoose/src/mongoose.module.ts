import { Module, Global, DynamicModule } from "@nestjs/common";
import { MongooseModule as NestMongoose } from "@nestjs/mongoose";

@Global()
@Module({})
export class MongooseModule {
  static forRoot(): DynamicModule {
    return {
      module: MongooseModule,
      imports: [
        NestMongoose.forRootAsync({
          useFactory: () => ({
            uri: process.env.MONGODB_URI,
          }),
        }),
      ],
      exports: [NestMongoose],
    };
  }
}
