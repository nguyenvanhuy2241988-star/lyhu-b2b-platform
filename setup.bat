@echo off
echo Starting npm install... > install.log
npm install >> install.log 2>&1
if %errorlevel% neq 0 (
    echo npm install failed with error code %errorlevel% >> install.log
    exit /b %errorlevel%
)
echo npm install completed successfully. >> install.log
