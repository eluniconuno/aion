// AION - Sistema de Efeitos Visuais Avançados
// Extensão modular sem quebrar funcionalidades existentes

// 1. NOISE LAYER - Ativar distorção durante Turbo/Scan
function updateNoiseLayer() {
    const noiseLayer = document.getElementById('holographicNoise');
    
    // Monitorar estado do turbo e scan
    const isTurboActive = document.getElementById('turboButton')?.classList.contains('active');
    const isScanActive = document.getElementById('scanButton')?.classList.contains('active');
    
    if (isTurboActive || isScanActive) {
        noiseLayer.classList.add('distort');
    } else {
        noiseLayer.classList.remove('distort');
    }
}

// 2. LENS FLARES - Posicionar no centro (crosshair)
function updateLensFlares() {
    // Os lens flares já estão centralizados via CSS
    // Este é um placeholder para futuras customizações baseadas em movimento
}

// 3. HORIZON LINE - Reagir ao PITCH
function updateHorizonLine() {
    const horizonLine = document.getElementById('horizonLine');
    const pitchElement = document.getElementById('pitchValue');
    
    if (pitchElement && horizonLine) {
        const pitchText = pitchElement.textContent;
        const pitchValue = parseFloat(pitchText);
        
        if (!isNaN(pitchValue)) {
            // Mover linha baseado no pitch (-30° a +30° -> -8px a +8px)
            const offset = (pitchValue / 30) * 8;
            horizonLine.style.transform = `translateY(${offset}px)`;
        }
    }
}

// 4. MESSAGE FEED - Rotacionar mensagens automaticamente
const messages = [
    'SYNCING STAR MAP...',
    'ROUTE VECTOR CONFIRMED',
    'GRAV FIELD NOMINAL',
    'MICRO-PARTICLES DETECTED',
    'SIGNAL CLEAN',
    'QUANTUM LOCK STABLE',
    'DIMENSIONAL ANCHOR OK',
    'SCANNING ANOMALIES',
    'ENERGY LEVELS OPTIMAL',
    'TELEMETRY SYNCHRONIZED'
];

let currentMessageIndex = 0;

function rotateMessages() {
    const messageContent = document.getElementById('messageContent');
    
    if (messageContent) {
        // Fade out
        messageContent.style.opacity = '0';
        
        setTimeout(() => {
            // Trocar mensagem
            currentMessageIndex = (currentMessageIndex + 1) % messages.length;
            messageContent.textContent = messages[currentMessageIndex];
            
            // Fade in
            messageContent.style.opacity = '1';
        }, 500);
    }
}

// 5. INICIALIZAÇÃO
function initVisualEffects() {
    console.log('AION Visual Effects: Inicializando...');
    
    // Atualizar noise layer a cada frame
    setInterval(updateNoiseLayer, 100);
    
    // Atualizar horizon line com base no pitch
    setInterval(updateHorizonLine, 100);
    
    // Rotacionar mensagens a cada 4 segundos
    setInterval(rotateMessages, 4000);
    
    console.log('AION Visual Effects: Online');
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualEffects);
} else {
    initVisualEffects();
}
