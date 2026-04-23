import { requireUser } from "@/lib/auth-helpers";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata = { title: "Chỉnh sửa hồ sơ" };

export default async function SettingsProfilePage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Chỉnh sửa hồ sơ</h1>
      <ProfileForm
        initial={{
          displayName: user.displayName,
          username: user.username ?? "",
          bio: user.bio ?? "",
          image: user.image ?? "",
        }}
      />
    </div>
  );
}
