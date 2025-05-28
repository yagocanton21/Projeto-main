document.addEventListener('DOMContentLoaded', () => {
  const redefinirSenhaForm = document.getElementById('redefinirSenhaForm');
  const mensagemDiv = document.getElementById('mensagem');
  const tokenInput = document.getElementById('token');
  const novaSenhaInput = document.getElementById('novaSenha');
  const confirmarSenhaInput = document.getElementById('confirmarSenha');
  
  // Obter token da URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    mensagemDiv.innerHTML = '<div class="alert alert-danger">Token não fornecido. Solicite uma nova redefinição de senha.</div>';
    redefinirSenhaForm.style.display = 'none';
    return;
  }
  
  tokenInput.value = token;
  
  redefinirSenhaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const novaSenha = novaSenhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;
    
    if (novaSenha !== confirmarSenha) {
      mensagemDiv.innerHTML = '<div class="alert alert-danger">As senhas não coincidem</div>';
      return;
    }
    
    // Mostrar mensagem de carregamento
    mensagemDiv.innerHTML = '<div class="alert alert-info">Processando solicitação...</div>';
    
    // Enviar requisição
    fetch('/api/auth/redefinir-senha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        novaSenha: novaSenha
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || 'Erro ao redefinir senha');
        });
      }
      return response.json();
    })
    .then(data => {
      mensagemDiv.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
      redefinirSenhaForm.reset();
      
      // Redirecionar para a página de login após 3 segundos
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 3000);
    })
    .catch(error => {
      console.error('Erro:', error);
      mensagemDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    });
  });
});