import { query } from "@anthropic-ai/claude-agent-sdk";
import { getTeacher } from "./teachers";

export interface ChatRequest {
  teacherId: string;
  message: string;
  sessionId?: string;
}

export interface ChatMessage {
  type: "text" | "error" | "done";
  content: string;
  sessionId?: string;
}

// 세션 저장소 (서버 재시작 시 초기화됨)
const sessions = new Map<string, string>();

export async function* chat(req: ChatRequest): AsyncGenerator<ChatMessage> {
  const teacher = await getTeacher(req.teacherId);

  if (!teacher) {
    yield { type: "error", content: `Teacher '${req.teacherId}' not found` };
    return;
  }

  let sessionId: string | undefined = req.sessionId;

  try {
    const queryOptions: any = {
      allowedTools: ["WebSearch"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      systemPrompt: {
        type: "preset",
        preset: "default",
        append: teacher.prompt
      }
    };

    // 세션 재개
    if (sessionId && sessions.has(sessionId)) {
      queryOptions.resume = sessions.get(sessionId);
    }

    for await (const message of query({
      prompt: req.message,
      options: queryOptions
    })) {
      // 세션 ID 캡처
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
        if (sessionId) {
          sessions.set(sessionId, sessionId);
        }
      }

      // 텍스트 응답 스트리밍
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if (block.type === "text") {
            yield { type: "text", content: block.text, sessionId };
          }
        }
      }

      // 최종 결과
      if (message.type === "result") {
        if (message.subtype === "success" && message.result) {
          yield { type: "text", content: message.result, sessionId };
        } else if (message.subtype !== "success") {
          yield { type: "error", content: `Agent error: ${message.subtype}` };
        }
      }
    }

    yield { type: "done", content: "", sessionId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    yield { type: "error", content: errorMessage };
  }
}
