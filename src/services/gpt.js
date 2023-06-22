require('dotenv').config({ path: __dirname + '/../../.env' });

const fetch = require('node-fetch');

exports.sendGptRequest = async (apiRequestBody) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(apiRequestBody)
    });

    const data = await response.json();
    return parseInt(data.choices[0].message.content);
}
