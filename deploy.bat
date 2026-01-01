@echo off
chcp 65001 >nul
echo ====================================
echo 🚀 Firebase 배포 스크립트
echo ====================================
echo.

:: 커밋 메시지 입력받기
set /p commit_msg="📝 커밋 메시지를 입력하세요 (엔터 시 '업데이트'): "
if "%commit_msg%"=="" set commit_msg=업데이트

echo.
echo [1/5] 📦 Git 변경사항 추가 중...
git add .
if errorlevel 1 (
    echo ❌ Git add 실패!
    pause
    exit /b 1
)

echo [2/5] 💾 Git 커밋 중...
git commit -m "%commit_msg%"
if errorlevel 1 (
    echo ⚠️ 커밋할 변경사항이 없거나 실패했습니다.
    echo 계속 진행합니다...
)

echo [3/5] ☁️ Git Push 중...
git push origin main
if errorlevel 1 (
    echo ❌ Git push 실패!
    pause
    exit /b 1
)

echo [4/5] 🔨 프로젝트 빌드 중...
call npm run build
if errorlevel 1 (
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)

echo [5/5] 🚀 Firebase 배포 중...
call firebase deploy
if errorlevel 1 (
    echo ❌ Firebase 배포 실패!
    pause
    exit /b 1
)

echo.
echo ====================================
echo ✅ 배포 완료!
echo 🌐 URL: https://mindflow-app-379c7.web.app
echo ====================================
echo.
echo 💡 브라우저에서 Ctrl+Shift+R로 강력 새로고침 하세요!
echo.
pause
