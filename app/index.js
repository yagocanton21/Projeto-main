const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-do-token';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do banco de dados
const sequelize = new Sequelize(
  process.env.DB_NAME || 'alunos_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'db',
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: false
  }
);

// Modelo de Aluno
const Aluno = sequelize.define('Aluno', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  telefone: {
    type: DataTypes.STRING
  },
  curso: {
    type: DataTypes.STRING
  },
  matricula: {
    type: DataTypes.STRING,
    unique: true
  }
}, {
  tableName: 'Alunos'
});

// Modelo de Usuário
const Usuario = sequelize.define('Usuario', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('admin', 'aluno'),
    defaultValue: 'aluno'
  }
});

// Modelo de Log de Atividades
const Log = sequelize.define('Log', {
  usuario_id: {
    type: DataTypes.INTEGER
  },
  acao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  detalhes: {
    type: DataTypes.TEXT
  },
  ip: {
    type: DataTypes.STRING
  }
});

// Modelo para Redefinição de Senha
const ResetToken = sequelize.define('ResetToken', {
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expira: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

// Relacionamento entre Usuário e Aluno
Usuario.belongsTo(Aluno, { foreignKey: 'alunoId' });
Aluno.hasOne(Usuario, { foreignKey: 'alunoId' });

// Middleware para verificar autenticação
const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar se é administrador
const verificarAdmin = (req, res, next) => {
  if (req.usuario.tipo !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
};

// Middleware para registrar logs
const registrarLog = (req, res, next) => {
  if (req.usuario) {
    Log.create({
      usuario_id: req.usuario.id,
      acao: req.method + ' ' + req.path,
      detalhes: JSON.stringify(req.body),
      ip: req.ip
    }).catch(err => console.error('Erro ao registrar log:', err));
  }
  next();
};

// Sincronizar o modelo com o banco de dados
sequelize.sync({ force: false })
  .then(async () => {
    console.log('Banco de dados sincronizado');
    
    // Verificar se o administrador já existe
    const adminExistente = await Usuario.findOne({ 
      where: { 
        [Sequelize.Op.or]: [
          { email: 'admin@admin.com' },
          { username: 'admin' }
        ]
      }
    });
    
    // Criar usuário administrador padrão apenas se não existir
    if (!adminExistente) {
      await Usuario.create({
        email: 'admin@admin.com',
        username: 'admin',
        senha: bcrypt.hashSync('admin', 8),
        tipo: 'admin'
      });
      console.log('Usuário administrador criado');
    }
  })
  .catch(err => console.error('Erro ao sincronizar banco de dados:', err));

// Rotas de autenticação
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Buscar usuário pelo email ou username
    const usuario = await Usuario.findOne({ 
      where: Sequelize.or(
        { email: email },
        { username: email }
      ),
      include: [Aluno]
    });
    
    if (!usuario) {
      return res.status(401).json({ error: 'Email/usuário ou senha incorretos' });
    }
    
    // Verificar senha
    const senhaValida = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email/usuário ou senha incorretos' });
    }
    
    // Gerar token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo, alunoId: usuario.alunoId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Registrar log de login
    Log.create({
      usuario_id: usuario.id,
      acao: 'LOGIN',
      detalhes: 'Login bem-sucedido',
      ip: req.ip
    }).catch(err => console.error('Erro ao registrar log de login:', err));
    
    // Retornar token e informações do usuário
    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
        alunoId: usuario.alunoId
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nome, email, username, senha, telefone, curso, matricula } = req.body;
    
    // Verificar se o email já existe
    const emailExistente = await Usuario.findOne({ where: { email } });
    if (emailExistente) {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }
    
    // Verificar se o username já existe
    if (username) {
      const usernameExistente = await Usuario.findOne({ where: { username } });
      if (usernameExistente) {
        return res.status(400).json({ error: 'Este nome de usuário já está em uso' });
      }
    }
    
    // Verificar se a matrícula já existe
    if (matricula) {
      const matriculaExistente = await Aluno.findOne({ where: { matricula } });
      if (matriculaExistente) {
        return res.status(400).json({ error: 'Esta matrícula já está em uso' });
      }
    }
    
    // Criar aluno
    const aluno = await Aluno.create({
      nome,
      email,
      telefone,
      curso,
      matricula
    });
    
    // Criar usuário associado ao aluno
    const usuario = await Usuario.create({
      email,
      username,
      senha: bcrypt.hashSync(senha, 8),
      tipo: 'aluno',
      alunoId: aluno.id
    });
    
    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (error) {
    // Tratamento de erro mais específico
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.fields.email) {
        return res.status(400).json({ error: 'Este email já está em uso' });
      }
      if (error.fields.username) {
        return res.status(400).json({ error: 'Este nome de usuário já está em uso' });
      }
      if (error.fields.matricula) {
        return res.status(400).json({ error: 'Esta matrícula já está em uso' });
      }
      return res.status(400).json({ error: 'Dados duplicados não permitidos' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Rota para solicitar redefinição de senha
app.post('/api/auth/esqueci-senha', async (req, res) => {
  try {
    const { email } = req.body;
    
    const usuario = await Usuario.findOne({ where: { email } });
    
    if (!usuario) {
      // Não informamos ao usuário se o email existe ou não por segurança
      return res.json({ message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' });
    }
    
    // Gerar token aleatório
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Salvar token no banco
    await ResetToken.create({
      email,
      token,
      expira: new Date(Date.now() + 3600000) // 1 hora
    });
    
    // Em um ambiente real, enviaríamos um email aqui
    console.log(`Token de redefinição para ${email}: ${token}`);
    
    res.json({ message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para redefinir senha
app.post('/api/auth/redefinir-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    
    const resetToken = await ResetToken.findOne({ 
      where: { 
        token,
        expira: { [Sequelize.Op.gt]: new Date() }
      }
    });
    
    if (!resetToken) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }
    
    const usuario = await Usuario.findOne({ where: { email: resetToken.email } });
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Atualizar senha
    await usuario.update({
      senha: bcrypt.hashSync(novaSenha, 8)
    });
    
    // Remover token usado
    await resetToken.destroy();
    
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rotas da API de alunos
app.get('/api/alunos', autenticar, async (req, res) => {
  try {
    // Se for admin, retorna todos os alunos
    // Se for aluno, retorna apenas o próprio aluno
    if (req.usuario.tipo === 'admin') {
      const alunos = await Aluno.findAll();
      res.json(alunos);
    } else {
      const aluno = await Aluno.findByPk(req.usuario.alunoId);
      res.json([aluno]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para busca de alunos
app.get('/api/alunos/busca', autenticar, verificarAdmin, async (req, res) => {
  try {
    const { termo, curso } = req.query;
    
    const where = {};
    
    if (termo) {
      where[Sequelize.Op.or] = [
        { nome: { [Sequelize.Op.iLike]: `%${termo}%` } },
        { email: { [Sequelize.Op.iLike]: `%${termo}%` } },
        { matricula: { [Sequelize.Op.iLike]: `%${termo}%` } }
      ];
    }
    
    if (curso) {
      where.curso = curso;
    }
    
    const alunos = await Aluno.findAll({ where });
    res.json(alunos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alunos/:id', autenticar, async (req, res) => {
  try {
    // Verificar se o usuário tem permissão para acessar este aluno
    if (req.usuario.tipo !== 'admin' && req.usuario.alunoId != req.params.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const aluno = await Aluno.findByPk(req.params.id);
    if (!aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    res.json(aluno);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/alunos', autenticar, verificarAdmin, async (req, res) => {
  try {
    const aluno = await Aluno.create(req.body);
    res.status(201).json(aluno);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/alunos/:id', autenticar, async (req, res) => {
  try {
    // Verificar se o usuário tem permissão para editar este aluno
    if (req.usuario.tipo !== 'admin' && req.usuario.alunoId != req.params.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const aluno = await Aluno.findByPk(req.params.id);
    if (!aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    // Se for aluno comum, só pode alterar telefone e curso
    if (req.usuario.tipo !== 'admin') {
      await aluno.update({
        telefone: req.body.telefone,
        curso: req.body.curso
      });
    } else {
      await aluno.update(req.body);
    }
    
    res.json(aluno);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/alunos/:id', autenticar, verificarAdmin, async (req, res) => {
  try {
    const aluno = await Aluno.findByPk(req.params.id);
    if (!aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    await aluno.destroy();
    res.json({ message: 'Aluno excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para estatísticas
app.get('/api/estatisticas', autenticar, verificarAdmin, async (req, res) => {
  try {
    const totalAlunos = await Aluno.count();
    
    const alunosPorCurso = await Aluno.findAll({
      attributes: ['curso', [Sequelize.fn('count', Sequelize.col('id')), 'total']],
      group: ['curso'],
      raw: true
    });
    
    res.json({
      totalAlunos,
      alunosPorCurso
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para exportar dados em CSV
app.get('/api/alunos/exportar', autenticar, verificarAdmin, async (req, res) => {
  try {
    const alunos = await Aluno.findAll();
    
    let csv = 'ID,Nome,Email,Telefone,Curso,Matrícula\n';
    
    alunos.forEach(aluno => {
      csv += `${aluno.id},"${aluno.nome}","${aluno.email}","${aluno.telefone || ''}","${aluno.curso || ''}","${aluno.matricula || ''}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=alunos.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para visualizar logs (apenas admin)
app.get('/api/logs', autenticar, verificarAdmin, async (req, res) => {
  try {
    const logs = await Log.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aplicar middleware de log em rotas autenticadas
app.use('/api/alunos', autenticar, registrarLog);

// Rotas para as páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/esqueci-senha', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'esqueci-senha.html'));
});

app.get('/redefinir-senha', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'redefinir-senha.html'));
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});