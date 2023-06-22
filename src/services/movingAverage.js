const { alpaca } = require('../config/config');
const { calculateMovingAverage } = require('../utils/utils');

async function getMovingAverage(tickerSymbol, fastMA, slowMA) {
    let ts = Date.now();
    let days = 86400000;

    let date_ob = new Date(ts - days);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    if (month < 10) {
        month = "0" + month
    }
    if (date < 10) {
        date = "0" + date
    }
    let endDate = year + "-" + month + "-" + date;

    date_ob = new Date(ts - (30 * days));
    date = date_ob.getDate();
    month = date_ob.getMonth() + 1;
    year = date_ob.getFullYear();
    if (month < 10) {
        month = "0" + month
    }
    if (date < 10) {
        date = "0" + date
    }
    let startDate = year + "-" + month + "-" + date;


    let barset = alpaca.getBarsV2(tickerSymbol, {
        start: startDate,
        end: endDate,
        limit: slowMA,
        timeframe: "1Day"
    });

    const bars = []
    for await (let b of barset) {
        bars.push(b);
    }

    let historicalPrices = bars.map(bar => bar.ClosePrice);

    let fastMAValue = calculateMovingAverage(historicalPrices.slice(-fastMA));
    let slowMAValue = calculateMovingAverage(historicalPrices.slice(-slowMA));

    return { fastMAValue, slowMAValue };
}

module.exports = getMovingAverage;
