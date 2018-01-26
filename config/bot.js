var watson = require('watson-developer-cloud');
var CONVERSATION_NAME = "Conversation-nvidia";
var fs = require('fs');
var conversationWorkspace, conversation;

//Conexão com watson
    conversation = watson.conversation({
        url: "https://gateway.watsonplatform.net/conversation/api"
        , username: "533602e9-9b29-4815-a89e-dd1efe5d5d60" 
        , password: "TG3MNwrEWAzr" 
        , version_date: '2017-04-10'
        , version: 'v1'
    });
    conversationWorkspace = "4acf021f-c9a2-43c3-90ef-e7ecff86c24e";

//Inicialização do bot

var chatbot = {
    sendMessage: function (req, callback) {
        buildContextObject(req, function (err, params) {
                if (err) {
                    console.log("Erro ao criar parametros do objeto: ", err);
                    return callback(err);
                }
                if (params.message) {
                    var conv = req.body.context.conversation_id;
                    var context = req.body.context; //Contexto
                    var res = { //Retorno do bot
                        intents: []
                        , entities: []
                        , input: req.body.text
                        , output: {
                            text: params.message
                        }
                        , context: context
                    };
                    callback(null, res);
                }
                else if (params) {

                    // Tratamento de erro + manda mensagens da conversa pelo contexto

                    conversation.message(params, function (err, data) {
                            if (err) {
                                console.log("Erro ao mandar a mensagem: ", err);
                                return callback(err);
                            }else{
                                
                            var conv = data.context.conversation_id;
                            console.log("Resposta do bot: ", JSON.stringify(data));
                                return callback(null, data);
                        }
                    });
            }
        });
}
};

//Construtor do contexto
//Começa vazio
function buildContextObject(req, callback) {
    var message = req.body.text;
    var context;
    if (!message) {
        message = '';
    }
    var params = {
        workspace_id: conversationWorkspace
        , input: {}
        , context: {}
    };

    
    if (req.body.context) {
        context = req.body.context;
        params.context = context;
    }
    else {
        context = '';
    }
    params.input = {
        text: message
    };
    return callback(null, params);
}
module.exports = chatbot;
