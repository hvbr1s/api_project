const express = require('express')
const { generateApiKey } = require('generate-api-key')
const app = express()
const PORT = 8888
require('dotenv').config()

// Env Variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const stripe = require('stripe')(STRIPE_SECRET_KEY)
const DOMAIN = `http://localhost:${PORT}/`

// middleware
app.use(express.static('public'))

// routes
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
            APIkey: newAPIKey
        },
        line_items: line_items,
        mode: mode,
        success_url: `${DOMAIN}/success.html?api_key=${newAPIKey}`,
        cancel_url: `${DOMAIN}/cancel.html`,
    })

    // create firebase record

    //use webhook to access firebase entry for api key
    res.redirect(303, session.url)
})

app.listen(PORT, () => console.log(`Server has started on port: ${DOMAIN}`))
