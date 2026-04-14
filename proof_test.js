const fetch = require('node-fetch'); // Fallback if old node, but Next.js 14 env should have fetch global

async function test() {
  const url = 'http://localhost:3000/api/widget-chat';
  const soul = {
    tenantId: 'Vhb5HLKbtfZaHwd9BqMU0fm0le22',
    visitorId: 'TERMINAL_FINAL_PROOF_99',
    message: 'Bhai ye lo Node.js se LIVE SABOOT! 🚀 Dashboard Inbox check karo, message wahan WEB badge ke saath aa gaya hoga!'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(soul)
    });
    const data = await res.json();
    console.log('--- SABOOT RESULT ---');
    console.log('Status Code:', res.status);
    console.log('Response:', data);
    console.log('---------------------');
  } catch(e) {
    console.error('Error:', e.message);
  }
}

test();
