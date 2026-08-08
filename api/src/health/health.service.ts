import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection as MongooseConnection } from "mongoose";

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly mongoConnection: MongooseConnection
  ) {}

  async checkMongo() {
    try {
      if (this.mongoConnection.readyState !== 1) {
        throw new Error("Mongo not connected");
      }
      await this.mongoConnection.db.admin().ping();
      return { status: "up" };
    } catch (e: any) {
      return { status: "down", message: e.message };
    }
  }

  async checkApp() {
    return { status: "up" };
  }

  async checkAll() {
    const [mongo, app] = await Promise.all([
      this.checkMongo(),
      this.checkApp(),
    ]);

    const isHealthy = mongo.status === "up";

    return {
      status: isHealthy ? "ok" : "error",
      services: {
        mongo,
        app,
      },
    };
  }
}
