const { alpaca } = require('../config/config');

exports.buyStock = async (tickerSymbol) => {
    try {
        // Check for sufficient capital before buying
        const account = await alpaca.getAccount();
        if (account.cash < 0) {
            console.log("Insufficient funds to purchase stock.");
            return;
        }

        let order = await alpaca.createOrder({
            symbol: tickerSymbol,
            qty: 1,
            side: 'buy',
            type: 'market',
            time_in_force: 'day'
        });
        console.log("Successfully purchased");
    } catch (err) {
        console.error("Error placing order: ", err);
    }
}

exports.sellStock = async (tickerSymbol) => {
    try {
        const position = await alpaca.getPosition(tickerSymbol);
        if (position) {
            let closedPosition = await alpaca.closePosition(tickerSymbol);
            console.log("Closed position");
        } else {
            console.log(`No position to close for ${tickerSymbol}`);
        }
    } catch (err) {
        console.error("Error ", err);
    }
}
