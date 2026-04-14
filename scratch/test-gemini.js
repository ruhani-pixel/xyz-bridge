async function testGemini() {
  const apiKey = 'AIzaSyBBi3K9ntOB_zdgkbHZsE9AD4d4G5ugxho';
  const model = 'gemini-1.5-flash'; // Common model
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, are you working?' }] }]
      })
    });

    const data = await res.json();
    console.log('Gemini Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

testGemini();
