const express = require("express");
const router = express.Router();
const AdminController = require("../controller/admincontroller");
router.post("/forgotpassword", AdminController.forgetPassword); //checked
router.post("/auth/:email", AdminController.authorizePro); //checked
router.post("/authenticate", AdminController.authenticate); //checked
router.post("/resetpass/:resetLink", AdminController.resetPassword);
router.get("/getallunauth", AdminController.unauthusers); //checked
module.exports = router;
