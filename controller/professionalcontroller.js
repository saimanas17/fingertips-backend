const bcrypt = require("bcryptjs");
const Professional = require("../model/professional");
const Service = require("../model/service");
const Customer = require("../model/customer");
const nodeMailer = require("../config/nodemailer");
const multer = require("multer");
const path = require("path");
// const services = async (req, res) => {
//   try {
//     const professionalEmail = req.params.professionalemail;

//     // Find all services where the professionalEmail matches
//     const services = await Service.find({ professionalEmail });

//     res.json(services); // Return the found services
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };
const services = async (req, res) => {
  try {
    const professionalEmail = req.params.professionalemail;

    // Find all services where the professionalEmail matches
    const services = await Service.find({ professionalEmail });

    // Array to store results
    const results = [];

    // Iterate over each service
    for (const service of services) {
      // Extract unique ID
      const uniqueId = service.uniqueid;

      // Find professional with that unique ID
      const professional = await Professional.findOne({
        "jobs.uniqueid": uniqueId,
      });
      const client = await Customer.findOne({
        "purchased_services.uniqueid": uniqueId,
      });

      // If professional found, push their DOB to results

      if (professional) {
        results.push({
          _id: service._id,
          uniqueId: uniqueId,
          location: service.location,
          job_date: service.jobDate,
          deadline: service.deadline,
          status: service.status,
          payment: service.payment,
          job: professional.profession,
          client_name: client.firstname + " " + client.lastname,
          client_phone: client.phonenum,
          client_email: client.email,
          feedback_from_cust_to_pro: service.customerFeedback.text,
          client_rating_to_pro: service.customerFeedback.rating,
          feedback_from_pro_to_cust: service.professionalFeedback.text,
          pro_rating_to_cust: service.professionalFeedback.rating,
          notes: service.notes.map((note) => ({
            text: note.text,
            author: note.author,
          })),
        });
      }
    }

    // Define sorting order based on status
    const statusOrder = ["pending", "in_progress", "completed", "cancelled"];

    // Sort results based on status
    results.sort(
      (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
    );

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getservicebyid = async (req, res) => {
  try {
    const professionalEmail = req.params.professionalemail;
    const serviceidtosearch = req.params.serviceid;
    // Find all services where the professionalEmail matches
    const services = await Service.find({ professionalEmail });

    // Array to store results
    const results = [];

    // Iterate over each service
    for (const service of services) {
      // Extract unique ID
      const uniqueId = service.uniqueid;

      // Find professional with that unique ID
      const professional = await Professional.findOne({
        "jobs.uniqueid": uniqueId,
      });
      const client = await Customer.findOne({
        "purchased_services.uniqueid": uniqueId,
      });

      // If professional found, push their DOB to results
      if (professional) {
        results.push({
          _id: service._id,
          uniqueId: uniqueId,
          location: service.location,
          job_date: service.jobDate,
          deadline: service.deadline,
          status: service.status,
          payment: service.payment,
          job: professional.profession,
          client_name: client.firstname + " " + client.lastname,
          client_phone: client.phonenum,
          client_email: client.email,
          feedback_from_cust_to_pro: service.customerFeedback.text,
          client_rating_to_pro: service.customerFeedback.rating,
          feedback_from_pro_to_cust: service.professionalFeedback.text,
          pro_rating_to_cust: service.professionalFeedback.rating,
          notes: service.notes.map((note) => ({
            text: note.text,
            author: note.author,
          })),
        });
      }
    }

    const serviceById = results.find(
      (service) => service.uniqueId === serviceidtosearch
    );

    if (!serviceById) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(serviceById);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
    if (!passwordRegex.test(userData.password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
      });
    }

    // Validate phone number
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(userData.phonenum)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Validate zip code
    const zipRegex = /^\d{5}$/;
    if (!zipRegex.test(userData.address.zip)) {
      return res.status(400).json({ message: "Invalid zip code format" });
    }

    // Check if the email already exists
    const existingUser = await Professional.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create a new professional user
    const newUser = new Professional({
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      profession: userData.profession,
      dob: userData.dob,
      password: hashedPassword,
      phonenum: userData.phonenum,
      address: {
        line1: userData.address.line1,
        line2: userData.address.line2,
        city: userData.address.city,
        state: userData.address.state,
        zip: userData.address.zip,
      },
    });

    // Save the user to the database
    await newUser.save();
    nodeMailer.transporter.sendMail(
      {
        from: "fingertips.root@.com",
        to: newUser.email,
        subject: "Your Registration is Pending Approval",
        html: `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .title {
                        color: #333333;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    .content {
                        color: #666666;
                        font-size: 16px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        color: #999999;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 class="title">Your Registration is Pending Approval</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${newUser.firstname},</p>
                        <p>Your registration with Fingertips is pending approval by the admin.</p>
                        <p>We will notify you via email once your registration has been approved.</p>
                        <p>Thank you for your patience.</p>
                    </div>
                    <div class="footer">
                        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
                        <p>This email was sent automatically. Please do not reply to it.</p>
                    </div>
                </div>
            </body>
        </html>
    `,
      },
      (err, info) => {
        if (err) {
          console.log(err);
          return;
        }
        console.log("Message sent", info);
        return res.json({
          message: "Success",
        });
      }
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const addNoteFromProfessional = async (req, res) => {
  try {
    const { serviceId } = req.params; // Extract service ID from request params
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    const { text } = req.body; // Extract note text from request body
    const professionalEmail = service.professionalEmail; // Extract professional email from authenticated user
    const professional = await Professional.findOne({
      email: professionalEmail,
    });
    // Add the note to the service document
    service.notes.push({
      text,
      author: professional.firstname + " " + professional.lastname,
    });

    // Save the updated service document
    await service.save();

    res.status(200).json(service); // Return the updated service document
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const changeJobStatus = async (req, res) => {
  try {
    const { serviceId, newStatus } = req.body;

    // Update the service document
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    service.status = newStatus;
    await service.save();

    // Update the professional document
    const professional = await Professional.findOne({
      email: service.professionalEmail,
    });

    if (!professional) {
      return res.status(404).json({ error: "Professional not found" });
    }
    const client = await Customer.findOne({ email: service.customerEmail });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const uiq = service.uniqueid;
    // Find the index of the service in the professional's jobs array
    professional.jobs.forEach((job, index) => {
      // Check if client email matches cEmail
      if (job.uniqueid === uiq) {
        // Update feedback for the matching job
        professional.jobs[index].status = newStatus;
      }
    });
    client.purchased_services.forEach((job, index) => {
      if (job.uniqueid == uiq) {
        client.purchased_services[index].status = newStatus;
      }
    });

    await client.save();
    await professional.save();

    res.status(200).json({ message: "Job status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const giveFeedbackfromprotocustomer = async (req, res) => {
  try {
    const { serviceId, text, rating } = req.body;

    // Find the service by ID
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Check if the service status is "completed"
    if (service.status !== "completed") {
      return res
        .status(400)
        .json({ error: "Feedback can only be given for completed services" });
    }

    const customerEmail = service.customerEmail;
    // Update the feedback in the service document
    service.professionalFeedback = { text, rating };

    // Save the updated service document
    await service.save();

    const client = await Customer.findOne({ email: customerEmail });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const uiq = service.uniqueid;
    // Find the index of the service in the professional's jobs array
    client.purchased_services.forEach((job, index) => {
      if (job.uniqueid == uiq) {
        client.purchased_services[index].feedback = { text, rating };
      }
    });

    await client.save();

    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProfessionalByEmail = async (req, res) => {
  const { email } = req.params; // Extracting email from route parameters

  try {
    // Find the professional by email
    const professional = await Professional.findOne({ email });

    if (!professional) {
      return res.status(404).json({ message: "Professional not found" });
    }

    res.status(200).json({ professional });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getAllProfessionals = async (req, res) => {
  try {
    // Find all professionals
    const professionals = await Professional.find({ isAuth: true });

    res.status(200).json({ professionals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //cb(null, "/usr/src/app/professional-images");
    cb(
      null,
      "D:/STUDY/NEU/Web Design 6150/Assignment/Grp Project/Backend/professional-images"
    );
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage: storage });

// Middleware to handle file upload
const uploadImage = upload.single("image");
const editProfessional = async (req, res) => {
  const { email } = req.params; // Extracting email from route parameters
  console.log(email);
  // Destructuring request body for editable fields
  const { firstname, lastname, password, phonenum, address } = req.body;

  try {
    // Find the professional by email
    let professional = await Professional.findOne({ email });

    if (!professional) {
      console.log("not found");
      return res.status(404).json({ message: "Professional not found" });
    }

    // Update editable fields if they are provided in the request
    if (firstname) professional.firstname = firstname;
    if (lastname) professional.lastname = lastname;
    if (password) professional.password = password;
    if (phonenum) professional.phonenum = phonenum;
    if (address) {
      if (address.line1) professional.address.line1 = address.line1;
      if (address.line2) professional.address.line2 = address.line2;
      if (address.city) professional.address.city = address.city;
      if (address.state) professional.address.state = address.state;
      if (address.zip) professional.address.zip = address.zip;
    }

    // Check if an image is provided in the request body
    if (req.file) {
      uploadImage(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: "Error uploading image" });
        } else if (err) {
          console.log("error");
          return res.status(500).json({ message: "Internal server error" });
        }

        // If image uploaded successfully, update professional's image field
        if (req.file) {
          professional.image = req.file.filename;
        }

        // Save the updated professional
        await professional.save();

        res.status(200).json({
          message: "Professional details updated successfully",
          professional,
        });
      });
    } else {
      // Save the professional without uploading an image
      await professional.save();
      res.status(200).json({
        message: "Professional details updated successfully",
        professional,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllProfessionalsByProfession = async (req, res) => {
  try {
    const { profession } = req.params;

    // Find all professionals with the specified profession
    const professionals = await Professional.find({ profession, isAuth: true });

    res.status(200).json({ professionals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllProfessionalsByProfession,
  createUser,
  services,
  addNoteFromProfessional,
  changeJobStatus,
  giveFeedbackfromprotocustomer,
  getProfessionalByEmail,
  getAllProfessionals,
  editProfessional,
  getservicebyid,
};
