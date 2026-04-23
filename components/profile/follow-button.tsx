"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/app/actions/follow";

type Props = {
  targetUserId: string;
  initialFollowing: boolean;
  canFollow: boolean;
};

export function FollowButton({ targetUserId, initialFollowing, canFollow }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!canFollow) {
      window.location.href = "/login";
      return;
    }
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const res = await toggleFollow(targetUserId);
      if ("following" in res) {
        setFollowing(res.following);
      } else {
        setFollowing(!next);
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={following ? "outline" : "default"}
      disabled={isPending}
      onClick={onClick}
    >
      {following ? "Đang theo dõi" : "Theo dõi"}
    </Button>
  );
}
