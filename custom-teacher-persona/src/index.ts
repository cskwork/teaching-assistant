import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { streamSSE } from "hono/streaming";
import { listTeachers, getTeacher } from "./teachers";
import { chat } from "./agent";

const app = new Hono();

// 정적 파일 서빙
app.use("/*", serveStatic({ root: "./public" }));

// 메인 페이지 - 선생님 선택
app.get("/", serveStatic({ path: "./public/index.html" }));

// 채팅 페이지
app.get("/chat/:teacherId", serveStatic({ path: "./public/chat.html" }));

// API: 선생님 목록
app.get("/api/teachers", async (c) => {
  const teachers = await listTeachers();
  return c.json({ teachers });
});

// API: 특정 선생님 정보
app.get("/api/teachers/:id", async (c) => {
  const id = c.req.param("id");
  const teacher = await getTeacher(id);

  if (!teacher) {
    return c.json({ error: "Teacher not found" }, 404);
  }

  const { prompt, ...info } = teacher;
  return c.json(info);
});

// API: 채팅 (SSE 스트리밍)
app.post("/api/chat", async (c) => {
  const body = await c.req.json();
  const { teacherId, message, sessionId } = body;

  if (!teacherId || !message) {
    return c.json({ error: "teacherId and message are required" }, 400);
  }

  return streamSSE(c, async (stream) => {
    for await (const msg of chat({ teacherId, message, sessionId })) {
      await stream.writeSSE({
        event: msg.type,
        data: JSON.stringify(msg)
      });
    }
  });
});

const port = process.env.PORT || 3000;

console.log(`Teacher Persona Chat running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch
};
