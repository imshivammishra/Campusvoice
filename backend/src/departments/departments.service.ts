import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name) private deptModel: Model<DepartmentDocument>,
  ) {}

  async create(data: any) {
    return this.deptModel.create(data);
  }

  async findAll(filter: any = {}) {
    return this.deptModel.find(filter).lean();
  }

  async findById(id: string) {
    return this.deptModel.findById(id).lean();
  }

  async update(id: string, data: any) {
    return this.deptModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }
}
