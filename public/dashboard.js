document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-box');
  const resultsList = document.getElementById('results-list');
  const logoutDiv = document.getElementById("logout");

  const fetchData = (value) => {
    fetch(`/mrkt/search?q=${encodeURIComponent(value)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
    results.forEach((result) => {
      const searchResultDiv = document.createElement('div');
      searchResultDiv.classList.add('search-result');
      searchResultDiv.textContent = `${result.symbol} - ${result.name}`;
      searchResultDiv.addEventListener('click', () => {
        alert(`You selected ${result.symbol}`);
        searchInput.value = result.symbol;
        resultsList.innerHTML = '';
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


