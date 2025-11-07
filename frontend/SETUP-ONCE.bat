@echo off
echo ========================================
echo MatrimonyAI - ONE-TIME COMPLETE SETUP
echo ========================================
echo.

echo Checking if node_modules exists...
if exist "node_modules" (
    echo Found existing node_modules
    echo Cleaning up old installation...
    rmdir /s /q node_modules
    del package-lock.json 2>nul
)

echo.
echo Installing ALL dependencies (this is the LAST time!)...
echo This will take 2-3 minutes...
echo.

call npm install react react-dom vite @vitejs/plugin-react tailwindcss postcss autoprefixer --save-dev

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Starting development server...
echo Browser will open at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

pause
