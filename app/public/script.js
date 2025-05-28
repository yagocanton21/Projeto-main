document.addEventListener('DOMContentLoaded', () => {
  // Verificar se o usuário está logado e é admin
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  if (!token || usuario.tipo !== 'admin') {
    window.location.href = 'login.html';
    return;
  }
  
  const alunoForm = document.getElementById('alunoForm');
  const alunoId = document.getElementById('alunoId');
  const nome = document.getElementById('nome');
  const email = document.getElementById('email');
  const telefone = document.getElementById('telefone');
  const curso = document.getElementById('curso');
  const matricula = document.getElementById('matricula');
  const alunosLista = document.getElementById('alunosLista');
  const limparFormBtn = document.getElementById('limparForm');

  // Adicionar botão de logout
  const navbar = document.createElement('nav');
  navbar.className = 'navbar navbar-expand-lg navbar-dark mb-4';
  navbar.innerHTML = `
    <div class="container">
      <a class="navbar-brand" href="#"><i class="fas fa-graduation-cap me-2"></i>Sistema de Alunos - Administração</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link" href="#" id="btnLogout"><i class="fas fa-sign-out-alt me-1"></i> Sair</a>
          </li>
        </ul>
      </div>
    </div>
  `;
  document.body.insertBefore(navbar, document.body.firstChild);
  
  document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
  });

  // Carregar alunos ao iniciar
  carregarAlunos();

  // Event listener para o formulário
  alunoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    salvarAluno();
  });

  // Event listener para o botão limpar
  limparFormBtn.addEventListener('click', () => {
    limparFormulario();
  });
  
  // Função para salvar um aluno (criar ou atualizar)
  function salvarAluno() {
    const alunoData = {
      nome: nome.value,
      email: email.value,
      telefone: telefone.value,
      curso: curso.value,
      matricula: matricula.value
    };

    const method = alunoId.value ? 'PUT' : 'POST';
    const url = alunoId.value ? `/api/alunos/${alunoId.value}` : '/api/alunos';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(alunoData)
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.error || 'Erro ao salvar aluno');
          });
        }
        return response.json();
      })
      .then(() => {
        limparFormulario();
        carregarAlunos();
        alert(alunoId.value ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
      })
      .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar aluno: ' + error.message);
      });
  }

  // Função para carregar a lista de alunos
  function carregarAlunos() {
    fetch('/api/alunos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
            throw new Error('Sessão expirada. Faça login novamente.');
          }
          throw new Error('Erro ao carregar alunos');
        }
        return response.json();
      })
      .then(alunos => {
        alunosLista.innerHTML = '';
        alunos.forEach(aluno => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${aluno.nome}</td>
            <td>${aluno.email}</td>
            <td>${aluno.telefone || '-'}</td>
            <td>${aluno.curso || '-'}</td>
            <td>${aluno.matricula || '-'}</td>
            <td>
              <button class="btn btn-warning btn-sm action-btn" onclick="editarAluno(${aluno.id})"><i class="fas fa-edit"></i> Editar</button>
              <button class="btn btn-danger btn-sm action-btn" onclick="excluirAluno(${aluno.id})"><i class="fas fa-trash-alt"></i> Excluir</button>
            </td>
          `;
          alunosLista.appendChild(row);
        });
      })
      .catch(error => {
        console.error('Erro ao carregar alunos:', error);
        alert('Erro ao carregar a lista de alunos.');
      });
  }



  // Função para limpar o formulário
  function limparFormulario() {
    alunoForm.reset();
    alunoId.value = '';
  }

  // Expor funções globalmente
  window.editarAluno = function(id) {
    fetch(`/api/alunos/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao carregar dados do aluno');
        }
        return response.json();
      })
      .then(aluno => {
        alunoId.value = aluno.id;
        nome.value = aluno.nome;
        email.value = aluno.email;
        telefone.value = aluno.telefone || '';
        curso.value = aluno.curso || '';
        matricula.value = aluno.matricula || '';
      })
      .catch(error => {
        console.error('Erro ao carregar dados do aluno:', error);
        alert('Erro ao carregar dados do aluno.');
      });
  };

  window.excluirAluno = function(id) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
      fetch(`/api/alunos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Erro ao excluir aluno');
          }
          return response.json();
        })
        .then(() => {
          carregarAlunos();
          alert('Aluno excluído com sucesso!');
        })
        .catch(error => {
          console.error('Erro:', error);
          alert('Erro ao excluir aluno.');
        });
    }
  };
});