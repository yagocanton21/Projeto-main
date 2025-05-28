document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const mensagemDiv = document.getElementById('mensagem');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    // Enviar requisição de login
    fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Email ou senha incorretos');
      }
      return response.json();
    })
    .then(data => {
      // Armazenar token e informações do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      
      // Redirecionar com base no tipo de usuário
      if (data.usuario.tipo === 'admin') {
        window.location.href = 'index.html';
      } else {
        window.location.href = 'perfil.html';
      }
    })
    .catch(error => {
      mensagemDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    });
  });
});