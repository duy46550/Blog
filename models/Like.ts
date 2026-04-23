import mongoose, { type Model, type InferSchemaType, type Types } from "mongoose";
const { Schema, model, models } = mongoose;

const LikeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true },
);

LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1, createdAt: -1 });

export type LikeDoc = InferSchemaType<typeof LikeSchema> & { _id: Types.ObjectId };

export const Like: Model<LikeDoc> =
  (models.Like as Model<LikeDoc>) || model<LikeDoc>("Like", LikeSchema);
