@echo off
echo ========================================
echo Fixing Lucide Icons Issue
echo ========================================
echo.
echo Removing lucide-react from all files...
echo This will use emojis instead of icons.
echo.

cd src\pages

echo Fixing HomePage.jsx...
powershell -Command "(gc HomePage.jsx) -replace 'import.*lucide-react.*', '// Icons removed - using emojis' | Set-Content HomePage.jsx"

echo Fixing LoginPage.jsx...
powershell -Command "(gc LoginPage.jsx) -replace 'import.*lucide-react.*', '// Icons removed - using emojis' | Set-Content LoginPage.jsx"

echo Fixing RegisterPage.jsx...
powershell -Command "(gc RegisterPage.jsx) -replace 'import.*lucide-react.*', '// Icons removed - using emojis' | Set-Content RegisterPage.jsx"

echo Fixing DashboardPage.jsx...
powershell -Command "(gc DashboardPage.jsx) -replace 'import.*lucide-react.*', '// Icons removed - using emojis' | Set-Content DashboardPage.jsx"

cd ..\..

echo.
echo ========================================
echo Done! All lucide imports removed.
echo ========================================
echo.
echo Now use emojis instead: ❤️ 🤖 ⭐ 👤 etc.
echo.
pause
