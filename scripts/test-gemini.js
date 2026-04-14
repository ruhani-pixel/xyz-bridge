const admin = require('firebase-admin');

// GEMINI API TEST SCRIPT
// This script tests if the provided Gemini API key works correctly with the AI Service.

async function testGemini() {
  const apiKey = 'AIzaSyApK10teZqOwc45rT5RxqZCvkvbwe8tu2U';
  const model = 'gemini-1.5-flash';
  const systemPrompt = 'You are a helpful assistant. Keep it very short.';
  const userMessage = 'Hii, what is your name?';

  console.log('--- STARTING GEMINI API TEST ---');

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100
        }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Gemini Error: ${err}`);
      return;
    }

    const data = await res.json();
    const reply = data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini Response:', reply);
    console.log('--- TEST SUCCESSFUL ---');
  } catch (err) {
    console.error('❌ Fetch Error:', err.message);
  }
}

testGemini().catch(console.error);
