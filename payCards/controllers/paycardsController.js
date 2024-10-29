module.exports = class paycardsController {
    
    static homePage (request,response) {
        return response.render('paycards/home')
    }

    static machinesCatalogPage (request,response) {
        return response.render('paycards/maquininhas')
    }

    static machinePage (request,response) {
        return response.render('paycards/maquininha')
    }
}