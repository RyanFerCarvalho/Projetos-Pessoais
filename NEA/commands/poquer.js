const pokerSubcommands = require('../jsons/pokerSubcommands.json');
const pokerContext = require('../bot.js').pokerContext;

function addPlayer (user) {
    pokerContext.players.push({
        id: user.id,
        username: user.username,
        cards: [],
        out: false,
        points: 50,
        bet: 0
    });
};

function showPlayersInfo () {
    var playersList = "Jogadores:\n";
    
    for (player of pokerContext.players) {
        playersList += `\n${player.username} -> ${player.points} Pontos`
    };

    return playersList;
};

function translateCards (cardsArray) {
    return cardsArray.map(card => {
        let [suit, value] = card.split(':');
        
        switch (suit) {
            case "1":
                suit = '♥'

                break
            case "2":
                suit = '♣'

                break
            case "3":
                suit = '♠'

                break
            case "4":
                suit = '♦'

                break

        }

        switch (value) {
            case '14':
                value = 'A'

                break
            case '13':
                value = 'K'

                break
            case '12':
                
                value = 'Q'

                break
            case '11':
                value = 'J'

                break
        }

        return suit + value
    })
};

async function showCards (player, client) {
    (await client.users.fetch(player.id)).send(("Cartas:\n\n" + translateCards(player.cards).join(" ")))
};

function showTableInfo (player) {
    var tableInfo = "Mesa:" + "\n\nCartas -> ";

    if (pokerContext.tableCards.length) {
        tableInfo += translateCards(pokerContext.tableCards).join(" ");
    } else {
        tableInfo += "(Sem Cartas)";
    };

    tableInfo += `\n\nPot -> ${pokerContext.pot}` + "\n\nApostas:\n";

    for (player of pokerContext.players) {
        if (player.bet > 0 || player.points > 0) {
            tableInfo += `\n${player.username} -> ${player.bet}`;
            
            if (player.out) {
                tableInfo += "(Out)"
            } else if (player.points === 0 && player.bet > 0) {
                tableInfo += "(All In)"
            }
        }
    };

    if (pokerContext.turnPlayer.turnPlayerReady) {
        tableInfo += `\n\nAposta mais alta: ${pokerContext.highestBet.value}`;
        tableInfo += `\nJogador do turno: ${pokerContext.players[pokerContext.turnPlayer.playerIndex].username}`;
    };

    console.log(pokerContext.turnPlayer.playerIndex);

    return tableInfo;
};

function betPoints (player, value) {
    player.bet += value
    pokerContext.pot += value
    player.points -= value
};

function getCard () {
    var suit 

    do {
        suit = pokerContext.cards[Math.floor(Math.random()*4)]
    } while (!suit.length)

    const card = suit[Math.floor(Math.random()*suit.length)]

    pokerContext.cards[pokerContext.cards.indexOf(suit)].splice(suit.indexOf(card), 1)

    return card
};

function subcommandsListIncludes (subcommandsList, subcommand) {
    for (subcommandArgsKey in subcommandsList) {
        if (subcommandsList[subcommandArgsKey].includes(subcommand)) return true
    }
};

async function endGame (message, lastPlayer) {
    function pokerGameWinnerVerifier (player) {
        if (player.points / (50 * pokerContext.players.length) >= 0.90) {
            message.channel.send(`${player.username}(${player.points} Pontos) venceu o jogo de Pôquer!` + "\nConseguiu reunir mais de 75% dos pontos totais da partida!");
            
            pokerContext.active = false;
            pokerContext.started = false;
            pokerContext.allInStage = false;
            pokerContext.cards = [
                ["1:14","1:13","1:12","1:12","1:10","1:9","1:8","1:7","1:6","1:5","1:4","1:3","1:2"],
                ["2:14","2:13","2:12","2:12","2:10","2:9","2:8","2:7","2:6","2:5","2:4","2:3","2:2"],
                ["3:14","3:13","3:12","3:12","3:10","3:9","3:8","3:7","3:6","3:5","3:4","3:3","3:2"],
                ["4:14","4:13","4:12","4:12","4:10","4:9","4:8","4:7","4:6","4:5","4:4","4:3","4:2"]
            ];
            pokerContext.players = [];
            pokerContext.turnPlayer = {
                turnPlayerReady: false,
                playerIndex: null
            };
            pokerContext.tableCards = [];
            pokerContext.pot = 0;
            pokerContext.highestBet = {
                playerIndex: null,
                value: 0
            };

            return;
        };
    };

    await message.channel.send(showTableInfo());

    if (lastPlayer) {
        lastPlayer.points += pokerContext.pot;

        message.channel.send(`${lastPlayer.username} levou o pot!` + `\n${lastPlayer.username} +${pokerContext.pot} Pontos`);

        pokerGameWinnerVerifier(lastPlayer);
    } else {
        var playersCardsPoints = [];
        var playersPodium = {};
        
        for (player of pokerContext.players) {
            if (player.bet > 0 || player.points > 0) {
                var playerCards = player.cards.concat(pokerContext.tableCards);
                var playerCardsValues = {
                    numbers: {},
                    suits: {}
                };
                var playerHand = {
                    1: [],
                    2: [],
                    3: [],
                    4: [],
                    oneSuit: undefined,
                    straight: undefined
                };
                var straight = {
                    lastValue: undefined,
                    noStraightValues: 0,
                    hasPair: undefined
                };

                for (let i = 0; i < playerCards.length; i++) {
                    for (let x = i + 1; x < playerCards.length; x++) {
                        if (playerCards[i] > playerCards[x]) {
                            var holdValue = playerCards[i];
                            
                            playerCards[i] = playerCards[x];
                            playerCards[x] = holdValue;
                        };
                    };
                };

                for ([index, card] of playerCards.entries()) {
                    const [suit, number] = card.split(':');

                    if (!playerCardsValues.numbers[number]) playerCardsValues.numbers[number] = 0;
                    if (!playerCardsValues.suits[suit]) playerCardsValues.suits[suit] = 0;

                    playerCardsValues.numbers[number]++
                    playerCardsValues.suits[suit]++

                    if (straight.lastValue && playerHand.straight != false) {
                        if (number === straight.lastValue + 1) {
                            if ((index === 4 && straight.noStraightValues === 0) || index === 5) {
                                playerHand.straight = true

                                const suits = Object.keys(playerCardsValues.suits)

                                if (playerCardsValues.suits[suits.at(-1)] >= 5 || (straight.hasPair && playerCardsValues.suits[suits.at(-2)] === 5)) {
                                    playerHand.oneSuit = true
                                } else if (playerHand.oneSuit) break
                            }

                            straight.lastValue = number
                        } else if (number === straight.lastValue) {
                            straight.noStraightValues++
                            straight.hasPair =  true
                        }else {
                            switch (index) {
                                case 1:
                                    straight.lastValue = number;
                                    straight.noStraightValues++

                                    break
                                case 5:
                                    straight.noStraightValues++

                                    break
                                default:
                                    playerHand.straight = false

                                    break
                            }
                        };

                        if (straight.noStraightValues > 1) playerHand.straight = false;
                    } else if (straight.lastValue === undefined) {
                        straight.lastValue = number;
                        playerCardsValues.suits[suit] = 1 ;
                    };
                }; 

                for (numberKey in playerCardsValues.numbers) {
                    for (i = 1; i <= 4; i++) {
                        if (playerCardsValues.numbers[numberKey] === i) {
                            playerHand[i].push(parseInt(numberKey));

                            break;
                        };
                    };
                };
                
                if (!playerHand.straight) {
                    for (suitKey in playerCardsValues.suits) {
                        if (playerCardsValues.suits[suitKey] >= 5) {
                            playerHand.oneSuit = suitKey;

                            break;
                        };
                    };
                };

                var highestCardValue = 0;
                var playerHandPoints = 0;

                function noStraightHighestCardValue () {
                    for (card of playerCards) {
                        const [suit, number] = card.split(':');

                        if ((number <= straight.lastValue - 5 || number > straight.lastValue) || number === lastCardValue) {
                            highestCardValue = number; 

                            break
                        }
                    
                        const lastCardValue = number
                    };
                };

                function outOfMainHandHighestCardValue () {
                    for (let i = 1; i <= 4; i++) { 
                        const currentCardValue = playerHand[i].at(-1);

                        if (currentCardValue > highestCardValue) highestCardValue = currentCardValue;
                    };
                };

                if (playerHand.straight && playerHand.oneSuit && straight.lastValue === 14) {
                    playerHandPoints = 2516192845167;

                    noStraightHighestCardValue();
                } else if (playerHand.straight && playerHand.oneSuit) {
                    playerHandPoints = (straight.lastValue - 1) * 209682737096;

                    noStraightHighestCardValue();
                } else if (playerHand[4].length) {
                    const foakCardValue = playerHand[4].pop(); // F.O.A.K. = FOUR OF A KIND

                    playerHandPoints = (foakCardValue - 1) * 16129441314;

                    outOfMainHandHighestCardValue();
                } else if (playerHand[3].length && playerHand[2].length) {
                    const toakCardValue = playerHand[3].pop(); // T.O.A.K. = THREE OF A KIND
                    const pairCardValue = playerHand[2].pop();
                    
                    playerHandPoints = (14 * (toakCardValue - 1) + pairCardValue - 1) * 83141450;

                    outOfMainHandHighestCardValue();
                } else if (!playerHand.straight && playerHand.oneSuit) {
                    var suitHighestCard = 0;

                    for (card of playerCards) {
                        const [suit, number] = card.split(':');

                        if (suit === playerHand.oneSuit) {
                            if (number > suitHighestCard) {
                                suitHighestCard = number;
                            }
                            
                            if (!highestCardValue) {
                                highestCardValue = number
                            }
                        };

                        if (suit !== playerHand.oneSuit) {
                            highestCardValue = number
                        }
                    };

                    playerHandPoints = (suitHighestCard - 1) * 6395495;
                } else if (playerHand.straight && !playerHand.oneSuit) {
                    playerHandPoints = (straight.lastValue - 1) * 491960;
                
                    noStraightHighestCardValue();
                } else if (playerHand[3].length) {
                    const toakCardValue = playerHand[3].pop(); // T.O.A.K. = THREE OF A KIND

                    playerHandPoints = (toakCardValue - 1) * 37842;

                    outOfMainHandHighestCardValue();
                } else if (playerHand[2].length >= 2) {
                    const pair1CardValue = playerHand[2].pop();
                    const pair2CardValue = playerHand[2].pop();

                    playerHandPoints = (13 * (pair1CardValue - 1) + pair2CardValue - 1) * 209;

                    outOfMainHandHighestCardValue()
                } else if (playerHand[2].length) {
                    const pairCardValue = playerHand[2].pop();

                    playerHandPoints = (pairCardValue - 1) * 15; 

                    outOfMainHandHighestCardValue();
                } else {
                    outOfMainHandHighestCardValue();
                };
            
                playersCardsPoints.push({
                    playerObject: player,
                    playerHandPoints,
                    highestCardValue
                });
            }
        };

        for (playerPoints of playersCardsPoints) {
            const playerTotalPoints = playerPoints.playerHandPoints + playerPoints.highestCardValue
            const podiumPositionsCount = Object.keys(playersPodium).length
            
            for (let i = 1; i <= podiumPositionsCount + 1; i++) {
                if (!playersPodium[i]) {
                    playersPodium[i] = [playerPoints]

                    break
                }

                const podiumPositionFirstPlayer = playersPodium[i][0];
                const podiumPositionTotalPoints = podiumPositionFirstPlayer.playerHandPoints + podiumPositionFirstPlayer.highestCardValue;
                
                if (playerTotalPoints > podiumPositionTotalPoints) {
                    for (let a = podiumPositionsCount + 1; a > i; a--) {
                        playersPodium[a] = playersPodium[a - 1]
                    }

                    playersPodium[i] = [playerPoints]

                    break
                } else if (playerTotalPoints === podiumPositionTotalPoints) {
                    playersPodium[i].push(playerPoints)

                    break
                }
            }
        };
        
        var endGameMessage = "Fim da rodada!\n";

        for (let i = 1; i <= Object.keys(playersPodium).length; i++) {
            const pointsPerPlayer = pokerContext.pot / playersPodium[i].length;
            const podiumPositionFirstPlayer = playersPodium[i][0];

            var podiumPositionHand = '';
            
            if (podiumPositionFirstPlayer.playerHandPoints === 2516192845167) {
                podiumPositionHand = "Royal Flush"
            } else if (podiumPositionFirstPlayer.playerHandPoints >= 209682737096) {
                podiumPositionHand = "Straight Flush +"
            } else if (podiumPositionFirstPlayer.playerHandPoints >= 16129441314) {
                podiumPositionHand = "Quadra +"
            } else if (podiumPositionFirstPlayer.playerHandPoints >= 83141450) {
                podiumPositionHand = "Full House +"
            } else if (podiumPositionFirstPlayer.playerHandPoints >= 6395495) {
                podiumPositionHand = "Flush +"
            } else if (podiumPositionFirstPlayer.playerHandPoints >= 491960) {
                podiumPositionHand = "Straight +"
            } else if (podiumPositionFirstPlayer.playerHandPoints >= 37842) {
                podiumPositionHand = "Trinca +"
            } else if (podiumPositionFirstPlayer.playerHandPoints >= 209) {
                podiumPositionHand = "Dois Pares +"
            } else if (podiumPositionFirstPlayer.playerHandPoints >= 15) {
                podiumPositionHand = "Par +"
            };
            
            switch (podiumPositionFirstPlayer.highestCardValue) {
                case 14:
                    podiumPositionHand += 'A';

                    break;
                case 13:
                    podiumPositionHand += 'K';

                    break;
                case 12:
                    podiumPositionHand += 'Q';

                    break;
                case 11:
                    podiumPositionHand += 'J';

                    break;
                default: 
                    podiumPositionHand += podiumPositionFirstPlayer.highestCardValue;
            };

            for ({ playerObject } of playersPodium[i]) {
                const maxPlayerReward = playerObject.bet * pokerContext.players.length;

                endGameMessage += `\n${i}° ${playerObject.username}(${translateCards(playerObject.cards).join(' ')}): `;
                endGameMessage += podiumPositionHand;

                if (maxPlayerReward < pointsPerPlayer) {
                    pokerContext.pot -= maxPlayerReward;
                    playerObject.points += maxPlayerReward;

                    endGameMessage += ` | +${maxPlayerReward} Pontos\n`;
                } else {
                    pokerContext.pot -= pointsPerPlayer;
                    playerObject.points += pointsPerPlayer;

                    endGameMessage += ` | +${pointsPerPlayer} Pontos\n`;
                };
            };
        };

        await message.channel.send(endGameMessage);

        for (player of pokerContext.players) {
            pokerGameWinnerVerifier(player)
        };
    }

    pokerContext.started = false;
    pokerContext.allInStage = false;
    pokerContext.cards = [
        ["1:14","1:13","1:12","1:12","1:10","1:9","1:8","1:7","1:6","1:5","1:4","1:3","1:2"],
        ["2:14","2:13","2:12","2:12","2:10","2:9","2:8","2:7","2:6","2:5","2:4","2:3","2:2"],
        ["3:14","3:13","3:12","3:12","3:10","3:9","3:8","3:7","3:6","3:5","3:4","3:3","3:2"],
        ["4:14","4:13","4:12","4:12","4:10","4:9","4:8","4:7","4:6","4:5","4:4","4:3","4:2"]
    ];
    pokerContext.turnPlayer = {
        turnPlayerReady: false,
        playerIndex: null
    };
    pokerContext.tableCards = [];
    pokerContext.pot = 0;
    pokerContext.highestBet = {
        playerIndex: null,
        value: 0
    };

    for (player of pokerContext.players) {
        player.bet = 0
        player.out = false
    };

    return;
};

module.exports = {
    name: "poquer",
    description: "Inicia um jogo de pôquer",
    options: [],
    async execution (message, args, client) {
        const subcommand =  args[0] ? args.shift().toLowerCase() : undefined;
        const user = message.author;

        var currentPlayer = {
            playerIndex: undefined,
            playerObject: undefined
        };

        for (const [index, player] of pokerContext.players.entries()) {
            if (player.id === user.id) {
                currentPlayer.playerIndex = index
                currentPlayer.playerObject = player

                break
            }
        };

        if (!subcommand || pokerSubcommands.createArgs.includes(subcommand)) {
            if (pokerContext.active === true) return message.reply("Uma partida de poker já está sendo preparada, ou iniciada, neste momento.")

            pokerContext.active = true;

            const reply = await message.reply("Preparando partida de Pôquer.");

            addPlayer(user);

            message.channel.send(showPlayersInfo());

            return reply.delete();
        };

        if (pokerSubcommands.startArgs.includes(subcommand)) {
            if (pokerContext.active === false) return message.reply("Nenhuma partida de Pôquer está ativa neste momento.");

            if (pokerContext.started === true) return message.reply("A partida já foi iniciada.");

            if (pokerContext.players.length < 2) return message.reply("A partida não pode ser iniciada com apenas um jogador.")

            pokerContext.started = true

            for (player of pokerContext.players) {
                if (player.points > 0) {
                    player.cards = []

                    for (let i = 0; i <= 1; i++){
                        player.cards.push(getCard())
                    }
                    
                    showCards(player, client)
                }
            }

            pokerContext.turnPlayer.playerIndex = Math.floor(Math.random()*pokerContext.players.length) 
            pokerContext.turnPlayer.turnPlayerReady = true
            pokerContext.highestBet.playerIndex = pokerContext.turnPlayer.playerIndex
            
            return message.channel.send("Partida de Pôquer iniciada.\n\n" + showPlayersInfo() + "\n\n" + showTableInfo())
        };

        if (pokerSubcommands.joinArgs.includes(subcommand)) {
            if (pokerContext.active === false) return message.reply("Nenhuma partida de Pôquer está ativa neste momento.");

            if (pokerContext.started === true) return message.reply("A partida já iniciou, você não pode mais participar.");

            if (currentPlayer.playerObject) return message.reply("Você já está incluído na partida.");

            addPlayer(user);

            return message.channel.send(showPlayersInfo());
        };

        if (pokerSubcommands.quitArgs.includes(subcommand)) {
            if (pokerContext.active === false) return message.reply("Nenhuma partida de Pôquer está ativa neste momento.");

            if (!currentPlayer.playerObject) return message.reply("Você não está incluído na partida atual.");

            pokerContext.players.splice(currentPlayer.playerIndex, 1)

            message.reply("Você foi removido da partida.")

            return message.channel.send(showPlayersInfo())
        };

        if (subcommandsListIncludes(pokerSubcommands.showSubcommands, subcommand)) {
            if (pokerContext.active === false) return message.reply("Nenhuma partida de Pôquer está ativa neste momento.");

            if (pokerSubcommands.showSubcommands.showPlayersArgs.includes(subcommand)) return message.channel.send(showPlayersInfo())

            if (pokerContext.started === false) return message.reply("Nenhuma partida foi iniciada até este momento")

            if (pokerSubcommands.showSubcommands.showTableArgs.includes(subcommand)) return message.channel.send(showTableInfo())

            if (pokerSubcommands.showSubcommands.showCardsArgs.includes(subcommand)) return showCards(currentPlayer.playerObject, client)
        };

        if (subcommandsListIncludes(pokerSubcommands.playSubcommands, subcommand)) {
            if (!pokerContext.active) return message.reply("Nenhuma partida de poker está ativa neste momento.")
            
            if (!pokerContext.started) return message.reply("A partida ainda não foi iniciada")

            if (currentPlayer.playerIndex != pokerContext.turnPlayer.playerIndex) return message.reply("Este ainda não é o seu turno");

            if (pokerSubcommands.playSubcommands.allInArgs.includes(subcommand)) {
                betPoints(currentPlayer.playerObject, currentPlayer.playerObject.points);

                pokerContext.allInStage = true
            } else if (pokerSubcommands.playSubcommands.payArgs.includes(subcommand)) {
                const betDiference = pokerContext.highestBet.value - currentPlayer.playerObject.bet;
                
                if (currentPlayer.playerObject.points <= betDiference) {
                    betPoints(currentPlayer.playerObject, currentPlayer.playerObject.points);

                    pokerContext.allInStage = true
                } else {
                    betPoints(currentPlayer.playerObject, betDiference);
                }  
            } else if (pokerSubcommands.playSubcommands.riseArgs.includes(subcommand)) {
                var bet = args.shift();

                if (!bet) return message.reply("Você deve informar um valor para poder subir a aposta.");

                if (isNaN(bet)) return message.reply("Você deve informar um valor numérico para poder subir a aposta.");

                bet = parseFloat(bet)

                if (!Number.isInteger(bet)) return message.reply("O valor informado deve ser inteiro, não é possível apostar valores decimais.")

                const betDiference = bet - currentPlayer.playerObject.bet

                if (bet <= pokerContext.highestBet.value - currentPlayer.playerObject.bet) return message.reply("Você deve informar um valor maior que a atual aposta mais alta para poder subir a aposta.")

                if (betDiference > currentPlayer.playerObject.points) return message.reply("Você deve informar um valor máximo de pontos igual ao que você possui para poder subir a aposta.")

                if (betDiference === currentPlayer.playerObject.points) pokerContext.allInStage = true

                betPoints(currentPlayer.playerObject, betDiference);
            } else if (pokerSubcommands.playSubcommands.passArgs.includes(subcommand)) {
                if (currentPlayer.playerObject.bet < pokerContext.highestBet.value) return message.reply("Você deve ao menos tentar pagar a aposta para poder continuar na partida")
            } else {
                currentPlayer.playerObject.out = true

                let outPlayersCount = 0
                let lastPlayer

                for (player of pokerContext.players) {
                    if (player.out) {
                        outPlayersCount++
                    } else {
                        lastPlayer = player
                    }
                }

                if (outPlayersCount === pokerContext.players.length - 1) {
                    return endGame(message, lastPlayer)
                }
            }

            pokerContext.turnPlayer.turnPlayerReady = false

            if (currentPlayer.playerObject.bet > pokerContext.highestBet.value) {
                pokerContext.highestBet.value = currentPlayer.playerObject.bet;
                pokerContext.highestBet.playerIndex = currentPlayer.playerIndex;
            };

            var turnPlayer;

            do {
                pokerContext.turnPlayer.playerIndex++;

                if (pokerContext.turnPlayer.playerIndex >= pokerContext.players.length) pokerContext.turnPlayer.playerIndex = 0;

                if (pokerContext.turnPlayer.playerIndex === pokerContext.highestBet.playerIndex) {
                    if (pokerContext.allInStage) {
                        for (let i = 1; i <= 4 - pokerContext.tableCards.length; i) {
                            pokerContext.tableCards.push(getCard());
                        };

                        return endGame(message)
                    } else {
                        pokerContext.tableCards.push(getCard());

                        if (pokerContext.tableCards.length === 4 ) return endGame(message)
                    };
                };

                turnPlayer = pokerContext.players[pokerContext.turnPlayer.playerIndex];
            } while (turnPlayer.points === 0 || turnPlayer.out === true);

            pokerContext.turnPlayer.turnPlayerReady = true

            return message.channel.send(showPlayersInfo() + '\n\n' + showTableInfo())
        };

        return message.reply("Informe um subcomando válido para o jogo de Pôquer")
    }
};