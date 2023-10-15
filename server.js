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
const { database } = require('firebase-admin')

// API key generator
function generateApiKey(length = 20) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sk-'+'';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Routes
// Health check endpoint
app.get('/_health', (req, res) => {
    res.status(200).send('OK');
  });

// GPT Route
app.post('/api', async (req, res) => {
    console.log('Received request for /api');
    const api_key = req.headers.authorization;
    const { user_input, user_id } = req.body;
    if (!api_key) {
        console.log('No api_key provided');
        return res.sendStatus(403);
    }
    let paid_status;
    const doc = await db.collection('api_keys').doc(api_key).get();
    if (!doc.exists) {
        console.log('API Key is invalid');
        return res.status(403).send({ 'status': "API Key is invalid" });
    } else {
        const { status, stripeCustomerId } = doc.data();
        console.log(`status: ${status}, stripeCustomerId: ${stripeCustomerId}`);
        if (status === 'subscription' || status > 0) {
            paid_status = true;
            if (status === 'subscription') {
                console.log('Status is subscription');
                const customer = await stripe.customers.retrieve(
                    stripeCustomerId,
                    { expand: ['subscriptions'] }
                );

                let subscriptionId = customer?.subscriptions?.data?.[0]?.id;
                if (!subscriptionId) {
                    console.log('No subscription found for this customer');
                    return res.status(400).send({'status': 'No subscription found for this customer'});
                }
                console.log(`subscriptionId: ${subscriptionId}`);
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const itemId = subscription?.items?.data[0].id;
                console.log(`itemId: ${itemId}`);

                const record = stripe.subscriptionItems.createUsageRecord(
                    itemId, {
                    quantity: 1,
                    timestamp: 'now',
                    action: 'increment'
                });
                console.log('Usage record created');
            } else {
                console.log('Status is greater than 0');
                const data = {
                    status: status - 1
                };
                const dbRes = await db.collection('api_keys').doc(api_key).set(data, { merge: true });
                console.log('Status decremented by 1');
            }
        }
    }

    if (paid_status) {
        try {
            console.log('Making request to http://35.180.32.119:80/');
            const response = await axios.post('http://35.180.32.119:80/', {
                user_input: user_input,
                user_id: user_id
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Received response:', response.data);
            res.status(200).send(response.data); // Forward the response from the target address
        } catch (error) {
            console.error('Error during forwarding request:', error);
            res.status(error.response ? error.response.status : 500).send(error.message);
        }
    } else {
        console.log('Paid status is false');
        res.sendStatus(403);
    }
});

app.get('/check_status', async (req, res) => {
    console.log('Received request for /check_status');
    const {api_key} = req.query
    const decodedApiKey = decodeURIComponent(api_key);
    const doc = await db.collection('api_keys').doc(decodedApiKey).get();
    if (!doc.exists){
        console.log('API key does not exist');
        res.status(400).send({'status': 'Sorry, this API key does not exist!'})
    }
    else {
        const {status} = doc.data()
        console.log('API key status: ', status);
        res.status(200).send({'status': status })
    }
})

app.get('/delete', async (req,res)=>{
    console.log('Received request for /delete');
    const {api_key} = req.query
    const doc = await db.collection('api_keys').doc(api_key).get()
    if (!doc.exists){
        console.log('API key does not exist');
        res.status(400).send({'status': 'Sorry, this API key does not exist!'})
    }
    else {
        const {stripeCustomerId} = doc.data()
        if (!stripeCustomerId) {
            console.log('No stripeCustomerId found for this API key');
            return res.status(400).send({'status': 'No stripeCustomerId found for this API key'});
        }
        try {
            const customer = await stripe.customers.retrieve(
                stripeCustomerId,
                {expand: ['subscriptions']}
            )
            let subscriptionId = customer?.subscriptions?.data?.[0]?.id
            console.log(subscriptionId)
            if (!subscriptionId) {
                console.log('No subscription found for this customer');
                return res.status(400).send({'status': 'No subscription found for this customer'});
            }
            await stripe.subscriptions.cancel(subscriptionId)
        
            const data = {
                status: null //subscription or 8
            }
            const dbRes = await db.collection('api_keys').doc(api_key).set(data, { merge: true })

        }
        catch (err) {
            console.log(err.message)
            return res.sendStatus(500)
        }
        res.sendStatus(200)
    }
})


app.post('/create-checkout-session/:product', async (req, res) =>{

    const { product } = req.params
    let mode, price_ID, line_items

    if (product === 'sub'){
        price_ID = 'price_1Nw3pUK2BEcUysLFWJ1BgWJw'
        mode = 'subscription'
        line_items = [{
            price: price_ID,
        }]
        quantity_type = 'subscription'

    } else if (product === 'pre') {
        price_ID='price_1Nw54sK2BEcUysLFWyuX0UBW'
        mode= 'payment'
        line_items = [{
            price: price_ID,
            quantity: 1,
        }]
        quantity_type = '100'

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
    const encodedApiKey = encodeURIComponent(newAPIKey);
    const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        metadata: {
            APIkey: newAPIKey,
            payment_type: product
        },
        line_items: line_items,
        mode: mode,
        success_url: `https://api-store-enhg.onrender.com/success.html?apikey=${encodedApiKey}`,
        cancel_url: `https://api-store-enhg.onrender.com/cancel.html`,
    })

    // create firebase record
    const data = {
            APIkey: newAPIKey,
            payment_type: product,
            stripeCustomerId,
            status: quantity_type
    }
    const dbRes = await db.collection('api_keys').doc(newAPIKey).set
    (data, {merge: true})

    //use webhook to access firebase entry for api key
    res.redirect(303, session.url)
})

app.listen(PORT, () => console.log(`Server has started on port: ${DOMAIN}`))
