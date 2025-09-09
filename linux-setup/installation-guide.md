# Ubuntu 22.04 LTS 설치 상세 가이드

## 설치 시작
1. **언어 선택**: 한국어 또는 English
2. **키보드 레이아웃**: Korean - Korean (101/104 key)

## 설치 유형 선택

### 옵션 1: Windows와 듀얼부팅 (추천)
- "Install Ubuntu alongside Windows Boot Manager" 선택
- 파티션 크기 조절 (최소 50GB, 권장 100GB+)

### 옵션 2: 전체 디스크 사용
- "Erase disk and install Ubuntu" 선택
- ⚠️ 경고: 모든 데이터 삭제됨

### 옵션 3: 수동 파티션 (고급)
```
추천 파티션 구성:
- /boot/efi : 512MB (FAT32, EFI 시스템 파티션)
- /         : 50GB+ (ext4, 루트)
- /home     : 나머지 (ext4, 홈)
- swap      : RAM 크기 (스왑 영역)
```

## 지역 및 사용자 설정
1. **시간대**: Seoul (Asia/Seoul)
2. **사용자 정보**:
   - 이름: 실명 또는 닉네임
   - 컴퓨터 이름: artifex-dev (예시)
   - 사용자명: 영문 소문자
   - 암호: 강력한 암호 설정
   - 자동 로그인: 보안상 비추천

## 설치 진행
- 설치 시간: 약 15-30분
- 설치 중 추가 소프트웨어 다운로드 가능

## 설치 완료
1. "Restart Now" 클릭
2. USB 제거 메시지 나타나면 USB 제거
3. Enter 키 누르기