import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InstitutionDocument = Institution & Document;

@Schema({ timestamps: true })
export class Institution {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  address: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const InstitutionSchema = SchemaFactory.createForClass(Institution);
