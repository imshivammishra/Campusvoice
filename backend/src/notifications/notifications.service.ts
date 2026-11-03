import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(data: any) {
    const payload = { ...data };
    if (payload.userId && Types.ObjectId.isValid(payload.userId)) {
      payload.userId = new Types.ObjectId(payload.userId);
    }
    return this.notificationModel.create(payload);
  }

  private userIdVariants(userId: string): any[] {
    const ids: any[] = [userId];
    if (Types.ObjectId.isValid(userId)) ids.push(new Types.ObjectId(userId));
    return ids;
  }

  async findByUser(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const filter = { userId: { $in: this.userIdVariants(userId) } };
    const [data, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId: { $in: this.userIdVariants(userId) } },
      { isRead: true },
      { new: true },
    );
  }
}
