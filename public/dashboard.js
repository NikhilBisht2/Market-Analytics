document.addEventListener('DOMContentLoaded', () => {
    // Correctly target the search input and results list from index.html
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
        resultsList.innerHTML = ''; // Clear previous results

        if (results.length === 0 && searchInput.value !== "") {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.textContent = 'No results found.';
            noResultsDiv.classList.add('search-result'); // This class will be added to styles.css
            noResultsDiv.style.cursor = 'default';
            resultsList.appendChild(noResultsDiv);
            return;
        } else if (searchInput.value === "") {
            // If the input is empty, clear the results list
            return;
        }

        results.forEach((result) => {
            const searchResultDiv = document.createElement('div');
            searchResultDiv.classList.add('search-result'); // This class will be added to styles.css
            searchResultDiv.textContent = result.name;
            searchResultDiv.addEventListener('click', () => {
                alert(`You selected ${result.name}!`);
            });
            resultsList.appendChild(searchResultDiv);
        });
    };

    // Attach the event listener to the search input
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        fetchData(value);
    });
});
