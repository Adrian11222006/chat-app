const https = require('https');
const fs = require('fs');
const path = require('path');

const modelUrl = 'https://huggingface.co/mmz-001/llama-pl-7b-q4/resolve/main/llama-pl-7b-q4.gguf';
const modelDir = path.join(__dirname, 'models');
const modelPath = path.join(modelDir, 'llama-pl-7b-q4.gguf');

if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir, { recursive: true });
}

console.log('Rozpoczynam pobieranie modelu LLaMA-PL...');
console.log('To może potrwać kilka minut...');

const file = fs.createWriteStream(modelPath);
https.get(modelUrl, (response) => {
  response.pipe(file);

  let downloaded = 0;
  const total = parseInt(response.headers['content-length'], 10);

  response.on('data', (chunk) => {
    downloaded += chunk.length;
    const progress = (downloaded / total * 100).toFixed(2);
    process.stdout.write(`\rPostęp: ${progress}%`);
  });

  file.on('finish', () => {
    console.log('\nModel został pobrany pomyślnie!');
    file.close();
  });
}).on('error', (err) => {
  fs.unlink(modelPath);
  console.error('Wystąpił błąd podczas pobierania:', err.message);
});
