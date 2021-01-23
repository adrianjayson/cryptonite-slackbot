require('dotenv').config();

const axios = require('axios').default;

module.exports = {
    getCoins: () => {
        const options = {
            method: 'GET',
            url: `https://${process.env.API_HOST}/coins`,
            headers: {
              'x-rapidapi-key': process.env.API_KEY,
              'x-rapidapi-host': process.env.API_HOST
            }
        };

        return axios.request(options).then((response) => {
            return response.data.data.coins;
        }).catch((error) => {
            console.error(error);
        });
    },

    getCoin: (coinId) => {
        const options = {
            method: 'GET',
            url: `https://${process.env.API_HOST}/coin/${coinId}`,
            headers: {
              'x-rapidapi-key': process.env.API_KEY,
              'x-rapidapi-host': process.env.API_HOST
            }
        };

        return axios.request(options).then((response) => {
            return response.data.data.coin;
        }).catch((error) => {
            console.error(error);
        });
    }
}