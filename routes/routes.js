const express = require("express");
const router = express.Router();
const ProfessionalController = require("../controller/professionalcontroller");
const AdminController = require("../controller/admincontroller");
const CustomerController = require("../controller/customercontroller");
//Professional
router.post("/createprofessional", ProfessionalController.createUser); //checked
router.post("/fbptc", ProfessionalController.giveFeedbackfromprotocustomer); //checked
router.post("/changejobstatus", ProfessionalController.changeJobStatus); //checked
router.get("/:professionalemail/proservices", ProfessionalController.services); //checked
router.post(
  "/addNoteFromProfessional/:serviceId",
  ProfessionalController.addNoteFromProfessional
); //checked
router.get(
  "/getprobyemail/:email",
  ProfessionalController.getProfessionalByEmail
);
router.get("/getallprofessionals", ProfessionalController.getAllProfessionals);
router.post("/editpro/:email", ProfessionalController.editProfessional);
//Admin
router.post("/forgotpassword", AdminController.forgetPassword); //checked
router.post("/auth/:email", AdminController.authorizePro); //checked
router.post("/authenticate", AdminController.authenticate); //checked
router.post("/resetpass/:resetLink", AdminController.resetPassword); //checked
//Customer
router.get("/getcustomerbyemail/:email", CustomerController.getCustomerByEmail);
router.post("/createcustomer", CustomerController.createUser); //checked
router.post("/purchaseservice", CustomerController.purchaseService); //checked
router.get("/:customeremail/custservices", CustomerController.services); //checked
router.post("/payment/:customerEmail/:serviceId", CustomerController.payment);
router.post(
  "/addNoteFromCustomer/:serviceId",
  CustomerController.addNoteFromCustomer
); //checked
router.put("/editcustomer/:email", CustomerController.editCustomer);
router.post(
  "/fbctp",
  CustomerController.giveFeedbackfromcustomertoprofessional
); //checked
module.exports = router;
