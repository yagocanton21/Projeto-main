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

// Sincronizar o modelo com o banco de dados
sequelize.sync({ force: true })
  .then(() => {
    console.log('Banco de dados sincronizado');
    
    // Criar usuário administrador padrão
    return Usuario.create({
      email: 'admin@admin.com',
      username: 'admin',
      senha: bcrypt.hashSync('admin', 8),
      tipo: 'admin'
    });
  })
  .then(() => console.log('Usuário administrador criado'))
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
    res.status(400).json({ error: error.message });
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

// Rotas para as páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});