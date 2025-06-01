require("dotenv").config();
const express = require("express");
const session = require("./sessionStore");
const passport = require("passport");
const authRoutes = require("./routes/auth");

const app = express();

app.use(session);
app.use(passport.initialize());
app.use(passport.session());

app.use("/", authRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Auth Service running on port ${process.env.PORT}`);
});
