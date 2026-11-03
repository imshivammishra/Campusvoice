import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditEvent, AuditEventDocument } from './schemas/audit-event.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditEvent.name) private auditModel: Model<AuditEventDocument>,
  ) {}

  async log(data: {
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: any;
    ip?: string;
    userAgent?: string;
  }) {
    return this.auditModel.create({
      userId: data.userId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata || {},
      ip: data.ip,
      userAgent: data.userAgent,
    });
  }

  async findAll(filter: any = {}, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.auditModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
