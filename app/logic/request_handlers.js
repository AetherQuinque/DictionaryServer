const ObjectID = require('mongodb').ObjectID; //For search by ID
const crypto = require('crypto'); //For secure password

//Function of sending a reply with a message and a value
function send_response(res, message, value) {
    console.log(message);
    /*
     * When code error occurs Express write error code into the Head response
     * and automatically sends it. When it's happened you can't write anything
     * into the Head. This try/catch protects from this error.
     */
    try {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });
    } catch (e) {

    } finally {

    }

    //Carcass of the responce
    var json = JSON.stringify({
        success: true,
        message: message,
        result: value
    });

    res.end(json);

}

function send_error(res, text) {
    console.log(text);
    try {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });
    } catch (e) {

    } finally {

    }


    var error = JSON.stringify({
        success: false,
        message: text
    })

    res.end(error);

}

function create_user(req, res, db) {

    //Verify email address and password
    if (!req.body.login.toString().includes("@")) {
        send_error(res, 'Login must be an email address');
    } else if (req.body.password.length === 0) {
        send_error(res, 'Password must not be empty');
    }

    var notSecurePassword = req.body.password;
    //Secure password to write to the DB
    var securePassword = crypto.createHash('md5').update(notSecurePassword).digest("hex");

    var newUser = {
        login: req.body.login,
        password: securePassword
    }

    //Search for an existing user
    db.collection('users')
        .find({
            login: {
                $regex: new RegExp("^" + newUser.login.toLowerCase(), "i")
            }
        })
        .limit(1)
        .next(function(err, result) {
            if (err) {
                send_error(res, err);
            } else {
                if (result === null) {
                    create();
                } else {
                    send_error(res, 'This email is already taken');
                }
            }
        });

    function create() {
        db.collection('users').insert(newUser, (err, result) => {
            if (err) {
                send_error(res, err);
            } else {
                send_response(res, 'New user created successfully', {
                    "user_id": result.ops[0]._id
                });
            }
        });
    }
}

function login(req, res, db) {
    var notSecurePassword = req.body.password;
    var securePassword = crypto.createHash('md5').update(notSecurePassword).digest("hex");
    db.collection('users')
        .find({
            login: req.body.login,
            password: securePassword
        })
        .limit(1)
        .next(function(err, result) {
            if (err) {
                send_error(res, err);
            } else {
                if (result === null) {
                    send_error(res, 'Incorrect login or password');
                } else {
                    send_response(res, 'Login successful', {
                        "user_id": result._id
                    });
                }
            }
        });
}

function create_word(req, res, db) {
    var newWord = {
        user: req.body.user_id,
        word: req.body.word,
        translation: req.body.translation,
        context: req.body.context,
        subject: req.body.subject,
        favorite: false,
        point: 0,
        date: new Date()
    }

    //Search for an existing word
    db.collection('words')
        .find({
            word: {
                $regex: new RegExp("^" + newWord.word.toLowerCase(), "i")
            },
            user: newWord.user
        })
        .next((err, result) => {
            if (err) {
                send_error(res, err);
            } else {
                if (result === null) {
                    create();
                } else {
                    send_error(res, 'This word already exists');
                }
            }
        });

    function create() {
        db.collection('words')
            .insert(newWord, (err, result) => {
                if (err) {
                    send_error(res, err);
                } else {
                    send_response(res, 'Word created successfully', result.ops[0]);
                }
            });
    }
}

function get_user_words(req, res, db) {

    var page = parseInt(req.query.page);
    var size = parseInt(req.query.size);


    db.collection('words')
        .find({
            user: req.query.user_id
        })
        .skip(page * size)
        .limit(size)
        .toArray((err, result) => {
            if (err) {
                send_error(res, err);
            } else {
                send_response(res, 'Getting words successfully', result);
            }

        });
}

function get_user_subjects(req, res, db) {

    db.collection('words')
        .distinct("subject", {
            user: req.query.user_id
        }, (err, result) => {
            if (err) {
                send_error(res, err);
            } else {
                send_response(res, 'Getting subjects successfully', result);
            }
        });
}

function get_user_not_learned_words(req, res, db) {
    db.collection('words').aggregate([{
            $match: {
                user: req.query.user_id,
                point: {
                    $lt: 5
                }
            }
        }, {
            $sample: {
                size: 10
            }
        }])
        .toArray((err, result) => {
            if (err) {
                send_error(res, err);
            } else {
                send_response(res, 'Getting not learned words successfully', result);
            }
        });
}


function get_user_favorite_words(req, res, db) {
    db.collection('words')
        .distinct("subject", {
            user: req.query.user_id,
            favorite: true
        }, (err, result) => {
            if (err) {
                send_error(res, err);
            } else {
                send_response(res, 'Getting favorite words successfully', result);
            }
        });

}

function up_word_score(req, res, db) {
    db.collection('words')
        .find({
            _id: new ObjectID(req.body.word_id)
        })
        .limit(1)
        .next((err, result) => {
            if (err) send_error(res, err);
            else up_score(result.point)
        });

    function up_score(score) {
        db.collection('words')
            .update({
                _id: new ObjectID(req.body.word_id)
            }, {
                $set: {
                    point: score + 1
                }
            }, (err, result) => {
                if (err) {
                    send_error(err);
                } else {
                    send_response(res, 'Updating word score successfully');
                }
            });
    }

}

function down_word_score(req, res, db) {
    db.collection('words')
        .find({
            _id: new ObjectID(req.body.word_id)
        })
        .limit(1)
        .next((err, result) => {
            if (err) send_error(res, err);
            else down_score(result.point)
        });

    function down_score(score) {
        if (score !== 0) {
            db.collection('words')
                .update({
                    _id: new ObjectID(req.body.word_id)
                }, {
                    $set: {
                        point: score - 1
                    }
                }, (err, result) => {
                    if (err) {
                        send_error(err);
                    } else {
                        send_response(res, 'Updating word score successfully');
                    }
                });
        } else {
            send_error(res, 'This word have 0 score');
        }
    }


}

exports.create_user = create_user;
exports.login = login;
exports.create_word = create_word;
exports.get_user_words = get_user_words;
exports.get_user_subjects = get_user_subjects;
exports.get_user_not_learned_words = get_user_not_learned_words;
exports.get_user_favorite_words = get_user_favorite_words;
exports.up_word_score = up_word_score;
exports.down_word_score = down_word_score;
