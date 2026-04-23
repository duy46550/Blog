import mongoose, { type Model, type InferSchemaType, type Types } from "mongoose";
const { Schema, model, models } = mongoose;

export const AI_RUN_STATUS = ["PENDING", "RUNNING", "SUCCESS", "FAILED"] as const;
export type AIRunStatus = (typeof AI_RUN_STATUS)[number];

const AIRunSchema = new Schema(
  {
    agent: { type: Schema.Types.ObjectId, ref: "AIAgent", required: true, index: true },
    status: { type: String, enum: AI_RUN_STATUS, default: "PENDING", index: true },
    inputUrls: { type: [String], default: [] },
    outputPost: { type: Schema.Types.ObjectId, ref: "Post", default: null },
    tokensUsed: { type: Number, default: 0 },
    cacheReadTokens: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    error: { type: String, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AIRunSchema.index({ createdAt: -1 });
AIRunSchema.index({ agent: 1, createdAt: -1 });

export type AIRunDoc = InferSchemaType<typeof AIRunSchema> & { _id: Types.ObjectId };

export const AIRun: Model<AIRunDoc> =
  (models.AIRun as Model<AIRunDoc>) || model<AIRunDoc>("AIRun", AIRunSchema);
