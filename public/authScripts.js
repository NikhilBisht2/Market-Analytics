const usr = document.getElementById('username');
const pwd = document.getElementById('password');

async function handleAuth() {
  const username = usr.value.trim();
  const password = pwd.value.trim();

  if (!username || !password) {
    alert('Please enter both username and password.');
    return;
  }

  try {
    // Attempt login first
    const loginRes = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      localStorage.setItem('token', data.token); 
      window.location.href = '/index.html'; 
      return;
    }

    // If login fails, attempt registration
    const registerRes = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const regData = await registerRes.json();
    if (registerRes.ok) {
      // Automatically log in after registration
      const autoLoginRes = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (autoLoginRes.ok) {
        const loginData = await autoLoginRes.json();
        localStorage.setItem('token', loginData.token);
        window.location.href = '/index.html';
      } else {
        alert('Registered but login failed. Please try manually.');
      }
    } else {
      alert(regData.message || 'Registration failed');
    }

  } catch (error) {
    console.error('Authentication error:', error);
    alert('An unexpected error occurred.');
  }
}



