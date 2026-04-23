import mongoose, { type Model, type InferSchemaType, type Types } from "mongoose";
const { Schema, model, models } = mongoose;

const CommentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, maxlength: 1000 },
    parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CommentSchema.index({ post: 1, createdAt: 1 });

export type CommentDoc = InferSchemaType<typeof CommentSchema> & { _id: Types.ObjectId };

export const Comment: Model<CommentDoc> =
  (models.Comment as Model<CommentDoc>) || model<CommentDoc>("Comment", CommentSchema);
