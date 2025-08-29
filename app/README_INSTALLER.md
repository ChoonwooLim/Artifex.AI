# Artifex AI Studio 설치 프로그램 가이드

## 사전 준비사항

1. **아이콘 파일 준비**
   - `app/build-resources/icon.ico` 파일 생성 필요
   - 최소 256x256 픽셀 권장
   - Windows .ico 형식

2. **의존성 설치**
   ```bash
   cd app
   npm install
   ```

## 빌드 방법

### 1. 설치 프로그램 빌드 (NSIS Installer)
```bash
cd app
build-installer.bat
```
- 출력: `dist-installer/ArtifexAI-Setup-0.1.0.exe`
- 시스템에 설치되는 버전
- 자동 업데이트 지원
- 시작 메뉴 및 바탕화면 바로가기 생성

### 2. 포터블 버전 빌드
```bash
cd app
build-portable.bat
```
- 출력: `dist-installer/ArtifexAI-0.1.0.exe`
- USB나 외장 드라이브에서 실행 가능
- 설치 불필요

## 설치 프로그램 특징

### 자동 포함 항목
- Electron 앱 및 모든 Node.js 의존성
- WAN 2.2 Python 코드
- AI 모델 파일들 (T2V, I2V, TI2V, S2V)
- Python 가상환경 자동 설정 스크립트

### 설치 시 자동 설정
- Python 가상환경 생성
- 필요한 Python 패키지 설치
- 환경 변수 설정 (WAN_FORCE_FP16, WAN_COMPILE 등)
- CUDA 확인 및 안내

### 자동 업데이트
- GitHub Releases를 통한 자동 업데이트
- 앱 실행 시 자동으로 업데이트 확인
- Help 메뉴에서 수동 업데이트 확인 가능

## 배포 방법

### GitHub Releases 배포
1. GitHub에 새 릴리즈 생성
2. 빌드된 `.exe` 파일 업로드
3. `latest.yml` 파일도 함께 업로드 (자동 생성됨)

### 버전 업데이트
1. `app/package.json`의 version 수정
2. 재빌드
3. GitHub에 새 릴리즈로 업로드

## 문제 해결

### 빌드 실패 시
- Node.js 18 이상 설치 확인
- `npm install` 재실행
- Windows Defender 실시간 보호 일시 중지

### 코드 서명
- 현재 코드 서명 없이 빌드됨
- Windows SmartScreen 경고 발생 가능
- 상용 배포 시 코드 서명 인증서 필요

## 파일 구조
```
dist-installer/
├── ArtifexAI-Setup-0.1.0.exe  # 설치 프로그램
├── ArtifexAI-0.1.0.exe        # 포터블 버전
├── latest.yml                  # 자동 업데이트 매니페스트
└── *.blockmap                  # 차등 업데이트용 파일
```