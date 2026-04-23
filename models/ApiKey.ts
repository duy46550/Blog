import mongoose, { type Model, type InferSchemaType, type Types } from "mongoose";
const { Schema, model, models } = mongoose;

export const API_KEY_PROVIDERS = ["anthropic", "openai", "firecrawl", "resend"] as const;
export type ApiKeyProvider = (typeof API_KEY_PROVIDERS)[number];

const ApiKeySchema = new Schema(
  {
    provider: { type: String, enum: API_KEY_PROVIDERS, required: true, index: true },
    label: { type: String, default: "" },
    // AES-256-GCM ciphertext (định dạng: iv:authTag:data, tất cả hex)
    keyEncrypted: { type: String, required: true },
    // 4 ký tự cuối của key thô để hiển thị admin (sk-...abcd)
    keyPreview: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ApiKeySchema.index({ provider: 1, active: 1 });

export type ApiKeyDoc = InferSchemaType<typeof ApiKeySchema> & { _id: Types.ObjectId };

export const ApiKey: Model<ApiKeyDoc> =
  (models.ApiKey as Model<ApiKeyDoc>) || model<ApiKeyDoc>("ApiKey", ApiKeySchema);
