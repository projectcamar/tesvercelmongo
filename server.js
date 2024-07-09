const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/:category', (req, res) => {
    const category = req.params.category;
    const fileName = `${category}.json`;
    res.sendFile(path.join(__dirname, 'data', fileName));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
