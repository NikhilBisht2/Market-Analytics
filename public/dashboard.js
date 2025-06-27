document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-box');
  const resultsList = document.getElementById('results-list');

  const fetchData = (value) => {
    fetch(`/mrkt/search?q=${encodeURIComponent(value)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((response) => response.json())
      .then((results) => {
        console.log("Search results:", results);
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
        // TODO: Add this stock to the user's stock list via POST request
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

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!document.querySelector('.search-container').contains(e.target)) {
      resultsList.innerHTML = '';
    }
  });
});


