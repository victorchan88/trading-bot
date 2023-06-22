const { alpaca, wss } = require('./config/config');
const { authenticateAndSubscribe } = require('./services/wsManager');
const { sendGptRequest } = require('./services/gpt');
const { buyStock, sellStock } = require('./services/tradeHandler');
const { calculateMovingAverage } = require('./utils/utils');
const getMovingAverage = require('./services/movingAverage');

// Initialize WebSocket connection
authenticateAndSubscribe();

wss.on('message', async function (message) {
    console.log("Message is " + message);
    const currentEvent = JSON.parse(message)[0];

    if (currentEvent.T === "n") {
        let companyImpact = 0;
        let crossOverImpact = 0;
        let companyWeight = 0.5;
        let crossOverWeight = 0.5;

        const apiRequestBodyCompany = {
            "model": "gpt-3.5-turbo-16k",
            "messages": [
                { role: "system", content: "Only respond with a number from 1-100 detailing the impact of the headline." },
                { role: "user", content: "Given the headline '" + currentEvent.headline + "', show me a number from 1-100 detailing the impact of this headline." }
            ]
        };

        companyImpact = await sendGptRequest(apiRequestBodyCompany);

        console.log(companyImpact);

        // Moving Average logic
        // Use your logic here

        const tickerSymbol = currentEvent.symbols[0];
        const { fastMAValue, slowMAValue } = await getMovingAverage(tickerSymbol, 10, 20);
        const apiRequestBodyCrossover = {
            "model": "gpt-3.5-turbo-16k",
            "messages": [
                { role: "system", content: "We have detected a Moving Average crossover. When presented with a moving average crossover scenario for a specific stock, your role is to return a score between 1-100. A score of 1 indicates a strong sell signal, while a score of 100 indicates a strong buy signal. Please ensure to always return a numerical score." },
                { role: "user", content: `The fast moving average has ${fastMAValue > slowMAValue ? 'crossed above' : 'crossed below'} the slow moving average for the stock ${tickerSymbol}. What score from 1 to 100 would you assign to this event? Please only give the score and nothing else.` }
            ]
        }

        crossOverImpact = await sendGptRequest(apiRequestBodyCrossover);

        console.log(crossOverImpact);

        const impact = companyImpact * companyWeight + crossOverImpact * crossOverWeight;

        console.log(impact);

        // Buy or sell based on the impact
        if (impact >= 70) {
            await buyStock(tickerSymbol);
        } else if (impact <= 30) {
            await sellStock(tickerSymbol);
        }
    }
});
