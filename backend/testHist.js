async function test() {
  try {
    let loginRes = await fetch('http://localhost:5555/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });
    if (!loginRes.ok) {
       loginRes = await fetch('http://localhost:5555/api/auth/register', {
         method: 'POST', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ username: 'test', email: 'test@example.com', password: 'password123' })
       });
    }
    const token = (await loginRes.json()).token;
    
    // FETCH history
    const res = await fetch('http://localhost:5555/api/entries/history?days=7', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("HISTORY:", await res.json());
  } catch (err) {
    console.log("ERR:", err.message);
  }
}
test();
