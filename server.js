const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const router = require('./app/routes/router.js')
const db = require('./config/db');

const app = express();
app.set('port', (process.env.PORT || 5000));

//For json parsing
app.use(bodyParser.json({
    type: 'application/json'
}))
//For query parsing
app.use(bodyParser.urlencoded({
    extended: true
}));

//Connet to DB and start server
MongoClient.connect(db.url, (err, database) => {
    if (err) return console.log(err)

    router(app, database);

    app.listen(app.get('port'), () => {
        console.log('Server start on ' + app.get('port') + ' port');
    });
})
