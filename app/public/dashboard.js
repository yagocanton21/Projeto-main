document.addEventListener('DOMContentLoaded', () => {
  // Verificar se o usuário está logado e é admin
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  if (!token || usuario.tipo !== 'admin') {
    window.location.href = 'login.html';
    return;
  }
  
  // Elementos do DOM
  const totalAlunosEl = document.getElementById('totalAlunos');
  const searchTermEl = document.getElementById('searchTerm');
  const cursosFilterEl = document.getElementById('cursosFilter');
  const searchBtnEl = document.getElementById('searchBtn');
  const searchResultsEl = document.getElementById('searchResults');
  const logsTableEl = document.getElementById('logsTable');
  
  // Carregar estatísticas
  carregarEstatisticas();
  
  // Carregar logs
  carregarLogs();
  
  // Event listeners
  searchBtnEl.addEventListener('click', buscarAlunos);
  document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
  });
  
  // Função para carregar estatísticas
  function carregarEstatisticas() {
    fetch('/api/estatisticas', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }
      return response.json();
    })
    .then(data => {
      // Atualizar total de alunos
      totalAlunosEl.textContent = data.totalAlunos;
      
      // Preencher select de cursos
      const cursos = data.alunosPorCurso.map(item => item.curso);
      cursos.forEach(curso => {
        if (curso) {
          const option = document.createElement('option');
          option.value = curso;
          option.textContent = curso;
          cursosFilterEl.appendChild(option);
        }
      });
      
      // Criar gráfico de pizza
      const ctx = document.getElementById('cursoChart').getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: data.alunosPorCurso.map(item => item.curso || 'Sem curso'),
          datasets: [{
            data: data.alunosPorCurso.map(item => item.total),
            backgroundColor: [
              '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
              '#6f42c1', '#5a5c69', '#858796', '#f8f9fc', '#d1d3e2'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Erro:', error);
      alert('Erro ao carregar estatísticas');
    });
  }
  
  // Função para buscar alunos
  function buscarAlunos() {
    const termo = searchTermEl.value;
    const curso = cursosFilterEl.value;
    
    let url = '/api/alunos/busca?';
    if (termo) url += `termo=${encodeURIComponent(termo)}&`;
    if (curso) url += `curso=${encodeURIComponent(curso)}`;
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao buscar alunos');
      }
      return response.json();
    })
    .then(alunos => {
      searchResultsEl.innerHTML = '';
      
      if (alunos.length === 0) {
        searchResultsEl.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum aluno encontrado</td></tr>';
        return;
      }
      
      alunos.forEach(aluno => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${aluno.nome}</td>
          <td>${aluno.email}</td>
          <td>${aluno.telefone || '-'}</td>
          <td>${aluno.curso || '-'}</td>
          <td>${aluno.matricula || '-'}</td>
          <td>
            <button class="btn btn-warning btn-sm action-btn" onclick="editarAluno(${aluno.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-sm action-btn" onclick="excluirAluno(${aluno.id})"><i class="fas fa-trash-alt"></i></button>
          </td>
        `;
        searchResultsEl.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Erro:', error);
      alert('Erro ao buscar alunos');
    });
  }
  
  // Função para carregar logs
  function carregarLogs() {
    fetch('/api/logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao carregar logs');
      }
      return response.json();
    })
    .then(logs => {
      logsTableEl.innerHTML = '';
      
      if (logs.length === 0) {
        logsTableEl.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum log encontrado</td></tr>';
        return;
      }
      
      logs.forEach(log => {
        const row = document.createElement('tr');
        const data = new Date(log.createdAt).toLocaleString();
        row.innerHTML = `
          <td>${data}</td>
          <td>ID: ${log.usuario_id || '-'}</td>
          <td>${log.acao}</td>
          <td>${log.ip || '-'}</td>
        `;
        logsTableEl.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Erro:', error);
      alert('Erro ao carregar logs');
    });
  }
  
  // Expor funções globalmente
  window.editarAluno = function(id) {
    window.location.href = `index.html?edit=${id}`;
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
        alert('Aluno excluído com sucesso!');
        buscarAlunos();
      })
      .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao excluir aluno');
      });
    }
  };
});