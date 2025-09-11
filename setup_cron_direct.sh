#!/bin/bash
# 직접 실행용 스크립트

# crontab에 추가
(crontab -l 2>/dev/null; echo "@reboot /usr/bin/python3 /home/stevenlim/popos_worker.py > /home/stevenlim/popos_worker.log 2>&1 &") | crontab -

echo "설정 완료!"
echo "현재 crontab:"
crontab -l