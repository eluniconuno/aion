import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import * as TWEEN from '@tweenjs/tween.js';
import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';

// Tornar GoogleGenerativeAI global para uso fora do module
window.GoogleGenerativeAI = GoogleGenerativeAI;

let scene, camera, renderer, composer;
let particles, gridHelper, floorLines;
let mouseX = 0, mouseY = 0;
const numParticles = 18000;

// Movimento da câmera
let cameraTime = 0;
const cameraFloatSpeed = 0.0003;
const cameraFloatAmount = 8;

// Estado da forma
let currentShapeIndex = 2;
const shapes = ['sphere', 'torus', 'triangle', 'complex', 'spiral', 'torusknot', 'kleinbottle', 'mobius', 'dyson', 'nebula', 'lorenz', 'dnahelix', 'trefoil', 'pulsar'];
let targetPositions = [];

// Estado do modo turbo
let turboMode = false;
let warpParticles = null;
let supernovaParticles = null;
let turboSpeed = 0;
let bloomPass;
let savedShapePositions = [];

// Estado do modo SCAN
let scanMode = false;
let scanWaveTime = 0;
let scanMessageIndex = 0;
let scanInterval = null;
const scanMessages = [
    'AION: Iniciando varredura estrutural.',
    'AION: Partículas ressoam. Leitura profunda iniciada.',
    'AION: Estruturas fractais detectadas.',
    'AION: Anomalia identificada — analisando...',
    'AION: Varredura concluída.'
];

// Sistema de telemetria dinâmica
let telemetryData = {
    proximity: 12.4,
    velocity: 0.8,
    altitude: 2847,
    navCode: 'AX7-912',
    yaw: 285,
    pitch: -12,
    roll: 3,
    power: 89,
    shield: 100,
    fuel: 67
};

function updateTelemetry() {
    // Simular mudanças realistas nos valores
    
    // Velocidade varia sutilmente (0.7c a 0.9c)
    telemetryData.velocity += (Math.random() - 0.5) * 0.05;
    telemetryData.velocity = Math.max(0.7, Math.min(0.9, telemetryData.velocity));
    
    // Proximidade aumenta gradualmente (nave se movendo)
    telemetryData.proximity += (Math.random() - 0.3) * 0.8;
    if (telemetryData.proximity < 0) telemetryData.proximity = 15 + Math.random() * 5;
    
    // Altitude oscila
    telemetryData.altitude += (Math.random() - 0.5) * 50;
    telemetryData.altitude = Math.max(2500, Math.min(3200, telemetryData.altitude));
    
    // NAV-CODE muda ocasionalmente
    if (Math.random() < 0.02) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letter1 = letters[Math.floor(Math.random() * letters.length)];
        const letter2 = letters[Math.floor(Math.random() * letters.length)];
        const num = Math.floor(Math.random() * 900) + 100;
        telemetryData.navCode = `${letter1}${letter2}${Math.floor(Math.random() * 10)}-${num}`;
    }
    
    // Orientação (YAW/PITCH/ROLL) muda suavemente
    telemetryData.yaw += (Math.random() - 0.5) * 2;
    if (telemetryData.yaw < 0) telemetryData.yaw += 360;
    if (telemetryData.yaw >= 360) telemetryData.yaw -= 360;
    
    telemetryData.pitch += (Math.random() - 0.5) * 1.5;
    telemetryData.pitch = Math.max(-30, Math.min(30, telemetryData.pitch));
    
    telemetryData.roll += (Math.random() - 0.5) * 1;
    telemetryData.roll = Math.max(-15, Math.min(15, telemetryData.roll));
    
    // Sistema: Power drena lentamente
    if (!turboMode) {
        telemetryData.power -= 0.01;
        if (telemetryData.power < 75) telemetryData.power = 95 + Math.random() * 5; // Recharge
    } else {
        telemetryData.power -= 0.15; // Drena mais rápido no turbo
    }
    
    // Shield regenera lentamente se não estiver cheio
    if (telemetryData.shield < 100) {
        telemetryData.shield += 0.2;
    } else if (Math.random() < 0.01) {
        telemetryData.shield -= Math.random() * 5; // Impacto ocasional
    }
    telemetryData.shield = Math.max(0, Math.min(100, telemetryData.shield));
    
    // Fuel consome continuamente
    if (turboMode) {
        telemetryData.fuel -= 0.08; // Consome mais no turbo
    } else {
        telemetryData.fuel -= 0.01;
    }
    if (telemetryData.fuel < 30) telemetryData.fuel = 85 + Math.random() * 15; // Refuel
    
    // Atualizar DOM
    document.getElementById('proxValue').textContent = `${telemetryData.proximity.toFixed(1)} KM`;
    document.getElementById('velValue').textContent = `${telemetryData.velocity.toFixed(1)}c`;
    document.getElementById('altValue').textContent = `${Math.floor(telemetryData.altitude).toLocaleString()} M`;
    document.getElementById('navCode').textContent = `NAV-CODE: ${telemetryData.navCode}`;
    
    document.getElementById('yawValue').textContent = `${Math.floor(telemetryData.yaw)}°`;
    document.getElementById('pitchValue').textContent = `${telemetryData.pitch >= 0 ? '+' : ''}${Math.floor(telemetryData.pitch)}°`;
    document.getElementById('rollValue').textContent = `${telemetryData.roll >= 0 ? '+' : ''}${Math.floor(telemetryData.roll)}°`;
    
    const pwrElement = document.getElementById('pwrValue');
    const shldElement = document.getElementById('shldValue');
    const fuelElement = document.getElementById('fuelValue');
    
    pwrElement.textContent = `${Math.floor(telemetryData.power)}%`;
    shldElement.textContent = `${Math.floor(telemetryData.shield)}%`;
    fuelElement.textContent = `${Math.floor(telemetryData.fuel)}%`;
    
    // Mudar cor baseado no valor
    pwrElement.className = telemetryData.power > 80 ? 'value green' : telemetryData.power > 50 ? 'value yellow' : 'value red';
    shldElement.className = telemetryData.shield > 80 ? 'value cyan' : telemetryData.shield > 50 ? 'value yellow' : 'value red';
    fuelElement.className = telemetryData.fuel > 50 ? 'value yellow' : telemetryData.fuel > 30 ? 'value orange' : 'value red';
    
    // Atualizar barra de status (média de power/shield/fuel)
    const avgStatus = (telemetryData.power + telemetryData.shield + telemetryData.fuel) / 3;
    document.getElementById('statusBar').style.width = `${Math.floor(avgStatus)}%`;
}

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x051020, 0.0025);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 20, 200);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    createDigitalFloor();
    createParticles();
    createWarpTrails(); // Trilhas de luz para warp

    const renderScene = new RenderPass(scene, camera);
    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, 0.4, 0.85
    );
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('click', onDocumentClick);

    generateShape(shapes[currentShapeIndex]);
}

function createDigitalFloor() {
    const gridSize = 2000;
    const gridDivisions = 60;
    gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00e6e6, 0x052040);
    gridHelper.position.y = -80;
    scene.add(gridHelper);

    const lineGeo = new THREE.BufferGeometry();
    const lineCount = 100;
    const linePos = [];
    
    for(let i=0; i<lineCount; i++) {
        const x = (Math.random() - 0.5) * 1000;
        const y = (Math.random() - 0.5) * 500;
        const zStart = -1000;
        const zEnd = 500;
        
        if (Math.abs(x) > 50) {
            linePos.push(x, -80, zStart);
            linePos.push(x * 1.5, -80, zEnd);
        }
    }
    
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ 
        color: 0x00e6e6, 
        transparent: true, 
        opacity: 0.2 
    });
    floorLines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(floorLines);
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(numParticles * 3);
    const colors = new Float32Array(numParticles * 3);
    const color = new THREE.Color();

    for (let i = 0; i < numParticles; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;

        if (Math.random() > 0.3) {
            color.setHex(0x00ffff);
        } else {
            color.setHex(0xffffff);
        }
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// Criar trilhas de luz para warp (ficam invisíveis até ativar)
function createWarpTrails() {
    const warpGeometry = new THREE.BufferGeometry();
    const warpPositions = new Float32Array(1000 * 3);
    const warpColors = new Float32Array(1000 * 3);
    const color = new THREE.Color(0x00ffff);
    
    for (let i = 0; i < 1000; i++) {
        // Linhas laterais (passam dos lados da tela)
        const side = i % 2 === 0 ? 1 : -1;
        warpPositions[i * 3] = side * (200 + Math.random() * 100);
        warpPositions[i * 3 + 1] = (Math.random() - 0.5) * 300;
        warpPositions[i * 3 + 2] = Math.random() * -1000;
        
        warpColors[i * 3] = color.r;
        warpColors[i * 3 + 1] = color.g;
        warpColors[i * 3 + 2] = color.b;
    }
    
    warpGeometry.setAttribute('position', new THREE.BufferAttribute(warpPositions, 3));
    warpGeometry.setAttribute('color', new THREE.BufferAttribute(warpColors, 3));
    
    const warpMaterial = new THREE.PointsMaterial({
        size: 2.0,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    warpParticles = new THREE.Points(warpGeometry, warpMaterial);
    scene.add(warpParticles);
}

// Ativar QUANTUM DRIVE
function activateTurbo() {
    console.log('activateTurbo called, turboMode:', turboMode);
    
    if (turboMode || scanMode) return; // Não ativar se SCAN estiver ativo
    turboMode = true;
    
    try {
        // Salvar posições atuais das partículas
        savedShapePositions = Float32Array.from(particles.geometry.attributes.position.array);
        console.log('Saved positions:', savedShapePositions.length);
        
        // FASE 1: Acelerar chão (0-1s)
        new TWEEN.Tween({ speed: 0 })
            .to({ speed: 80 }, 1000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate((obj) => {
                turboSpeed = obj.speed;
            })
            .start();
        
        console.log('Phase 1: Floor acceleration started');
        
        // FASE 2: Soltar partículas (1-2s)
        setTimeout(() => {
            console.log('Phase 2: Particle explosion starting');
            const positions = particles.geometry.attributes.position.array;
            
            new TWEEN.Tween({ explode: 0, opacity: 1, warpOpacity: 0, bloom: 1.2 })
                .to({ explode: 1, opacity: 0, warpOpacity: 1, bloom: 2.5 }, 1500)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate((obj) => {
                    // Explodir partículas para fora
                    const maxParticles = Math.min(numParticles, savedShapePositions.length / 3);
                    for (let i = 0; i < maxParticles; i++) {
                        const idx = i * 3;
                        const x = savedShapePositions[idx] || 0;
                        const y = savedShapePositions[idx + 1] || 0;
                        const z = savedShapePositions[idx + 2] || 0;
                        
                        // Calcular direção do centro
                        const dist = Math.sqrt(x*x + y*y + z*z) || 1;
                        const nx = x / dist;
                        const ny = y / dist;
                        const nz = z / dist;
                        
                        // Expandir para fora
                        positions[idx] = x + nx * obj.explode * 500;
                        positions[idx + 1] = y + ny * obj.explode * 500;
                        positions[idx + 2] = z + nz * obj.explode * 500;
                    }
                    
                    particles.geometry.attributes.position.needsUpdate = true;
                    particles.material.opacity = obj.opacity;
                    warpParticles.material.opacity = obj.warpOpacity;
                    bloomPass.strength = obj.bloom;
                })
                .start();
        }, 1000);
        
        // FASE 3: Criar supernova (3.5s)
        setTimeout(() => {
            console.log('Phase 3: Creating supernova');
            createQuantumSupernova();
        }, 3500);
        
        // FASE 4: Condensar e voltar (6.5s)
        setTimeout(() => {
            console.log('Phase 4: Condensing supernova');
            condenseSupernova();
        }, 6500);
        
    } catch (error) {
        console.error('Error in activateTurbo:', error);
        turboMode = false;
    }
}

// Criar supernova com partículas
function createQuantumSupernova() {
    console.log('createQuantumSupernova called');
    
    try {
        const supernovaGeo = new THREE.BufferGeometry();
        const supernovaPos = new Float32Array(5000 * 3);
        const supernovaCol = new Float32Array(5000 * 3);
        const color = new THREE.Color();
        
        for (let i = 0; i < 5000; i++) {
            // Todas partículas começam no centro
            supernovaPos[i * 3] = 0;
            supernovaPos[i * 3 + 1] = 0;
            supernovaPos[i * 3 + 2] = 0;
            
            // Cores quentes (branco, cyan, azul)
            const choice = Math.random();
            if (choice > 0.7) {
                color.setHex(0xffffff);
            } else if (choice > 0.4) {
                color.setHex(0x00ffff);
            } else {
                color.setHex(0x0099ff);
            }
            
            supernovaCol[i * 3] = color.r;
            supernovaCol[i * 3 + 1] = color.g;
            supernovaCol[i * 3 + 2] = color.b;
        }
        
        supernovaGeo.setAttribute('position', new THREE.BufferAttribute(supernovaPos, 3));
        supernovaGeo.setAttribute('color', new THREE.BufferAttribute(supernovaCol, 3));
        
        const supernovaMat = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        supernovaParticles = new THREE.Points(supernovaGeo, supernovaMat);
        scene.add(supernovaParticles);
        console.log('Supernova particles added to scene');
        
        // Animar explosão da supernova
        const positions = supernovaParticles.geometry.attributes.position.array;
        const velocities = [];
        
        // Calcular velocidades aleatórias
        for (let i = 0; i < 5000; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            velocities.push({
                x: Math.sin(phi) * Math.cos(theta),
                y: Math.sin(phi) * Math.sin(theta),
                z: Math.cos(phi)
            });
        }
        
        // Expansão
        new TWEEN.Tween({ radius: 0, opacity: 1, bloom: 2.5 })
            .to({ radius: 150, opacity: 0.8, bloom: 4.0 }, 2000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate((obj) => {
                if (!supernovaParticles) return;
                for (let i = 0; i < 5000; i++) {
                    positions[i * 3] = velocities[i].x * obj.radius;
                    positions[i * 3 + 1] = velocities[i].y * obj.radius;
                    positions[i * 3 + 2] = velocities[i].z * obj.radius;
                }
                supernovaParticles.geometry.attributes.position.needsUpdate = true;
                supernovaParticles.material.opacity = obj.opacity;
                bloomPass.strength = obj.bloom;
            })
            .start();
        
        console.log('Supernova expansion animation started');
        
    } catch (error) {
        console.error('Error in createQuantumSupernova:', error);
    }
}

// Condensar supernova de volta à forma original
function condenseSupernova() {
    if (!supernovaParticles) {
        console.error('Supernova particles not found');
        resetToNormalMode();
        return;
    }
    
    const supernovaPos = supernovaParticles.geometry.attributes.position.array;
    
    // Contrair supernova
    new TWEEN.Tween({ scale: 1, opacity: 0.8 })
        .to({ scale: 0, opacity: 0 }, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate((obj) => {
            if (!supernovaParticles) return;
            for (let i = 0; i < 5000; i++) {
                const currentX = supernovaPos[i * 3];
                const currentY = supernovaPos[i * 3 + 1];
                const currentZ = supernovaPos[i * 3 + 2];
                
                supernovaPos[i * 3] = currentX * obj.scale;
                supernovaPos[i * 3 + 1] = currentY * obj.scale;
                supernovaPos[i * 3 + 2] = currentZ * obj.scale;
            }
            supernovaParticles.geometry.attributes.position.needsUpdate = true;
            supernovaParticles.material.opacity = obj.opacity;
        })
        .onComplete(() => {
            scene.remove(supernovaParticles);
            supernovaParticles = null;
            
            // Retornar partículas à forma original
            resetToNormalMode();
        })
        .start();
}

// Voltar ao modo normal
function resetToNormalMode() {
    if (!savedShapePositions || savedShapePositions.length === 0) {
        console.error('Saved positions not available');
        turboMode = false;
        return;
    }
    
    const positions = particles.geometry.attributes.position.array;
    
    new TWEEN.Tween({ speed: 80, bloom: 4.0, opacity: 0, warpOpacity: 1, t: 0 })
        .to({ speed: 0, bloom: 1.2, opacity: 1, warpOpacity: 0, t: 1 }, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate((obj) => {
            turboSpeed = obj.speed;
            bloomPass.strength = obj.bloom;
            particles.material.opacity = obj.opacity;
            warpParticles.material.opacity = obj.warpOpacity;
            
            // Interpolar de volta às posições salvas
            const maxParticles = Math.min(numParticles, savedShapePositions.length / 3);
            for (let i = 0; i < maxParticles; i++) {
                const idx = i * 3;
                const currentX = positions[idx];
                const currentY = positions[idx + 1];
                const currentZ = positions[idx + 2];
                
                positions[idx] = currentX + (savedShapePositions[idx] - currentX) * obj.t;
                positions[idx + 1] = currentY + (savedShapePositions[idx + 1] - currentY) * obj.t;
                positions[idx + 2] = currentZ + (savedShapePositions[idx + 2] - currentZ) * obj.t;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        })
        .onComplete(() => {
            turboMode = false;
        })
        .start();
}

// Desativar quantum drive (não usado automaticamente)
function deactivateTurbo() {
    // O ciclo completa sozinho
}

// Expor funções globalmente
window.activateTurbo = activateTurbo;
window.deactivateTurbo = deactivateTurbo;

// SCAN MODE
function enableScanMode() {
    if (turboMode || scanMode) return; // Não ativar se TURBO estiver ativo ou já estiver em SCAN
    
    console.log('SCAN MODE: Ativado');
    scanMode = true;
    scanWaveTime = 0;
    scanMessageIndex = 0;
    
    // Ativar elementos visuais
    document.getElementById('scanOverlay').classList.add('active');
    document.getElementById('scanWave').classList.add('active');
    document.getElementById('scanPanel').classList.add('active');
    document.getElementById('scanButton').classList.add('active');
    document.querySelector('.crosshair-hud').classList.add('scan-mode');
    
    // Bloquear TURBO
    const turboButton = document.getElementById('turbo-button');
    if (turboButton) {
        turboButton.classList.add('disabled');
        turboButton.style.opacity = '0.3';
        turboButton.style.pointerEvents = 'none';
    }
    
    // Alterar compass para SCAN RANGE
    const compassDegree = document.querySelector('.compass-degree');
    if (compassDegree) {
        compassDegree.dataset.originalText = compassDegree.textContent;
        compassDegree.textContent = 'SCAN RANGE';
    }
    
    // Alterar energy slider label
    const energyLabel = document.querySelector('.energy-info label');
    if (energyLabel) {
        energyLabel.dataset.originalText = energyLabel.textContent;
        energyLabel.textContent = 'SCAN POWER';
    }
    
    // Iniciar mensagens com efeito de digitação
    const messagesContainer = document.getElementById('scanMessages');
    messagesContainer.innerHTML = '';
    
    let messageDelay = 0;
    scanMessages.forEach((msg, index) => {
        messageDelay += 1500 + (index * 300);
        setTimeout(() => {
            typeMessage(msg, messagesContainer);
            // Atualizar barra de progresso
            const progress = ((index + 1) / scanMessages.length) * 100;
            document.getElementById('scanProgressBar').style.width = progress + '%';
            
            // Desativar automaticamente quando terminar
            if (index === scanMessages.length - 1) {
                setTimeout(() => {
                    disableScanMode();
                }, 2000);
            }
        }, messageDelay);
    });
    
    // Aplicar efeito nas partículas (aumentar intensidade do bloom)
    if (bloomPass) {
        bloomPass.strength = 2.5;
    }
}

function disableScanMode() {
    console.log('SCAN MODE: Desativado');
    scanMode = false;
    
    // Desativar elementos visuais
    document.getElementById('scanOverlay').classList.remove('active');
    document.getElementById('scanWave').classList.remove('active');
    document.getElementById('scanPanel').classList.remove('active');
    document.getElementById('scanButton').classList.remove('active');
    document.querySelector('.crosshair-hud').classList.remove('scan-mode');
    
    // Desbloquear TURBO
    const turboButton = document.getElementById('turbo-button');
    if (turboButton) {
        turboButton.classList.remove('disabled');
        turboButton.style.opacity = '';
        turboButton.style.pointerEvents = '';
    }
    
    // Restaurar compass
    const compassDegree = document.querySelector('.compass-degree');
    if (compassDegree && compassDegree.dataset.originalText) {
        compassDegree.textContent = compassDegree.dataset.originalText;
    }
    
    // Restaurar energy slider label
    const energyLabel = document.querySelector('.energy-info label');
    if (energyLabel && energyLabel.dataset.originalText) {
        energyLabel.textContent = energyLabel.dataset.originalText;
    }
    
    // Restaurar bloom
    if (bloomPass) {
        bloomPass.strength = 1.5;
    }
    
    // Resetar barra de progresso
    document.getElementById('scanProgressBar').style.width = '0%';
}

function typeMessage(message, container) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'scan-message';
    container.appendChild(messageDiv);
    
    let index = 0;
    const label = message.includes('AION:') ? '<span class="label">AION:</span> ' : '';
    const text = message.replace('AION: ', '');
    
    messageDiv.innerHTML = label;
    
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            messageDiv.innerHTML = label + text.substring(0, index + 1);
            index++;
        } else {
            clearInterval(typeInterval);
        }
    }, 30);
    
    // Auto-scroll
    container.scrollTop = container.scrollHeight;
}

// Expor funções SCAN globalmente
window.enableScanMode = enableScanMode;
window.disableScanMode = disableScanMode;

function generateShape(shapeType) {
    targetPositions = [];
    
    for (let i = 0; i < numParticles; i++) {
        let x, y, z;

        if (shapeType === 'sphere') {
            const r = 90;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
        } 
        else if (shapeType === 'torus') {
            const R = 80; const r = 25;
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            x = (R + r * Math.cos(v)) * Math.cos(u);
            y = (R + r * Math.cos(v)) * Math.sin(u);
            z = r * Math.sin(v);
            
            const tempX = x;
            x = z;
            z = tempX;
        }
        else if (shapeType === 'triangle') {
            const size = 160;
            
            let r1 = Math.random();
            let r2 = Math.random();
            if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
            
            const v1 = {x: 0, y: size};
            const v2 = {x: -size, y: -size/1.5};
            const v3 = {x: size, y: -size/1.5};
            
            x = v1.x * r1 + v2.x * r2 + v3.x * (1 - r1 - r2);
            y = v1.y * r1 + v2.y * r2 + v3.y * (1 - r1 - r2);
            z = (Math.random() - 0.5) * 20;

            const dist = Math.sqrt(x*x + y*y);
            if(dist < 40) {
                z += 50;
            }
        }
        else if (shapeType === 'spiral') {
            const t = (i / numParticles) * Math.PI * 12;
            const radius = 100 * (1 - (i / numParticles));
            const depth = 150 * ((i / numParticles) - 0.5);
            
            const spiralCount = 8;
            const armOffset = (i % spiralCount) * (Math.PI * 2 / spiralCount);
            
            x = radius * Math.cos(t + armOffset);
            y = radius * Math.sin(t + armOffset);
            z = depth;
            
            const twist = t * 0.3;
            const tempX = x;
            x = tempX * Math.cos(twist) - y * Math.sin(twist);
            y = tempX * Math.sin(twist) + y * Math.cos(twist);
        }
        else if (shapeType === 'torusknot') {
            // Torus Knot (3,2) - Nó toroidal complexo
            const p = 3; // Número de voltas ao redor do torus
            const q = 2; // Número de voltas através do buraco
            const t = (i / numParticles) * Math.PI * 2 * q;
            
            const r = 60 + 30 * Math.cos(p * t);
            x = r * Math.cos(q * t);
            y = r * Math.sin(q * t);
            z = 40 * Math.sin(p * t);
            
            // Adicionar espessura ao nó
            const thickness = 8;
            const angle = Math.random() * Math.PI * 2;
            const offset = Math.random() * thickness;
            
            // Normal aproximada para distribuir partículas ao redor do tubo
            const nx = -Math.sin(q * t) * Math.cos(angle);
            const ny = Math.cos(q * t) * Math.cos(angle);
            const nz = Math.sin(angle);
            
            x += nx * offset;
            y += ny * offset;
            z += nz * offset;
        }
        else if (shapeType === 'kleinbottle') {
            // Klein Bottle - Garrafa de Klein (superfície não-orientável)
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            
            const a = 60; // Raio maior
            const n = 3;  // Número de voltas
            
            const r = a * (1 + Math.cos(v));
            x = r * Math.cos(u) * (1 + Math.sin(v));
            y = r * Math.sin(u) * (1 + Math.sin(v));
            
            if (u < Math.PI) {
                z = -a * Math.sin(v);
            } else {
                z = a * Math.sin(v);
            }
            
            // Adicionar torção característica
            const twist = u * 0.5;
            const tempX = x;
            x = tempX * Math.cos(twist) - z * Math.sin(twist);
            z = tempX * Math.sin(twist) + z * Math.cos(twist);
        }
        else if (shapeType === 'mobius') {
            // Superfície de Möbius - Fita com uma torção
            const u = (i / numParticles) * Math.PI * 2;
            const v = (Math.random() - 0.5) * 30; // Largura da fita
            
            const R = 80; // Raio da fita
            
            x = (R + v * Math.cos(u / 2)) * Math.cos(u);
            y = (R + v * Math.cos(u / 2)) * Math.sin(u);
            z = v * Math.sin(u / 2);
            
            // Adicionar espessura sutil
            const thickness = Math.random() * 3;
            const normal = Math.random() * Math.PI * 2;
            x += Math.cos(normal) * thickness;
            y += Math.sin(normal) * thickness;
        }
        else if (shapeType === 'dyson') {
            // Esfera de Dyson - Estrutura de painéis solares
            const r = 95;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            // Posição base na esfera
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            
            // Criar padrão de painéis (grade geodésica)
            const gridSize = 12;
            const thetaGrid = Math.floor(theta / (Math.PI * 2) * gridSize);
            const phiGrid = Math.floor(phi / Math.PI * gridSize);
            
            // Gaps entre painéis (estrutura)
            const isGap = (thetaGrid + phiGrid) % 4 === 0;
            if (isGap) {
                // Partículas de estrutura (mais próximas ao centro)
                const structureFactor = 0.95;
                x *= structureFactor;
                y *= structureFactor;
                z *= structureFactor;
            } else {
                // Painéis solares (na superfície)
                const panelOffset = Math.random() * 3;
                const normalFactor = 1 + (panelOffset / r);
                x *= normalFactor;
                y *= normalFactor;
                z *= normalFactor;
            }
            
            // Adicionar rotação para simular seções da megaestrutura
            const rotationSpeed = 0.3;
            const angle = (thetaGrid * rotationSpeed) % (Math.PI * 2);
            const tempX = x;
            x = tempX * Math.cos(angle) - y * Math.sin(angle);
            y = tempX * Math.sin(angle) + y * Math.cos(angle);
        }
        else if (shapeType === 'nebula') {
            // Nebulosa - Nuvem espacial com densidade variável e filamentos
            const clusterCount = 5;
            const clusterIndex = Math.floor(Math.random() * clusterCount);
            
            // Centro do cluster
            const clusterAngle = (clusterIndex / clusterCount) * Math.PI * 2;
            const clusterDist = 40 + Math.random() * 30;
            const cx = Math.cos(clusterAngle) * clusterDist;
            const cy = Math.sin(clusterAngle) * clusterDist;
            const cz = (Math.random() - 0.5) * 40;
            
            // Distribuição gaussiana ao redor do centro
            const spread = 25 + Math.random() * 20;
            const r = spread * Math.sqrt(-2 * Math.log(Math.random()));
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 2;
            
            x = cx + r * Math.sin(phi) * Math.cos(theta);
            y = cy + r * Math.sin(phi) * Math.sin(theta);
            z = cz + r * Math.cos(phi) * 0.5; // Achatada
            
            // Adicionar filamentos turbulentos
            const turbulence = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 15;
            z += turbulence;
            
            // Variação de densidade (algumas partículas mais distantes)
            if (Math.random() < 0.15) {
                const escapeDir = Math.random() * Math.PI * 2;
                x += Math.cos(escapeDir) * 50;
                y += Math.sin(escapeDir) * 50;
            }
        }
        else if (shapeType === 'lorenz') {
            // Atrator de Lorenz - Sistema caótico em forma de borboleta
            const sigma = 10;
            const rho = 28;
            const beta = 8/3;
            const dt = 0.01;
            
            // Começar de pontos iniciais variados
            let lx = (Math.random() - 0.5) * 20;
            let ly = (Math.random() - 0.5) * 20;
            let lz = 20 + Math.random() * 10;
            
            // Iterar sistema de Lorenz
            const iterations = 50 + Math.floor(Math.random() * 200);
            for (let j = 0; j < iterations; j++) {
                const dx = sigma * (ly - lx) * dt;
                const dy = (lx * (rho - lz) - ly) * dt;
                const dz = (lx * ly - beta * lz) * dt;
                
                lx += dx;
                ly += dy;
                lz += dz;
            }
            
            // Escalar para caber na cena
            x = lx * 3;
            y = ly * 3;
            z = (lz - 25) * 3; // Centralizar em Z
        }
        else if (shapeType === 'dnahelix') {
            // Hélice Dupla (DNA) - Duas hélices entrelaçadas
            const t = (i / numParticles) * Math.PI * 8; // 4 voltas completas
            const radius = 40;
            const height = 150;
            
            // Escolher qual das duas hélices
            const helixOffset = (i % 2) * Math.PI;
            
            x = radius * Math.cos(t + helixOffset);
            y = (t / (Math.PI * 8)) * height - height/2;
            z = radius * Math.sin(t + helixOffset);
            
            // Adicionar "degraus" conectando as hélices
            if (i % 30 < 5) {
                const stepProgress = (i % 30) / 5;
                const x1 = radius * Math.cos(t);
                const z1 = radius * Math.sin(t);
                const x2 = radius * Math.cos(t + Math.PI);
                const z2 = radius * Math.sin(t + Math.PI);
                
                x = x1 + (x2 - x1) * stepProgress;
                z = z1 + (z2 - z1) * stepProgress;
            }
            
            // Adicionar espessura
            const thickness = 3;
            const angle = Math.random() * Math.PI * 2;
            x += Math.cos(angle) * thickness * Math.random();
            z += Math.sin(angle) * thickness * Math.random();
        }
        else if (shapeType === 'trefoil') {
            // Trefoil Knot - Nó de trevo (nó mais simples não-trivial)
            const t = (i / numParticles) * Math.PI * 2;
            
            // Parametrização do nó trefoil
            x = (2 + Math.cos(3 * t)) * Math.cos(2 * t) * 35;
            y = (2 + Math.cos(3 * t)) * Math.sin(2 * t) * 35;
            z = Math.sin(3 * t) * 35;
            
            // Adicionar espessura tubular
            const tubeRadius = 8;
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI * 2;
            
            // Normal aproximada
            const nx = -Math.sin(2 * t);
            const ny = Math.cos(2 * t);
            const nz = Math.cos(3 * t) * 0.5;
            
            const offset = Math.random() * tubeRadius;
            x += nx * offset * Math.cos(angle1);
            y += ny * offset * Math.cos(angle1);
            z += nz * offset + Math.sin(angle2) * tubeRadius * 0.5;
        }
        else if (shapeType === 'pulsar') {
            // Pulsar Beam - Feixes rotativos de estrela de nêutrons
            const beamCount = 2; // Dois feixes opostos
            const beamIndex = i % beamCount;
            const beamAngle = (beamIndex / beamCount) * Math.PI * 2;
            
            // Estrela central (núcleo denso)
            if (i < 500) {
                const r = 8 + Math.random() * 4;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((Math.random() * 2) - 1);
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi);
            } else {
                // Feixes de radiação
                const beamLength = (i / numParticles) * 180;
                const beamWidth = 15 * (1 - (i / numParticles) * 0.7); // Afunila
                
                // Direção do feixe
                x = Math.cos(beamAngle) * beamLength;
                y = Math.sin(beamAngle) * beamLength;
                z = 0;
                
                // Adicionar largura ao feixe (cone)
                const spreadAngle = Math.random() * Math.PI * 2;
                const spreadDist = Math.random() * beamWidth;
                
                const perpX = -Math.sin(beamAngle);
                const perpY = Math.cos(beamAngle);
                
                x += (perpX * Math.cos(spreadAngle) * spreadDist);
                y += (perpY * Math.cos(spreadAngle) * spreadDist);
                z += Math.sin(spreadAngle) * spreadDist;
                
                // Adicionar pulsação (ondulação ao longo do feixe)
                const wave = Math.sin((i / numParticles) * Math.PI * 8) * 10;
                z += wave;
            }
            
            // Rotação da estrutura completa (simular rotação do pulsar)
            const rotationAngle = (i / numParticles) * Math.PI * 0.2;
            const tempX = x;
            x = tempX * Math.cos(rotationAngle) - y * Math.sin(rotationAngle);
            y = tempX * Math.sin(rotationAngle) + y * Math.cos(rotationAngle);
        }
        else {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI;
            const r = 80 + 20 * Math.sin(5 * u) * Math.cos(4 * v);
            x = r * Math.sin(v) * Math.cos(u);
            y = r * Math.sin(v) * Math.sin(u);
            z = r * Math.cos(v);
        }

        targetPositions.push(x, y, z);
    }
    
    morphParticles();
}

function morphParticles() {
    const currentPositions = particles.geometry.attributes.position.array;
    const tweenObj = { t: 0 };
    const startPositions = Float32Array.from(currentPositions);

    new TWEEN.Tween(tweenObj)
        .to({ t: 1 }, 1500)
        .easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(() => {
            for (let i = 0; i < numParticles; i++) {
                const idx = i * 3;
                currentPositions[idx] = startPositions[idx] + (targetPositions[idx] - startPositions[idx]) * tweenObj.t;
                currentPositions[idx+1] = startPositions[idx+1] + (targetPositions[idx+1] - startPositions[idx+1]) * tweenObj.t;
                currentPositions[idx+2] = startPositions[idx+2] + (targetPositions[idx+2] - startPositions[idx+2]) * tweenObj.t;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        })
        .start();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.0005;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.0005;
}

// Som de clique retrofuturista (cristal/glitch)
function playClickSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Criar múltiplos osciladores para som complexo tipo "cristal"
    const createBeep = (freq, delay, duration) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        // Onda tipo "vidro" (square com filtro)
        osc.type = 'square';
        
        // Frequência com micro-variação (efeito glitch)
        const startTime = audioContext.currentTime + delay;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, startTime + duration);
        
        // Envelope rápido e preciso
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.005); // Ataque instantâneo
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    };
    
    // Camadas de som (efeito retrofuturista com "eco cristalino")
    createBeep(1760, 0, 0.08);        // Nota principal (A6 - alta e cristalina)
    createBeep(2217, 0.015, 0.06);    // Harmônico superior (glitch)
    createBeep(880, 0.025, 0.05);     // Oitava abaixo (profundidade)
    createBeep(1320, 0.04, 0.04);     // Ressonância final
}

function onDocumentClick(event) {
    if(event.target.closest('a')) return;
    
    // Tocar som de clique
    playClickSound();
    
    currentShapeIndex = (currentShapeIndex + 1) % shapes.length;
    generateShape(shapes[currentShapeIndex]);
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    
    // Atualizar telemetria a cada frame (60fps)
    updateTelemetry();

    if (turboMode) {
        // Modo turbo: mover trilhas warp em direção à câmera
        if (warpParticles) {
            const positions = warpParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 2] += turboSpeed; // Mover no eixo Z
                
                // Reset se passar da câmera
                if (positions[i + 2] > 500) {
                    positions[i + 2] = -1000;
                }
            }
            warpParticles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Rotação suave da supernova
        if (supernovaParticles) {
            supernovaParticles.rotation.y += 0.005;
            supernovaParticles.rotation.x += 0.002;
        }
        
        // Grid acelera
        if (gridHelper) {
            gridHelper.position.z += turboSpeed * 0.5;
            if (gridHelper.position.z > 100) gridHelper.position.z = 0;
        }
    } else {
        // Modo normal
        if (particles) {
            particles.rotation.y += 0.002;
            
            // Movimento suave baseado no mouse
            scene.rotation.y += (mouseX - scene.rotation.y) * 0.05;
            scene.rotation.x += (mouseY - scene.rotation.x) * 0.05;
            
            // Efeito SCAN MODE nas partículas
            if (scanMode) {
                scanWaveTime += 0.016; // ~60fps
                
                // Criar efeito de brilho nas partículas quando a onda passa
                const positions = particles.geometry.attributes.position.array;
                const colors = particles.geometry.attributes.color.array;
                
                // Calcular raio atual da onda (0 a 1000 em 1.2s)
                const waveRadius = (scanWaveTime % 1.2) * 833; // 1000px / 1.2s
                const waveThickness = 50; // Espessura da onda
                
                for (let i = 0; i < positions.length; i += 3) {
                    const x = positions[i];
                    const y = positions[i + 1];
                    const z = positions[i + 2];
                    
                    // Distância da partícula ao centro (projetada no plano XY)
                    const distFromCenter = Math.sqrt(x * x + y * y);
                    
                    // Se a partícula está dentro da onda
                    if (Math.abs(distFromCenter - waveRadius) < waveThickness) {
                        // Aumentar brilho (cor cyan)
                        const intensity = 1 - (Math.abs(distFromCenter - waveRadius) / waveThickness);
                        colors[i] = 0 + intensity * 0.5;     // R
                        colors[i + 1] = 1;                   // G (cyan)
                        colors[i + 2] = 1;                   // B (cyan)
                    } else {
                        // Cor normal
                        colors[i] = 0;
                        colors[i + 1] = 1;
                        colors[i + 2] = 1;
                    }
                }
                
                particles.geometry.attributes.color.needsUpdate = true;
            }
        }

        // Movimento de flutuação automático da câmera
        cameraTime += cameraFloatSpeed;
        
        // Movimento senoidal suave
        const floatY = Math.sin(cameraTime * 2) * cameraFloatAmount;
        const floatX = Math.cos(cameraTime * 1.5) * (cameraFloatAmount * 0.5);
        const floatZ = Math.sin(cameraTime) * (cameraFloatAmount * 0.3);
        
        // Aplicar movimento suave à câmera
        camera.position.y = 20 + floatY;
        camera.position.x = floatX;
        camera.position.z = 200 + floatZ;
        
        // Rotação suave da câmera
        camera.rotation.z = Math.sin(cameraTime * 0.5) * 0.02;

        if(gridHelper) {
            gridHelper.position.z = (Date.now() * 0.05) % 50;
        }
    }

    composer.render();
}

init();
animate();
