module.exports = class authController {

    static singUpPage (request, response) {
        return response.render('auth/cadastro')
    }

    static accountTypePage (request, response) {
        return response.render('auth/cadastroTipoconta')
    }

    static marketTypePage (request, response) {
        return response.render('auth/cadastroTiponegocio')
    }
    
    static enterpriseValidatePage (request, response) {
        return response.render('auth/cadastroValidarnegocio')
    }

    static addressPage (request, response) {
        return response.render('auth/cadastroEndereco')
    }

    static incomePage (request, response) {
        return response.render('auth/cadastroRenda')
    }

    static personalDataPage (request, response) {
        return response.render('auth/cadastroDadopessoal')
    }

    static singInPage (request, response) {
        return response.render('auth/login')
    }
}