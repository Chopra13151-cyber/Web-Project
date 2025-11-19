document.addEventListener("DOMContentLoaded", () => {
    
    const galleryContainer = document.getElementById("foodGallery");
    const starContainer = document.getElementById("starContainer");
    const form = document.getElementById("feedbackForm");
    const thank = document.getElementById("thank");
    const errorMessage = document.getElementById("errorMessage");

    const GALLERY_DATA = [
        { "src": "https://raw.githubusercontent.com/programmercloud/foodlover/main/img/menu-1.jpg", "alt": "Delicious Pizza" },
        { "src": "https://raw.githubusercontent.com/programmercloud/foodlover/main/img/menu-2.jpg", "alt": "Crispy Fries" },
        { "src": "https://raw.githubusercontent.com/programmercloud/foodlover/main/img/menu-3.jpg", "alt": "Aromatic Biryani" }
    ];

    let currentRating = 0;

    
    const renderGallery = () => {
        if (galleryContainer) {
            galleryContainer.innerHTML = GALLERY_DATA.map(img => `
                <img src="${img.src}" alt="${img.alt}" onerror="this.src='https://placehold.co/200x150/e74c3c/ffffff?text=Image+Error'; this.onerror=null;">
            `).join('');
        }
    };

    const setupStars = () => {
        if (!starContainer) return;

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<button type="button" class="star" data-rating="${i}">⭐</button>`;
        }
        starContainer.innerHTML = starsHtml;

        const stars = document.querySelectorAll(".star");
        stars.forEach(star => {
            star.addEventListener("click", (e) => {
                currentRating = parseInt(e.currentTarget.dataset.rating);
                updateStarsVisual(currentRating, stars);
            });
        });
        return stars;
    };

    const updateStarsVisual = (rating, stars) => {
        stars.forEach(star => {
            star.classList.toggle("active", parseInt(star.dataset.rating) <= rating);
        });
    };
    
    const toggleMessage = (element, duration = 4000) => {
        if (element) {
            element.style.display = "block";
            setTimeout(() => element.style.display = "none", duration);
        }
    };
    
    const logFeedback = (name, message, rating) => {
        console.log("--- 🍔 New Feedback Received ---");
        console.log("Name:", name);
        console.log("Rating:", rating + " stars");
        console.log("Message:", message || "(No message provided)");
        console.log("Date:", new Date().toLocaleString());
        console.log("----------------------------------");
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        if (errorMessage) errorMessage.style.display = "none";

        const nameInput = document.getElementById("name");
        const messageInput = document.getElementById("message");
        const submitButton = form.querySelector('.submit-btn');

        const name = nameInput.value.trim();
        const message = messageInput.value;
        
        if (name === "" || currentRating === 0) {
            toggleMessage(errorMessage);
            return;
        }

        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;

        logFeedback(name, message, currentRating); 

        setTimeout(() => {
            toggleMessage(thank);
            form.reset();
            updateStarsVisual(0, document.querySelectorAll(".star"));
            currentRating = 0;
            submitButton.textContent = 'Submit Feedback';
            submitButton.disabled = false;
        }, 1500);
    };

    renderGallery();
    setupStars();

    if (form) {
        form.addEventListener("submit", handleSubmit);
    }
});