const apiKey = 'AIzaSyDWDACibc8pxGhAGOi4AnzPuih2sRMTTJ4';
const model = 'gemini-2.0-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

async function test() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Explain gravity in one sentence.' }] }]
      })
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

test();





