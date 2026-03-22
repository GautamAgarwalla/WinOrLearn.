export interface Attachment {
  id: string;
  type: 'image' | 'pdf' | 'audio';
  url: string; // Base64 string or blob URL
  name: string;
}

export interface TagData {
  name: string;
  color: string;
}

export interface Resource {
  id: string;
  title: string;
  link: string;
  secondaryUrl?: string;
  category: string;
  tags: TagData[];
  isImportant: boolean;
  createdAt: number;
  attachments?: Attachment[];
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface RoutineTask {
  id: string;
  title: string;
  days: DayOfWeek[];
  time?: string;
}

export interface DailyTask {
  id: string;
  routineTaskId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
  wasOverdue?: boolean;
}
