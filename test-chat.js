const https = require('https');

function testChat() {
  const postData = JSON.stringify({ 
    message: 'I want to lose weight. What should I do?', 
    userId: 'dev-user-123',
    chatHistory: []
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chatbot-enhanced',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Testing chatbot with a typical user message...');
  
  const req = https.request(options, (res) => {
    console.log('Response status:', res.statusCode);
    console.log('Response headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('Response data:', JSON.stringify(jsonData, null, 2));
      } catch (error) {
        console.log('Raw response:', data);
        console.error('JSON parse error:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.write(postData);
  req.end();
}

testChat(); 