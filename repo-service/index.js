require("dotenv").config();
const express = require("express");
const repoRoutes = require("./routes/repo");

const app = express();
app.use(express.json());

app.use("/", repoRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Repo Service running on port ${PORT}`));
