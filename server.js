const express = require('express')
const app = express()
const PORT = 8888

// middleware
app.use(express.static('public'))

app.listen(PORT, () => console.log(`Server has started on port: ${PORT}`))