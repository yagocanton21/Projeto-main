document.addEventListener('DOMContentLoaded', () => {
  const registroForm = document.getElementById('registroForm');
  const mensagemDiv = document.getElementById('mensagem');

  registroForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const telefone = document.getElementById('telefone').value;
    const curso = document.getElementById('curso').value;
    const matricula = document.getElementById('matricula').value;
    
    // Validar senha
    if (senha !== confirmarSenha) {
      mensagemDiv.innerHTML = '<div class="alert alert-danger">As senhas não coincidem</div>';
      return;
    }
    
    // Mostrar mensagem de carregamento
    mensagemDiv.innerHTML = '<div class="alert alert-info">Processando registro...</div>';
    
    // Enviar requisição de registro
    fetch('/api/auth/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome,
        email,
        username,
        senha,
        telefone,
        curso,
        matricula
      })
    })
    .then(response => {
      return response.json().then(data => {
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao registrar');
        }
        return data;
      });
    })
    .then(data => {
      mensagemDiv.innerHTML = '<div class="alert alert-success">Registro realizado com sucesso! Redirecionando para o login...</div>';
      
      // Redirecionar para a página de login após 2 segundos
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    })
    .catch(error => {
      mensagemDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    });
  });
});