'use strict';

const health = document.querySelector('#health');
const modules = document.querySelector('#modules');
const form = document.querySelector('#login');
const loginStatus = document.querySelector('#login-status');

const demoCredentialsButton = document.createElement('button');
demoCredentialsButton.type = 'button';
demoCredentialsButton.textContent = 'Auto Fill Demo Credentials';
demoCredentialsButton.setAttribute('aria-label', 'Auto Fill Demo Credentials');
demoCredentialsButton.addEventListener('click', async () => {
  try {
    const response = await fetch('/api/auth/demo-credentials', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) throw new Error('Demo credentials are unavailable');
    const credentials = await response.json();
    form.elements.email.value = credentials.email;
    form.elements.password.value = credentials.password;
  } catch (error) { loginStatus.textContent = error.message; }
});
form.insertBefore(demoCredentialsButton, form.querySelector('button'));

fetch('/api/health', { credentials: 'same-origin' })
  .then(async (response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    health.textContent = `Backend ${data.status}; version ${data.version}`;
    modules.replaceChildren(...data.modules.map((name) => {
      const item = document.createElement('li');
      item.textContent = name;
      return item;
    }));
  })
  .catch(() => { health.textContent = 'Backend unavailable.'; });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginStatus.textContent = 'Signing in…';
  const body = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Sign-in failed');
    const result = await response.json();
    sessionStorage.setItem('aiFinanceToken', result.token);
    loginStatus.textContent = `Signed in as ${result.user.email}. Token is stored for this tab only.`;
    form.reset();
  } catch (error) {
    loginStatus.textContent = error.message;
  }
});
