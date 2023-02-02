const express = require('express');
const app = express();

app.get('/api/sayhello', (req, res) =>{
    res.json({message: 'Whattup'});
});

//i will not be setting env on amazon but let it go to 3000
const port = process.env.port || 3000;
app.listen(port, () => {
    console.log(`Server is ready on port ${port}`);
});