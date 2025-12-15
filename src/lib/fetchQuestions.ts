export interface Question {
  id?: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  option5?: string;
  answer: string;
  explanation?: string;
  type: string;
  section: string;
  file_id?: number;
}

export interface RawQuestion {
  id?: string;
  uid?: string;
  question?: string;
  question_text?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  answer?: string;
  correct?: string;
  explanation?: string;
  type?: string;
  section?: string;
  file_id?: number;
  [key: string]: unknown;
}
export async function fetchQuestions(
  fileId?: string | number,
): Promise<RawQuestion[]> {
  // Use GET /api/fetch-questions?file_id= to avoid CORS and keep behavior consistent
  try {
    const url = fileId
      ? `/api/fetch-questions?file_id=${encodeURIComponent(String(fileId))}`
      : "/api/fetch-questions";

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error ${res.status}: ${text}`);
    }

    const payload = await res.json();

    // The API may return either { success: true, data: { questions: [...] } } (GET)
    // or { success: true, questions: [...] } (POST/back-compat). Normalize both.
    let rawQuestions: RawQuestion[] = [];
    if (payload && payload.success) {
      if (payload.data && Array.isArray(payload.data.questions))
        rawQuestions = payload.data.questions;
      else if (Array.isArray(payload.questions))
        rawQuestions = payload.questions;
      else if (Array.isArray(payload)) rawQuestions = payload; // defensive
    } else if (Array.isArray(payload)) {
      rawQuestions = payload;
    } else {
      throw new Error("Unexpected API response shape");
    }

    return rawQuestions;
  } catch (error) {
    // Bubble up a useful error for callers
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}
