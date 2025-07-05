// Simple TV Animation System
let currentSet = Math.floor(Math.random() * 3) % 3;
let currentFrame = 0;
let animationInterval;
let frameRate = 166; // 1/6 second in milliseconds

const animationSets = [
    ['cook1.png', 'cook2.png'],
    ['travel1.png', 'travel2.png'],
    ['dino1.png', 'dino2.png']
];

let allTVImages = [];

let tennaOverlay = null;
let susieNormal = null;
let susieRemote = null;

let normalSusieTimeout = null;

function initTV() {
    // Hide all TV images initially
    allTVImages = document.querySelectorAll('img[src*="cook"], img[src*="travel"], img[src*="dino"]');
    allTVImages.forEach(img => img.style.display = 'none');

    tennaOverlay = document.getElementById('tenna-overlay');
    susieNormal = document.getElementById('susie-normal');
    susieRemote = document.getElementById('susie-remote');

    // Show first frame of first set
    showCurrentFrame();

    // Start animation
    startAnimation();
}

function showCurrentFrame() {
    // Hide all TV images
    allTVImages.forEach(img => img.style.display = 'none');

    // Show current frame
    const currentImageName = animationSets[currentSet][currentFrame];
    const currentImage = document.querySelector(`img[src*="${currentImageName}"]`);
    if (currentImage) {
        currentImage.style.display = 'block';
    }
}

function nextFrame() {
    const setFrames = animationSets[currentSet];
    currentFrame = (currentFrame + 1) % setFrames.length;
    showCurrentFrame();
}

function startAnimation() {
    if (animationInterval) clearInterval(animationInterval);
    animationInterval = setInterval(nextFrame, frameRate);
}

function normalSusie() {
    susieNormal.style.display = 'block';
    susieRemote.style.display = 'none';
}

function cycleAnimation() {
    currentSet = (currentSet + 1) % animationSets.length;
    currentFrame = 0;

    susieNormal.style.display = 'none';
    susieRemote.style.display = 'block';
    clearTimeout(normalSusieTimeout);
    normalSusieTimeout = setTimeout(normalSusie, 200);

    if (Math.random() < 0.1) {
      tennaOverlay.style.display = 'block';
      setTimeout(() => {
          tennaOverlay.style.display = 'none';
      }, 100);
    }

    showCurrentFrame();
}

function setFrameRate(fps) {
    frameRate = 1000 / fps;
    if (animationInterval) {
        startAnimation(); // Restart with new frame rate
    }
}

// Same thing but for music
let music1 = null;
let music2 = null;

function initMusic() {
    music1 = document.getElementById('music1');
    music2 = document.getElementById('music2');
    cycleMusic1();
}

function cycleMusic1() {
    music1.style.display = 'none';
    music2.style.display = 'block';
    setTimeout(cycleMusic2, 166 * 2);
}

function cycleMusic2() {
    music1.style.display = 'block';
    music2.style.display = 'none';
    setTimeout(cycleMusic1, 166 * 2);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initTV);
document.addEventListener('DOMContentLoaded', initMusic);

// Expose functions globally
window.cycleTV = cycleAnimation;
window.setTVFrameRate = setFrameRate;
