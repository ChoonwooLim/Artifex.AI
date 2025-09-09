# 부팅 USB 만들기 가이드

## Windows에서 부팅 USB 만들기

### 방법 1: Rufus 사용 (추천)
1. **Rufus 다운로드**: https://rufus.ie/
2. **설정**:
   - USB 드라이브 선택 (8GB 이상)
   - 부트 선택: 다운로드한 ISO 파일 선택
   - 파티션 방식: GPT (UEFI 시스템용)
   - 파일 시스템: FAT32
   - 클러스터 크기: 기본값
3. **시작** 클릭 후 완료 대기

### 방법 2: Etcher 사용
1. **balenaEtcher 다운로드**: https://etcher.balena.io/
2. Flash from file → ISO 선택
3. Select target → USB 드라이브 선택
4. Flash! 클릭

## 중요 체크사항
- ✅ USB 드라이브 백업 (모든 데이터 삭제됨)
- ✅ 8GB 이상 USB 권장
- ✅ USB 3.0 이상 권장 (설치 속도)
- ✅ Secure Boot 비활성화 필요할 수 있음