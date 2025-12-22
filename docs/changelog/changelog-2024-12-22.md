# Changelog - 2024-12-22

## 새로운 기능

### Multi-Modal Teaching Assistant 초기 구현
- 한국어 음성 및 시각적 학습을 지원하는 교육 워크플로우 구축
- Excalidraw MCP와 Gemini TTS API 통합

### 주요 컴포넌트

#### 1. TTS Express Server (`server/`)
- **server/index.js**: Gemini API를 활용한 한국어 TTS 서버
  - POST /tts 엔드포인트로 텍스트를 음성으로 변환
  - WebSocket 지원으로 실시간 스트리밍
  - Base64 PCM을 WAV 형식으로 자동 변환
  - 포트: 3334

- **server/public/index.html**: 브라우저 기반 오디오 플레이어
  - WebSocket 자동 연결
  - 실시간 음성 재생
  - 볼륨 조절 기능
  - 오디오 비주얼라이저
  - 테스트 인터페이스

- **server/package.json**: Node.js 의존성 관리
  - express: 웹 서버
  - ws: WebSocket 지원
  - cors: CORS 처리
  - dotenv: 환경 변수 관리

#### 2. Teaching Skill (`~/.claude/skills/teach.md`)
- 한국어 교육 모드 정의
- 3-5문장 청킹 전략
- Drawing + Speaking 서브에이전트 오케스트레이션
- Excalidraw 시각화 전략 (색상 코드, 다이어그램 유형)
- 트랜스크립트 자동 기록

#### 3. 시작 스크립트
- **scripts/start-all.sh**: 전체 시스템 자동 시작
  - Excalidraw Canvas (포트 3333)
  - TTS Server (포트 3334)
  - 의존성 자동 설치
  - 프로세스 충돌 방지
  - Screen 세션 관리

#### 4. 인프라스트럭처
- **.env.example**: API 키 설정 템플릿
- **.gitignore**: Git 버전 관리 제외 파일
- **transcripts/**: 학습 세션 기록 저장 디렉토리
- **docs/changelog/**: 변경 이력 문서

## 기술 스택

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + WebSocket
- **TTS**: Google Gemini API (한국어 음성)
- **Drawing**: Excalidraw MCP
- **Orchestration**: Claude Code Skills

## 사용 방법

1. API 키 설정:
   ```bash
   cp .env.example .env
   # .env 파일에 GEMINI_API_KEY 입력
   ```

2. 시스템 시작:
   ```bash
   ./scripts/start-all.sh
   ```

3. 브라우저 열기:
   ```
   http://localhost:3334
   ```

4. Claude Code에서 `/teach` 실행

## 아키텍처

```
Claude (Main Teacher)
    ├─> Drawing Subagent (Excalidraw MCP)
    ├─> Speaking Subagent (TTS Server)
    └─> Transcript Recording
```

## 다음 단계

- [ ] 실제 학습 세션 테스트
- [ ] Excalidraw 자동 동기화 검증
- [ ] TTS 음성 품질 최적화
- [ ] 트랜스크립트 포맷 개선
- [ ] 에러 핸들링 강화
