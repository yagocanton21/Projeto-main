document.addEventListener('DOMContentLoaded', () => {
  // Verificar se o usuário está logado
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Elementos do DOM
  const perfilNome = document.getElementById('perfilNome');
  const perfilEmail = document.getElementById('perfilEmail');
  const perfilTelefone = document.getElementById('perfilTelefone');
  const perfilCurso = document.getElementById('perfilCurso');
  const perfilMatricula = document.getElementById('perfilMatricula');
  
  const btnEditar = document.getElementById('btnEditar');
  const btnCancelar = document.getElementById('btnCancelar');
  const formEdicao = document.getElementById('formEdicao');
  const perfilForm = document.getElementById('perfilForm');
  
  const editTelefone = document.getElementById('editTelefone');
  const editCurso = document.getElementById('editCurso');
  
  // Carregar dados do perfil
  carregarPerfil();
  
  // Event listeners
  btnEditar.addEventListener('click', () => {
    formEdicao.style.display = 'block';
    editTelefone.value = perfilTelefone.textContent;
    editCurso.value = perfilCurso.textContent;
  });
  
  btnCancelar.addEventListener('click', () => {
    formEdicao.style.display = 'none';
  });
  
  perfilForm.addEventListener('submit', (e) => {
    e.preventDefault();
    atualizarPerfil();
  });
  
  document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
  });
  
  // Função para carregar dados do perfil
  function carregarPerfil() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    fetch(`/api/alunos/${usuario.alunoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Não foi possível carregar os dados do perfil');
      }
      return response.json();
    })
    .then(aluno => {
      perfilNome.textContent = aluno.nome;
      perfilEmail.textContent = aluno.email;
      perfilTelefone.textContent = aluno.telefone || '-';
      perfilCurso.textContent = aluno.curso || '-';
      perfilMatricula.textContent = aluno.matricula || '-';
    })
    .catch(error => {
      alert('Erro ao carregar perfil: ' + error.message);
    });
  }
  
  // Função para atualizar o perfil
  function atualizarPerfil() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    const dadosAtualizados = {
      telefone: editTelefone.value,
      curso: editCurso.value
    };
    
    fetch(`/api/alunos/${usuario.alunoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dadosAtualizados)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Não foi possível atualizar o perfil');
      }
      return response.json();
    })
    .then(() => {
      formEdicao.style.display = 'none';
      carregarPerfil();
      alert('Perfil atualizado com sucesso!');
    })
    .catch(error => {
      alert('Erro ao atualizar perfil: ' + error.message);
    });
  }
});