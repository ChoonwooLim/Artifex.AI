#!/bin/bash
# 빠른 자동 시작 설정 (1분 소요)

echo "PopOS Worker 서버 자동 시작 설정 (빠른 방법)"
echo "============================================"

# crontab에 추가 (가장 간단)
(crontab -l 2>/dev/null | grep -v popos_worker; echo "@reboot /usr/bin/python3 /home/stevenlim/popos_worker.py > /home/stevenlim/popos_worker.log 2>&1 &") | crontab -

echo "✓ 설정 완료!"
echo ""
echo "확인:"
crontab -l | grep popos_worker
echo ""
echo "다음 재부팅부터 서버가 자동 시작됩니다!"