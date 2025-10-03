@echo off
REM Setup script for Classics Retold PWA (Windows)

echo Setting up Classics Retold PWA...
echo.

REM Create directories
echo Creating directories...
if not exist "public\icons" mkdir public\icons
if not exist "public\images\covers" mkdir public\images\covers
echo Directories created
echo.

echo Installing dependencies...
call npm install
echo.

echo Setup complete!
echo.
echo Next steps:
echo   1. Run 'npm run dev' to start development server
echo   2. Add book cover to public/images/covers/frankenstein.jpg
echo   3. Generate PWA icons (see public/icons/README.md)
echo.
echo Note: For icon generation, install ImageMagick or use:
echo   https://www.pwabuilder.com/imageGenerator
echo.

pause
