import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoleEntity, RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(@InjectModel(RoleEntity.name) private roleModel: Model<RoleDocument>) {}

  async findAll() {
    return this.roleModel.find().lean();
  }

  async findByName(name: string) {
    return this.roleModel.findOne({ name }).lean();
  }
}
