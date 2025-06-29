document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-box');
  const resultsList = document.getElementById('results-list');
  const logoutDiv = document.getElementById('logout');
  const moversGrid = document.querySelector('.movers-grid');
  const stockChartSection = document.getElementById('stock-chart-section');
  const chartStockTicker = document.getElementById('chart-stock-ticker');
  const chartStockName = document.getElementById('chart-stock-name');
  const chartCurrentPrice = document.getElementById('chart-current-price');
  const chartPriceChange = document.getElementById('chart-price-change');
  const timeFilters = document.getElementById('time-filters');
  const summaryOpen = document.getElementById('summary-open');
  const summaryHigh = document.getElementById('summary-high');
  const summaryLow = document.getElementById('summary-low');
  const summaryPrevClose = document.getElementById('summary-prev-close');
  const appMessage = document.getElementById('app-message');

  let stockChartInstance = null;
  let messageTimeout;

  // display messages
  const showMessage = (message, type) => {
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }

    appMessage.textContent = message;
    appMessage.className = `app-message show ${type}`;
    messageTimeout = setTimeout(() => {
      appMessage.classList.remove('show');
      setTimeout(() => {
        appMessage.className = 'app-message';
        appMessage.textContent = '';
      }, 300);
    }, 3000);
  };


  // Fetch and display chart data
  const fetchAndDisplayChart = async (symbol, range = 1) => {
    stockChartSection.style.display = 'block';

    // Fetch stock profile
    try {
      const profileRes = await fetch(`/mrkt/stock-profile?symbol=${symbol}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!profileRes.ok) throw new Error('Failed to fetch stock profile');
      const profileData = await profileRes.json();

      chartStockTicker.textContent = symbol;
      chartStockName.textContent = profileData.name || 'N/A';
      summaryOpen.textContent =
          profileData.o ? `$${profileData.o.toFixed(2)}` : 'N/A';
      summaryHigh.textContent =
          profileData.h ? `$${profileData.h.toFixed(2)}` : 'N/A';
      summaryLow.textContent =
          profileData.l ? `$${profileData.l.toFixed(2)}` : 'N/A';
      summaryPrevClose.textContent =
          profileData.pc ? `$${profileData.pc.toFixed(2)}` : 'N/A';

      // Update current price
      const quoteRes = await fetch(`/mrkt/quote?symbol=${symbol}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!quoteRes.ok) throw new Error('Failed to fetch stock quote');
      const quoteData = await quoteRes.json();

      chartCurrentPrice.textContent =
          quoteData.c ? `$${quoteData.c.toFixed(2)}` : 'N/A';
      const priceChange = quoteData.d;
      const percentChange = quoteData.dp;
      if (priceChange !== null && percentChange !== null) {
        chartPriceChange.textContent =
            `${priceChange.toFixed(2)} (${percentChange.toFixed(2)}%)`;
        chartPriceChange.className =
            `price-change ${priceChange >= 0 ? 'positive' : 'negative'}`;
      } else {
        chartPriceChange.textContent = 'N/A';
        chartPriceChange.className = 'price-change';
      }

    } catch (error) {
      console.error('Error fetching stock profile or quote:', error);
      chartStockTicker.textContent = symbol;
      chartStockName.textContent = 'N/A';
      chartCurrentPrice.textContent = 'N/A';
      chartPriceChange.textContent = 'N/A';
      summaryOpen.textContent = 'N/A';
      summaryHigh.textContent = 'N/A';
      summaryLow.textContent = 'N/A';
      summaryPrevClose.textContent = 'N/A';
    }


    try {
      const res =
          await fetch(`/mrkt/stock-chart?symbol=${symbol}&range=${range}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          console.error(
              'Authentication failed for chart data. Redirecting to login.');
          logout();
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const chartData = await res.json();

      const labels = chartData.t.map(timestamp => {
        const date = new Date(timestamp * 1000);
        if (range <= 1) {
          return date.toLocaleTimeString(
              'en-US', {hour: '2-digit', minute: '2-digit'});
        }
        return date.toLocaleDateString();
      });
      const dataPoints = chartData.c;

      const ctx = document.getElementById('stockChart').getContext('2d');

      if (stockChartInstance) {
        stockChartInstance.destroy();
      }

      stockChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `${symbol} Price`,
            data: dataPoints,
            borderColor: 'var(--primary-blue)',
            backgroundColor: 'rgba(92, 98, 246, 0.2)',
            fill: true,
            tension: 0.1,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {display: false},
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                title: function(context) {
                  return labels[context[0].dataIndex];
                },
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += `$${context.parsed.y.toFixed(2)}`;
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {display: false},
              ticks: {
                autoSkip: true,
                maxRotation: 0,
                minRotation: 0,
                callback: function(value, index, values) {
                  if (range > 7) {
                    const step = Math.ceil(labels.length / 5);
                    if (index % step === 0) {
                      return labels[index];
                    }
                  }
                  return labels[index];
                }
              }
            },
            y: {
              beginAtZero: false,
              grid: {color: 'var(--border-light)'},
              ticks: {
                callback: function(value) {
                  return `$${value.toFixed(2)}`;
                }
              }
            }
          }
        }
      });
    } catch (err) {
      console.error('Failed to load chart data:', err);
      if (stockChartInstance) {
        stockChartInstance.destroy();
      }
      const ctx = document.getElementById('stockChart').getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.font = '16px Inter';
      ctx.fillStyle = 'var(--text-medium)';
      ctx.textAlign = 'center';
      ctx.fillText(
          'Failed to load chart data.', ctx.canvas.width / 2,
          ctx.canvas.height / 2);
    }
  };

  timeFilters.addEventListener('click', (event) => {
    if (event.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn')
          .forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');

      const symbol = chartStockTicker.textContent;
      const range = parseInt(event.target.dataset.range);
      if (symbol) {
        fetchAndDisplayChart(symbol, range);
      }
    }
  });

  // delete Stock
  window.deleteStock = async (event, symbol) => {
    event.stopPropagation();

    try {
      const res = await fetch('/mrkt/delete-stock', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({symbol: symbol}),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete stock');
      }

      const data = await res.json();
      showMessage(data.message, 'success');
      fetchAndDisplayUserStocks();
      if (chartStockTicker.textContent === symbol) {
        stockChartSection.style.display = 'none';
        if (stockChartInstance) {
          stockChartInstance.destroy();
          stockChartInstance = null;
        }
      }

    } catch (error) {
      console.error('Error deleting stock:', error);
      showMessage(`Error deleting stock: ${error.message}`, 'error');
    }
  };


  const fetchAndDisplayUserStocks = () => {
    fetch('/mrkt/userStocks', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
        .then((res) => {
          if (res.status === 401 || res.status === 403) {
            console.error(
                'Authentication failed for user stocks. Redirecting to login.');
            logout();
            return;
          }
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((stockInfo) => {
          moversGrid.innerHTML = '';

          if (stockInfo.length === 0) {
            moversGrid.innerHTML =
                '<p class="no-stocks-message">You have no stocks saved. Search and add some!</p>';
            return;
          }

          stockInfo.forEach((item) => {
            if (!item) return;

            const div = document.createElement('div');
            div.className = 'card mover-card';

            const priceChangeClass =
                item.priceChange >= 0 ? 'positive' : 'negative';
            div.innerHTML = `
          <div class="mover-info">
            <span class="mover-ticker">${item.symbol}</span>
            <span class="mover-name">${item.name}</span>
          </div>
          <div class="mover-price-change">
            <p class="current-price">$${
                item.currentPrice ? item.currentPrice.toFixed(2) : 'N/A'}</p>
            <p class="price-change ${priceChangeClass}">
              ${item.priceChange ? item.priceChange.toFixed(2) : 'N/A'} (${
                item.percentChange ? item.percentChange.toFixed(2) : 'N/A'}%)
            </p>
          </div>
          <button class="delete-button" onclick="deleteStock(event, '${
                item.symbol}')">
            <img src="imgs/del.png" class="del-Logo" alt="Delete">
          </button>
        `;
            moversGrid.append(div);
            div.addEventListener('click', () => {
              fetchAndDisplayChart(item.symbol, 1);
            });
          });
        })
        .catch((err) => console.error('Failed to load user stock cards:', err));
  };

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
        <p>${item.source} | ${
              new Date(item.datetime * 1000).toLocaleDateString()}</p>
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
          body: JSON.stringify({symbol: result.symbol}),
        })
            .then((res) => {
              if (!res.ok) {
                if (res.status === 409) {
                  showMessage('Stock is already in your portfolio.', 'error');
                } else {
                  throw new Error('Failed to save stock');
                }
              }
              return res.json();
            })
            .then(() => {
              fetchAndDisplayUserStocks();
              fetchAndDisplayChart(result.symbol, 1);  // Display chart
            })
            .catch((err) => {
              console.error(err);
              showMessage(`Error saving stock: ${err.message}`, 'error');
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
    const isClickInsideSearch =
        document.querySelector('.search-container')?.contains(e.target);
    const isClickInsideProfile =
        document.querySelector('.profile-logo')?.contains(e.target);

    if (!isClickInsideSearch) {
      resultsList.innerHTML = '';
    }

    if (!isClickInsideProfile) {
      logoutDiv.innerHTML = '';
    }
  });
});

function profile() {
  const logoutDiv = document.getElementById('logout');

  if (logoutDiv.innerHTML !== '') {
    logoutDiv.innerHTML = '';
    return;
  }

  const token = localStorage.getItem('token');
  let username = 'User';

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      username = payload.username || 'User';
    } catch (err) {
      console.error('Failed to decode token:', err);
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
  localStorage.removeItem('token');
  window.location.href = '/LogReg.html';
}