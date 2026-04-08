import { GoogleGenAI, Type } from "@google/genai";
import { Course } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const parseScheduleText = async (text: string): Promise<Course[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Hãy phân tích đoạn văn bản sau đây (thường là thời khóa biểu copy từ cổng thông tin sinh viên Đại học Đồng Tháp) và chuyển nó thành danh sách các môn học có cấu trúc JSON.
    
    Văn bản:
    ${text}
    
    Yêu cầu:
    - Trả về mảng các đối tượng môn học.
    - Mỗi đối tượng có: name (tên môn), code (mã môn), lecturer (giảng viên), room (phòng học), dayOfWeek (thứ trong tuần: 1 cho Thứ 2, ..., 6 cho Thứ 7, 0 cho Chủ Nhật), startTime (giờ bắt đầu HH:mm), endTime (giờ kết thúc HH:mm).
    - Nếu không có thông tin nào đó, hãy để trống hoặc ước lượng hợp lý.
    - Chú ý: Sinh viên DThU thường dùng "Tiết" (ví dụ Tiết 1-3). Tiết 1 bắt đầu lúc 07:00, mỗi tiết 50p, nghỉ giải lao 10p.
    - Tiết 1: 07:00 - 07:50
    - Tiết 2: 08:00 - 08:50
    - Tiết 3: 09:00 - 09:50
    - Tiết 4: 10:00 - 10:50
    - Tiết 5: 11:00 - 11:50
    - Tiết 6: 13:00 - 13:50
    - Tiết 7: 14:00 - 14:50
    - Tiết 8: 15:00 - 15:50
    - Tiết 9: 16:00 - 16:50
    - Tiết 10: 17:00 - 17:50`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            code: { type: Type.STRING },
            lecturer: { type: Type.STRING },
            room: { type: Type.STRING },
            dayOfWeek: { type: Type.INTEGER },
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
          },
          required: ["name", "dayOfWeek", "startTime", "endTime"],
        },
      },
    },
  });

  try {
    const rawData = JSON.parse(response.text || "[]");
    return rawData.map((item: any, index: number) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      color: getRandomColor(index),
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    return [];
  }
};

const getRandomColor = (index: number) => {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ];
  return colors[index % colors.length];
};
