const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./config/mongoose");
const userRoutes = require("./routes/routes");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

app.use("/user", userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
