import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Escalation, EscalationDocument } from './schemas/escalation.schema';

@Injectable()
export class EscalationsService {
  constructor(
    @InjectModel(Escalation.name)
    private escalationModel: Model<EscalationDocument>,
  ) {}

  async create(data: any) {
    const escalationId = `ESC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const escalation = new this.escalationModel({
      ...data,
      escalationId,
    });
    return escalation.save();
  }

  async findAll(filter: any = {}) {
    return this.escalationModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.escalationModel.findById(id).lean();
  }

  async respond(escalationId: string, response: string, responderId: string) {
    const escalation = await this.escalationModel.findById(escalationId);
    if (!escalation) throw new NotFoundException('Escalation not found');
    escalation.response = response;
    escalation.respondedAt = new Date();
    return escalation.save();
  }
}
