import { readdir } from "node:fs/promises";
import { join } from "node:path";

const TEACHERS_DIR = join(import.meta.dir, "../teachers");

export interface Teacher {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

// 마크다운 파일에서 메타데이터 추출
function parseTeacherMd(id: string, content: string): Teacher {
  const lines = content.split("\n");

  // 첫 번째 # 헤딩을 이름으로 사용
  const titleLine = lines.find(l => l.startsWith("# "));
  const name = titleLine ? titleLine.replace("# ", "").trim() : id;

  // Teaching Style 섹션의 첫 번째 항목을 설명으로 사용
  const styleIndex = lines.findIndex(l => l.includes("Teaching Style"));
  let description = `Learn with ${name}`;
  if (styleIndex !== -1) {
    for (let i = styleIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("-")) {
        description = line.replace(/^-\s*/, "");
        break;
      }
    }
  }

  return {
    id,
    name,
    description,
    prompt: content
  };
}

// 모든 선생님 목록 가져오기
export async function listTeachers(): Promise<Omit<Teacher, "prompt">[]> {
  const files = await readdir(TEACHERS_DIR);
  const teachers: Omit<Teacher, "prompt">[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const id = file.replace(".md", "");
    const content = await Bun.file(join(TEACHERS_DIR, file)).text();
    const { prompt, ...teacher } = parseTeacherMd(id, content);
    teachers.push(teacher);
  }

  return teachers;
}

// 특정 선생님 가져오기
export async function getTeacher(id: string): Promise<Teacher | null> {
  const filePath = join(TEACHERS_DIR, `${id}.md`);
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    return null;
  }

  const content = await file.text();
  return parseTeacherMd(id, content);
}
