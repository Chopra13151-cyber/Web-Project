// public/js/script.js
// Loads menu from /api/menu (MongoDB) and additional config (serviceZones, cardTypes) from /data/mydata.json
// Renders menu using MenuCard OOP class, keeps search, location check & payment logic.

async function loadData() {
  try {
    // Fetch two resources in parallel:
    //  - /api/menu (returns array of menu items from DB)
    //  - /data/mydata.json (local file containing serviceZones and cardTypes)
    const [menuResp, staticResp] = await Promise.all([
      fetch('/api/menu'),
      fetch('/data/mydata.json')
    ]);

    if (!menuResp.ok) throw new Error('Failed to load /api/menu');
    if (!staticResp.ok) throw new Error('Failed to load /data/mydata.json');

    const menuItems = await menuResp.json();
    const staticData = await staticResp.json();

    // Compose a data object similar to your old structure so initWebsite keeps working
    const data = {
      menuItems: Array.isArray(menuItems) ? menuItems : (menuItems.menuItems || []),
      serviceZones: staticData.serviceZones || [],
      cardTypes: staticData.cardTypes || []
    };

    console.log('✅ Data loaded successfully (menu from API + config from JSON)', data);
    initWebsite(data);
  } catch (error) {
    console.error('❌ Error loading data:', error);
    // If API fails, try fallback to local JSON for menu (graceful degradation)
    try {
      const fallbackResp = await fetch('/data/mydata.json');
      if (!fallbackResp.ok) throw new Error('Fallback JSON load failed');
      const fallback = await fallbackResp.json();
      const data = {
        menuItems: fallback.menuItems || [],
        serviceZones: fallback.serviceZones || [],
        cardTypes: fallback.cardTypes || []
      };
      console.warn('Using fallback local data.json', data);
      initWebsite(data);
    } catch (err) {
      console.error('Fallback also failed:', err);
      const grid = document.getElementById('menuGrid');
      if (grid) grid.innerHTML = `<p style="text-align:center;color:red;">Unable to load menu at this time.</p>`;
    }
  }
}

function initWebsite(data) {
  const grid = document.getElementById("menuGrid");
  const searchInput = document.getElementById("searchInput");

  // OOP MenuCard class
  class MenuCard {
    constructor(item) {
      this.item = item || {};
    }

    render() {
      const el = document.createElement('div');
      el.className = 'menu-item';

      const imageSrc = this.item.image || '/images/placeholder.png';
      const name = this.item.name || 'Untitled Dish';
      const price = this.item.price || '';
      const desc = this.item.description || '';
      const link = this.item.link || '#';

      el.innerHTML = `
        <img src="${imageSrc}" alt="${escapeHtml(name)}" onerror="this.src='/images/placeholder.png'">
        <h3>${escapeHtml(name)}</h3>
        <p class="price">${escapeHtml(price)}</p>
        ${desc ? `<p class="desc">${escapeHtml(desc)}</p>` : ''}
        <a href="${link}" class="btn">Order →</a>
      `;
      return el;
    }
  }

  // Small helper to avoid inserting raw HTML from data
  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  const displayMenu = (items) => {
    if (!grid) return;
    if (!items || items.length === 0) {
      grid.innerHTML = `<p style="text-align:center;color:red;">No dishes found.</p>`;
      return;
    }
    grid.innerHTML = '';
    items.forEach(item => {
      const card = new MenuCard(item);
      grid.appendChild(card.render());
    });
  };

  // Initial render
  displayMenu(data.menuItems || []);

  // Search feature (client-side filter)
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = (data.menuItems || []).filter(item =>
        (item.name || '').toLowerCase().includes(query)
      );
      displayMenu(filtered);
    });
  }

  // Location form logic (uses data.serviceZones)
  const locationForm = document.getElementById("locationForm");
  const locationResult = document.getElementById("locationResult");

  if (locationForm) {
    locationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cityZip = (document.getElementById("cityZip").value || '').toLowerCase().trim();

      const found = (data.serviceZones || []).find(zone =>
        (zone.keywords || []).some(k => cityZip.includes(k)) ||
        (zone.zipCode && cityZip.includes(String(zone.zipCode)))
      );

      if (found) {
        locationResult.style.color = "green";
        locationResult.innerHTML = `✅ Service available in <b>${escapeHtml(found.name)}</b> (${escapeHtml(found.time || '')})`;
      } else {
        locationResult.style.color = "red";
        locationResult.innerHTML = `❌ Sorry, no delivery in "${escapeHtml(cityZip)}".`;
      }
    });
  }

  // Payment System (keeps same validation, but redirects to server route /confirmation)
  class PaymentSystem {
    constructor(cardTypes) {
      this.cardTypes = cardTypes || [];
      this.form = document.getElementById("paymentForm");
      this.msgBox = document.getElementById("successMsg");
      this.cardNumber = document.getElementById("cardNumber");
      this.cardTypeDisplay = document.getElementById("cardType");

      if (this.form) this.form.onsubmit = this.submitPayment.bind(this);
      if (this.cardNumber) this.cardNumber.oninput = this.detectCardType.bind(this);
    }

    detectCardType() {
      const number = (this.cardNumber.value || '').replace(/\s/g, "");
      let type = "Unknown";
      for (const card of this.cardTypes) {
        // card.prefix can be a string like '^4' or a regex-like pattern in config
        try {
          const regex = new RegExp(card.prefix);
          if (regex.test(number)) {
            type = card.name;
            break;
          }
        } catch (err) {
          // fallback: prefix as simple startsWith
          if (number.startsWith(card.prefix)) {
            type = card.name;
            break;
          }
        }
      }
      if (this.cardTypeDisplay) this.cardTypeDisplay.textContent = `Card Type: ${type}`;
    }

    showMessage(msg, success = false) {
      if (!this.msgBox) return;
      this.msgBox.textContent = msg;
      this.msgBox.style.display = "block";
      this.msgBox.style.backgroundColor = success ? "#2ecc71" : "#e74c3c";
      this.msgBox.style.color = "white";
      if (!success) {
        setTimeout(() => { this.msgBox.style.display = "none"; }, 4000);
      }
    }

    submitPayment(e) {
      e.preventDefault();
      const number = (this.cardNumber.value || '').replace(/\s/g, "");
      const cvv = (document.getElementById("cvv").value || '').trim();
      const yearVal = (document.getElementById("year").value || '').trim();
      const year = parseInt(yearVal) || 0;
      const currentYear = new Date().getFullYear();

      if (number.length < 12 || cvv.length < 3) { // relaxed to allow various test cards
        this.showMessage("⚠️ Invalid Card or CVV.");
        return;
      }
      if (year && year < currentYear) {
        this.showMessage("⚠️ Card expired.");
        return;
      }

      this.showMessage("✅ Payment Successful! Redirecting...", true);
      const btn = this.form.querySelector(".btn-pay");
      if (btn) btn.disabled = true;

      // For demo we redirect to server-rendered confirmation page
      setTimeout(() => {
        window.location.href = "/confirmation";
      }, 1200);
    }
  }

  // initialize payment system with card types from data
  new PaymentSystem(data.cardTypes || []);
}

document.addEventListener("DOMContentLoaded", loadData);
