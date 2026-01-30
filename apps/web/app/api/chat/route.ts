import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.log("[CHAT API] POST /api/chat - Request received");
  
  try {
    const { noteId, message, history } = await req.json();
    console.log("[CHAT API] Request data:", { noteId, messageLength: message?.length, historyLength: history?.length });

    if (!noteId || !message) {
      console.error("[CHAT API] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Store user message
    console.log("[CHAT API] Storing user message in database...");
    const { error: insertError } = await supabase.from("chat_messages").insert({
      note_id: noteId,
      role: "user",
      content: message,
    });

    if (insertError) {
      console.error("[CHAT API] Database insert error:", insertError);
    }

    // Call OpenRouter API
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error("[CHAT API] OpenRouter API key not configured");
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }
    console.log("[CHAT API] OpenRouter key found, length:", openRouterKey.length);

    const messages = [
      {
        role: "system",
        content: "You are a helpful AI assistant helping users with their notes. Provide concise, clear, and insightful responses.",
      },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    console.log("[CHAT API] Calling OpenRouter API with", messages.length, "messages");
    
    let response;
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "Novel Note App",
          },
          body: JSON.stringify({
            model: "tngtech/deepseek-r1t2-chimera:free",
            messages,
            stream: true,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        break;
      } catch (err: any) {
        retries--;
        console.error(`[CHAT API] Fetch attempt failed (${3 - retries}/3):`, err.message);
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    if (!response) {
      throw new Error("Failed to get response after retries");
    }

    console.log("[CHAT API] OpenRouter response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CHAT API] OpenRouter API error:", errorText);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullContent = "";

    // Stream response
    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || "";
                  if (content) {
                    fullContent += content;
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Store assistant message
          if (fullContent) {
            await supabase.from("chat_messages").insert({
              note_id: noteId,
              role: "assistant",
              content: fullContent,
            });
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[CHAT API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
