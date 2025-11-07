@echo off
echo ========================================
echo MatrimonyAI Platform - Setup & Run
echo ========================================
echo.

echo Step 1: Deleting old index.js...
if exist "src\index.js" (
    del "src\index.js"
    echo - Deleted src\index.js
) else (
    echo - src\index.js not found, skipping
)

echo.
echo Step 2: Installing dependencies...
echo This may take a few minutes...
call npm install

echo.
echo Step 3: Starting development server...
echo Opening browser at http://localhost:3000
echo.
call npm run dev

pause
