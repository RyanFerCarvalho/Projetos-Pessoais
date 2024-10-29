const gallowsData = require('../jsons/gallowsData.json');
const gallowsContext = require('../bot.js').gallowsContext;

function endGame() {
    gallowsContext.active = false;
    gallowsContext.wordObject= null;
    gallowsContext.user = null;
    gallowsContext.status.word = null;
    gallowsContext.status.letters = [];
    gallowsContext.errors = 0;
};

module.exports = {
    name: "forca",
    description: "Inicia uma forca enforcando um membro do servidor, que se morrer será rebaixado pelo tempo definido",
    options: [],
    async execution (message, args) {
        const arg =  args[0] ? args.shift().toLowerCase() : undefined;

        if ((gallowsContext.active === false && !arg) || gallowsData.subcommands.startArgs.includes(arg)) {
            if (gallowsContext.active === false) {
                const m = await message.reply("Gerando forca...");
                const wordObject = gallowsData.words[Math.floor(Math.random()*gallowsData.words.length)];
                const members = Array.from(await message.guild.members.fetch()).map(member => member[1].user).filter(user => user.bot !== true);
                const member = members[Math.floor(Math.random()*members.length)];

                var hiddenWord = ""
                
                for (letter of wordObject.word) {
                    hiddenWord += "? "
                }

                hiddenWord = hiddenWord.trim()

                try {
                    message.channel.send(`${hiddenWord} | Erros: 0 de 5 | Enforcado: ${member.username}`)
                    m.delete()

                    gallowsContext.active = true
                    gallowsContext.wordObject = wordObject
                    gallowsContext.user = member
                    gallowsContext.status.word = hiddenWord

                    return
                }catch(error) {
                    console.error(error);
                }
            } else {
                return message.reply("Uma forca já foi iniciada e está ocorrendo neste momento.")
            }
        };

        if (/^[a-z]$/.test(arg)) {
            if (gallowsContext.active === true) {
                if (!gallowsContext.status.letters.includes(arg)) {
                    var endGameMessage;
                    var valid;
                    
                    for (i = 0; i < gallowsContext.wordObject.word.length; i++) {
                        if (arg == gallowsContext.wordObject.word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')[i]) {
                            gallowsContext.status.word = `${gallowsContext.status.word.substring(0, i*2) + gallowsContext.wordObject.word[i] + gallowsContext.status.word.substring(i*2 + 1)}`;
                            
                            valid = true;
                        };
                    };

                    gallowsContext.status.letters.push(arg);
                    gallowsContext.status.letters.sort();

                    if (valid) {
                        if (!gallowsContext.status.word.includes('?')) {
                            endGameMessage = "Fim de jogo: Vocês Ganharam :grin:" + "\nA palavra foi descoberta antes que o número máximo de erros fosse atingido"
                        }
                    } else {
                        gallowsContext.errors++;

                        if (gallowsContext.errors >= 5) {
                            gallowsContext.errors = 5

                            endGameMessage = "Fim de jogo: Vocês Perderam :pensive:" + `\nPalavra: ${gallowsContext.wordObject.word}` + "\nInfelizmente o número máximo de erros foi atingido antes que a palavra fosse descoberta"
                        };
                    };

                    message.channel.send(`${gallowsContext.status.word} | Erros: ${gallowsContext.errors} de 5 | Enforcado: ${gallowsContext.user}` + `\n${gallowsContext.status.letters.join(' ')}`);

                    if (endGameMessage) {
                        endGame()

                        message.channel.send(endGameMessage)
                    }

                    return
                } else {
                    message.reply("Essa letra já foi mencionada")
                    return message.channel.send(`${gallowsContext.status.word} | Erros: ${gallowsContext.errors} de 5 | Enforcado: ${gallowsContext.user}` + `\n${gallowsContext.status.letters.join(' ')}`);
                };
            } else {
                return message.reply("Nenhuma forca está ativa neste momento");
            };
        };

        if ((gallowsContext.active === true && !arg) || gallowsData.subcommands.showArgs.includes(arg)) {
            if (gallowsContext.active === true) {
                return message.channel.send(`${gallowsContext.status.word} | Erros: ${gallowsContext.errors} de 5 | Enforcado: ${gallowsContext.user}` + `\n${gallowsContext.status.letters.join(' ')}`);
            } else {
                return message.reply("Nenhuma forca está ativa neste momento")
            }
        };

        if (gallowsData.subcommands.hintArgs.includes(arg)) {
            if (gallowsContext.active === true) {
                const hintsStart = 5 - gallowsContext.wordObject.hints.length

                if (gallowsContext.errors >= hintsStart) {
                    var hints = []

                    for (i = 0; i <= gallowsContext.errors - hintsStart; i++) {
                        hints.push(`${i + 1}. ${gallowsContext.wordObject.hints[i]}`)
                    }

                    return message.channel.send(hints.join('\n'))
                } else {
                    return message.reply("As dicas só serão liberadas a partir de dois erros")
                }
            } else {
                return message.reply("Nenhuma forca está ative neste momento")
            }
        }

        if (gallowsData.subcommands.stopArgs.includes(arg)) {
            endGame()

            return message.channel.send("A forca foi cancelada")
        };

        return message.reply("Esse não é um argumento válido para os comandos da forca");
    }
};