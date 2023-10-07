const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

//let serviceAccount = require('./creds.json')
let serviceAccount = require('/etc/secrets/creds.json')

initializeApp({
    credential: cert(serviceAccount)
})

const db = new getFirestore()

module.exports = { db }
