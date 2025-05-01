import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vitePath = path.join(__dirname, 'node_modules', 'vite');
const viteExists = fs.existsSync(vitePath);

const vitePackageJson = path.join(vitePath, 'package.json');
let viteVersion = 'not installed';

if (viteExists && fs.existsSync(vitePackageJson)) {
  const vitePackage = JSON.parse(fs.readFileSync(vitePackageJson, 'utf8'));
  viteVersion = vitePackage.version;
}

console.log('Vite installed:', viteExists);
console.log('Vite version:', viteVersion);
console.log('Vite path exists:', vitePath);

// Выводим информацию о структуре проекта
console.log('\nProject structure:');
console.log('Current directory:', __dirname);
console.log('node_modules exists:', fs.existsSync(path.join(__dirname, 'node_modules')));

try {
  console.log('\nRunning vite help:');
  console.log(execSync('npx vite --help', {encoding: 'utf8', cwd: __dirname}));
} catch (error) {
  console.error('Error running vite:', error.message);
}

if (!viteExists) {
  console.log('\nVite not found, installing explicitly...');
  try {
    execSync('npm install vite vite-plugin-solid --no-save', {stdio: 'inherit', cwd: __dirname});
    console.log('Vite installed successfully');
  } catch (error) {
    console.error('Failed to install vite:', error.message);
    process.exit(1);
  }
} 