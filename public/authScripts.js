const usr = document.getElementById('username');
const pwd = document.getElementById('password');

async function regAuth() {
  const username = usr.value.trim();
  const password = pwd.value.trim();

  if (!username || !password) {
    document.getElementById('alert').innerHTML = "<p>Empty Fields</p>";
    return;
  }

  try {
      const registerRes = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await registerRes.json();
      if (registerRes.ok) {
          document.getElementById('alert').innerHTML = `<p>${data.message || 'Registration Successful!'}</p>`;
          usr.value = '';
          pwd.value = '';
      } else {
          document.getElementById('alert').innerHTML = `<p>${data.message || 'Registration Failed'}</p>`;
      }
  } catch (error) {
    console.error('Registration error:', error);
    document.getElementById('alert').innerHTML = "<p>Registration failed. Please try again later.</p>";
  }
}

async function logAuth() {
  const username = usr.value.trim();
  const password = pwd.value.trim();

  if (!username || !password) {
    document.getElementById('alert').innerHTML = "<p>Empty Fields</p>";
    return;
  }

  try {
    const loginRes = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await loginRes.json();
    if (loginRes.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = '/index.html';
      return;
    } else {
      document.getElementById('alert').innerHTML = `<p>${data.message || 'Login Failed. Invalid credentials.'}</p>`;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    document.getElementById('alert').innerHTML = "<p>Login failed. Please try again later.</p>";
  }
}



