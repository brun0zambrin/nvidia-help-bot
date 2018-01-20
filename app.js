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

//Parte para o FBmensager

require('dotenv').config({silent: true});
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var contexto_atual = null;

//Iniciando objeto da conversa
var w_conversation = new Conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    version_date: '2017-04-21',
    username: process.env.CONVERSATION_USERNAME,
    password: process.env.CONVERSATION_PASSWORD,
    version: 'v1'
  });

  //Parte do webhook para conexão com o Mensager
  app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === process.env.FB_TOKENVERIFIC) res.send(req.query['hub.challenge']);
	res.send('Erro de validação no token.');//Erro de conexão com o token
});

app.post('/webhook/', function (req, res) {
	var text = null;
	
	messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {	
		event = req.body.entry[0].messaging[i];
        sender = event.sender.id;

        if (event.message && event.message.text) text = event.message.text;
		else if (event.postback && !text) text = event.postback.payload;
		else break;

		 var payload = {
    		workspace_id: process.env.WORKSPACE_ID,
    		context: contexto_atual || {},
    		input: { "text": text },
			alternate_intents: true
  		};

		callWatson(payload, sender); 
    }
    res.sendStatus(200);
});

function callWatson(payload, sender) {
	w_conversation.message(payload, function (err, results) {
    	if (err) return responseToRequest.send("Erro > " + JSON.stringify(err));

		if(results.context != null) contexto_atual = results.context;
		
        if(results != null && results.output != null){
			var i = 0;
			while(i < results.output.text.length){
				sendMessage(sender, results.output.text[i++]);
			}
		}
            
    });
}

function sendMessage(sender, text_) { //Função para enviar mensagem para o chat do FB
	text_ = text_.substring(0, 319);
	messageData = {	text: text_ };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.FB_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
        	console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

app.listen(process.env.PORT || 3000);