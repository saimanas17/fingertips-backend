const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./config/mongoose");
const custRoutes = require("./routes/routescustomer");
const proRoutes = require("./routes/routesprofessional");
const adminRoutes = require("./routes/routesadmin");


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

app.use("/user", custRoutes);
app.use("/user", proRoutes);
app.use("/user", adminRoutes);


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
