const express = require('express')
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
app.post('/create-checkout-session/:product', (req, res) =>{

    const { product } = req.params
    let mode, price_ID, line_items

    if (product === 'sub'){
        price_ID = ''
        mode = 'subscription'
        line_items ={
            price: price_ID,
        }

    } else if (product === 'pre') {
        price_ID=''
        mode= 'payment'
        line_items={
            price: price_ID,
            quantity: 1,
        }


    } else {

        return res.sendStatus(403)

    }

}
)


app.listen(PORT, () => console.log(`Server has started on port: ${DOMAIN}`))