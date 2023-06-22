exports.calculateMovingAverage = (prices) => {
    let sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
}
