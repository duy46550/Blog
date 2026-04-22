import { Schema, model, models, type Model, type InferSchemaType, type Types } from "mongoose";

const AIAgentSchema = new Schema(
  {
    name: { type: String, required: true },
    topic: { type: String, default: "" },
    sources: { type: [String], default: [] }, // RSS urls / website urls
    schedule: { type: String, required: true }, // cron expression
    prompt: { type: String, default: "" }, // system prompt template (hỗ trợ {{topic}}, {{source}})
    model: { type: String, default: "claude-sonnet-4-6" },
    autoPublish: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    dailyTokenLimit: { type: Number, default: 200_000 },
    lastRunAt: { type: Date, default: null },
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export type AIAgentDoc = InferSchemaType<typeof AIAgentSchema> & { _id: Types.ObjectId };

export const AIAgent: Model<AIAgentDoc> =
  (models.AIAgent as Model<AIAgentDoc>) || model<AIAgentDoc>("AIAgent", AIAgentSchema);
