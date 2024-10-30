const { Sequelize } = require('sequelize');

const DataBase = new Sequelize("nea_bot", "root", "senha", {
    host: '127.0.0.1',
    port: 3306,
    dialect: 'mysql'
});

try {
    DataBase.authenticate()
} catch (error) {
    console.error("Erro ao tentar conectar ao banco de dados: " + error);
};

module.exports = DataBase
