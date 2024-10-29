const router = require('express').Router()

const authController = require('../controllers/authController.js')

router.get('/cadastro', authController.singUpPage)
router.get('/cadastro/tipoconta', authController.accountTypePage)
router.get('/cadastro/tiponegocio', authController.marketTypePage)
router.get('/cadastro/validarnegocio', authController.enterpriseValidatePage)
router.get('/cadastro/endereco', authController.addressPage)
router.get('/cadastro/renda', authController.incomePage)
router.get('/cadastro/dadopessoal', authController.personalDataPage)
router.get('/login', authController.singInPage)

module.exports = router