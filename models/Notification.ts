import mongoose, { type Model, type InferSchemaType, type Types } from "mongoose";
const { Schema, model, models } = mongoose;

export const NOTIFICATION_TYPES = ["LIKE", "REPLY", "FOLLOW"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", default: null },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });

export type NotificationDoc = InferSchemaType<typeof NotificationSchema> & {
  _id: Types.ObjectId;
};

export const Notification: Model<NotificationDoc> =
  (models.Notification as Model<NotificationDoc>) ||
  model<NotificationDoc>("Notification", NotificationSchema);
