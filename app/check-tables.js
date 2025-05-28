const { Sequelize } = require('sequelize');

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

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');
    
    // Listar todas as tabelas
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('Tabelas existentes:');
    tables.forEach(table => {
      console.log(table.table_name);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
    process.exit(1);
  }
}

checkTables();