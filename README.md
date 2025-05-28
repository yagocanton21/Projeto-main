# Sistema de Gerenciamento de Alunos

Sistema completo para gerenciamento de cadastro de alunos utilizando Node.js, PostgreSQL e Docker.

## Funcionalidades

- Sistema de autenticação com diferentes níveis de acesso (admin/aluno)
- Cadastro de alunos com validação de dados
- Login com email ou nome de usuário
- Perfil de aluno com edição de informações
- Painel administrativo para gerenciar todos os alunos
- Persistência de dados entre reinicializações

## Tecnologias Utilizadas

- **Backend**: Node.js com Express
- **Banco de Dados**: PostgreSQL
- **ORM**: Sequelize
- **Frontend**: HTML, CSS, JavaScript e Bootstrap
- **Autenticação**: JWT e bcrypt
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

## Credenciais de Administrador

- **Email**: admin@admin.com
- **Username**: admin
- **Senha**: admin

## Estrutura do Projeto

```
projeto/
├── app/                    # Aplicação Node.js
│   ├── public/             # Arquivos estáticos (frontend)
│   │   ├── index.html      # Página principal (admin)
│   │   ├── login.html      # Página de login
│   │   ├── registro.html   # Página de registro
│   │   ├── perfil.html     # Página de perfil do aluno
│   │   ├── style.css       # Estilos CSS
│   │   ├── login.js        # JavaScript do login
│   │   ├── registro.js     # JavaScript do registro
│   │   ├── script.js       # JavaScript da página principal
│   │   └── perfil.js       # JavaScript do perfil
│   ├── Dockerfile          # Configuração do container Node.js
│   ├── index.js            # Arquivo principal da aplicação
│   └── package.json        # Dependências do projeto
├── docker-compose.yml      # Configuração dos serviços Docker
└── README.md               # Documentação do projeto
```

## Notas Importantes

- Os dados são persistentes e armazenados em um volume Docker
- Validações são feitas para evitar duplicação de email, nome de usuário e matrícula
- O sistema possui tratamento de erros específicos para melhor experiência do usuário