// ============== CÓDIGO DE CONEXÃO GEMINI (ADICIONAR NO FIM DO SEU ARQUIVO) =============

// 1. Conecta o botão ENVIAR e a tecla Enter
document.getElementById('send-button').addEventListener('click', enviarPerguntaParaAION);
document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        enviarPerguntaParaAION();
    }
});


// 2. Função principal que chama a API
async function enviarPerguntaParaAION() {
    const inputElement = document.getElementById('chat-input');
    const chatContainer = document.getElementById('chat-messages');

    const pergunta = inputElement.value.trim();
    if (!pergunta) return;

    // Exibe a pergunta do usuário
    chatContainer.innerHTML += `<div class="user-message">${pergunta}</div>`;
    inputElement.value = ''; 
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // O ENDPOINT CHAVE: Chamando a sua função Netlify
    const endpoint = '/.netlify/functions/gemini-proxy'; 
    
    try {
        // Status de processamento (para imersão)
        const thinkingMessage = document.createElement('div');
        thinkingMessage.className = 'aion-message processing';
        thinkingMessage.id = 'thinking-status';
        thinkingMessage.innerHTML = 'AION está processando a anomalia...';
        chatContainer.appendChild(thinkingMessage);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: pergunta }), 
        });

        // Remove o status de processamento
        document.getElementById('thinking-status').remove(); 

        const data = await response.json();

        if (response.ok) {
            const respostaGemini = data.text.replace(/\n/g, '<br>');
            // Exibe a resposta final do AION
            chatContainer.innerHTML += `<div class="aion-message">${respostaGemini}</div>`;
        } else {
            throw new Error(`[ERRO ${response.status}]: ${data.error || "Falha na comunicação com o Proxy."}`);
        }

    } catch (error) {
        console.error("ERRO DE CONEXÃO AION:", error);
        chatContainer.innerHTML += `<div class="system-error">ERRO CRÍTICO NO NODE. Falha de conexão.</div>`;
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
