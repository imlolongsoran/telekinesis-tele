@echo off
echo Memulai aplikasi Auto Upload Telegram...
echo.
echo [1/2] Menjalankan server Node.js...
start cmd /k "npm start"

echo [2/2] Membuka browser...
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo Aplikasi berhasil dijalankan!
echo Server berjalan di http://localhost:3000
echo.
echo Tekan tombol apa saja untuk keluar dari jendela ini...
pause > nul 