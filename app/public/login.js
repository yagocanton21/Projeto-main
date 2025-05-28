document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const mensagemDiv = document.getElementById('mensagem');

  // Verificar se já está logado
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  if (token) {
    // Redirecionar para a página apropriada
    if (usuario.tipo === 'admin') {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'perfil.html';
    }
    return;
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    // Mostrar mensagem de carregamento
    mensagemDiv.innerHTML = '<div class="alert alert-info">Processando login...</div>';
    
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
        return response.json().then(err => {
          throw new Error(err.error || 'Erro ao fazer login');
        });
      }
      return response.json();
    })
    .then(data => {
      // Armazenar token e informações do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      
      // Redirecionar com base no tipo de usuário
      if (data.usuario.tipo === 'admin') {
        window.location.href = 'dashboard.html';
      } else {
        window.location.href = 'perfil.html';
      }
    })
    .catch(error => {
      console.error('Erro:', error);
      mensagemDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    });
  });
});