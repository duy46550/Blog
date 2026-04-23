import mongoose, { type Model, type InferSchemaType, type Types } from "mongoose";
const { Schema, model, models } = mongoose;

export const POST_STATUS = ["DRAFT", "PUBLISHED", "SCHEDULED"] as const;
export type PostStatus = (typeof POST_STATUS)[number];

const LinkPreviewSchema = new Schema(
  {
    url: String,
    title: String,
    description: String,
    image: String,
    domain: String,
  },
  { _id: false },
);

const PostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    content: { type: String, required: true, maxlength: 2000 },
    title: { type: String, default: null },
    slug: { type: String, unique: true, sparse: true },
    mediaUrls: { type: [String], default: [] },
    linkPreview: { type: LinkPreviewSchema, default: null },
    tags: { type: [String], default: [], index: true },
    status: { type: String, enum: POST_STATUS, default: "PUBLISHED", index: true },
    scheduledAt: { type: Date, default: null },
    publishedAt: { type: Date, default: () => new Date() },
    aiGenerated: { type: Boolean, default: false, index: true },
    aiSourceUrls: { type: [String], default: [] },
    parent: { type: Schema.Types.ObjectId, ref: "Post", default: null, index: true },
    // denormalized counters — cập nhật qua $inc trong transaction
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ parent: 1, createdAt: 1 });
PostSchema.index({ content: "text", title: "text" });

export type PostDoc = InferSchemaType<typeof PostSchema> & { _id: Types.ObjectId };

export const Post: Model<PostDoc> =
  (models.Post as Model<PostDoc>) || model<PostDoc>("Post", PostSchema);
