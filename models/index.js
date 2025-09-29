const { Sequelize } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');

// Cargar variables de entorno local
if (!process.env.VERCEL) {
  require('dotenv').config({ path: '.env.local' });
}

// Detecta entorno de producción
const useNeon = process.env.VERCEL === '1' || process.env.USE_NEON === 'true';

console.log('USANDO NEON', useNeon, process.env.USE_NEON,'\n', process.env.AGENDA_URL);
console.log('ENv:', JSON.stringify(process.env.DATABASE_URL, null, 2));
let sequelize;

if (useNeon) {
  let connectionString = process.env.DATABASE_URL;

  // 👇 Fix: Sequelize necesita postgres://
  if (connectionString && connectionString.startsWith('postgresql://')) {
    connectionString = connectionString.replace('postgresql://', 'postgres://');
  }
  //sequelize = new Sequelize(process.env.AGENDA_URL, {
  sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  const dbPath = path.join(__dirname, '..', 'contacts.db');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: (msg) => console.debug("[SQL]:", msg), // 👈 función válida
  });
}

// Cargar modelos
const User = require('./user')(sequelize);
const Contact = require('./contact')(sequelize);

/*const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

const Contact = sequelize.define('Contact', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: false
  }
});*/

// Inicializar tablas y usuario por defecto
const createTablesAndDefaultUser = async () => {
  //await sequelize.sync({ force: false });
  await sequelize.sync({ force: true});
  //await sequelize.sync({ alter: true });

  const hashedPassword = bcrypt.hashSync('1234', 10);
  let uAdmin = {username: 'admin', password: hashedPassword};
  //await User.create(uAdmin);
  const [user, created] = await User.findOrCreate({
    where: { username: 'admin' },
    defaults: { password: hashedPassword }
  });
}

sequelize.authenticate()
  .then(() => console.log('✅ Conectado a la base de datos'))
  .catch(err => console.error('❌ Error de conexión:', err));


module.exports = {
    sequelize,
    User,
    Contact,
    createTablesAndDefaultUser
};