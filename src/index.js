require('dotenv').config();

const kwBank = require('./constants/KeywordsBank');
const { GREET, CRYPTO_UNAVAILABLE, CRYPTO_NOT_FOUND } = require('./constants/Responses');
const { isInMessage, isAllInMessage } = require('./utils/KeywordUtils');
const { getCoins, getCoin } = require('./client/CoinRankingClient');
const { moneyFormatter, decimalFormatter } = require('./utils/Formatters');

const { RTMClient } = require('@slack/rtm-api');
const { WebClient } = require('@slack/web-api');

const packageJson = require('../package.json');

const cryptoniteBot = new RTMClient(process.env.BOT_TOKEN);
const webClient = new WebClient(process.env.BOT_TOKEN);

let coinsList = [];

cryptoniteBot.start().catch(console.error);

cryptoniteBot.on('ready', async () => {
    await initializeCoins();

    console.log('Bot started.');
    
    announce(`Cryptonite v.${packageJson.version} is online! Powered by Coinranking.com`, 'im');
});

cryptoniteBot.on('slack_event', async (eventType, event) => {

    if(event 
        && event.type === 'message' 
        && event.subtype !== 'bot_message') {

        if(isInMessage(event.text, kwBank.HELLO)) {
            hello(event.channel);
        }

        if(isInMessage(event.text, kwBank.COINS_UPDATE_ANY_KW)) {
            
            const response = await getCoinsUpdate();

            sendMessage(event.channel, response.message, response.attachments);

        } else if(isAllInMessage(event.text, kwBank.COIN_PRICE_ALL_KW) || 
            isInMessage(event.text, kwBank.COIN_PRICE_ANY_KW)) {
            
            const coin = getCoinFromMessage(event.text);
            console.log(coin);
            const response = await getCoinPrice(coin);

            sendMessage(event.channel, response, null);

        } else if(isAllInMessage(event.text, kwBank.COIN_UPDATE_ALL_KW) || 
            isInMessage(event.text, kwBank.COIN_UPDATE_ANY_KW)) {
            
            const coin = getCoinFromMessage(event.text);
            console.log(coin);
            const response = await getCoinUpdate(coin);

            sendMessage(event.channel, response.message, response.attachments);

        }
    }

});

const sendMessage = async (channel, text, attachments) => {
    await webClient.chat.postMessage({
        channel,
        text,
        attachments
    });
};

const announce = async (message, types, attachments)=> {
    const response = await webClient.conversations.list({
        types
    });
    response.channels.forEach(channel => {
        sendMessage(channel.id, message, attachments);
    });
};

const hello = (channelId) => {
    sendMessage(channelId, GREET, null);
};

const getCoinsUpdate = async () => {
    const response = {
        message: CRYPTO_UNAVAILABLE,
        attachments: []
    };
    const coinsData = await getCoins();

    if (coinsData && coinsData.length) {

        coinsData.forEach(coinData => {
            response.attachments.push(buildAttachment(coinData));
        });
        
        response.message = 'Here you go,';

        return response;
    }
    
    return response;
};

const buildAttachment = ({name, websiteUrl, price, change, marketCap}) => {
    return {
        "color": change > 0 ? '2ecc71' : 'e74c3c',
        "title": name,
        "title_link": websiteUrl,
        "fields": [
            {
                "title": "Price",
                "value": moneyFormatter(price),
                "short": false
            },
            {
                "title": "Market Cap",
                "value": decimalFormatter(marketCap),
                "short": false
            },
            {
                "title": "24H Change",
                "value": `${change}%`,
                "short": false
            }
        ]
    };
};

const initializeCoins = async () => {
    console.log('Initializing coins...');
    const coins = await getCoins();
    coinsList = getCoinsMapping(coins);
    console.log(coinsList);
};

const getCoinsMapping = (coins) => {
    return coins.map(coin => ({
        id: coin.id, 
        name: coin.name
    })).sort((a, b) => {
        if (a.name > b.name) {
            return 1;
          }
          if (a.name < b.name) {
            return -1;
          }
          return 0;
    }).reverse();
};

const getCoinFromMessage = (message) => {
    const coin = coinsList.find(coin => isInMessage(message, [coin.name.toLowerCase()]));

    if(coin) {
        return coin;
    } else {
        return null;
    }
};

const getCoinPrice = async (coin) => {
    if(coin) {
        coinData = await getCoin(coin.id);
    
        return coinData ? `${coin.name} is currently worth ${moneyFormatter(coinData.price)}.` :
            CRYPTO_UNAVAILABLE;
    }
    return CRYPTO_NOT_FOUND;
};

const getCoinUpdate = async (coin) => {
    const response = {
        message: CRYPTO_NOT_FOUND,
        attachments: []
    };
    
    if(coin) {
        const coinData = await getCoin(coin.id);

        if (coinData) {
            response.attachments.push(buildAttachment(coinData));
            response.message = 'Here you go,';
        } else {
            response.message = CRYPTO_UNAVAILABLE;
        }
    }
    
    return response;
};