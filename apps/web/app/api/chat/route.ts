import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, noteId } = await req.json();
    console.log("[CHAT API] Received request:", { noteId, messageCount: messages?.length });

    if (!noteId || !messages) {
      console.error("[CHAT API] Missing fields:", { noteId, messages });
      return new Response("Missing required fields", { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const openRouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    try {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        await supabase.from("chat_messages").insert({
          note_id: noteId,
          role: "user",
          content: lastMessage.content,
        });
      }
    } catch (dbError) {
      console.error("[CHAT API] DB Save Error:", dbError);
      // Continue anyway
    }

    console.log("[CHAT API] calls streamText with model: google/gemini-2.0-flash-001");

    const result = await streamText({
      model: openRouter("google/gemini-2.0-flash-001"),
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant helping users with their notes. You can schedule notes by setting a due date.",
        },
        ...messages,
      ],
      tools: {
        scheduleNote: tool({
          description:
            "Schedule the current note with a due date. Use this when the user asks to schedule, remind, or set a deadline.",
          parameters: z.object({
            date: z.string().describe("ISO date string (e.g., 2024-12-25T09:00:00Z) or YYYY-MM-DD"),
          }),
          execute: async ({ date }) => {
            console.log(`Scheduling note ${noteId} for ${date}`);
            const { error } = await supabase.from("notes").update({ due_date: date }).eq("id", noteId);

            if (error) {
              console.error("Error updating note:", error);
              return "Failed to schedule note.";
            }
            return `Note scheduled for ${date}`;
          },
        }),
      },
      onFinish: async ({ text }) => {
        if (text) {
          await supabase.from("chat_messages").insert({
            note_id: noteId,
            role: "assistant",
            content: text,
          });
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
