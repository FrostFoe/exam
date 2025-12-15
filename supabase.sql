create extension if not exists "uuid-ossp" with schema extensions;

create table users (
  uid uuid default extensions.uuid_generate_v4() not null primary key,
  name text,
  roll text unique,
  pass text,
  enrolled_batches uuid[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX idx_users_enrolled_batches ON users USING GIN (enrolled_batches);

create type admin_role as enum ('admin', 'moderator');

create table admins (
  uid uuid default extensions.uuid_generate_v4() not null primary key,
  username text unique,
  password text,
  role admin_role,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table batches (
  id uuid default extensions.uuid_generate_v4() not null primary key,
  name text not null,
  description text,
  icon_url text,
  is_public boolean default false,
  status text default 'live' check (status in ('live', 'end')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table exams (
  id uuid default extensions.uuid_generate_v4() not null primary key,
  name text not null,
  batch_id uuid references batches(id) on delete cascade,
  duration_minutes integer default 120,
  negative_marks_per_wrong numeric(4,2) default 0.50,
  file_id uuid,
  is_practice boolean default false,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  shuffle_sections_only boolean,
  shuffle_questions boolean,
  marks_per_question numeric default 1,
  total_subjects int2,
  mandatory_subjects jsonb,
  optional_subjects jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists student_exams (
  id uuid default extensions.uuid_generate_v4() not null primary key,
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references users(uid) on delete cascade,
  score numeric(5,2),
  correct_answers integer default 0,
  wrong_answers integer default 0,
  unattempted integer default 0,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX idx_exams_batch_id ON exams(batch_id);
CREATE INDEX idx_student_exams_student_id ON student_exams(student_id);
CREATE INDEX idx_student_exams_exam_id ON student_exams(exam_id);
CREATE UNIQUE INDEX idx_student_exams_student_exam ON student_exams(student_id, exam_id);
