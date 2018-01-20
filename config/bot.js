/**
 *
 * @requires  app.js
 *
 */
var watson = require('watson-developer-cloud');
var CONVERSATION_NAME = "Conversation-tracker";
var fs = require('fs');
var appEnv = null;
var conversationWorkspace, conversation;

// =====================================
// CRIANDO CONEXÃO COM WATSON ==========
// =====================================
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



// ===============================================
// LOGS COM INPUTS DO USUÁRIO =====================
// ===============================================
function chatLogs(owner, conversation, response, callback) {
    console.log("Response object is: ", response);
    var logFile = {
        inputText: ''
        , responseText: ''
        , entities: {}
        , intents: {}
    , };
    logFile.inputText = response.input.text;
    logFile.responseText = response.output.text;
    logFile.entities = response.entities;
    logFile.intents = response.intents;
    logFile.date = new Date();
    var date = new Date();
    var doc = {};
    Logs.find({
        selector: {
            'conversation': conversation
        }
    }, function (err, result) {
        if (err) {
            console.log("Couldn't find logs.");
            callback(null);
        }
        else {
            doc = result.docs[0];
            if (result.docs.length === 0) {
                console.log("No log. Creating new one.");
                doc = {
                    owner: owner
                    , date: date
                    , conversation: conversation
                    , lastContext: response.context
                    , logs: []
                };
                doc.logs.push(logFile);
                Logs.insert(doc, function (err, body) {
                    if (err) {
                        console.log("There was an error creating the log: ", err);
                    }
                    else {
                        console.log("Log successfull created: ", body);
                    }
                    callback(null);
                });
            }
            else {
                doc.lastContext = response.context;
                doc.logs.push(logFile);
                Logs.insert(doc, function (err, body) {
                    if (err) {
                        console.log("There was an error updating the log: ", err);
                    }
                    else {
                        console.log("Log successfull updated: ", body);
                    }
                    callback(null);
                });
            }
        }
    });
}
// ===============================================
// FUNÇÕES DO BOT E LOG ==========================
// ===============================================
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
    // Parâmetros do payload, F12>network> pra ver o payload 
    params.input = {
        text: message
    };
    return callback(null, params);
}
module.exports = chatbot;
