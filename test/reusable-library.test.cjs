const assert = require('assert');
const fs = require('fs');
const path = require('path');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

const repo = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');

const files = [
  'README.md',
  'appConfig.ts',
  'connectingToMongoDB.ts',
  'globalErrorHandler.ts',
  's3.ts',
  'sendEmail-Brevo.ts',
];

test('repository contains the expected source files', () => {
  for (const file of files) {
    assert.ok(fs.existsSync(path.join(repo, file)), `${file} should exist`);
  }
});

test('README describes the repo purpose', () => {
  const readme = read('README.md');
  assert.match(readme, /Reusable-Library/);
  assert.match(readme, /reusability/i);
  assert.match(readme, /modularity/i);
  assert.match(readme, /scalability/i);
});

test('appConfig validates NODE_ENV and required env vars', () => {
  const content = read('appConfig.ts');
  assert.match(content, /NODE_ENV is not set/);
  assert.match(content, /Unable to locate the environment file/);
  assert.match(content, /MONGODB_URI/);
});

test('MongoDB connector has retry logic', () => {
  const content = read('connectingToMongoDB.ts');
  assert.match(content, /MAX_RETRIES/);
  assert.match(content, /RETRY_DELAY/);
  assert.match(content, /mongoose\.connect/);
  assert.match(content, /process\.exit\(1\)/);
});

test('global error handler covers major error types', () => {
  const content = read('globalErrorHandler.ts');
  assert.match(content, /ValidationError/);
  assert.match(content, /CastError/);
  assert.match(content, /DocumentNotFoundError/);
  assert.match(content, /JsonWebTokenError/);
  assert.match(content, /TokenExpiredError/);
  assert.match(content, /MulterError/);
  assert.match(content, /MongoServerError/);
});

test('S3 helper exposes upload, delete, and signed URL functions', () => {
  const content = read('s3.ts');
  assert.match(content, /uploadFileToS3/);
  assert.match(content, /deleteAFileFromS3/);
  assert.match(content, /generateSignedUrl/);
  assert.match(content, /PutObjectCommand/);
  assert.match(content, /DeleteObjectCommand/);
  assert.match(content, /GetObjectCommand/);
});

test('email helper uses retries and fetch to Brevo', () => {
  const content = read('sendEmail-Brevo.ts');
  assert.match(content, /maxRetries/);
  assert.match(content, /retryDelayMs/);
  assert.match(content, /fetch\(/);
  assert.match(content, /Brevo API responded with status/);
  assert.match(content, /Failed to send email/);
});

console.log('All repository checks passed.');
