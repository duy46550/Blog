import mongoose, { type Model, type InferSchemaType, type Types } from "mongoose";
const { Schema, model, models } = mongoose;

export const USER_ROLES = ["USER", "AUTHOR", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    emailVerified: { type: Date, default: null },
    username: { type: String, unique: true, sparse: true, index: true, trim: true },
    displayName: { type: String, required: true },
    image: { type: String, default: null }, // NextAuth dùng field `image`; alias sang avatarUrl bên dưới
    bio: { type: String, default: "" },
    role: { type: String, enum: USER_ROLES, default: "USER", index: true },
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followingCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "users", // cùng collection với NextAuth MongoDB adapter
  },
);

UserSchema.virtual("avatarUrl").get(function (this: { image?: string | null }) {
  return this.image ?? null;
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", UserSchema);
