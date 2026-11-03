import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ManagementReview, ManagementReviewDocument } from './schemas/management-review.schema';

@Injectable()
export class ManagementReviewsService {
  constructor(
    @InjectModel(ManagementReview.name)
    private reviewModel: Model<ManagementReviewDocument>,
  ) {}

  async create(data: any, userId: string) {
    const reviewId = `MR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const review = new this.reviewModel({
      ...data,
      reviewId,
      createdBy: new Types.ObjectId(userId),
      status: 'draft',
    });
    return review.save();
  }

  async findAll(filter: any = {}) {
    return this.reviewModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.reviewModel.findById(id).lean();
  }

  async findByReviewId(reviewId: string) {
    return this.reviewModel.findOne({ reviewId }).lean();
  }

  async respond(reviewId: string, response: string, responderId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    review.response = response;
    review.respondedAt = new Date();
    review.status = 'resolved';
    return review.save();
  }
}
