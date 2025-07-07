// Media Collection Modal Functionality

// Flash and Modal System:
// - Elements with data-category="category-name" will trigger flash effects on hover
// - Elements with both data-category and data-modal will also open modals on click
// - Flash images should have data-flash="category-name" to link to the category
//
// Example HTML:
// <div data-category="games" data-modal>Click to open games modal with flash effect</div>
// <div data-category="music">Hover for flash effect only</div>
// <div data-flash="games">This flashes when games category is hovered</div>

// Media data with personal blurbs
const mediaData = {
    "A Silent Voice": {
        type: "Movie",
        blurb: "",
        cover: "img/media/a_silent_voice.jpg",
        spotify: "https://open.spotify.com/embed/track/17OjICytA1x5SSqxlvQCqc?utm_source=generator"
    },
    "Whiplash": {
        type: "Movie",
        blurb: "",
        cover: "img/media/whiplash.jpg",
        spotify: "https://open.spotify.com/embed/track/2Xtsv7BUMrNodQWH2JPOc0?utm_source=generator"
    },
    "The Wind Rises": {
        type: "Movie",
        blurb: "",
        cover: "img/media/the_wind_rises.jpg",
        spotify: "https://open.spotify.com/embed/track/7DxcFra5ZjW4ld4l2qLAVn?utm_source=generator"
    },
    "The Matrix": {
        type: "Movie",
        blurb: "",
        cover: "img/media/the_matrix.jpg",
        spotify: "https://open.spotify.com/embed/track/1PuEx5VByUrl2T7ZKwdlJF?utm_source=generator"
    },
    "One Piece": {
        type: "TV Series",
        blurb: "",
        cover: "img/media/one_piece.jpg",
        spotify: "https://open.spotify.com/embed/track/5b8YwoYRwTx0vpPGy3lWLy?utm_source=generator"
    },
    "Blade Runner": {
        type: "Movie",
        blurb: "Either the original or 2049, both are great.",
        cover: "img/media/blade_runner.jpg",
        spotify: "https://open.spotify.com/embed/track/6bHjk4FudnJpUEz1PGs1YS?utm_source=generator"
    },
    "Ergo Proxy": {
        type: "TV Series",
        blurb: "",
        cover: "img/media/ergo_proxy.webp",
        spotify: "https://open.spotify.com/embed/track/4Ljv20Qfsp3Ul6BBml37Xb?utm_source=generator"
    },
    "Better Call Saul": {
        type: "TV Series",
        blurb: "",
        cover: "img/media/better_call_saul.jpg",
        spotify: "https://open.spotify.com/embed/track/41fWOLOAoyRdiN2kjvmCef?utm_source=generator"
    },
    "Taskmaster": {
        type: "TV Series",
        blurb: "",
        cover: "img/media/taskmaster.jpg",
    },
    "Catch Me If You Can": {
        type: "Movie",
        blurb: "",
        cover: "img/media/catch_me.jpg"
    },
    "Brave New World": {
        type: "Book",
        blurb: "",
        cover: "img/media/brave_new_world.jpg"
    },
    "Things to Make and Do in the 4th Dimension": {
        type: "Book",
        blurb: "",
        cover: "img/media/things_to_make_and_do.jpg"
    },
    "Our Mathematical Universe": {
        type: "Book",
        blurb: "",
        cover: "img/media/our_mathematical_universe.jpg"
    },
    "Careless Love": {
        type: "Music",
        blurb: "",
        cover: "img/media/careless_love.jpg",
        spotify: "https://open.spotify.com/embed/track/2JgQULmVwV0J3Gds7YfBCu?utm_source=generator"
    },
    "Is This It": {
        type: "Music",
        blurb: "",
        cover: "img/media/is_this_it.webp",
        spotify: "https://open.spotify.com/embed/track/56NkIxSZZiMpFP5ZNSxtnT?utm_source=generator"
    },
    "Sara Gazarek": {
        type: "Music",
        blurb: "",
        cover: "img/media/thirsty_ghost.jpg",
        spotify: "https://open.spotify.com/embed/track/2lIFQ2swhPnyhQRpk4Z1Dd?utm_source=generator"
    },
    "Birdie": {
        type: "Music",
        blurb: "",
        cover: "img/media/acolyte.jpeg",
        spotify: "https://open.spotify.com/embed/track/12sUmjgHS0mI5LrsqrhdnN?utm_source=generator"
    },
    "David Bowie": {
        type: "Music",
        blurb: "",
        cover: "img/media/heroes.png",
        spotify: "https://open.spotify.com/embed/track/7Jh1bpe76CNTCgdgAdBw4Z?utm_source=generator"
    },
    "Arcade Fire": {
        type: "Music",
        blurb: "",
        cover: "img/media/funeral.jpg",
        spotify: "https://open.spotify.com/embed/track/6Hmj7SrLRbreLVfVS7mV1S?utm_source=generator"
    },
    "Broken Bells": {
        type: "Music",
        blurb: "",
        cover: "img/media/into_the_blue.jpeg",
        spotify: "https://open.spotify.com/embed/track/2apLrBlEQvFa8ob0dQcu6i?utm_source=generator"
    },
    "Madison McFerrin": {
        type: "Music",
        blurb: "",
        cover: "img/media/TRY.jpeg",
        spotify: "https://open.spotify.com/embed/track/1htTRt6dZPPeqduos5PAmC?utm_source=generator"
    },
    "Kaki King": {
        type: "Music",
        blurb: "",
        cover: "img/media/soft_shoulder.jpg",
        spotify: "https://open.spotify.com/embed/track/1HBFG53NNg7jqm1ehWpAVS?utm_source=generator"
    },
    "Berlinist": {
        type: "Music",
        blurb: "",
        cover: "img/media/hold_me_tight.jpg",
        spotify: "https://open.spotify.com/embed/track/3JQ1n3bt7Hl6ilW46i8QOf?utm_source=generator"
    },
    "Lena Raine": {
        type: "Music",
        blurb: "",
        cover: "img/media/farewell.jpg",
        spotify: "https://open.spotify.com/embed/track/2DSbk7BEJV2FFne8tiGfOn?utm_source=generator"
    },
    "Aaron Cherof": {
        type: "Music",
        blurb: "",
        cover: "img/media/cobalt_core.jpeg",
        spotify: "https://open.spotify.com/embed/track/5bcfmoF83LKqaUYTjghTbo?utm_source=generator"
    },
    "A Pathway in Monet's Garden": {
        type: "Art",
        blurb: "",
        cover: "https://via.placeholder.com/200x300/FDCB6E/FFFFFF?text=Monet's+Garden",
        spotify: ""
    },
    "Professor Layton Series": {
        type: "Game",
        blurb: "Inventive and Varied puzzles, also really like the art style.",
        cover: "img/layton.jpg",
        spotify: "https://open.spotify.com/embed/track/0sIluAjYu77ZwYGYeawFvi?utm_source=generator"
    },
    "Portal 2": {
        type: "Game",
        blurb: "Hilarious, Clever, and Super fun in co-op!",
        cover: "img/portal2.jpg",
        spotify: "https://open.spotify.com/embed/track/1hJguUT14lfeNW7cgP7Rp9?utm_source=generator"
    },
    "Undertale": {
        type: "Game",
        blurb: "Undertale tells stories in a way I haven't experienced before or since playing it in 2020. I don't want to say anything else about it, just play it.",
        cover: "img/undertale.jpg",
        spotify: "https://open.spotify.com/embed/track/2AtC6i0b8TjpjhWBZYLprX?utm_source=generator"
    },
    "Celeste": {
        type: "Game",
        blurb: "Celeste came along at a rough time in my life and tackled many of the same problems I was facing - anxiety, identity, and purpose. No other game has made me smile and cry like Celeste. It is also just an excellent <i>videogame</i>, deep gameplay with a vibrant modding community.",
        cover: "img/celeste.jpg",
        spotify: "https://open.spotify.com/embed/track/27vJ34Stsi20C79zSw39E7?utm_source=generator"
    },
    "Chicory: A Colorful Tale": {
        type: "Game",
        blurb: "Chicory is just a great game to relax and play, with a wonderful story to boot.",
        cover: "img/chicory.jpg",
        spotify: "https://open.spotify.com/embed/track/0q9DsbDGUWj9lpnpyb3lrR?utm_source=generator"
    },
    "Everhood": {
        type: "Game",
        blurb: "",
        cover: "img/media/everhood.jpeg",
        spotify: "https://open.spotify.com/embed/track/65vaHbThKuxEXwpjBHtiTV?utm_source=generator"
    },
    "Fire Emblem Three Houses": {
        type: "Game",
        blurb: "",
        cover: "img/media/fe3h.jpeg",
        spotify: "https://open.spotify.com/embed/track/4Hx8KBfGcVh5oRMhzm1QqT?utm_source=generator"
    },
    "Furi": {
        type: "Game",
        blurb: "",
        cover: "img/media/furi.jpeg",
        spotify: "https://open.spotify.com/embed/track/1566sa7tQN3XaET8oWpHB7?utm_source=generator"
    },
    "Half Life Series": {
        type: "Game",
        blurb: "",
        cover: "img/media/half-life.jpg",
        spotify: "https://open.spotify.com/embed/track/3mRrltPsgbYEnjNGZ11Wrl?utm_source=generator"
    },
    "Hollow Knight": {
        type: "Game",
        blurb: "",
        cover: "img/media/hollow_knight_game.jpg",
        spotify: "https://open.spotify.com/embed/track/0nD62ke95NJvAI8chsRjRg?utm_source=generator"
    },
    "Metroid Prime": {
        type: "Game",
        blurb: "",
        cover: "",
        yt_music: "https://www.youtube.com/watch?v=ZbbUv1hz6mE&list=RDZbbUv1hz6mE&start_radio=1"
    },
    "Ori and the Will of the Wisps": {
        type: "Game",
        blurb: "",
        cover: "img/media/ori.jpg",
        spotify: "https://open.spotify.com/embed/track/6yvy7IGCod8A2aeyKvMysF?utm_source=generator"
    },
    "SpeedRunners": {
        type: "Game",
        blurb: "",
        cover: "img/media/speedrunners.jpeg",
        spotify: "https://open.spotify.com/embed/track/3RwZE4rOQWV3NRztD6bawF?utm_source=generator"
    },
    "Super Mario Galaxy": {
        type: "Game",
        blurb: "",
        cover: "img/media/galaxy.jpg",
        yt_music: "https://www.youtube.com/watch?v=wBhzmys2-eU"
    },
    "Super Metroid": {
        type: "Game",
        blurb: "",
        cover: "img/media/super_metroid.jpg",
        yt_music: "https://www.youtube.com/watch?v=zk7TGDmdt2U"
    },
    "Left 4 Dead 2": {
        type: "Game",
        blurb: "",
        cover: "img/media/l4d2.jpg",
        yt_music: "https://www.youtube.com/watch?v=0H_sbf3cyFo"
    },
    "Counter Strike: Global Offensive": {
        type: "Game",
        blurb: "",
        cover: "",
        yt_music: "https://www.youtube.com/watch?v=-cLW5Ffykq4"
    }
};

// Modal functionality
function openMediaModal(title) {
    const modal = document.getElementById('media-modal');
    const modalTitle = document.getElementById('media-modal-title');
    const modalType = document.getElementById('media-modal-type');
    const modalBlurb = document.getElementById('media-modal-blurb');
    const modalCover = document.getElementById('media-cover-image');
    const modalSpotify = document.getElementById('media-modal-spotify');
    const spotifyEmbed = document.getElementById('media-spotify-embed');

    const mediaInfo = mediaData[title];

    if (mediaInfo) {
        modalTitle.textContent = title;
        modalType.textContent = mediaInfo.type;
        modalBlurb.textContent = mediaInfo.blurb;
        modalCover.src = mediaInfo.cover;
        modalCover.alt = `${title} Cover`;

        // Show/hide Spotify embed based on availability
        if (mediaInfo.spotify) {
            modalSpotify.style.display = 'block';
            spotifyEmbed.src = mediaInfo.spotify;
        } else {
            modalSpotify.style.display = 'none';
            spotifyEmbed.src = '';
        }

        modal.style.display = 'block';

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
}

function closeMediaModal() {
    const modal = document.getElementById('media-modal');
    const spotifyEmbed = document.getElementById('media-spotify-embed');

    modal.style.display = 'none';

    // Clear Spotify embed to stop audio
    spotifyEmbed.src = '';

    // Remove any active flash effects when closing modals
    removeAllFlashActive();

    // Only restore body scroll if no category modals are open
    const categoryModals = document.querySelectorAll('#tv-modal, #books-modal, #music-modal, #games-modal');
    const anyCategoryModalOpen = Array.from(categoryModals).some(modal => modal.style.display === 'block');

    if (!anyCategoryModalOpen) {
        document.body.style.overflow = 'auto';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add click listeners to all media items
    const mediaItems = document.querySelectorAll('.media-item');
    mediaItems.forEach(item => {
        const clickHandler = function(event) {
            event.preventDefault(); // Prevent default touch behavior
            const title = this.getAttribute('data-title');
            openMediaModal(title);
        };

        item.addEventListener('click', clickHandler);
        item.addEventListener('touchstart', clickHandler);
    });

    // Close modal when clicking the X
    const closeBtn = document.querySelector('.media-modal-close');
    if (closeBtn) {
        const closeHandler = function(event) {
            event.preventDefault();
            closeMediaModal();
        };

        closeBtn.addEventListener('click', closeHandler);
        closeBtn.addEventListener('touchstart', closeHandler);
    }

    // Close modal when clicking outside of it
    const modal = document.getElementById('media-modal');
    if (modal) {
        const modalClickHandler = function(event) {
            if (event.target === modal) {
                event.preventDefault();
                closeMediaModal();
            }
        };

        modal.addEventListener('click', modalClickHandler);
        modal.addEventListener('touchstart', modalClickHandler);
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeMediaModal();
            closeCategoryModal();
        }
    });

    // Apply random positioning to all media covers
    randomizeMediaPositions();

    // Universal flash effect functionality for all elements with data-category
    const elementsWithCategory = document.querySelectorAll('[data-category]');
    elementsWithCategory.forEach(element => {
        // Add hover effects for flash images
        element.addEventListener('mouseenter', function() {
            const category = this.getAttribute('data-category');
            const flashImage = getFlashImageForCategory(category);
            if (flashImage) {
                flashImage.classList.add('active');
            }
        });

        element.addEventListener('mouseleave', function() {
            const category = this.getAttribute('data-category');
            const flashImage = getFlashImageForCategory(category);
            if (flashImage) {
                flashImage.classList.remove('active');
            }
        });

        const clickHandler = function(event) {
            event.preventDefault(); // Prevent default touch behavior
            const hasModal = this.hasAttribute('data-modal');
            if (hasModal) {
                const category = this.getAttribute('data-category');
                openCategoryModal(category);
            }
            // Remove active class from any flash images when clicking
            removeAllFlashActive();
        };

        element.addEventListener('click', clickHandler);
        element.addEventListener('touchstart', clickHandler);
    });

    // Add click listeners to category modal close buttons
    const categoryModalCloseButtons = document.querySelectorAll('.category-modal-close');
    categoryModalCloseButtons.forEach(button => {
        const closeHandler = function(event) {
            event.preventDefault();
            closeCategoryModal();
        };

        button.addEventListener('click', closeHandler);
        button.addEventListener('touchstart', closeHandler);
    });

    // Add click listeners to category modal items
    const categoryModalItems = document.querySelectorAll('.category-media-item');
    categoryModalItems.forEach(item => {
        const clickHandler = function(event) {
            event.preventDefault(); // Prevent default touch behavior
            const title = this.getAttribute('data-title');
            openMediaModal(title); // Open the media modal without closing category modal
        };

        item.addEventListener('click', clickHandler);
        item.addEventListener('touchstart', clickHandler);
    });

    // Close category modals when clicking outside
    const outsideClickHandler = function(event) {
        if (event.target.classList.contains('center-modal')) {
            if (event.target.id.includes('-modal')) {
                event.preventDefault();
                closeCategoryModal();
            }
        }
    };

    document.addEventListener('click', outsideClickHandler);
    document.addEventListener('touchstart', outsideClickHandler);
});

// Category modal functions
function openCategoryModal(category) {
    const modalId = category + '-modal';
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeCategoryModal() {
    const categoryModals = document.querySelectorAll('#tv-modal, #books-modal, #music-modal, #games-modal');

    categoryModals.forEach(modal => {
        modal.style.display = 'none';
    });

    // Remove any active flash effects when closing modals
    removeAllFlashActive();

    document.body.style.overflow = 'auto';
}

// Helper function to find flash image for a given category
function getFlashImageForCategory(category) {
    return document.querySelector(`[data-flash="${category}"]`);
}

// Helper function to remove active class from all flash images
function removeAllFlashActive() {
    const flashImages = document.querySelectorAll('.flash-image');
    flashImages.forEach(img => {
        img.classList.remove('active');
    });
}

// Generic function to make onclick elements touch-friendly
function makeTouchFriendly(element) {
    if (!element || !element.onclick) return;

    const originalOnClick = element.onclick;

    const touchHandler = function(event) {
        event.preventDefault();
        originalOnClick.call(this, event);
    };

    element.addEventListener('touchstart', touchHandler);
}
window.makeTouchFriendly = makeTouchFriendly;

// Function to apply random positioning to all media covers
function randomizeMediaPositions() {
    const mediaCovers = document.querySelectorAll('.album-cover, .book-spine, .game-box, .dvd-case');

    mediaCovers.forEach(media => {
        // Random translation: -3 to 3 pixels in both X and Y
        const translateX = (Math.random() - 0.5) * 6; // -3 to 3 pixels
        const translateY = (Math.random() - 0.5) * 6; // -3 to 3 pixels

        // Random rotation: -5 to 5 degrees
        const rotation = (Math.random() - 0.5) * 10; // -5 to 5 degrees

        // Store the random transform for hover effects
        media.dataset.baseTransform = `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`;

        // Apply the initial transform
        media.style.transform = media.dataset.baseTransform;

        // Add hover event listeners
        media.addEventListener('mouseenter', function() {
            this.style.transform = `${this.dataset.baseTransform} translateY(-8px) scale(1.05)`;
        });

        media.addEventListener('mouseleave', function() {
            this.style.transform = this.dataset.baseTransform;
        });
    });
}
