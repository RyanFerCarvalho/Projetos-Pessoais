// Importando arquivos e dependências e aplicando conexões

// Importando as dependências
const express = require('express')
const expHandlebars = require('express-handlebars')
const session = require('express-session') // Criar sessão do usuário
const Filestore = require('session-file-store')(session)
const flash = require('express-flash')

// // Conexão com o banco de dados
// const connection = require('./dataBase/connection')

// Importando os Controllers
const paycardsController = require('./controllers/paycardsController')

// Importando as rotas
const paycardsRoutes = require('./routes/paycardsRoutes.js')
const authRoutes = require('./routes/authRoutes.js')

// Definindo as variáveis
const hbsPartials = expHandlebars.create({ partialsDir: ['views/partials'] })
const app = express()

const port = 4004

// Aplicando a engine
app.engine('handlebars', hbsPartials.engine)
app.set('view engine', 'handlebars')

// Importando JSON
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// // Import middleware para controle de sessões
// app.use(session({
//   name: 'session',
//   secret: 'secreto (temporario)',
//   resave: false,
//   saveUninitialized: false,
//   store: new Filestore({
//     logFn: function () { },
//     path: require('path').join(require('os').tmpdir(), 'sessions')
//   }),
//   cookie: {
//     secure: false,
//     maxAge: 360000,
//     expires: new Date(Date.now() + 360000),
//     httpOnly: true
//   }
// }))

// // Importar as flash messages
// app.use(flash())

// Importando static files
app.use(express.static('public'))

// // Middleware para armazenar sessões na resposta
// app.use((request, response, next)=>{
//   if(request.session.userId){
//     response.locals.session = request.session
//   }
//   next()
// })

app.use('/usuario', authRoutes)
app.use('/', paycardsRoutes)
app.get('/', paycardsController.homePage)

app.listen(port)