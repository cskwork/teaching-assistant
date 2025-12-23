# Changelog 2025-12-24

## TalkingHead 3D 아바타 통합

### 추가된 기능

1. **TalkingHead 플로팅 위젯**
   - 우측 하단에 고정된 3D 아바타 위젯 (280x320px)
   - Ready Player Me 아바타 사용 (ARKit + Oculus Visemes 지원)
   - 최소화/확대 토글 버튼

2. **Gemini TTS 연동 립싱크**
   - 기존 Gemini Flash TTS 오디오와 연동
   - WebSocket으로 수신한 오디오를 TalkingHead에 전달
   - 텍스트 기반 단어 타이밍 추정으로 입 움직임 동기화

3. **상태 표시**
   - Ready/Speaking 상태 표시
   - 로딩 스피너 (아바타 로드 중)
   - 에러 상태 처리

### 기술 구현

- **CDN 의존성**: Three.js + TalkingHead (npm 설치 불필요)
- **서버 변경 없음**: 기존 TTS 서버 그대로 사용
- **언어 독립적**: 한국어 TTS에도 동작 (단어 기반 타이밍)

### 수정된 파일

- `server/public/index.html`
  - TalkingHead CSS 추가 (라인 540-648)
  - HTML 컨테이너 추가 (라인 793-802)
  - importmap + TalkingHead 모듈 추가 (라인 805-946)
  - playAudio() 함수에 lip-sync 트리거 추가 (라인 1557-1564)
  - 오디오 정지 시 TalkingHead 상태 업데이트 (라인 1678-1686)

### 사용법

1. 페이지 로드 시 자동으로 아바타 초기화
2. TTS 오디오 재생 시 자동으로 lip-sync 시작
3. `-` 버튼으로 위젯 최소화/복원

### 알려진 제한사항

- Ready Player Me 서비스 2026년 1월 31일 종료 예정
- 한국어 특화 lip-sync 모듈 없음 (영어 기반 추정)
- 첫 로드 시 아바타 GLB 다운로드 지연 가능 (~5MB)
