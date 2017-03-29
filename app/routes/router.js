const requestHandlers = require('../logic/request_handlers.js');
module.exports = function(app, db) {

    //Create new user
    app.post('/signup', (req, res) => {
        requestHandlers.create_user(req, res, db);
    });

    //Login
    app.post('/login', (req, res) => {
        requestHandlers.login(req, res, db);
    });


    //Create new word
    app.post('/word', (req, res) => {
        requestHandlers.create_word(req, res, db);
    });

    //Get all user words
    app.get('/words', (req, res) => {
        requestHandlers.get_user_words(req, res, db);
    });

    //Get all user favorite words
    app.get('/favorite', (req, res) => {
        requestHandlers.get_user_favorite_words(req, res, db);
    });

    //Get all user subjects
    app.get('/subjects', (req, res) => {
        requestHandlers.get_user_subjects(req, res, db);
    });

    //Get 10 random not learned user words
    app.get('/test', (req, res) => {
        requestHandlers.get_user_not_learned_words(req, res, db);
    });

    //Up word score
    app.post('/up/', (req, res) => {
        requestHandlers.up_word_score(req, res, db);
    });

    //Down word score
    app.post('/down', (req, res) => {
        requestHandlers.down_word_score(req, res, db);
    });

};
