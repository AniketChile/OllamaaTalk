const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json()); // Required to parse JSON bodies

app.use('/api', chatRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
