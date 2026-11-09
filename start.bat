@echo off
title JourneyJar Local Server
echo Starting JourneyJar...
powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
