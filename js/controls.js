// Controls: Intro, Manifesto, Audio
window.addEventListener('DOMContentLoaded', function() {
    // Remover tela de intro
    setTimeout(() => {
        document.getElementById('introScreen').classList.add('hidden');
        document.body.classList.remove('intro-active');
    }, 5500);

    setTimeout(() => {
        document.getElementById('introScreen').remove();
    }, 6500);
});

// Controle do Manifesto
const manifestoHud = document.getElementById('manifestoHud');
const manifestoOverlay = document.getElementById('manifestoOverlay');
const manifestoClose = document.getElementById('manifestoClose');

manifestoHud.addEventListener('click', function(e) {
    if (!this.classList.contains('expanded')) {
        this.classList.add('expanded');
        manifestoOverlay.classList.add('active');
    }
});

manifestoClose.addEventListener('click', function(e) {
    e.stopPropagation();
    manifestoHud.classList.remove('expanded');
    manifestoOverlay.classList.remove('active');
});

manifestoOverlay.addEventListener('click', function() {
    manifestoHud.classList.remove('expanded');
    this.classList.remove('active');
});

// Controle de Áudio
const audio1 = document.getElementById('bgMusic');
const audio2 = document.getElementById('bgMusic2');
const volumeSlider = document.getElementById('volumeSlider');
const volumePercent = document.getElementById('volumePercent');
const volumeBar = document.getElementById('volumeBar');
const hudCircle = document.getElementById('volumeDisplay');

let isPlaying = false;
let currentAudio = audio1;
let nextAudio = audio2;

audio1.volume = 0.5;
audio2.volume = 0.5;

audio1.removeAttribute('loop');
audio2.removeAttribute('loop');

audio1.addEventListener('ended', () => {
    if (isPlaying) {
        currentAudio = audio2;
        nextAudio = audio1;
        audio2.play();
    }
});

audio2.addEventListener('ended', () => {
    if (isPlaying) {
        currentAudio = audio1;
        nextAudio = audio2;
        audio1.play();
    }
});

function updateVolume(value) {
    const percent = Math.round(value);
    volumePercent.textContent = percent + '%';
    audio1.volume = value / 100;
    audio2.volume = value / 100;
    volumeBar.style.setProperty('--fill-height', percent + '%');
}

volumeSlider.addEventListener('input', (e) => {
    updateVolume(e.target.value);
});

hudCircle.addEventListener('click', () => {
    if (isPlaying) {
        currentAudio.pause();
        isPlaying = false;
        hudCircle.style.opacity = '0.5';
    } else {
        currentAudio.play();
        isPlaying = true;
        hudCircle.style.opacity = '1';
    }
});

document.addEventListener('click', () => {
    if (!isPlaying) {
        currentAudio.play().then(() => {
            isPlaying = true;
            hudCircle.style.opacity = '1';
        }).catch(() => {});
    }
}, { once: true });

const style = document.createElement('style');
style.textContent = `
    .hud-bar-vertical::before {
        height: var(--fill-height, 50%) !important;
    }
`;
document.head.appendChild(style);

updateVolume(50);

// Controle do botão Turbo
const turboButton = document.getElementById('turboButton');
let turboActive = false;

turboButton.addEventListener('click', () => {
    turboActive = !turboActive;
    
    if (turboActive) {
        turboButton.classList.add('active');
        if (window.activateTurbo) window.activateTurbo();
    } else {
        turboButton.classList.remove('active');
        if (window.deactivateTurbo) window.deactivateTurbo();
    }
});

// Controle do botão SCAN
const scanButton = document.getElementById('scanButton');
let scanActive = false;

scanButton.addEventListener('click', () => {
    if (scanActive) {
        // Forçar desativação manual (normalmente auto-desativa)
        if (window.disableScanMode) window.disableScanMode();
        scanActive = false;
    } else {
        // Ativar SCAN MODE
        if (window.enableScanMode) {
            window.enableScanMode();
            scanActive = true;
            
            // Auto-desativar após completar (sincronizar com as mensagens)
            setTimeout(() => {
                scanActive = false;
            }, 10000); // 10 segundos (tempo total das mensagens)
        }
    }
});
