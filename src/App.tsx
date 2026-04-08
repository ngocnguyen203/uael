import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  Download, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User,
  ChevronLeft,
  ChevronRight,
  Info,
  Settings,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Course } from "./types";
import { parseScheduleText } from "./lib/gemini";
import { cn } from "@/lib/utils";

const DAYS = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 to 19:00

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dthu_schedule");
    if (saved) {
      try {
        setCourses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load schedule", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("dthu_schedule", JSON.stringify(courses));
  }, [courses]);

  const handleSmartImport = async () => {
    if (!importText.trim()) return;
    setIsLoading(true);
    try {
      const newCourses = await parseScheduleText(importText);
      setCourses((prev) => [...prev, ...newCourses]);
      setIsImporting(false);
      setImportText("");
    } catch (error) {
      console.error("Import failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setSelectedCourse(null);
  };

  const clearAll = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ thời khóa biểu?")) {
      setCourses([]);
    }
  };

  const getCoursePosition = (course: Course) => {
    const [startH, startM] = course.startTime.split(":").map(Number);
    const [endH, endM] = course.endTime.split(":").map(Number);
    
    const startMinutes = (startH - 7) * 60 + startM;
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    
    // Grid rows start at 7:00, each row is 60px (1 hour)
    // Header row is index 1, so 7:00 is row 2
    const top = (startMinutes / 60) * 60 + 50; // 50 is header height
    const height = (durationMinutes / 60) * 60;
    
    // Column: Time label is col 1, Sun is col 2, Mon is col 3...
    // dayOfWeek: 0 (Sun) -> col 2, 1 (Mon) -> col 3
    const left = `calc(80px + (100% - 80px) / 7 * ${course.dayOfWeek === 0 ? 0 : course.dayOfWeek - 1})`;
    const width = `calc((100% - 80px) / 7)`;
    
    return { top, height, left, width };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-dthu-blue p-2 rounded-lg">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-dthu-blue">DThU Smart Schedule</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Đại học Đồng Tháp</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isImporting} onOpenChange={setIsImporting}>
            <DialogTrigger render={<Button variant="outline" className="gap-2 border-dthu-green text-dthu-green hover:bg-dthu-green/10" />}>
              <Sparkles className="w-4 h-4" />
              Nhập thông minh (AI)
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-dthu-green" />
                  Nhập thời khóa biểu bằng AI
                </DialogTitle>
                <DialogDescription>
                  Dán nội dung thời khóa biểu từ cổng thông tin sinh viên DThU vào đây. AI sẽ tự động phân tích và tạo lịch cho bạn.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea 
                  placeholder="Ví dụ: Thứ 2, Tiết 1-3, Môn: Lập trình Web, Phòng: C1.201..."
                  className="min-h-[200px] font-mono text-sm"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsImporting(false)}>Hủy</Button>
                <Button 
                  onClick={handleSmartImport} 
                  disabled={isLoading || !importText.trim()}
                  className="bg-dthu-green hover:bg-dthu-green/90"
                >
                  {isLoading ? "Đang phân tích..." : "Bắt đầu nhập"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="destructive" size="icon" onClick={clearAll} title="Xóa tất cả">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Timetable Container */}
          <Card className="border-none shadow-xl overflow-hidden bg-white">
            <div className="relative overflow-x-auto">
              <div className="min-w-[1000px] relative">
                {/* Grid Header */}
                <div className="timetable-grid border-b bg-slate-50/50">
                  <div className="flex items-center justify-center border-r font-mono text-[10px] text-slate-400 uppercase">Giờ</div>
                  {DAYS.slice(1).concat(DAYS[0]).map((day) => (
                    <div key={day} className="flex items-center justify-center font-bold text-sm text-slate-600 border-r last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                <div className="relative">
                  {/* Time Labels & Horizontal Lines */}
                  {HOURS.map((hour) => (
                    <div key={hour} className="timetable-grid border-b last:border-b-0 h-[60px]">
                      <div className="flex items-start justify-center pt-2 border-r font-mono text-xs text-slate-400">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="border-r last:border-r-0 bg-white/50" />
                      ))}
                    </div>
                  ))}

                  {/* Courses Overlay */}
                  <AnimatePresence>
                    {courses.map((course) => {
                      const pos = getCoursePosition(course);
                      return (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute z-10 p-1"
                          style={{
                            top: pos.top,
                            height: pos.height,
                            left: pos.left,
                            width: pos.width,
                          }}
                          onClick={() => setSelectedCourse(course)}
                        >
                          <div 
                            className="h-full w-full rounded-md border-l-4 p-2 shadow-sm flex flex-col gap-1 overflow-hidden transition-all hover:brightness-95 active:scale-95 cursor-pointer"
                            style={{ 
                              backgroundColor: `${course.color}15`, 
                              borderColor: course.color,
                              color: course.color 
                            }}
                          >
                            <span className="font-bold text-[11px] leading-tight line-clamp-2 uppercase">{course.name}</span>
                            <div className="flex items-center gap-1 text-[9px] opacity-80">
                              <MapPin className="w-2 h-2" />
                              <span className="truncate">{course.room}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] opacity-80">
                              <Clock className="w-2 h-2" />
                              <span>{course.startTime} - {course.endTime}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Card>

          {/* Legend / Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="w-4 h-4 text-dthu-blue" />
                  Hướng dẫn
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-2">
                <p>• Sử dụng <strong>Nhập thông minh</strong> để thêm lịch nhanh chóng từ văn bản.</p>
                <p>• Click vào môn học để xem chi tiết hoặc xóa.</p>
                <p>• Lịch học được lưu tự động trên trình duyệt của bạn.</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-slate-200 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-dthu-green" />
                  Mẹo AI
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600">
                <p>Bạn có thể dán toàn bộ danh sách môn học từ file PDF hoặc Excel của trường, AI sẽ tự động lọc ra các thông tin cần thiết như Thứ, Tiết, Phòng và Giảng viên.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent>
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold" style={{ color: selectedCourse.color }}>
                  {selectedCourse.name}
                </DialogTitle>
                <DialogDescription className="font-mono text-sm">
                  Mã môn: {selectedCourse.code || "N/A"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Thời gian</Label>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                      {DAYS[selectedCourse.dayOfWeek === 0 ? 0 : selectedCourse.dayOfWeek]}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {selectedCourse.startTime} - {selectedCourse.endTime}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Địa điểm</Label>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {selectedCourse.room}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400 font-bold">Giảng viên</Label>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="w-4 h-4 text-slate-400" />
                    {selectedCourse.lecturer || "Chưa cập nhật"}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedCourse(null)}>Đóng</Button>
                <Button variant="destructive" onClick={() => deleteCourse(selectedCourse.id)} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Xóa môn học
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t py-4 px-6 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">
        &copy; 2026 DThU Smart Schedule • Hỗ trợ bởi Google Gemini AI
      </footer>
    </div>
  );
}
