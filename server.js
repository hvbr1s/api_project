const { generateApiKey } = require('generate-api-key')
const PORT = 8888
require('dotenv').config()
const {db} = require('./firebase.js')

// Env Variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const stripe = require('stripe')(STRIPE_SECRET_KEY)
const DOMAIN = `http://localhost:${PORT}/`

// Initialize express app
const express = require('express');
const app = express()
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public')) // for parsing application/x-www-form-urlencoded

// Initialize axios
const axios = require('axios');

// routes
app.get('/api', async (req, res) => {
    const { api_key } = req.query;
    if (!api_key) {
        return res.sendStatus(403);
    } else {
        try {
            const response = await axios.get('https://knowlbot.aws.prd.ldg-tech.com/');
            res.status(200).send(response.data); // Forward the response from the target address
        } catch (error) {
            console.error('Error during forwarding request:', error);
            res.status(error.response ? error.response.status : 500).send(error.message);
        }
    }
});


app.post('/create-checkout-session/:product', async (req, res) =>{

    const { product } = req.params
    let mode, price_ID, line_items

    if (product === 'sub'){
        price_ID = 'price_1Nw3pUK2BEcUysLFWJ1BgWJw'
        mode = 'subscription'
        line_items = [{
            price: price_ID,
        }]

    } else if (product === 'pre') {
        price_ID='price_1Nw54sK2BEcUysLFWyuX0UBW'
        mode= 'payment'
        line_items = [{
            price: price_ID,
            quantity: 1,
        }]

    } else {
        return res.sendStatus(403)
    }

    const newAPIKey = generateApiKey()
    const customer = await stripe.customers.create({
        metadata: {
            APIkey: newAPIKey,
            payment_type: product
        }
    })

    const stripeCustomerId = customer.id
    const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        metadata: {
            APIkey: newAPIKey,
            payment_type: product
        },
        line_items: line_items,
        mode: mode,
        success_url: `${DOMAIN}/success.html?apikey=${newAPIKey}`,
        cancel_url: `${DOMAIN}/cancel.html`,
    })

    // create firebase record
    const data = {
            APIkey: newAPIKey,
            payment_type: product,
            stripeCustomerId
    }
    const dbRes = await db.collection('api_keys').doc(newAPIKey).set
    (data, {merge: true})


    //use webhook to access firebase entry for api key
    res.redirect(303, session.url)
})

app.listen(PORT, () => console.log(`Server has started on port: ${DOMAIN}`))
