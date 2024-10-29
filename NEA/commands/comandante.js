const Commander = require('../models/Commander')
const commanderOperations = require('../jsons/commanderOperations.json')

module.exports = {
    name: "comandante",
    description: 'Altera a tabela de "Commanders"',
    options: [],
    async execution (message, args) {
        const operation = args[0] ? args.shift().toLowerCase() : undefined
        const username = args.shift()
        const authority = parseInt(args.shift())

        var userId

        if (!operation) return message.reply('Você deve declarar uma operação para que o comando "comandante" seja executado.')
            
        if (!username) return message.reply('Você deve fornecer o usuário do comandante para que o comando seja executado.')

        if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/.test(username)) return message.reply('Você deve fornecer um usuário válido para que o comando seja executado.')

        for ([key, member] of (await message.guild.members.fetch())) {
            const user = member.user

            if (user.username === username) {
                userId = user.id
            }
        }

        if (!userId) return message.reply('O usuário informado não é um membro deste servidor.')

        const commander = await Commander.findOne({ where: { id: userId }, raw: true });

        if (commanderOperations.createArgs.includes(operation)) {
            if (!authority) return message.reply("Você deve fornecer um nível de autoridade para que o comando seja executado.")

            if (!/^[0-9]$/.test(authority)) return message.reply("Você deve fornecer um nível de autoridade válido para que o comando seja executado.")

            if (commander) return message.reply('Já existe um registro de comandante para esse usuário.')

            await Commander.create({ id: userId, username, authority })

            return message.reply("Registro de comandante realizado" + `\n${username} foi registrado como comandante de autoridade nível ${authority}.`)
        }

        if (commanderOperations.updateArgs.includes(operation)) {
            if (!commander) return message.reply('Não existe um registro de comandante para esse usuário')

            var updateMessage = ""

            if (commander.username != username) {
                await Commander.update({ username }, { where: { id: userId } })
                
                updateMessage += `Nome de usuário do registro do comandante alterado. (Anterior: ${commander.username} / Atual: ${username})`
            }

            if (authority && commander.authority != authority) {
                await Commander.update({ authority }, { where: { id: userId } })

                updateMessage += `\nNível de autoridade do registro do comandante alterado. (Anterior: Nível ${commander.authority} / Atual: Nível ${authority})`
            }

            if (updateMessage === "") return message.reply("Nenhuma alteração foi feita no registro do comandante." + "\nOs valores suplentes, ou são iguais aos atuais, ou são inexistentes.")

            return message.reply(updateMessage)
        }

        if (commanderOperations.readArgs.includes(operation)) {
            if (!commander) return message.reply('Não existe um registro de comandante para esse usuário');

            return message.channel.send("Registro de comandante:\n" + `\nId: ${commander.id}\nNome de usuário: ${commander.username}\nNível de autoridade: ${commander.authority}`)
        }

        if (commanderOperations.deleteArgs.includes(operation)) {
            if (!commander) return message.reply('Não existe um registro de comandante para esse usuário');

            await Commander.destroy({ where: { id: userId } })

            return message.reply(`O registro de comandante do usuário "${username}" foi apagado`)
        }

        return message.reply('Você deve fornecer um comando válido para que o comando "comandante" seja executado.')
    } 
}