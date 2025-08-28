@echo off
echo Starting Artifex.AI with optimizations...
SET WAN_FORCE_FP16=1
SET WAN_COMPILE=1
cd app
npm start