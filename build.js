const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const clientDir = path.join(__dirname, 'client');

console.log('Начинаем сборку клиента...');

console.log('Установка зависимостей клиента...');
execSync('npm install', { cwd: clientDir, stdio: 'inherit' });

console.log('Сборка клиента...');
execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });

console.log('Сборка клиента завершена успешно!');

const distDir = path.join(clientDir, 'dist');
const files = fs.readdirSync(distDir);
console.log('Файлы в папке dist:', files);

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Копирование файлов из client/dist в public...');
execSync(`cp -r ${distDir}/* ${publicDir}/`, { stdio: 'inherit' });

console.log('Сборка завершена успешно!'); 