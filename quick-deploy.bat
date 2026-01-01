@echo off
chcp 65001 >nul
echo ====================================
echo ⚡ 빠른 배포 (커밋: "업데이트")
echo ====================================
echo.

git add .
git commit -m "업데이트"
git push origin main
echo 🔨 빌드 중...
call npm run build
echo 🚀 배포 중...
call firebase deploy

echo.
echo ✅ 완료! Ctrl+Shift+R로 새로고침 하세요!
pause
