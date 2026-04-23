export type TopicVariant = "tech" | "kinh-te" | "the-thao" | "giai-tri" | "general";

const TONE_BY_TOPIC: Record<TopicVariant, string> = {
  "tech": "tone tò mò, thích khám phá công nghệ, dùng ví dụ thực tế dễ hiểu",
  "kinh-te": "tone phân tích, bình tĩnh, đặt câu hỏi suy ngẫm về tác động thực tế",
  "the-thao": "tone hứng khởi, cảm xúc, dùng từ mạnh như 'đỉnh', 'điên rồ', 'không thể tin được'",
  "giai-tri": "tone vui vẻ, tám chuyện, dùng emoji vừa phải",
  "general": "tone tự nhiên, chia sẻ như với bạn bè",
};

const BANNED_KEYWORDS = [
  "cờ bạc", "cá độ", "khiêu dâm", "súng đạn", "ma túy", "rửa tiền",
  "hack tài khoản", "phần mềm crack",
];

export const BANNED_KEYWORDS_RE = new RegExp(
  BANNED_KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

export function buildSystemPrompt(topic: TopicVariant = "general"): string {
  const tone = TONE_BY_TOPIC[topic];
  return `Bạn là biên tập viên cho blog tin tức Threads-style.

NHIỆM VỤ: Đọc nguồn tin bên dưới và viết lại thành bài đăng theo phong cách của bạn.

PHONG CÁCH:
- ${tone}
- Ngắn gọn: 2–4 đoạn, mỗi đoạn 2–4 câu
- Có hook mở đầu cuốn hút (câu hỏi, sự thật bất ngờ, hoặc số liệu đáng chú ý)
- Thêm nhận định cá nhân, KHÔNG copy nguyên văn
- Cuối bài trích nguồn: "Nguồn: <domain>"

GIỚI HẠN NGHIÊM NGẶT:
- Không quá 500 từ
- KHÔNG bịa số liệu, tên người, sự kiện không có trong nguồn
- KHÔNG nội dung 18+, bạo lực, cờ bạc, ma túy

OUTPUT: Chỉ trả về JSON hợp lệ (không có markdown code block), schema:
{
  "title": "tiêu đề ngắn dưới 80 ký tự",
  "content": "nội dung bài đăng",
  "tags": ["tag1", "tag2"],
  "excerpt": "tóm tắt 1 câu dưới 150 ký tự"
}`;
}

export function buildUserPrompt(sourceText: string, topic: string): string {
  return `CHỦ ĐỀ: ${topic || "Tin tức tổng hợp"}

NGUỒN TIN:
${sourceText.slice(0, 8000)}

Hãy viết bài theo yêu cầu trên.`;
}
