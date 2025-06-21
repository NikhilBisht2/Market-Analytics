 document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-box');
    const resultsList = document.getElementById('result-list');

    const fetchData = (value) => {
        fetch("https://jsonplaceholder.typicode.com/users")
            .then((response) => response.json())
            .then((json) => {
                const results = json.filter((user) => {
                    return (
                        value &&
                        user &&
                        user.name &&
                        user.name.toLowerCase().includes(value.toLowerCase())
                    );
                });
                displayResults(results);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    };

    const displayResults = (results) => {
        resultsList.innerHTML = ''; 

        if (results.length === 0 && searchInput.value !== "") {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.textContent = 'No results found.';
            noResultsDiv.classList.add('search-result'); 
            noResultsDiv.style.cursor = 'default';
            resultsList.appendChild(noResultsDiv);
            return;
        } else if (searchInput.value === "") {
            return;
        }

        results.forEach((result) => {
            const searchResultDiv = document.createElement('div');
            searchResultDiv.classList.add('search-result'); 
            searchResultDiv.textContent = result.name;
            searchResultDiv.addEventListener('click', () => {
                alert(`You selected ${result.name}!`);
            });
            resultsList.appendChild(searchResultDiv);
        });
    };
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        fetchData(value);
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

