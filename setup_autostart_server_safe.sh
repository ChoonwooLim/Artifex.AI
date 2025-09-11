#!/bin/bash
# 안전한 자동 시작 설정 (사용자 로그인 후)

echo "사용자 로그인 후 서버 자동 시작 설정"
echo "======================================="

# 방법 1: systemd user service (가장 안전)
mkdir -p ~/.config/systemd/user/

cat > ~/.config/systemd/user/popos-worker.service << 'EOF'
[Unit]
Description=PopOS GPU Worker (User Service)
After=graphical-session.target

[Service]
Type=simple
ExecStartPre=/bin/sleep 15
ExecStart=/usr/bin/python3 /home/stevenlim/popos_worker.py
Restart=on-failure
RestartSec=30
StandardOutput=append:/home/stevenlim/popos_worker.log
StandardError=append:/home/stevenlim/popos_worker_error.log

[Install]
WantedBy=default.target
EOF

# 서비스 활성화
systemctl --user daemon-reload
systemctl --user enable popos-worker.service
systemctl --user start popos-worker.service

echo "설정 완료!"
echo ""
echo "상태 확인: systemctl --user status popos-worker"
echo "로그 확인: tail -f ~/popos_worker.log"