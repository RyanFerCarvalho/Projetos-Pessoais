const { DataTypes } = require('sequelize');
const DataBase = require('../db/connection.js');

const Commander = DataBase.define("Commander", {
    id: {
        primaryKey: true,
        type: DataTypes.STRING,
        require: true,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        require: true,
        allowNull: false
    },
    authority: {
        type: DataTypes.TINYINT,
        require: true,
        allowNull: false
    }
});

module.exports = Commander;