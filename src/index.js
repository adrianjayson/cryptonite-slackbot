require('dotenv').config();

const rtm = require('@slack/rtm-api');

const cryptoniteBot = new rtm.RTMClient(process.env.BOT_TOKEN);

cryptoniteBot.start().catch(console.error);

cryptoniteBot.on('ready', async() => {
    console.log('Bot started.');
});