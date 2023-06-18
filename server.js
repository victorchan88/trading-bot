const Alpaca = require("@alpacahq/alpaca-trade-api");
const alpaca = new Alpaca(); // Environment Variables
const WebSocket = require('ws');

// Server < -- > Data Source
// Communication can go both ways
// Data source can send us information
// Send data to the data source (Authenticate, ask what data we want)

// WebSockets are like push notifications on your phone
// Whenever an event happens (texts you, snapchat, anything) you get a notification

const wss = new WebSocket("wss://stream.data.alpaca.markets/v1beta1/news");

wss.on('open', function() {
    console.log("Websocket connected!");

    // We now have to log in to the data source
    const authMsg = {
        action: 'auth',
        key: process.env.APCA_API_KEY_ID,
        secret: process.env.APCA_API_SECRET_KEY
    };

    wss.send(JSON.stringify(authMsg)); // Send auth data to ws, "log us in"

    // Subscribe to all news feeds
    const subscribeMsg = {
        action: 'subscribe',
        news: ['*'] // ["TSLA"]
    };
    wss.send(JSON.stringify(subscribeMsg)); // Connecting us to the live data source of news
});

wss.on('message', async function(message) {
    console.log("Message is " + message);
    // message is a STRING
    const currentEvent = JSON.parse(message)[0];
    // "T": "n" newsEvent
    if(currentEvent.T === "n") { // This is a news event
        let companyImpact = 0;
        let crossOverImpact = 0;
        let companyWeight = 0.5;
        let crossOverWeight = 0.5;

        // Ask ChatGPT its thoughts on the headline
        const apiRequestBody = {
            "model": "gpt-3.5-turbo-16k",
            "messages": [
                { role: "system", content: "Only respond with a number from 1-100 detailing the impact of the headline." }, // How ChatGPT should talk to us
                { role: "user", content: "Given the headline '" + currentEvent.headline + "', show me a number from 1-100 detailing the impact of this headline."}
            ]
        }

        await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(apiRequestBody)
        }).then((data) => {
            return data.json();
        }).then((data) => {
            // data is the ChatGPT response
            console.log(data);
            console.log(data.choices[0].message);
            companyImpact = parseInt(data.choices[0].message.content);
        });

        // Make trades based on the output (of the impact saved in companyImpact)
        const tickerSymbol = currentEvent.symbols[0];

        let fastMA = 10;
        let slowMA = 20;

        let barset = await alpaca.getBars('day', tickerSymbol, {limit: slowMA});
        let historicalPrices = barset[tickerSymbol].map(bar => bar.closePrice);

        let fastMAValue = calculateMovingAverage(historicalPrices.slice(-fastMA));
        let slowMAValue = calculateMovingAverage(historicalPrices);

        // Check for MA crossover
        if (fastMAValue > slowMAValue || fastMAValue < slowMAValue) {
            // Moving Average crossover detected, ask ChatGPT for scoring
            const apiRequestBody = {
                "model": "gpt-3.5-turbo-16k",
                "messages": [
                    { role: "system", content: "We have detected a Moving Average crossover. Please provide a score from 1-100 that indicates the potential impact of this event on the stock price." }, 
                    { role: "user", content: `The fast moving average has ${fastMAValue > slowMAValue ? 'crossed above' : 'crossed below'} the slow moving average for the stock ${tickerSymbol}. Please provide an impact score.` }
                ]
            }

            let crossoverImpact = 0;
            await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(apiRequestBody)
            }).then((data) => {
                return data.json();
            }).then((data) => {
                console.log(data);
                crossoverImpact = parseInt(data.choices[0].message.content);
            });
        }

        impact = companyImpact*companyWeight + crossOverImpact*crossOverWeight

        // 1 - 100, 1 being the most negative, 100 being the most positive impact on a company.
        if(impact >= 70) { // if score >= 70 : BUY STOCK
            // Check for sufficient capital before buying
            const account = await alpaca.getAccount();
            if (account.cash < 0) {
                console.log("Insufficient funds to purchase stock.");
                return;
            }

            // Buy stock
            try {
                let order = await alpaca.createOrder({
                    symbol: tickerSymbol,
                    qty: 1,
                    side: 'buy',
                    type: 'market',
                    time_in_force: 'day' // day ends, it wont trade.
                });
            } catch (err) {
                console.error("Error placing order: ", err);
            }

        } else if (impact <= 30) { // else if impact <= 30: SELL ALL OF STOCK
            // Sell stock
            try {
                let closedPosition = alpaca.closePosition(tickerSymbol); //(tickerSymbol);
            } catch (err) {
                console.error("Error ")
            }
        }
        
    }
});

function calculateMovingAverage(prices) {
    let sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
}