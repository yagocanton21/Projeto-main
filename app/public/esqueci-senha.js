document.addEventListener('DOMContentLoaded', () => {
  const esqueciSenhaForm = document.getElementById('esqueciSenhaForm');
  const mensagemDiv = document.getElementById('mensagem');
  
  esqueciSenhaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    
    // Mostrar mensagem de carregamento
    mensagemDiv.innerHTML = '<div class="alert alert-info">Processando solicitação...</div>';
    
    // Enviar requisição
    fetch('/api/auth/esqueci-senha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
      mensagemDiv.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
      esqueciSenhaForm.reset();
      
      // Mostrar informação adicional para desenvolvimento
      console.log('Verifique o console do servidor para o token de redefinição');
    })
    .catch(error => {
      console.error('Erro:', error);
      mensagemDiv.innerHTML = '<div class="alert alert-danger">Erro ao processar solicitação. Tente novamente.</div>';
    });
  });
});