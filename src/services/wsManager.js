const { wss } = require('../config/config');

exports.authenticateAndSubscribe = () => {
    wss.on('open', function () {
        console.log("Websocket connected!");

        const authMsg = {
            action: 'auth',
            key: process.env.APCA_API_KEY_ID,
            secret: process.env.APCA_API_SECRET_KEY
        };
        wss.send(JSON.stringify(authMsg));

        const subscribeMsg = {
            action: 'subscribe',
            news: ['*']
        };
        wss.send(JSON.stringify(subscribeMsg));
    });
}
