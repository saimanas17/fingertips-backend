const express = require("express");
const router = express.Router();

const CustomerController = require("../controller/customercontroller");

//Customer
router.get(
  "/getcustservicebyid/:customeremail/:serviceid",
  CustomerController.getservicebyid
);
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
