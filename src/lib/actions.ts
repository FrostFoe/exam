
"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "./supabase";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const roll = formData.get("roll") as string;
  const batch_id = formData.get("batch_id") as string | null;

  // 1. Generate a random 8-digit password
  const newPassword = Math.random().toString(36).slice(-8);

  // 2. Insert the new user
  const enrolled_batches = batch_id ? [batch_id] : [];
  const { data, error } = await supabase
    .from("users")
    .insert([{ name, roll, pass: newPassword, enrolled_batches }])
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: "Failed to create user: " + error.message,
    };
  }

  revalidatePath("/admin/dashboard/users");

  // 3. Return user data with the generated password
  return {
    success: true,
    message: "User created successfully",
    data: { ...data, pass: newPassword },
  };
}

export async function updateUser(formData: FormData) {
  const uid = formData.get("uid") as string;
  const name = formData.get("name") as string;
  const roll = formData.get("roll") as string;
  const pass = formData.get("pass") as string;

  const { data, error } = await supabase
    .from("users")
    .update({ name, roll, pass })
    .eq("uid", uid)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: "Failed to update user: " + error.message,
    };
  }

  revalidatePath("/admin/dashboard/users");

  return {
    success: true,
    data,
  };
}

export async function createBatch(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon_url = formData.get("icon_url") as string;
  const status = formData.get("status") as "live" | "end";
  const is_public = formData.get("is_public") === "true";

  const { data, error } = await supabase
    .from("batches")
    .insert([
      {
        name,
        description,
        icon_url,
        status,
        is_public,
      },
    ])
    .select();

  if (error) {
    return {
      success: false,
      message: "Failed to create batch: " + error.message,
    };
  }

  revalidatePath("/admin/dashboard/batches");

  return {
    success: true,
    message: "Batch created successfully",
    data: data[0],
  };
}

export async function updateBatch(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const is_public = formData.get("is_public_hidden") === "true";
  const icon_url = formData.get("icon_url") as string;

  const batchUpdate: {
    name: string;
    description: string;
    is_public: boolean;
    icon_url?: string;
  } = {
    name,
    description,
    is_public,
  };

  if (icon_url) {
    batchUpdate.icon_url = icon_url;
  }

  const { data, error } = await supabase
    .from("batches")
    .update(batchUpdate)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: "Failed to update batch: " + error.message,
    };
  }

  revalidatePath("/admin/dashboard/batches");
  revalidatePath(`/admin/dashboard/batches/\${id}`);

  return {
    success: true,
    message: "Batch updated successfully",
    data,
  };
}

export async function deleteBatch(formData: FormData) {
  const id = formData.get("id") as string;

  const { error } = await supabase.from("batches").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: "Failed to delete batch: " + error.message,
    };
  }

  revalidatePath("/admin/dashboard/batches");

  return {
    success: true,
    message: "Batch deleted successfully",
  };
}

export async function createExam(formData: FormData) {
  const name = formData.get("name") as string;
  const batch_id_raw = formData.get("batch_id") as string | null;
  const batch_id = batch_id_raw === 'public' ? null : batch_id_raw;
  const durationRaw = formData.get("duration_minutes") as string;
  const duration_minutes = durationRaw ? parseInt(durationRaw, 10) : null;
  const marks_per_question = parseFloat(
    formData.get("marks_per_question") as string,
  );
  const negative_marks_per_wrong = parseFloat(
    formData.get("negative_marks_per_wrong") as string,
  );
  const file_id = formData.get("file_id") as string;
  const is_practice = formData.get("is_practice") === "true";
  const shuffle_questions = formData.get("shuffle_questions") === "true";
  const shuffle_sections_only =
    formData.get("shuffle_sections_only") === "true";
  let start_at = formData.get("start_at") as string | null;
  let end_at = formData.get("end_at") as string | null;

  if (is_practice) {
    start_at = null;
    end_at = null;
  }

  const total_subjects_raw = formData.get("total_subjects") as string;
  const total_subjects = total_subjects_raw
    ? parseInt(total_subjects_raw, 10)
    : null;
  const mandatory_subjects = formData.getAll("mandatory_subjects") as string[];
  const optional_subjects = formData.getAll("optional_subjects") as string[];

  const { data, error } = await supabase
    .from("exams")
    .insert([
      {
        name,
        batch_id,
        duration_minutes,
        marks_per_question,
        negative_marks_per_wrong,
        file_id: file_id || null,
        is_practice: is_practice || false,
        shuffle_questions,
        shuffle_sections_only,
        start_at,
        end_at,
        total_subjects,
        mandatory_subjects:
          mandatory_subjects.length > 0 ? mandatory_subjects : null,
        optional_subjects:
          optional_subjects.length > 0 ? optional_subjects : null,
      },
    ])
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: "Failed to create exam: " + error.message,
    };
  }

  if (batch_id) {
    revalidatePath(`/admin/dashboard/batches/\${batch_id}`);
  } else {
    revalidatePath("/admin/dashboard/exams");
  }

  return {
    success: true,
    message: "Exam created successfully",
    data,
  };
}

export async function deleteExam(formData: FormData) {
  const id = formData.get("id") as string;
  const batch_id = formData.get("batch_id") as string | null;

  const { error } = await supabase.from("exams").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: "Failed to delete exam: " + error.message,
    };
  }

  if (batch_id) {
    revalidatePath(`/admin/dashboard/batches/\${batch_id}`);
  } else {
    revalidatePath("/admin/dashboard/exams");
  }

  return {
    success: true,
    message: "Exam deleted successfully",
  };
}

export async function updateExam(formData: FormData) {
  const id = formData.get("id") as string;
  const batch_id = formData.get("batch_id") as string;
  const name = formData.get("name") as string;
  const durationRaw = formData.get("duration_minutes") as string;
  const duration_minutes = parseInt(durationRaw, 10);
  const marks_per_question_raw = formData.get("marks_per_question") as string;
  const marks_per_question = marks_per_question_raw ? parseFloat(marks_per_question_raw) : null;
  const negative_marks_per_wrong = parseFloat(
    formData.get("negative_marks_per_wrong") as string,
  );
  const file_id = formData.get("file_id") as string;
  const is_practice = formData.get("is_practice") === "true";
  const shuffle_questions = formData.get("shuffle_questions") === "true";
  const shuffle_sections_only =
    formData.get("shuffle_sections_only") === "true";
  let start_at = formData.get("start_at") as string | null;
  let end_at = formData.get("end_at") as string | null;

  if (is_practice) {
    start_at = null;
    end_at = null;
  }

  const total_subjects_raw = formData.get("total_subjects") as string;
  const total_subjects = total_subjects_raw
    ? parseInt(total_subjects_raw, 10)
    : null;
  const mandatory_subjects = formData.getAll("mandatory_subjects") as string[];
  const optional_subjects = formData.getAll("optional_subjects") as string[];

  const { data, error } = await supabase
    .from("exams")
    .update({
      name,
      duration_minutes: isNaN(duration_minutes) ? null : duration_minutes,
      marks_per_question,
      negative_marks_per_wrong,
      file_id: file_id || null,
      is_practice: is_practice || false,
      shuffle_questions,
      shuffle_sections_only,
      start_at: start_at,
      end_at: end_at,
      total_subjects,
      mandatory_subjects:
        mandatory_subjects.length > 0 ? mandatory_subjects : [],
      optional_subjects:
        optional_subjects.length > 0 ? optional_subjects : [],
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: "Failed to update exam: " + error.message,
    };
  }

  const revalidatePathString = `/admin/dashboard/batches/${batch_id}`;
  revalidatePath(revalidatePathString);
  revalidatePath("/admin/dashboard/exams");

  return {
    success: true,
    data,
  };
}

export async function enrollStudent(formData: FormData) {
  const user_id = formData.get("user_id") as string;
  const batch_id = formData.get("batch_id") as string;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("enrolled_batches")
    .eq("uid", user_id)
    .single();

  if (userError || !user) {
    return {
      success: false,
      message: "User not found: " + (userError?.message || ""),
    };
  }

  const updatedBatches = [...(user.enrolled_batches || []), batch_id];

  const { data, error } = await supabase
    .from("users")
    .update({ enrolled_batches: updatedBatches })
    .eq("uid", user_id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: "Failed to enroll student: " + error.message,
    };
  }

  revalidatePath(`/admin/dashboard/batches/\${batch_id}`);

  return {
    success: true,
    data,
  };
}

export async function removeStudentFromBatch(formData: FormData) {
  const user_id = formData.get("user_id") as string;
  const batch_id = formData.get("batch_id") as string;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("enrolled_batches")
    .eq("uid", user_id)
    .single();

  if (userError || !user) {
    return {
      success: false,
      message: "User not found: " + (userError?.message || ""),
    };
  }

  const updatedBatches = (user.enrolled_batches || []).filter(
    (id: string) => id !== batch_id,
  );

  const { data, error } = await supabase
    .from("users")
    .update({ enrolled_batches: updatedBatches })
    .eq("uid", user_id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: "Failed to remove student from batch: " + error.message,
    };
  }

  revalidatePath(`/admin/dashboard/batches/\${batch_id}`);

  return {
    success: true,
    data,
  };
}
