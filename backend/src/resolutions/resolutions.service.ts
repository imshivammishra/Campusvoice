import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resolution, ResolutionDocument } from './schemas/resolution.schema';

@Injectable()
export class ResolutionsService {
  constructor(
    @InjectModel(Resolution.name) private resolutionModel: Model<ResolutionDocument>,
  ) {}

  async create(data: any) {
    const resolutionId = `RES-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const resolution = new this.resolutionModel({
      ...data,
      resolutionId,
      status: 'open',
    });
    return resolution.save();
  }

  async findAll(filter: any = {}) {
    return this.resolutionModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.resolutionModel.findById(id).lean();
  }

  async updateStatus(id: string, status: string, userId: string) {
    const resolution = await this.resolutionModel.findById(id);
    if (!resolution) throw new NotFoundException('Resolution not found');
    resolution.status = status;
    if (status === 'resolved') {
      resolution.resolvedBy = new Types.ObjectId(userId);
      resolution.resolvedAt = new Date();
    }
    return resolution.save();
  }
}
