document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-box');
  const resultsList = document.getElementById('results-list');
  const logoutDiv = document.getElementById("logout");
  const moversGrid = document.querySelector(".movers-grid"); // Get the parent for stock cards

  // Function to fetch and display user stocks
  const fetchAndDisplayUserStocks = () => {
    fetch('/mrkt/userStocks', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    .then((res) => {
      if (res.status === 401 || res.status === 403) {
        // Handle unauthorized/forbidden access, e.g., redirect to login
        console.error("Authentication failed for user stocks. Redirecting to login.");
        logout(); // Or redirect to login page
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((stockInfo) => {
      moversGrid.innerHTML = ''; // Clear existing cards

      if (stockInfo.length === 0) {
        moversGrid.innerHTML = '<p class="no-stocks-message">You have no stocks saved. Search and add some!</p>';
        return;
      }

      stockInfo.forEach((item) => {
        if (!item) return; // Skip if Finnhub failed for this stock

        const div = document.createElement('div');
        div.className = 'card mover-card';

        const priceChangeClass = item.priceChange >= 0 ? 'positive' : 'negative';

        div.innerHTML = `
          <div class="mover-info">
            <span class="mover-ticker">${item.symbol}</span>
            <span class="mover-name">${item.name}</span>
          </div>
          <div class="mover-price-change">
            <p class="current-price">$${item.currentPrice ? item.currentPrice.toFixed(2) : 'N/A'}</p>
            <p class="price-change ${priceChangeClass}">
              ${item.priceChange ? item.priceChange.toFixed(2) : 'N/A'} (${item.percentChange ? item.percentChange.toFixed(2) : 'N/A'}%)
            </p>
          </div>
        `;
        moversGrid.append(div);
      });
    })
    .catch((err) => console.error('Failed to load user stock cards:', err));
  };

  // Initial fetch of user stocks when the page loads
  fetchAndDisplayUserStocks();

  // fetch news
  fetch('/mrkt/news')
  .then((res) => res.json())
  .then((newsItems) => {
    const newsContainer = document.getElementById('news-today');
    newsContainer.innerHTML = ''; 

    newsItems.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'news-card';
      div.innerHTML = `
        <h4>${item.headline}</h4>
        <p>${item.source} | ${new Date(item.datetime * 1000).toLocaleDateString()}</p>
        <a href="${item.url}" target="_blank">Read more</a>
      `;
      newsContainer.appendChild(div);
    });
  })
  .catch((err) => console.error('Failed to load news:', err));

  // search
  const fetchData = (value) => {
    fetch(`/mrkt/search?q=${encodeURIComponent(value)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`, // Ensure search also has token
      },
    })
      .then((response) => response.json())
      .then((results) => {
        displayResults(results);
      })
      .catch((error) => {
        console.error('Search error:', error);
      });
  };

  const displayResults = (results) => {
    resultsList.innerHTML = '';
    if (results.length === 0) {
      const noResultsDiv = document.createElement('div');
      noResultsDiv.classList.add('search-result');
      noResultsDiv.textContent = 'No results found';
      resultsList.appendChild(noResultsDiv);
      return;
    }

    results.forEach((result) => {
      const searchResultDiv = document.createElement('div');
      searchResultDiv.classList.add('search-result');
      searchResultDiv.textContent = `${result.symbol} - ${result.name}`;
      searchResultDiv.addEventListener('click', () => {
        searchInput.value = result.symbol;
        resultsList.innerHTML = '';

        fetch('/mrkt/save-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ symbol: result.symbol }),
        })
          .then((res) => {
            if (!res.ok) {
              if (res.status === 409) { // Assuming 409 for duplicate entry (UNIQUE constraint)
                alert('Stock is already in your portfolio.');
              } else {
                throw new Error('Failed to save stock');
              }
            }
            return res.json();
          })
          .then(() => {
            // After successfully saving a stock, refresh the user's stock list
            fetchAndDisplayUserStocks(); 
          })
          .catch((err) => {
            console.error(err);
            alert('Error saving stock.');
          });
      });
      resultsList.appendChild(searchResultDiv);
    });
  };

  searchInput.addEventListener('input', () => {
    const inputValue = searchInput.value.trim();
    if (inputValue.length > 1) {
      fetchData(inputValue);
    } else {
      resultsList.innerHTML = '';
    }
  });

  document.addEventListener('click', (e) => {
    const isClickInsideSearch = document.querySelector('.search-container')?.contains(e.target);
    const isClickInsideProfile = document.querySelector('.profile-logo')?.contains(e.target);

    if (!isClickInsideSearch) {
      resultsList.innerHTML = '';
    }

    if (!isClickInsideProfile) {
      logoutDiv.innerHTML = '';
    }
  });
});

function profile() {
  const logoutDiv = document.getElementById("logout");

  if (logoutDiv.innerHTML !== "") {
    logoutDiv.innerHTML = "";
    return;
  }

  const token = localStorage.getItem("token");
  let username = "User";

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      username = payload.username || "User";
    } catch (err) {
      console.error("Failed to decode token:", err);
    }
  }

  logoutDiv.innerHTML = `
    <div class="logout-dropdown">
      <p class="username-label">Hi, ${username}</p>
      <button onclick="logout()" class="logout-btn">Logout</button>
    </div>
  `;
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/LogReg.html";
}


