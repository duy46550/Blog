import type { PostDoc } from "@/models/Post";
import type { UserDoc } from "@/models/User";
import type { Types } from "mongoose";

export type SerializedAuthor = {
  _id: string;
  username: string | null;
  displayName: string;
  image: string | null;
};

export type SerializedLinkPreview = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
};

export type SerializedPost = {
  _id: string;
  content: string;
  mediaUrls: string[];
  linkPreview: SerializedLinkPreview | null;
  parent: string | null;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  author: SerializedAuthor;
  liked: boolean;
};

type PopulatedAuthor = Pick<UserDoc, "username" | "displayName" | "image"> & { _id: Types.ObjectId };

export type RawPost = Omit<PostDoc, "author"> & {
  _id: Types.ObjectId;
  author: PopulatedAuthor | null;
};

const ANON_AUTHOR: SerializedAuthor = {
  _id: "anonymous",
  username: null,
  displayName: "Ẩn danh",
  image: null,
};

export function serializePost(p: RawPost, liked = false): SerializedPost {
  return {
    _id: String(p._id),
    content: p.content,
    mediaUrls: p.mediaUrls ?? [],
    linkPreview: p.linkPreview
      ? {
          url: p.linkPreview.url ?? "",
          title: p.linkPreview.title ?? undefined,
          description: p.linkPreview.description ?? undefined,
          image: p.linkPreview.image ?? undefined,
          domain: p.linkPreview.domain ?? undefined,
        }
      : null,
    parent: p.parent ? String(p.parent) : null,
    likesCount: p.likesCount ?? 0,
    repliesCount: p.repliesCount ?? 0,
    createdAt: new Date(p.createdAt as unknown as string).toISOString(),
    author: p.author
      ? {
          _id: String(p.author._id),
          username: p.author.username ?? null,
          displayName: p.author.displayName ?? "Ẩn danh",
          image: p.author.image ?? null,
        }
      : ANON_AUTHOR,
    liked,
  };
}
