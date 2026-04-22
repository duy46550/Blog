import { redirect } from "next/navigation";

// Không có flow đăng ký riêng — redirect sang login.
// (Đăng nhập Google/magic link sẽ tự tạo tài khoản.)
export default function RegisterPage() {
  redirect("/login");
}
