import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClassEntity, ClassDocument } from './schemas/class.schema';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(ClassEntity.name) private classModel: Model<ClassDocument>,
  ) {}

  async create(data: any) {
    return this.classModel.create(data);
  }

  async findAll(filter: any = {}) {
    return this.classModel.find(filter).lean();
  }

  async findById(id: string) {
    return this.classModel.findById(id).lean();
  }

  async update(id: string, data: any) {
    return this.classModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }
}
