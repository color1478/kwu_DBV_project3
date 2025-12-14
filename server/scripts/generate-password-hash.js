// 비밀번호 해시 생성 스크립트
// 사용법: node scripts/generate-password-hash.js password123

import bcrypt from 'bcrypt';

const password = process.argv[2] || 'password123';

bcrypt.hash(password, 10).then(hash => {
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}).catch(err => {
  console.error('Error:', err);
});

