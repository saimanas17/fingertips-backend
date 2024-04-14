const express = require("express");
const router = express.Router();
const ProfessionalController = require("../controller/professionalcontroller");
router.post("/createprofessional", ProfessionalController.createUser); //checked
router.post("/fbptc", ProfessionalController.giveFeedbackfromprotocustomer); //checked
router.post("/changejobstatus", ProfessionalController.changeJobStatus); //checked
router.get("/:professionalemail/proservices", ProfessionalController.services); //checked
router.post(
  "/addNoteFromProfessional/:serviceId",
  ProfessionalController.addNoteFromProfessional
); //checked
router.get(
  "/getservicebyid/:professionalemail/:serviceid",
  ProfessionalController.getservicebyid
);
router.get(
  "/getprobyemail/:email",
  ProfessionalController.getProfessionalByEmail
);
router.get("/getallprofessionals", ProfessionalController.getAllProfessionals);
router.get(
  "/getallprofessionalsbyprofession/:profession",
  ProfessionalController.getAllProfessionalsByProfession
);
router.put("/editpro/:email", ProfessionalController.editProfessional);
module.exports = router;
