//Animações de popup 

$(document).ready(function () {
    var isOpen = false;
    $('.chat-header').click(function () {
        if (isOpen) {
            isOpen = false;
            $('.chat-popup').css({
                "animation-name": "popup_close"
            });
            $('.chat-body').css({
                "animation-name": "hide_chat"
            });
            $('.chat-footer').css({
                "animation-name": "hide_chat"
            });
        }
        else {
            isOpen = true;
            $('.chat-popup').css({
                "animation-name": "popup_open"
            });
            $('.chat-body').css({
                "animation-name": "show_chat"
            });
            $('.chat-footer').css({
                "animation-name": "show_chat"
            });
        }
    });
});


var params = {},
    watson = 'Watson',
    context;

function userMessage(message) {
    
    params.text = message;
    if (context) {
        params.context = context;    
    }
    var xhr = new XMLHttpRequest();
    var uri = '/api/watson';
    xhr.open('POST', uri, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        // Verifica se teve resposta e se algum texto foi enviado.
        if (xhr.status === 200 && xhr.responseText) {
            var response = JSON.parse(xhr.responseText);
            text = response.output.text; // Primeira resposta
            context = response.context; // Guarda o contexto para o proximo nó
            console.log("Got response from Watson: ", JSON.stringify(response));
           
            for (var txt in text) {
                displayMessage(text[txt], watson);
            }

        }
        else {
            console.error('Server error for Conversation. Return status of: ', xhr.statusText);
            //Mensagem para o console;
            displayMessage("Putz, eu me perdi aqui. Você pode tentar novamente.", watson);
            //No CHAT: Erro se nao conseguir conectar com watson, provavelmente algum (user,pass,workid) estão errados
        }
    };
    xhr.onerror = function () {
        console.error('Network error trying to send message!');
        displayMessage("Ops, acho que meu cérebro está offline. Espera um minutinho para continuarmos por favor.", watson);
        //Usuário perde conexão com a internet
    };
    console.log(JSON.stringify(params));
    xhr.send(JSON.stringify(params));
}

function newEvent(event) {
    // Only check for a return/enter press - Event 13
    if (event.which === 13 || event.keyCode === 13) {
        var userInput = document.getElementById('chatInput');
        text = userInput.value; // Using text as a recurring variable through functions
        text = text.replace(/(\r\n|\n|\r)/gm, ""); // Remove erroneous characters
        // If there is any input then check if this is a claim step
        // Some claim steps are handled in newEvent and others are handled in userMessage
        if (text) {
            // Display the user's text in the chat box and null out input box
            //            userMessage(text);
            displayMessage(text, 'user');
            userInput.value = '';
            userMessage(text);
        }
        else {
            // Blank user message. Do nothing.
            console.error("No message.");
            userInput.value = '';
            return false;
        }
    }
}

function displayMessage(text, user) {
    var chat_body = document.getElementById('chat-body');
    var bubble = document.createElement('div');
    bubble.setAttribute("class", "bubble");
    if (user == "user") {
        bubble.className += " user";
    }
    else {
        bubble.className += " watson";
    }
    bubble.innerHTML = text;
    chat_body.appendChild(bubble);
    chat_body.scrollTop = chat_body.scrollHeight;
}


userMessage('');