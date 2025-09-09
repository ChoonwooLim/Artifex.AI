# Dual GPU Architecture for Artifex.AI

## 시스템 구성
- **Windows PC (Main)**: RTX GPU + Artifex.AI 메인 앱
- **Pop!_OS PC (Worker)**: 추가 GPU + 10Gbps 연결
- **연결**: 10.0.0.2 (10Gbps Direct Connection)

## 분산 처리 전략

### 1. 작업 분할 방식
- **프레임 분할**: 비디오를 절반으로 나누어 각 GPU에서 처리
- **파이프라인 분할**: 각 단계를 다른 GPU에서 처리
- **모델 분할**: 큰 모델을 두 GPU에 분산

### 2. 통신 프로토콜
- **HTTP REST API**: 작업 요청/응답
- **WebSocket**: 실시간 진행률 업데이트
- **File Transfer**: 10Gbps로 빠른 파일 전송

## 구현 계획

### Phase 1: API 서버 구축
- Pop!_OS에 FastAPI 서버 설치
- GPU 상태 모니터링 엔드포인트
- 작업 큐 시스템

### Phase 2: 작업 분산 시스템
- Windows에서 작업 스케줄러
- Pop!_OS로 작업 전달
- 결과 수집 및 병합

### Phase 3: 최적화
- 로드 밸런싱
- 캐싱 메커니즘
- 실패 복구 시스템

## 예상 성능 향상
- 단일 GPU: 10분 영상 = 30분 처리
- 듀얼 GPU: 10분 영상 = 15-18분 처리 (약 1.7-2배 향상)