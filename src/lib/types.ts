export type User = {
  uid: string;
  name: string;
  roll?: string; // nullable in DB
  pass?: string;
  enrolled_batches: string[];
  created_at: string;
};

export interface UserFormResult extends User {
  pass?: string;
}

export type Admin = {
  uid: string;
  username: string;
  role: "admin" | "moderator";
  created_at: string;
};

export type Batch = {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  status: "live" | "end";
  is_public: boolean;
  created_at: string;
};

export type Exam = {
  id: string;
  name: string;
  description?: string | null;
  course_name?: string | null;
  batch_id?: string | null;
  duration_minutes?: number;
  marks_per_question?: number;
  negative_marks_per_wrong?: number;
  file_id?: string;
  is_practice?: boolean;
  type?: "live" | "practice";
  category?: string;
  shuffle_questions?: boolean;
  shuffle_sections_only?: boolean;
  start_at?: string | null;
  end_at?: string | null;
  total_subjects?: number | null;
  mandatory_subjects?: string[] | null; // JSONB array in DB
  optional_subjects?: string[] | null; // JSONB array in DB
  created_at: string;
  questions?: Question[];
};

export type Question = {
  id?: string;
  exam_id?: string;
  file_id?: string;
  question: string;
  options: string[] | Record<string, string>;
  answer: number | string;
  correct?: string;
  explanation?: string | null;
  type?: string | null;
  section?: string | null;
  order_index?: number;
  created_at?: string;
};

export type StudentExam = {
  id?: string;
  exam_id: string;
  student_id: string;
  score?: number | null; // nullable in DB
  correct_answers?: number;
  wrong_answers?: number;
  unattempted?: number;
  submitted_at?: string;
  marks_per_question?: number;
};

export type ServerActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T | T[] | null;
};
