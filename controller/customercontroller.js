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

    res.json(services); // Return the found services
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
        from: "fingertips.root@.com",
        to: newCustomer.email,
        subject: "Application Approved",
        html: `<h1> Application Approved <h1>
                <p>Application Approved</a> </p>`,
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
      description,
      location,
      jobDate,
      deadline,
      payment,
      status,
      notes,
    } = req.body;
    const uniqueString =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Create a new service object
    const newService = new Service({
      customerEmail,
      professionalEmail,
      description,
      location,
      jobDate,
      deadline,
      payment,
      status,
      notes,
      uniqueid: uniqueString,
    });

    // Save the service to the database
    const savedService = await newService.save();

    // Find the professional based on the professionalEmail
    const professional = await Professional.findOne({
      email: professionalEmail,
    });

    if (!professional) {
      return res.status(404).json({ error: "Professional not found" });
    }

    // Find the client based on the customerEmail
    const client = await Customer.findOne({ email: customerEmail });
    const pro = await Professional.findOne({ email: professionalEmail });
    // Extract client's name and phone number
    const clientName = client ? client.firstname + " " + client.lastname : "";
    const clientPhone = client ? client.phonenum : "";

    const proName = pro ? pro.firstname + " " + pro.lastname : "";
    const proPhone = pro ? pro.phonenum : "";
    //console.log(client.name + " " + client.phone);
    // Push the newly created service to the professional's jobs array

    professional.jobs.push({
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

    client.purchased_services.push({
      description,
      location,
      job_date: jobDate,
      deadline,
      status,
      payment,
      professional: {
        name: proName,
        phone: proPhone,
        email: professionalEmail,
      },
      uniqueid: uniqueString,
    });

    // Save the updated professional document
    await professional.save();
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
      // Check if client email matches cEmail
      if (job.uniqueid === uiq) {
        // Update feedback for the matching job
        professional.jobs[index].feedback = { text, rating };
      }
    });

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
    if (address) customer.address = address;
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
};
