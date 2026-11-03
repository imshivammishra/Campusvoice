import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CrMessage, CrMessageDocument } from './schemas/cr-message.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class CrMessagesService {
  constructor(
    @InjectModel(CrMessage.name)
    private messageModel: Model<CrMessageDocument>,
    private usersService: UsersService,
  ) {}

  /** A student sends a private message to their current CR. */
  async sendAsStudent(userId: string, content: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'STUDENT' && user.role !== 'CLASS_REPRESENTATIVE') {
      throw new ForbiddenException('Only students can message their CR');
    }
    if (!content?.trim()) throw new BadRequestException('Message is required');
    const msg = await this.messageModel.create({
      studentId: user._id,
      className: user.className,
      classId: user.classId,
      senderId: user._id,
      senderRole: user.role,
      senderName: user.fullName || user.username,
      content: content.trim(),
    });
    return msg.toObject();
  }

  /** The current CR replies to a student in their class. */
  async replyAsCr(crId: string, studentId: string, content: string) {
    const cr = await this.usersService.findById(crId);
    if (!cr || cr.role !== 'CLASS_REPRESENTATIVE') {
      throw new ForbiddenException('Only the current CR can reply');
    }
    if (!content?.trim()) throw new BadRequestException('Message is required');
    const student = await this.usersService.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');
    // The CR may only message classmates in the same class.
    if ((student.className || '') !== (cr.className || '')) {
      throw new ForbiddenException('Student is not in your class');
    }
    const msg = await this.messageModel.create({
      studentId: student._id,
      className: student.className,
      classId: student.classId,
      senderId: cr._id,
      senderRole: cr.role,
      senderName: cr.fullName || cr.username,
      content: content.trim(),
    });
    return msg.toObject();
  }

  /**
   * Builds a class-matching filter that works even when the class is unset.
   * A student and their CR are matched by className; when neither has a class
   * configured (common in small deployments) they are matched on the shared
   * "no class" bucket rather than silently never matching.
   */
  private classFilter(className?: string): any {
    if (className && className.trim()) {
      return { className };
    }
    return {
      $or: [
        { className: { $in: [null, ''] } },
        { className: { $exists: false } },
      ],
    };
  }

  /**
   * Returns the conversation(s) visible to the caller:
   * - Student: only their own conversation.
   * - CR: all conversations from students in their class.
   */
  async listForUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) return [];
    if (user.role === 'CLASS_REPRESENTATIVE') {
      const msgs = await this.messageModel
        .find(this.classFilter(user.className))
        .sort({ createdAt: 1 })
        .lean();
      return this.groupByStudent(msgs);
    }
    // student (or CR viewing their own thread)
    const msgs = await this.messageModel
      .find({ studentId: new Types.ObjectId(userId) })
      .sort({ createdAt: 1 })
      .lean();
    return msgs;
  }

  async threadWithStudent(crId: string, studentId: string) {
    const cr = await this.usersService.findById(crId);
    if (!cr || cr.role !== 'CLASS_REPRESENTATIVE') {
      throw new ForbiddenException('Only the current CR can view this');
    }
    if (!Types.ObjectId.isValid(studentId)) return [];
    const msgs = await this.messageModel
      .find({
        studentId: new Types.ObjectId(studentId),
        ...this.classFilter(cr.className),
      })
      .sort({ createdAt: 1 })
      .lean();
    return msgs;
  }

  private groupByStudent(msgs: any[]) {
    const map = new Map<string, any>();
    for (const m of msgs) {
      const key = m.studentId.toString();
      if (!map.has(key)) {
        map.set(key, {
          studentId: key,
          lastMessage: m.content,
          lastAt: m.createdAt,
          messages: [],
        });
      }
      const entry = map.get(key);
      entry.messages.push(m);
      entry.lastMessage = m.content;
      entry.lastAt = m.createdAt;
    }
    return Array.from(map.values());
  }
}
