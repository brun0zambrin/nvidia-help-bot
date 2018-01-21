//Dependencias
var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    fs = require('fs');
var cfenv = require('cfenv');
var chatbot = require('./config/bot.js');//chamando o script do bot
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');

// all environments - preparando o server
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

app.get('/', routes.chat);

app.post('/api/watson', function (req, res) {
    processChatMessage(req, res);
});



//Enviando a mensagem para o chat bot
function processChatMessage(req, res) {
    chatbot.sendMessage(req, function (err, data) {//função mandar mensagem em bot.js
        if (err) {
            console.log("Error in sending message: ", err);//No console caso de algum erro
            res.status(err.code || 500).json(err);
        }
        else { //Enviado
            var context = data.context;
            res.status(200).json(data);
        }
    });
}


http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port ' + app.get('port'));
});

