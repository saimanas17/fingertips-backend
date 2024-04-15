const bcrypt = require("bcryptjs");
const Customer = require("../model/customer");
const Professional = require("../model/professional");
const Service = require("../model/service");
const nodeMailer = require("../config/nodemailer");
const multer = require("multer");
const path = require("path");

const services = async (req, res) => {
  try {
    const customerEmail = req.params.customeremail;

    // Find all services where the customerEmail matches
    const services = await Service.find({ customerEmail });
    const results = [];
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

      if (client) {
        results.push({
          _id: service._id,
          uniqueId: uniqueId,
          location: service.location,
          job_date: service.jobDate,
          deadline: service.deadline,
          status: service.status,
          payment: service.payment,
          job: professional.profession,
          professional_name:
            professional.firstname + " " + professional.lastname,
          professional_phone: professional.phonenum,
          professional_email: professional.email,
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

    res.json(results); // Return the found services
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getservicebyid = async (req, res) => {
  try {
    const customerEmail = req.params.customeremail;
    const serviceidtosearch = req.params.serviceid;
    // Find all services where the customerEmail matches
    const services = await Service.find({ customerEmail });
    const results = [];
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

      if (client) {
        results.push({
          _id: service._id,
          uniqueId: uniqueId,
          location: service.location,
          job_date: service.jobDate,
          deadline: service.deadline,
          status: service.status,
          payment: service.payment,
          job: professional.profession,
          professional_name:
            professional.firstname + " " + professional.lastname,
          professional_phone: professional.phonenum,
          professional_email: professional.email,
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
    const {
      firstname,
      lastname,
      dob,
      email,
      password,
      phonenum,
      address,
      purchased_services,
    } = req.body;

    // Check if the email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Validation regex patterns
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    const zipRegex = /^\d{5}$/;

    // Validate email
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password
    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^a-zA-Z\d]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
      });
    }

    // Validate phone number
    if (!phoneRegex.test(phonenum)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Validate zip code
    if (address.zip && !zipRegex.test(address.zip)) {
      return res.status(400).json({ message: "Invalid zip code format" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new customer
    const newCustomer = new Customer({
      firstname,
      lastname,
      dob,
      email,
      password: hashedPassword,
      phonenum,
      address,
      purchased_services,
    });

    // Save the customer to the database
    await newCustomer.save();
    nodeMailer.transporter.sendMail(
      {
        from: "fingertips.root@gmail.com",
        to: newCustomer.email,
        subject: "Welcome to Fingertips!",
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
                        <h1 class="title">Welcome to Fingertips!</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${newCustomer.firstname},</p>
                        <p>Thank you for registering with Fingertips. We are excited to have you on board!</p>
                        <p>You can now log in to your account using the credentials you provided during registration.</p>
                        <p>We hope you have a great experience with our platform.</p>
                    </div>
                    <div class="footer">
                        <p>If you have any questions, feel free to contact us.</p>
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
    res.status(201).json({ message: "Customer created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const purchaseService = async (req, res) => {
  try {
    const {
      customerEmail,
      professionalEmail,
      jobType,
      description,
      location,
      jobDate,
      deadline,
      payment,
      status,
    } = req.body;
    const parsedJobDate = new Date(jobDate);
    const parsedDeadline = new Date(deadline);

    let availableProfessional;

    if (!professionalEmail || professionalEmail === "notgiven@gmail.com") {
      // If no professionalEmail provided, find an available professional with the same jobType
      availableProfessional = await Professional.findOne({
        profession: jobType,
        isAuth: true, // Consider only professionals with isAuth set to true
        "jobs.job_date": { $not: { $lte: jobDate }, $not: { $gte: deadline } },
      });

      if (!availableProfessional) {
        return res
          .status(404)
          .json({ error: "No available professionals for this job type" });
      }
    } else {
      // Find the professional based on the professionalEmail
      const professional = await Professional.findOne({
        email: professionalEmail,
        isAuth: true, // Consider only professionals with isAuth set to true
      });

      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }

      // Check professional's availability
      for (const job of professional.jobs) {
        const jobStartDate = new Date(job.job_date);
        const jobEndDate = new Date(job.deadline);
        if (
          (parsedJobDate >= jobStartDate && parsedJobDate <= jobEndDate) ||
          (parsedDeadline >= jobStartDate && parsedDeadline <= jobEndDate) ||
          (jobStartDate >= parsedJobDate && jobEndDate <= parsedDeadline)
        ) {
          return res.status(400).json({
            error: "Professional is not available during this time",
          });
        }
      }

      availableProfessional = professional;
    }

    // Create a new service object

    const uniqueString =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    const newService = new Service({
      customerEmail,
      professionalEmail: availableProfessional.email,
      description,
      jobType,
      location,
      jobDate,
      deadline,
      payment,
      status,
      uniqueid: uniqueString,
      notes: [{ text: "Your appointment is booked!!", author: "admin" }],
    });

    // Save the service to the database
    const savedService = await newService.save();

    // Extract client's name and phone number
    const client = await Customer.findOne({ email: customerEmail });
    const clientName = client ? client.firstname + " " + client.lastname : "";
    const clientPhone = client ? client.phonenum : "";

    const proName =
      availableProfessional.firstname + " " + availableProfessional.lastname;
    const proPhone = availableProfessional.phonenum;

    // Push the newly created service to the professional's jobs array
    availableProfessional.jobs.push({
      description,
      location,
      job_date: jobDate,
      deadline,
      status,
      payment,
      client: {
        name: clientName,
        phone: clientPhone,
        email: customerEmail,
      },
      uniqueid: uniqueString,
    });

    // Push the newly created service to the client's purchased_services array
    client.purchased_services.push({
      description,
      location,
      job_date: jobDate,
      jobType,
      deadline,
      status,
      payment,
      professional: {
        name: proName,
        phone: proPhone,
        email: availableProfessional.email,
      },
      uniqueid: uniqueString,
    });

    // Save the updated professional document and the client document
    await availableProfessional.save();
    await client.save();

    res.status(201).json(savedService); // Return the newly created service
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addNoteFromCustomer = async (req, res) => {
  try {
    const { serviceId } = req.params; // Extract service ID from request params
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    const { text } = req.body; // Extract note text from request body
    const customerEmail = service.customerEmail; // Extract customer email from authenticated user

    const client = await Customer.findOne({
      email: customerEmail,
    });
    service.notes.push({
      text,
      author: client.firstname + " " + client.lastname,
    });

    // Save the updated service document
    await service.save();

    res.status(200).json(service); // Return the updated service document
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const payment = async (req, res) => {
  const { customerId, serviceId } = req.params;
  try {
    // Find the service by service ID and customer ID
    const service = await Service.findOne({
      _id: serviceId,
      customerEmail: customerId,
    });
    if (!service) {
      return res
        .status(404)
        .json({ message: "Service not found for the provided customer" });
    }

    // Update payment status
    service.payment = true; // Change payment status to false
    await service.save();

    return res
      .status(200)
      .json({ message: "Payment status updated successfully", service });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const giveFeedbackfromcustomertoprofessional = async (req, res) => {
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

    const professionalEmail = service.professionalEmail;

    // Update the feedback in the service document
    service.customerFeedback = { text, rating };

    // Save the updated service document
    await service.save();

    // Find the professional by email
    const professional = await Professional.findOne({
      email: professionalEmail,
    });

    if (!professional) {
      return res.status(404).json({ error: "Professional not found" });
    }
    const uiq = service.uniqueid;
    // Find the index of the service in the professional's jobs array
    professional.jobs.forEach((job, index) => {
      // Check if unique ID matches uiq
      if (job.uniqueid === uiq) {
        // Update feedback for the matching job
        professional.jobs[index].feedback = { text, rating };
      }
    });

    await professional.save();
    let totalRating = 0;
    let numRatings = 0;
    for (const job of professional.jobs) {
      if (job.feedback && job.feedback.rating !== undefined) {
        totalRating += job.feedback.rating;

        numRatings++;
      }
    }
    console.log(totalRating);
    console.log(numRatings);
    professional.avgrating = numRatings > 0 ? totalRating / numRatings : null;

    await professional.save();

    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/usr/src/app/customer-images");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Multer upload configuration
const upload = multer({ storage: storage });

// Middleware to handle file upload
const uploadImage = upload.single("image"); // Assuming the field name for image is 'image'

const editCustomer = async (req, res) => {
  const { email } = req.params; // Extracting email from route parameters

  // Destructuring request body for editable fields
  const { firstname, lastname, password, phonenum, address } = req.body;

  try {
    // Find the customer by email
    let customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update editable fields if they are provided in the request
    if (firstname) customer.firstname = firstname;
    if (lastname) customer.lastname = lastname;
    if (password) customer.password = password;
    if (address) {
      if (address.line1) customer.address.line1 = address.line1;
      if (address.line2) customer.address.line2 = address.line2;
      if (address.city) customer.address.city = address.city;
      if (address.state) customer.address.state = address.state;
      if (address.zip) customer.address.zip = address.zip;
    }
    if (phonenum) customer.phonenum = phonenum;

    // Handle image upload if provided in the request
    uploadImage(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Error uploading image" });
      } else if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }

      // If image uploaded successfully, update customer's image field
      if (req.file) {
        customer.image = req.file.filename;
      }

      // Save the updated customer
      await customer.save();

      res
        .status(200)
        .json({ message: "Customer details updated successfully", customer });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getCustomerByEmail = async (req, res) => {
  const { email } = req.params; // Extracting email from route parameters

  try {
    // Find the customer by email
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  createUser,
  purchaseService,
  services,
  payment,
  addNoteFromCustomer,
  giveFeedbackfromcustomertoprofessional,
  editCustomer,
  getCustomerByEmail,
  getservicebyid,
};
