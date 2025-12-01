#!/bin/bash

echo "🚀 Запуск Даль AI"
echo ""

# Запускаем Vite dev server
echo "📦 Запускаем клиент (Vite) на http://localhost:5000"
cd "$(dirname "$0")"
npx vite dev --port 5000 &
VITE_PID=$!

# Ждем запуска Vite
sleep 3

# Запускаем Express server
echo "⚙️  Запускаем сервер (Express) на http://localhost:5001"  
PORT=5001 npx tsx server/index-dev.ts &
SERVER_PID=$!

echo ""
echo "✅ Даль AI запущен!"
echo "   Клиент: http://localhost:5000"
echo "   Сервер: http://localhost:5001"
echo ""
echo "Нажмите Ctrl+C для остановки"

# Ждем сигнала завершения
trap "kill $VITE_PID $SERVER_PID 2>/dev/null; exit" INT TERM

wait
