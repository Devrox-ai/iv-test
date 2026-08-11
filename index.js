const express = require('express');
const app = express()
const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.send('index com heloo meooooow')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

