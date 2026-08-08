import { Document, Model, FilterQuery, UpdateQuery } from "mongoose";

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }
  async findOne(f: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(f).exec();
  }
  async findAll(f: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(f).exec();
  }
  async count(f: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(f).exec();
  }
  async delete(f: FilterQuery<T>): Promise<number> {
    const r = await this.model.deleteOne(f).exec();
    return r.deletedCount;
  }
  async update(f: FilterQuery<T>, d: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate(f, d, { new: true, upsert: true })
      .exec();
  }
}
