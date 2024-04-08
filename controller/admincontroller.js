const Customer = require("../model/customer");
const Professional = require("../model/professional");
const Service = require("../model/service");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodeMailer = require("../config/nodemailer");
const signToken = (userId, userType) => {
  return jwt.sign({ userId, userType }, "ethan_hunt", { expiresIn: "1h" });
};
const forgetPassword = async (req, res) => {
  const userEmail = req.body.email;

  // First, search for a professional with the provided email
  try {
    let user = await Professional.findOne({ email: userEmail });
    if (!user) {
      // If professional is not found, search for a customer with the provided email
      user = await Customer.findOne({ email: userEmail });
    }

    if (!user) {
      // If neither professional nor customer is found with the provided email
      return res.status(400).json({ error: "Incorrect email ID" });
    }

    // Generate token and update user
    const token = signToken(
      user._id,
      user instanceof Professional ? "professional" : "customer"
    );
    user.resetlink = token;
    await user.save();

    // Send reset email
    sendResetEmail(userEmail, token, res);
    console.log(token);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Function to send reset password email
const sendResetEmail = (userEmail, token, res) => {
  nodeMailer.transporter.sendMail(
    {
      from: "fingertips.root@gmail.com",
      to: userEmail,
      subject: "Password reset link",
      html: `<h1> Password Reset <h1>
          <p>Please click on the following link to reset your password: <a>http://selfserviceportal-1253583212.us-east-1.elb.amazonaws.com:3000/user/resetpassword/${token}</a> </p>`,
    },
    (err, info) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error sending email" });
      }
      console.log("Message sent", info);
      return res.json({ message: "Success" });
    }
  );
};
const resetPassword = async (req, res) => {
  const { newPass } = req.body;
  const resetLink = req.params.resetLink;

  // Hash the new password
  const updatePassword = await bcrypt.hash(newPass, 10);

  if (resetLink) {
    try {
      // Verify the resetLink token
      const decodedData = jwt.verify(resetLink, "ethan_hunt");

      // Extract user ID and user type from decoded token
      const { userId, userType } = decodedData;

      // Determine the model based on userType
      const Model = userType === "professional" ? Professional : Customer;

      // Find the user by userId
      const user = await Model.findOne({ _id: userId });

      if (!user) {
        return res
          .status(400)
          .json({ error: "User with this reset link does not exist" });
      }

      // Update user's password and resetlink
      user.password = updatePassword;
      user.resetlink = "";

      // Save the updated user
      await user.save();

      // Respond with success message
      return res
        .status(200)
        .json({ message: "Your password has been changed" });
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: "Incorrect or expired token" });
    }
  } else {
    return res.status(401).json({ error: "Authentication Error" });
  }
};

const authorizePro = async (req, res) => {
  try {
    const { email } = req.params;

    // Find the professional by email
    const professional = await Professional.findOne({ email });

    if (!professional) {
      return res.status(404).json({ message: "Professional not found" });
    }

    // Update isAuth to true
    professional.isAuth = true;

    // Save the updated professional to the database
    await professional.save();
    nodeMailer.transporter.sendMail(
      {
        from: "fingertips.root@.com",
        to: professional.email,
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
    res.status(200).json({ message: "Professional authorized successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const authenticate = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Search for professional with provided email
    const professional = await Professional.findOne({ email });
    if (professional) {
      // If professional is found, verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        professional.password
      );
      if (isPasswordValid) {
        // If password is valid, generate JWT token
        const token = jwt.sign(
          {
            id: professional._id,
            email: professional.email,
            userType: "professional",
          },
          "ethan_hunt"
        );
        return res.json({ token });
      }
    }

    // Search for customer with provided email
    const customer = await Customer.findOne({ email });

    if (customer) {
      // If customer is found, verify password
      const isPasswordValid = await bcrypt.compare(password, customer.password);
      if (isPasswordValid) {
        // If password is valid, generate JWT token
        const token = jwt.sign(
          { id: customer._id, email: customer.email, userType: "customer" },
          "ethan_hunt"
        );
        return res.json({ token });
      }
    }

    // If neither professional nor customer is found with the provided email or password is invalid
    res.status(401).json({ error: "Invalid email or password" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  authorizePro,
  authenticate,
  forgetPassword,
  resetPassword,
};
