import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import type { Types } from "mongoose";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { connectDB } from "@/lib/db";
import { Notification, type NotificationType } from "@/models/Notification";
import { User, type UserDoc } from "@/models/User";
import { Post, type PostDoc } from "@/models/Post";
import { requireUser } from "@/lib/auth-helpers";

export const metadata = { title: "Hoạt động" };

void User;
void Post;

type LeanNotification = {
  _id: Types.ObjectId;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  actor: Pick<UserDoc, "username" | "displayName" | "image"> & { _id: Types.ObjectId };
  post:
    | (Pick<PostDoc, "content"> & { _id: Types.ObjectId })
    | null;
};

export default async function ActivityPage() {
  const me = await requireUser();
  await connectDB();

  const notifications = await Notification.find({ recipient: me._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("actor", "username displayName image")
    .populate("post", "content")
    .lean<LeanNotification[]>();

  await Notification.updateMany({ recipient: me._id, read: false }, { $set: { read: true } });

  return (
    <div className="flex flex-col">
      <h1 className="mb-4 text-lg font-semibold">Hoạt động</h1>

      {notifications.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">Chưa có hoạt động nào.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-border/50">
          {notifications.map((n) => (
            <NotificationRow key={String(n._id)} n={n} />
          ))}
        </ol>
      )}
    </div>
  );
}

function NotificationRow({ n }: { n: LeanNotification }) {
  const { actor } = n;
  const initial = (actor.displayName || actor.username || "?").slice(0, 1).toUpperCase();
  const time = formatDistanceToNowStrict(new Date(n.createdAt), {
    locale: vi,
    addSuffix: false,
  });

  let Icon: typeof Heart;
  let text: string;
  let href: string;
  switch (n.type) {
    case "LIKE":
      Icon = Heart;
      text = "đã thích bài của bạn";
      href = n.post ? `/post/${String(n.post._id)}` : "/";
      break;
    case "REPLY":
      Icon = MessageCircle;
      text = "đã trả lời bạn";
      href = n.post ? `/post/${String(n.post._id)}` : "/";
      break;
    case "FOLLOW":
      Icon = UserPlus;
      text = "đã theo dõi bạn";
      href = actor.username ? `/@${actor.username}` : "/";
      break;
  }

  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 py-3 transition-colors hover:bg-accent/30"
      >
        <div className="relative">
          <Avatar className="size-10">
            {actor.image ? <AvatarImage src={actor.image} alt="" /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span
            className={
              n.type === "LIKE"
                ? "absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-white"
                : n.type === "REPLY"
                  ? "absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-sky-500 text-white"
                  : "absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white"
            }
          >
            <Icon className="size-3" />
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-sm">
            <span className="font-semibold">{actor.displayName}</span>{" "}
            <span className="text-muted-foreground">{text}</span>{" "}
            <span className="text-muted-foreground">· {time}</span>
          </p>
          {n.post?.content ? (
            <p className="line-clamp-1 text-sm text-muted-foreground">{n.post.content}</p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
