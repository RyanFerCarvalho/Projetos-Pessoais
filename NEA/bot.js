const Discord = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders')
const fs = require("fs");
const config = require("./config.json");
const DataBase = require('./db/connection.js');

const Commander = require('./models/Commander.js');

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.GuildMembers
    ]
});
const rest = new Discord.REST({ version: 10 }).setToken(config.token)

async function botUsersCount() {
    let botUsers = []

    for (const [key, guild] of client.guilds.cache) {
        for (const [key, member] of await guild.members.fetch()) {
            const user = member.user

            if(!user.bot && !botUsers.includes(user.id)) {
                botUsers.push(user.id)
            }
        }
    }

    return botUsers
}
async function sendReply (userRequest, previousReply, replyConstitution) {
    var reply

    if (replyConstitution instanceof String) {
        reply = replyConstitution
    } else {
        reply = { embeds: [
            new Discord.EmbedBuilder()
            .setColor(replyConstitution.color)
            .setTitle(replyConstitution.title)
            .setAuthor({
                name: replyConstitution.author.name,
                iconURL: replyConstitution.author.iconURL
            })
            .setTimestamp()
            .setFooter({
                text: replyConstitution.footer.text,
                iconURL: replyConstitution.footer.iconURL
            })
        ] };

        const embed = reply.embeds[0]

        if (replyConstitution.description) embed.setDescription(replyConstitution.description)

        for (const field of replyConstitution.fields) {
            embed.addFields(field)
        }
    }

    if (userRequest instanceof Discord.Message) {
        previousReply.edit(reply)
    } else {
        userRequest.editReply(reply)
    }
}

module.exports = {
    gallowsContext: {
        active: false,
        wordObject: null,
        user: null,
        status: {
            word: null,
            letters: []
        },
        errors: 0
    },
    pokerContext: {
        active: false,
        started: false,
        allInStage: false,
        cards: [
            ["1:14","1:13","1:12","1:12","1:10","1:9","1:8","1:7","1:6","1:5","1:4","1:3","1:2"],
            ["2:14","2:13","2:12","2:12","2:10","2:9","2:8","2:7","2:6","2:5","2:4","2:3","2:2"],
            ["3:14","3:13","3:12","3:12","3:10","3:9","3:8","3:7","3:6","3:5","3:4","3:3","3:2"],
            ["4:14","4:13","4:12","4:12","4:10","4:9","4:8","4:7","4:6","4:5","4:4","4:3","4:2"]
        ],
        players: [],
        turnPlayer: {
            turnPlayerReady: false,
            playerIndex: null
        },
        tableCards: [],
        pot: 0,
        highestBet: {
            playerIndex: null,
            value: 0
        },
    },
    client,
};

client.commands = new Discord.Collection()
commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
};

try {
    (async () => {
        await rest.put(Discord.Routes.applicationCommands(config.id), {
            body: client.commands.map((value, key) => {
                const { execution, ...noFunctionCommand } = value
    
                return noFunctionCommand
            })
        })
    })()
} catch (error) {
    console.error(`Error ao registrar os comandos do bot nos servidores:\n\n${error}`);
}

client.once("ready", async (_) => {
    client.user.setActivity(`pedidos de ${(await botUsersCount()).length} usuários, em ${client.guilds.cache.size} servidores.`, { type: Discord.ActivityType.Listening });

    const botInfo = [
        `Olá, @everyone! Eu sou o ${client.user.username}. Usem o prefixo "${config.prefix}" para interagir comigo. Por exemplo, "${config.prefix}ajuda" para obter uma lista de comandos.`,
        '@everyone, aviso: o subcomando "play" do comando "audio" por meio de prefixo(:audio play) possui uma execução mais complexa, e por isso mais lenta, do que ao utilizar os "slash commands" (/audio play). Por isso, peço que deem preferência aos "slash commands", mas não se esqueçam que ambas as formas de comando funcionam.'
    ];
    
    for ([key, guild] of client.guilds.cache) {
        const botInfoChannel = guild.channels.cache.find(channel => channel.name === "info" && channel.type === Discord.ChannelType.GuildText)
        
        if (botInfoChannel) {
            const botInfoChannelMessages = ((await botInfoChannel.messages.fetch({ limit: 50 }))?.filter((message, key) => message.author.id === client.user.id));

            for (message of botInfo) {
                const latestMessageKey = botInfoChannelMessages.lastKey()
                const latestMessage = botInfoChannelMessages.get(latestMessageKey)

                botInfoChannelMessages.delete(latestMessageKey)

                if (!latestMessage) {
                    botInfoChannel.send(message);
                } else if (latestMessage.content != message) {
                    latestMessage.edit(message);
                }
            }
        }
    }
});

client.on("guildCreate", async guild => {
    console.log(`O bot foi adicionado no servidor: ${guild.name} (id: ${guild.id}). População: ${guild.memberCount - 1} outros membros.`);

    client.user.setActivity(`pedidos de ${(await botUsersCount()).length} usuários, em ${client.guilds.cache.size} servidores.`, { type: Discord.ActivityType.Listening });
});

client.on("guildDelete", async guild => {
    console.log(`O bot foi removido do servidor: ${guild.name} (id: ${guild.id}).`);

    client.user.setActivity(`pedidos de ${(await botUsersCount()).length} usuários, em ${client.guilds.cache.size} servidores.`, { type: Discord.ActivityType.Listening });
});

client.on("messageCreate", async message => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;
    if (message.channel === "dm") return;
    if (message.author.id != "494308730939113472") return message.reply("Comando recusado");

    const args = message.content.slice(config.prefix.length).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

    if (!client.commands.has(commandName)) return message.reply(`O comando "${commandName}" não existe.\nUse "${config.prefix}ajuda" para obter umas lista de comandos.`);

    const previousReply = await message.reply({ embeds: [
        new Discord.EmbedBuilder()
            .setColor('#fffb00')
            .setTitle('Carregando comando ...')
            .setDescription(`NEA está processando o comando "${commandName}".`)
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
    ] });

    try {
        await sendReply(message, previousReply, await client.commands.get(commandName).execution(message, args, previousReply));
    } catch (error) {
        console.error(`Houve um erro durante a execução do comando.\n${error}`);
    };
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;

    const args = []
        
    try {
        args.unshift(interaction.options.getSubcommand())
    } catch (error) {
        console.error(`Houve um erro ao tentar acessar o subcomando. Erro: ${error}`);
    }

    interaction.author = interaction.user;

    delete interaction.user;

    if (options = interaction.options.data[0]?.options) for (const option of options) {
        args.push(option.value)
    };

    await interaction.deferReply();

    const previousReply = {
        createdTimestamp: Date.now()
    };

    try {
        await sendReply(interaction, previousReply, await client.commands.get(interaction.commandName).execution(interaction, args, previousReply));
    } catch (error) {
        console.error(`Houve um erro durante a execução do comando.\nErro: ${error}`);
    };
});

DataBase.sync()
    .then((_) => client.login(config.token))
    .catch(error => console.error("Não foi possível inicializar o Bot." + "Erro: " + error));
