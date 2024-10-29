const router = require('express').Router()

const paycardsController = require('../controllers/paycardsController')

router.get('/produtos/maquininhas', paycardsController.machinesCatalogPage)
router.get('/produtos/maquininhas/:id', paycardsController.machinePage)

module.exports = router