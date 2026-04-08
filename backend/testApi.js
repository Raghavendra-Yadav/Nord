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
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    // 2. Post an experiment
    const res = await fetch('http://localhost:5555/api/experiments', {
      method: 'POST',
      headers: { 
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        title: 'Monk Mode',
        hypothesis: 'Test',
        durationDays: 30,
        frequency: 'Daily'
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
       console.log("HTTP ERROR:", res.status, data);
    } else {
       console.log("SUCCESS:", data);
    }
  } catch (err) {
    console.log("FATAL ERROR:", err.message);
  }
}
test();
