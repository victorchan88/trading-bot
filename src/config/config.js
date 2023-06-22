require('dotenv').config({path: __dirname + '/../../.env'});

const Alpaca = require("@alpacahq/alpaca-trade-api");
const WebSocket = require('ws');

exports.alpaca = new Alpaca({
    keyId: process.env.APCA_API_KEY_ID,
    secretKey: process.env.APCA_API_SECRET_KEY,
    paper: true,
    usePolygon: false
});

exports.wss = new WebSocket("wss://stream.data.alpaca.markets/v1beta1/news");
