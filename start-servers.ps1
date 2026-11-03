# CampusVoice Startup Script
# Run this in PowerShell to start both servers

Write-Host "Starting CampusVoice Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command 'cd `"C:\Users\iamsh\OneDrive\Desktop\CampusVoice\backend`"; node dist/backend/src/main.js'" -WindowStyle Normal

Write-Host "Starting CampusVoice Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command 'cd `"C:\Users\iamsh\OneDrive\Desktop\CampusVoice\frontend`"; npm run dev'" -WindowStyle Normal

Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Gray
Write-Host "IMPORTANT: Keep these PowerShell windows open to keep the servers running." -ForegroundColor Red
