const { client } = require('../bot.js');

module.exports = {
    name: "ping",
    description: 'Apresenta a latência do Bot',
    async execution (userRequest, args, previousReply) {
        return {
            color: 'c69b54',
            title: 'Latência',
            fields: [
                { name: 'Resposta do BOT', value: `${previousReply.createdTimestamp - userRequest.createdTimestamp}ms`, inline: true },
                { name: 'Resposta da API', value: `${client.ws.ping}ms`, inline: true }
            ],
            author: {
                name: 'Comando Ping',
                iconURL: 'https://www.citypng.com/public/uploads/preview/wireless-wifi-round-green-logo-icon-png-img-701751694967751mpjvl3va1b.png'
            },
            footer: {  
                text: `Executado por ${userRequest.author.username}`,
                iconURL: userRequest.author.displayAvatarURL()
            }
        }
    }
}