import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Institution, InstitutionDocument } from './schemas/institution.schema';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectModel(Institution.name) private institutionModel: Model<InstitutionDocument>,
  ) {}

  async create(data: any) {
    const existing = await this.institutionModel.findOne({ code: data.code });
    if (existing) throw new ConflictException('Institution code already exists');
    return this.institutionModel.create(data);
  }

  async findAll() {
    return this.institutionModel.find().lean();
  }

  async findById(id: string) {
    return this.institutionModel.findById(id).lean();
  }

  async update(id: string, data: any) {
    return this.institutionModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id: string) {
    return this.institutionModel.findByIdAndDelete(id);
  }
}
