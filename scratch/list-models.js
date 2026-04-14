const apiKey = 'AIzaSyD-AC0XyjZr7P7iMOXlIz3rt-ch4jZk8XA';
const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

async function listModels() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Models:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

listModels();
