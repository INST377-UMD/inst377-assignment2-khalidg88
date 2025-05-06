
function initHomePage() {
    if (!document.querySelector('.home-page')) return;
    fetchDailyQuote();
    initVoiceCommands();
}


function initStocksPage() {
    if (!document.querySelector('.stocks-page')) return;
    
}


async function fetchDailyQuote() {
    const quoteBox = document.getElementById('daily-quote');
    if (!quoteBox) return;

    try {
        const response = await fetch('https://api.quotable.io/random');
        const data = await response.json();
        quoteBox.querySelector('.quote-text').textContent = `"${data.content}"`;
        quoteBox.querySelector('.quote-author').textContent = `— ${data.author}`;
    } catch (error) {
        console.error('Failed to fetch quote:', error);
        quoteBox.querySelector('.quote-text').textContent = 
            '"The only way to do great work is to love what you do."';
        quoteBox.querySelector('.quote-author').textContent = '— Steve Jobs';
    }
}

function initVoiceCommands() {
    if (!annyang) return;

    const commands = {
        'hello': () => {
            alert('Hello! Welcome to our activity hub!');
        },
        'change the color to *color': (color) => {
            document.body.style.backgroundColor = color;
        },
        'go to *page': (page) => {
            const normalizedPage = page.toLowerCase().trim();
            if (normalizedPage === 'home') {
                window.location.href = 'index.html';
            } else if (normalizedPage === 'stocks') {
                window.location.href = 'stocks.html';
            } else if (normalizedPage === 'dogs') {
                window.location.href = 'dogs.html';
            }
        },
        'show *breed': (breed) => {
            if (typeof window.loadBreedInfo === 'function') {
                window.loadBreedInfo(breed);
            }
        }
    };

    annyang.addCommands(commands);

    document.getElementById('voice-on')?.addEventListener('click', () => {
        annyang.start();
        alert('Voice commands activated!');
    });

    document.getElementById('voice-off')?.addEventListener('click', () => {
        annyang.abort();
        alert('Voice commands disabled');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initHomePage();
    initStocksPage();
    
});

// Stocks Page Functionality
function initStocksPage() {
    if (!document.querySelector('.stocks-page')) return;

    const apiKey = 'P8_gmpu2hWNhEt8RAgVuafW9AZIpCpNq';
    let stockChart = null;

    // Initialize stock data fetching
    document.getElementById('fetch-data').addEventListener('click', fetchAndRenderStockData);

    // Load trending stocks on page load
    fetchTrendingStocks();

    // Initialize voice commands
    setupVoiceCommands();

    async function fetchStockData(ticker, days) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        const formatDate = (date) => date.toISOString().split('T')[0];
        
        try {
            const response = await fetch(
                `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${formatDate(startDate)}/${formatDate(endDate)}?adjusted=true&sort=asc&apiKey=${apiKey}`
            );
            
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                throw new Error('No data available');
            }
            
            return data.results.map(item => ({
                date: new Date(item.t).toLocaleDateString(),
                price: item.c
            }));
        } catch (error) {
            console.error('Error fetching stock data:', error);
            throw error;
        }
    }

    function renderStockChart(data, ticker) {
        const ctx = document.getElementById('stock-chart').getContext('2d');
        
        if (stockChart) {
            stockChart.destroy();
        }
        
        stockChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.date),
                datasets: [{
                    label: `${ticker} Closing Price`,
                    data: data.map(item => item.price),
                    borderColor: '#4a6baf',
                    backgroundColor: 'rgba(74, 107, 175, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Price ($)'
                        }
                    }
                }
            }
        });
    }

    async function fetchAndRenderStockData() {
        const ticker = document.getElementById('stock-symbol').value.trim().toUpperCase();
        const days = parseInt(document.getElementById('time-range').value, 10);
        
        if (!ticker) {
            alert('Please enter a stock symbol');
            return;
        }
        
        try {
            const stockData = await fetchStockData(ticker, days);
            renderStockChart(stockData, ticker);
        } catch (error) {
            alert('Failed to fetch stock data. Please check the ticker and try again.');
        }
    }

    function fetchTrendingStocks() {
        fetch('https://tradestie.com/api/v1/apps/reddit?date=2022-04-03')
            .then(response => response.json())
            .then(data => {
                const top5 = data.slice(0, 5);
                const tbody = document.querySelector('#trending-table tbody');
                
                top5.forEach(stock => {
                    const row = document.createElement('tr');
                    
                    
                    const tickerCell = document.createElement('td');
                    const link = document.createElement('a');
                    link.href = `https://finance.yahoo.com/quote/${stock.ticker}`;
                    link.textContent = stock.ticker;
                    link.target = '_blank';
                    tickerCell.appendChild(link);
                    
                   
                    const commentsCell = document.createElement('td');
                    commentsCell.textContent = stock.no_of_comments;
                    
                    
                    const sentimentCell = document.createElement('td');
                    const sentimentIcon = document.createElement('span');
                    sentimentIcon.className = 'sentiment-icon';
                    sentimentIcon.textContent = stock.sentiment === 'Bullish' ? '🐂' : '🐻';
                    sentimentIcon.title = stock.sentiment;
                    
                    sentimentCell.appendChild(sentimentIcon);
                    sentimentCell.append(` ${stock.sentiment}`);
                    
                    row.appendChild(tickerCell);
                    row.appendChild(commentsCell);
                    row.appendChild(sentimentCell);
                    tbody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error loading trending stocks:', error);
                document.querySelector('#trending-table tbody').innerHTML = 
                    '<tr><td colspan="3">Failed to load trending stocks</td></tr>';
            });
    }

    function setupVoiceCommands() {
        if (!annyang) return;

        const commands = {
            'hello': () => alert('Hello! Welcome to Stock Explorer.'),
            'change the color to *color': (color) => {
                document.body.style.backgroundColor = color;
            },
            'go to *page': (page) => {
                const normalizedPage = page.toLowerCase().trim();
                if (normalizedPage === 'home') window.location.href = 'index.html';
                else if (normalizedPage === 'stocks') window.location.href = 'stocks.html';
                else if (normalizedPage === 'dogs') window.location.href = 'dogs.html';
            },
            'lookup *ticker': (ticker) => {
                document.getElementById('stock-symbol').value = ticker.toUpperCase();
                fetchAndRenderStockData();
            }
        };

        annyang.addCommands(commands);

        document.getElementById('enable-voice').addEventListener('click', () => {
            annyang.start();
            alert('Voice commands enabled! Try saying "Lookup AAPL"');
        });

        document.getElementById('disable-voice').addEventListener('click', () => {
            annyang.abort();
            alert('Voice commands disabled');
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initStocksPage();
});