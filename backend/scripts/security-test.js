/**
 * Security & build test script
 * Run: node scripts/security-test.js
 * Tests: JWT, auth flow, input sanitization, rate limiting headers, SQL injection detection
 */
require('dotenv').config();
const http = require('http');

const BASE = `http://localhost:${process.env.PORT || 3000}`;
let passed = 0;
let failed = 0;

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTest/1.0',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: raw, headers: res.headers }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  console.log('\n🔐 Security & Functionality Tests\n');

  console.log('📋 Authentication Tests:');

  await test('Reject login with empty body', async () => {
    const res = await request('POST', '/api/auth/login', {});
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('Reject login with wrong credentials', async () => {
    const res = await request('POST', '/api/auth/login', { username: 'notexist', password: 'wrong' });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Reject protected route without token', async () => {
    const res = await request('GET', '/api/auth/me');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Reject invalid JWT token', async () => {
    const res = await request('GET', '/api/auth/me', null, { Authorization: 'Bearer invalid.jwt.token' });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Reject malformed Bearer header', async () => {
    const res = await request('GET', '/api/auth/me', null, { Authorization: 'Token abc123' });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  console.log('\n📋 Security Headers Tests:');

  await test('X-Content-Type-Options header present', async () => {
    const res = await request('GET', '/api/blogs');
    assert(res.headers['x-content-type-options'] === 'nosniff', 'Missing x-content-type-options');
  });

  await test('X-Frame-Options header present', async () => {
    const res = await request('GET', '/api/blogs');
    assert(res.headers['x-frame-options'], 'Missing x-frame-options');
  });

  await test('Content-Security-Policy present', async () => {
    const res = await request('GET', '/api/blogs');
    assert(res.headers['content-security-policy'], 'Missing CSP header');
  });

  console.log('\n📋 Input Validation Tests:');

  await test('Reject SQL injection in login', async () => {
    const res = await request('POST', '/api/auth/login', {
      username: "admin' OR '1'='1",
      password: "' OR '1'='1",
    });
    assert([400, 401].includes(res.status), `Expected 400/401, got ${res.status}`);
  });

  await test('Public blog endpoint returns 200', async () => {
    const res = await request('GET', '/api/blogs');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('Non-existent blog returns 404', async () => {
    const res = await request('GET', '/api/blogs/this-slug-does-not-exist-xyz');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await test('Admin blog route requires auth', async () => {
    const res = await request('GET', '/api/blogs/admin/all');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Tunnel route requires admin auth', async () => {
    const res = await request('GET', '/api/tunnel/status');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Blog creation requires auth', async () => {
    const res = await request('POST', '/api/blogs', { title: 'test', content: 'hello world test' });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  console.log('\n📋 Path & 404 Tests:');

  await test('Unknown API route returns 404', async () => {
    const res = await request('GET', '/api/unknown-route-xyz');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await test('Admin page accessible', async () => {
    const res = await request('GET', '/admin');
    assert([200, 301, 302].includes(res.status), `Expected 200/30x, got ${res.status}`);
  });

  await test('Blog page accessible', async () => {
    const res = await request('GET', '/blog');
    assert([200, 301, 302].includes(res.status), `Expected 200/30x, got ${res.status}`);
  });

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('⚠️  Some tests failed. Check server logs.');
    process.exit(1);
  } else {
    console.log('✅ All security tests passed!\n');
  }
}

run().catch(err => { console.error('Test runner error:', err.message); process.exit(1); });
