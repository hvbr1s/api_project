require('dotenv').config();
const axios = require('axios');

axios.get('http://localhost:8888/api', {
    params: {
        api_key: process.env.FIREBASE_API_KEY,
        user_input: "Hello!",
        user_id: "8888"
    }
})
.then(function (response) {
    console.log(response.data);
})
.catch(function (error) {
    console.log(error);
});