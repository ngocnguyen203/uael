export interface Course {
  id: string;
  name: string;
  code: string;
  lecturer: string;
  room: string;
  dayOfWeek: number; // 0 for Sunday, 1-6 for Mon-Sat
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  color?: string;
}

export interface ScheduleState {
  courses: Course[];
}
