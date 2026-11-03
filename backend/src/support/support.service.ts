import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupportTicket, SupportTicketDocument } from './schemas/support-ticket.schema';
import { SupportMessage, SupportMessageDocument } from './schemas/support-message.schema';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(SupportMessage.name) private messageModel: Model<SupportMessageDocument>,
  ) {}

  async createTicket(data: any, userId: string) {
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const ticket = new this.ticketModel({
      ...data,
      ticketId,
      createdBy: new Types.ObjectId(userId),
      status: 'open',
      unreadCount: 0,
    });
    return ticket.save();
  }

  async addMessage(ticketId: string, senderId: string, content: string, attachments: string[] = []) {
    const ticket = await this.ticketModel.findOne({ ticketId });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const message = new this.messageModel({
      ticketId: ticket._id,
      senderId: new Types.ObjectId(senderId),
      content,
      attachments,
      isRead: false,
    });
    await message.save();

    if (senderId !== ticket.createdBy.toString()) {
      ticket.unreadCount = (ticket.unreadCount || 0) + 1;
    }
    await ticket.save();

    return message;
  }

  async findTickets(filter: any = {}) {
    return this.ticketModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.ticketModel.findById(id).lean();
  }

  async getMessages(ticketId: string) {
    const ticket = await this.ticketModel.findOne({ ticketId }).lean();
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.messageModel.find({ ticketId: ticket._id }).sort({ createdAt: 1 }).lean();
  }

  async markAsRead(ticketId: string, userId: string) {
    const ticket = await this.ticketModel.findOne({ ticketId }).lean();
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.messageModel.updateMany(
      { ticketId: ticket._id, senderId: { $ne: new Types.ObjectId(userId) }, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    await this.ticketModel.findOneAndUpdate({ ticketId }, { unreadCount: 0 });
    return { success: true };
  }
}
