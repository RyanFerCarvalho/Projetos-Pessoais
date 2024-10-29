const { DisTube } = require('distube')
const { YouTubePlugin } = require('@distube/youtube');
const { client } = require('../bot.js')

const distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [new YouTubePlugin()]
});

// var currentPlaying

// function (playingNowMessage) {
//     currentPlaying.delete()
// }

distube.on("playSong", async (queue, audio) => {
    const audioUpdatesChannel = queue.voiceChannel.guild.channels.cache.find(channel => channel.name === 'musicas' && channel.type === Discord.ChannelType.GuildText);
    const metadataChannel = audio.metadata.channel

    if (audioUpdatesChannel) {
        if (metadataChannel === audioUpdatesChannel) {
            if (audio.metadata instanceof Discord.Message) {
                const audioUpdatesChannelMessages = await audioUpdatesChannel.messages.fetch({ limit: 50 })
                var botReplied 
                
                for ([key, message] of audioUpdatesChannelMessages) {
                    if (message === audio.metadata) break

                    if (message.reference?.messageId) {
                        botReplied = true

                        break
                    }
                }

                if (!botReplied) return await sendReply(audio.metadata, `:musical_note:  Tocando Agora:\n${audio.name} | (Duração: ${audio.formattedDuration})`)

                return await audio.metadata.reply('teste')
            } else {
                if (!audio.metadata.replied) return await sendReply(audio.metadata, `:musical_note:  Tocando Agora:\n${audio.name} | (Duração: ${audio.formattedDuration})`)
            
                return await audio.metadata.followUp('teste')
            }
        }

        return await audioUpdatesChannel.send(`:musical_note:  Tocando Agora:\n${audio.name} | (Duração: ${audio.formattedDuration})`);
    }
});

distube.on("addSong", async (queue, audio) => {
    const audioUpdatesChannel = queue.voiceChannel.guild.channels.cache.find(channel => channel.name === 'musicas' && channel.type === Discord.ChannelType.GuildText);
    const userRequestChannel = audio.metadata.userRequest.channel;

    if (!(userRequestChannel === audioUpdatesChannel)) {
        await sendReply({});

        if (!audioUpdatesChannel) return await metadataChannel.send('Por favor, crie um canal de texto de nome "musicas" no servidor para que o bot posso adicionar as atualizações relacionadas às filas de reprodução.');
        
        await audioUpdatesChannel.send(`:satellite:  Adicionado à fila de reprodução:\n"${audio.name}" | (Duração: ${audio.formattedDuration}).`);

        return await metadataChannel.send('Por favor, envie os comandos de "audio" no canal de nome "musicas" para poder acelerar o processamento da fila de reprodução.');
    } 

    return sendReply(audio.metadata, `:satellite:  Adicionado à fila de reprodução:\n"${audio.name}" | (Duração: ${audio.formattedDuration}).`);
});

distube.on("addList", async (queue, playlist) => {
    const audioUpdatesChannel = queue.voiceChannel.guild.channels.cache.find(channel => channel.name === 'musicas' && channel.type === Discord.ChannelType.GuildText);
    const metadataChannel = playlist.metadata.channel;

    if (!(metadataChannel === audioUpdatesChannel)) {
        await sendReply(audio.metadata, 'Playlist atribuída à fila de reprodução.');

        if (!audioUpdatesChannel) return await metadataChannel.send('Por favor, crie um canal de texto de nome "musicas" no servidor para que o bot posso adicionar as atualizações relacionadas às filas de reprodução.');
        
        if (queue.songs.length > 1) await audioUpdatesChannel.send(`:satellite:  Adicionada à fila de reprodução:\nPlaylist: ${playlist.name} | (Qtd Vídeos: ${playlist.songs.length}).`);

        return await metadataChannel.send('Por favor, envie os comandos de "audio" no canal de nome "musicas" para poder acelerar o processamento da fila de reprodução.');
    } 

    if (queue.songs.length > 1) return sendReply(audio.metadata, `:satellite:  Adicionada à fila de reprodução:\nPlaylist: ${playlist.name} | (Qtd Vídeos: ${playlist.songs.length}).`);
});

module.exports = {
    name: "audio",
    description: 'Controla a reprodução de áudios',
    options: [
        {
            name: "stop",
            description: "Encerra toda a fila de reprodução de áudio",
            type: 1,
        },
        {
            name: "pause",
            description: "Pausa a reprodução do áudio atual",
            type: 1,
        },
        {
            name: "resume",
            description: "Reativa a reprodução do áudio atualmente pausado",
            type: 1,
        },
        {
            name: "skip",
            description: "Encerra a reprodução do áudio atual",
            type: 1,
            options: [
                {
                    name: "musica",
                    description: "Áudio que irá sobrepor o áudio interrompido",
                    type: 3,
                }
            ]
        },
        {
            name: "unshift",
            description: "Adiciona um áudio ao inicio da fila",
            type: 1,
            options: [
                {
                    name: "musica",
                    description: "Áudio que será adicionado à fila",
                    type: 3,
                    required: true
                }
            ]
        },
        {
            name: "play",
            description: "Adiciona um áudio ao final da fila de reprodução",
            type: 1,
            options: [
                {
                    name: "musica",
                    description: "Áudio que será adicionado à fila",
                    type: 3,
                    required: true
                }
            ]
        }
    ],
    async execution (userRequest, args, previousReply) {
        const memberVoiceChannel = userRequest.member.voice.channel;
        const botVoiceChannel = distube.voices.get(userRequest)?.channel;
        const audiosCount = distube.getQueue(userRequest)?.songs.length;
        const subcommand = args.shift()
        const playAudioOptions = {
            metadata: {
                userRequest,
                previousReply
            },
            member: userRequest.member,
            textChannel: userRequest.channel,
            skip: false,
            unshift: false
        };

        if (!memberVoiceChannel) return sendReply(userRequest, "Você precisa estar em um canal de voz para usar esse comando.");

        if (!subcommand) return sendReply(userRequest, `Você deve informar um subcomando para executar o comando.`);

        if (["play", "unshift"].includes(subcommand) || (subcommand === "skip" && args.length >= 1)) {
            switch (subcommand) {
                case "unshift":
                    playAudioOptions.unshift = true;
    
                    break;
                case "skip":
                    playAudioOptions.skip = true;
    
                    break;
            };

            return await distube.play(memberVoiceChannel, args.join(' '), playAudioOptions);
        } else if (["stop", "pause", "resume"].includes(subcommand) || (subcommand === "skip" && args.length === 0)) {
            if (!botVoiceChannel) return sendReply(userRequest, "O bot não está ativo em qualquer canal de voz. É necessário que o bot esteja ativo.");

            if (!(memberVoiceChannel === botVoiceChannel)) return sendReply(userRequest, `Você precisa estar no mesmo canal de voz do bot para requisitar a execução do subcomando "${subcommand}".`);

            if (!audiosCount || audiosCount.length === 0) return sendReply(userRequest, "Não há qualquer áudio na lista de reprodução neste momento.");

            switch (subcommand) {
                case "resume":
                    if (!distube.getQueue()?.pause) return sendReply(userRequest, "Não há qualquer áudio com a reprodução pausada neste momento para que seja possível reativar sua reprodução.");

                    distube.resume(userRequest.guild);

                    return sendReply(userRequest, "A reprodução do áudio atual foi reativada.");
                case "stop":
                    await distube.stop(userRequest);

                    return sendReply(userRequest, "A lista de reprodução foi cancelada.");
                case "pause":
                    if (distube.getQueue()?.pause)  return sendReply(userRequest, "O áudio atual já está com sua reprodução pausada.");

                    distube.pause(userRequest.guild);

                    return sendReply(userRequest, "A reprodução do áudio atual foi pausada.");
                case "skip":
                    if (audiosCount === 1) return sendReply(userRequest, "Não é possível cancelar a reprodução do áudio atual quando só há um áudio presente na fila de reprodução, por favor, use o commando " + '"stop"' + " para cancelar toda a fila de reprodução");

                    await distube.skip(userRequest)

                    return sendReply(userRequest, "A reprodução do áudio foi cancelada");
            }
        }

        return sendReply(userRequest, "O subcomando informado não existe neste comando, por favor informe um subcomando válido.");
    }
};