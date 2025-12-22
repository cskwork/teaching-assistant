# Changelog - 2025-12-22

- Excalidraw 캔버스가 npx 확인 프롬프트로 멈추지 않도록 start-all 스크립트에서 tsx 실행을 무인 모드로 변경.
- Excalidraw 캔버스 경로가 바뀐 이슈를 해결하기 위해 start-canvas.sh를 호출하도록 start-all 스크립트를 수정.
- Teaching session 트랜스크립트에 인사 응답을 추가.
- Added teaching transcript entry for quadratic equation explanation.
- Teaching session 트랜스크립트에 클로드 코드 설명을 추가.
- Teaching session 트랜스크립트에 클로드 코드 질문 응답을 추가.
- 에이전트 진행 상황을 SSE로 스트리밍하고, 단일 화면에서 실시간 진행과 채팅 전환을 보여주는 UI로 교체.
- Excalidraw 캔버스를 단일 화면에 임베드하고, 채팅 스트리밍 버블로 대화 흐름을 표시.
- TTS 요청 시 실제 텍스트를 `text_delta`로 스트리밍해 대화 패널에 실시간으로 표시.
- 실제 이벤트 수신 시 데모 스트림을 초기화해 실시간 텍스트만 남도록 처리.
- 텍스트 스트리밍을 오디오 길이에 맞춰 느리게 재생하고, SSE 중복 전송으로 인한 텍스트 반복을 제거.
- 캔버스를 좌측, 채팅을 우측에 배치하도록 레이아웃을 재구성.
- Excalidraw 요소를 직접 렌더링해 여백 없이 드로잉만 보이는 미리보기를 추가.
- Excalidraw 미리보기 줌 인아웃 슬라이더와 마우스 휠 확대 축소를 추가.
- 캔버스와 채팅 패널 높이를 키우고 화면 폭을 더 넓게 사용하도록 조정.
- 캔버스 미리보기 드래그 이동을 지원하고 캔버스/채팅 영역을 추가로 확대.
- 채팅 입력 UI를 제거하고 로그 전용 화면으로 정리.
- TTS 서버 연결 실패 원인과 해결법을 CLAUDE 인사이트에 추가.
