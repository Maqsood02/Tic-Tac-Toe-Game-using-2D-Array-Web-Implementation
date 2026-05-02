@echo off
echo Compiling Tic Tac Toe backend in C...
gcc -o tictactoe.exe tictactoe.c
if %errorlevel% neq 0 (
    echo Compilation failed! Make sure GCC is installed and on your PATH.
    pause
    exit /b
)

echo Starting the web server...
echo Access the game at http://localhost:3000
start http://localhost:3000
node server.js
