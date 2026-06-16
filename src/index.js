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

        const id = alert.properties.id;
        const event = alert.properties.event;
        const vtec = alert.properties.parameters.VTEC[0];
        const headline = alert.properties.headline;

        const codeBlock = (txt) => { return "```" + txt + "```"; }

        await respond({
            blocks: [
                {
                    type: "card",
                    title: {
                        type: "mrkdwn",
                        text: event,
                        verbatim: true
                    },
                    subtitle: {
                        type: "mrkdwn",
                        text: `\`${vtec}\``,
                        verbatim: true
                    },
                    body: {
                        type: "mrkdwn",
                        text: headline.length > 200 ? headline.slice(0, 197) + "..." : headline,
                        verbatim: true
                    },
                    actions: [
                        {
                            type: "button",
                            style: "primary",
                            text: {
                                type: "plain_text",
                                text: "Learn more",
                                emoji: false
                            },
                            action_id: "starslack-nws-alert-more",
                            value: id
                        }
                    ]
                }
            ]
        });
    } catch (err) {
        console.error(err);
        await respond({ text: "Failed to fetch an alert." });
    }
});

app.action("starslack-nws-alert-more", async ({ ack, body, client, action }) => {
    await ack();

    const alertId = action.value;

    try {
        const alert = await axios.get(`https://api.weather.gov/alerts/${alertId}`);

        const event = alert.data.properties.event;
        const vtec = alert.data.properties.parameters.VTEC[0];
        const headline = alert.data.properties.headline ?? "None";
        const description = alert.data.properties.description ?? "None";
        const instruction = alert.data.properties.instruction ?? "None";
        const sender = alert.data.properties.senderName;
        const senderCode = vtec.split(".")[2];
        const senderUrl = "https://weather.gov/" + senderCode.slice(1).toLowerCase();

        await client.views.open({
            trigger_id: body.trigger_id,
            view: {
                type: "modal",
                title: {
                    type: "plain_text",
                    text: event,
                    emoji: true
                },
                close: {
                    type: "plain_text",
                    text: "Close",
                    emoji: true
                },
                blocks: [
                    {
                        type: "alert",
                        text: {
                            type: "mrkdwn",
                            text: "Starslack is *not* meant for use in life-threatening situations.\nIf you're in a life-threatening scenario, *please use <https://weather.gov|official sources> instead*.",
                            verbatim: true
                        },
                        level: "warning"
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*VTEC Code:*\n\`${vtec}\``
                        }
                    },
                    {
                        type: "divider"
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*Headline:*\n\`\`\`${headline}\`\`\``
                        }
                    },
                    {
                        type: "divider"
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*Description:*\n\`\`\`${description}\`\`\``
                        }
                    },
                    {
                        type: "divider"
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*Instruction:*\n\`\`\`${instruction}\`\`\``
                        }
                    },
                    {
                        type: "divider"
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `Issued by <${senderUrl}|${sender}>. (${senderCode})\nView the full data <https://api.weather.gov/alerts/${alertId}|here>.`
                        }
                    }
                ]
            }
        });
    } catch (err) {
        console.error(err);
        // TODO: respond?
    }
});

app.command("/starslack-coin-flip", async ({ ack, respond }) => {
    await ack();

    const result = Math.round(Math.random());

    await respond({ text: result === 1 ? "It's Heads." : "Tails." });
});

app.command("/starslack-bunny", async ({ ack, respond }) => {
    await ack();

    try {
        const result = await axios.get("https://rabbit-api-two.vercel.app/api/random");

        const breed = result.data.breed;
        const url = result.data.url;

        await respond({
            blocks: [
                {
                    type: "image",
                    title: {
                        type: "plain_text",
                        text: breed,
                        emoji: true
                    },
                    image_url: url,
                    alt_text: `A ${breed} bunny/rabbit.`
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "Images provided by <https://rabbit-api-two.vercel.app/|Rabbit API>."
                    }
                }
            ]
        });
    } catch (err) {
        console.error(err);
        await respond({ text: "Failed to get a random bunny.\nHere's a generic one instead: 🐇" });
    }
});

(async () => {
    await app.start();
    console.log(`Started StarSlack.`);
})();