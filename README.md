# Sistema de Gerenciamento de Alunos

Sistema simples para gerenciamento de cadastro de alunos utilizando Node.js, PostgreSQL e Docker.

## Funcionalidades

- Adicionar alunos
- Excluir cadastro de alunos
- Alterar cadastro de alunos
- Listar todos os alunos cadastrados

## Tecnologias Utilizadas

- **Backend**: Node.js com Express
- **Banco de Dados**: PostgreSQL
- **ORM**: Sequelize
- **Frontend**: HTML, CSS, JavaScript e Bootstrap
- **Containerização**: Docker e Docker Compose

## Como Executar

1. Certifique-se de ter o Docker e o Docker Compose instalados em sua máquina.

2. Execute o comando para iniciar os containers:
   ```
   docker-compose up -d
   ```

3. Acesse a aplicação no navegador:
   ```
   http://localhost:3000
   ```

## Estrutura do Projeto

```
projeto/
├── app/                    # Aplicação Node.js
│   ├── public/             # Arquivos estáticos (frontend)
│   │   ├── index.html      # Página principal
│   │   ├── style.css       # Estilos CSS
│   │   └── script.js       # JavaScript do frontend
│   ├── Dockerfile          # Configuração do container Node.js
│   ├── index.js            # Arquivo principal da aplicação
│   └── package.json        # Dependências do projeto
├── docker-compose.yml      # Configuração dos serviços Docker
└── README.md               # Documentação do projeto
```