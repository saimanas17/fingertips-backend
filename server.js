const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./config/mongoose");
const custRoutes = require("./routes/routescustomer");
const proRoutes = require("./routes/routesprofessional");
const adminRoutes = require("./routes/routesadmin");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Origin",
    "http://fingertips-201005000.us-east-1.elb.amazonaws.com/"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.use("/user", custRoutes);
app.use("/user", proRoutes);
app.use("/user", adminRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
