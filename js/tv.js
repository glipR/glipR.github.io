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

// Dialog animation state
let dialogAnimationTimeout = null;
let dialogHideTimeout = null;

function initTV() {
    // Small delay to ensure all images are fully loaded and processed
    setTimeout(() => {
        // Hide all TV images initially
        allTVImages = document.querySelectorAll('img[src*="cook"], img[src*="travel"], img[src*="dino"]');
        allTVImages.forEach(img => img.style.display = 'none');

        tennaOverlay = document.getElementById('tenna-overlay');
        susieNormal = document.getElementById('susie-normal');
        susieRemote = document.getElementById('susie-remote');

        // Verify we found all the elements we need
        if (allTVImages.length === 0) {
            console.warn('TV images not found, retrying...');
            setTimeout(initTV, 100);
            return;
        }

        // Show first frame of first set
        showCurrentFrame();

        // Start animation
        startAnimation();
    }, 100);
}

function showCurrentFrame() {
    // Hide all TV images
    allTVImages.forEach(img => img.style.display = 'none');

    // Show current frame
    const currentImageName = animationSets[currentSet][currentFrame];
    const currentImage = document.querySelector(`img[src*="${currentImageName}"]`);
    if (currentImage) {
        currentImage.style.display = 'block';
    } else {
        console.warn(`Could not find image for: ${currentImageName}`);
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
    // Small delay to ensure all images are fully loaded and processed
    setTimeout(() => {
        music1 = document.getElementById('music1');
        music2 = document.getElementById('music2');

        // Verify we found all the elements we need
        if (!music1 || !music2) {
            console.warn('Music elements not found, retrying...');
            setTimeout(initMusic, 100);
            return;
        }

        cycleMusic1();
    }, 100);
}

function cycleMusic1() {
    music1.style.display = 'none';
    music2.style.display = 'block';
    setTimeout(cycleMusic2, 166 * 2);
    document.getElementById('music-flash').src = 'img/room/flashes/music2.png';
}

function cycleMusic2() {
    music1.style.display = 'block';
    music2.style.display = 'none';
    setTimeout(cycleMusic1, 166 * 2);
    document.getElementById('music-flash').src = 'img/room/flashes/music1.png';
}

// Initialize when page loads - wait for images to load
window.addEventListener('load', initTV);
window.addEventListener('load', initMusic);

// Expose functions globally
window.cycleTV = cycleAnimation;
window.setTVFrameRate = setFrameRate;

function phoneDialog(profile, text) {
    // Cancel any existing animation and hide timeouts
    if (dialogAnimationTimeout) {
        clearTimeout(dialogAnimationTimeout);
        dialogAnimationTimeout = null;
    }
    if (dialogHideTimeout) {
        clearTimeout(dialogHideTimeout);
        dialogHideTimeout = null;
    }

    document.getElementById('dr-text-profile').src = profile;
    const textBox = document.querySelector('.dr-text-box');
    const textElement = document.querySelector('.dr-text-text');

    // Store the original text
    const originalText = text;

    // Show the dialog box
    textBox.style.display = 'flex';

    // Clear the text initially
    textElement.textContent = '';

    // Animate text character by character
    let currentIndex = 0;
    const textSpeed = 25; // milliseconds per character

    function typeNextCharacter() {
        if (currentIndex < originalText.length) {
            textElement.textContent += originalText[currentIndex];
            currentIndex++;
            dialogAnimationTimeout = setTimeout(typeNextCharacter, textSpeed);
        }
    }

    // Start the typing animation
    typeNextCharacter();

    // Calculate total animation time
    const totalAnimationTime = originalText.length * textSpeed;

    // Hide dialog after 4 seconds total (or at least 2 seconds after animation completes)
    const hideDelay = Math.max(4000, totalAnimationTime + 2000);

    dialogHideTimeout = setTimeout(() => {
        textBox.style.display = 'none';
        // Reset text for next time
        textElement.textContent = originalText;
        // Clear the timeout references
        dialogHideTimeout = null;
    }, hideDelay);
}

window.phoneDialog = phoneDialog;
