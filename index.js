require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require("axios");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

app.command("/starslack-ping", async ({ command, ack, respond }) => {
    const start = Date.now();
    await ack();
    const latency = Date.now() - start;
    await respond({ text: `🏓 Pong!\nLatency: ${latency}ms ${latency <= 5 ? "(wow thats low!)" : ""}` });
});

app.command("/starslack-nws-alert", async ({ ack, respond }) => {
    await ack();

    try {
        const resp = await axios.get("https://api.weather.gov/alerts/active?status=actual");

        const alert = resp.data.features[Math.floor(Math.random() * resp.data.features.length)];

        const id = alert.id;
        const event = alert.properties.event;
        const vtec = alert.properties.parameters.VTEC[0];
        const headline = alert.properties.headline;
        const description = alert.properties.description;
        const instruction = alert.properties.instruction;
        const senderCode = vtec.split(".")[2];
        const senderUrl = "https://weather.gov/" + senderCode.slice(1).toLowerCase();
        const sender = alert.properties.senderName;

        const codeBlock = (txt) => { return "```" + txt + "```"; }

        await respond({ text: `*<${id}|${event}> (\`${vtec}\`)*\nHeadline:\n${codeBlock(headline)}\nDescription:\n${codeBlock(description)}\nInstruction:\n${codeBlock(instruction)}\nIssued by <${senderUrl}|${sender}>. (${senderCode})` });
    } catch (err) {
        console.error(err);
        await respond({ text: "Failed to fetch an alert." });
    }
});

app.command("/starslack-coin-flip", async ({ ack, respond }) => {
    await ack();

    const result = Math.round(Math.random());

    await respond({ text: result === 1 ? "It's Heads." : "Tails." });
});

(async () => {
    await app.start();
    console.log(`Started StarSlack.`);
})();