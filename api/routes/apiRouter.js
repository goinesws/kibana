const express = require("express");
const router = express.Router();
const db = require("../../db");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const fs = require("fs");
const accountRouter = require("./accountRouter");
const taskRouter = require("./taskRouter");
const serviceRouter = require("./serviceRouter");
const reviewRouter = require("./reviewRouter");
const transactionRouter = require("./transactionRouter");
const userController = require("../controllers/userController");
const clientController = require("../controllers/clientController");
const multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../utils/googleUtil.js");;
const storage = multer.diskStorage({
	destination: '/tmp',
  });
const upload = multer({ storage: storage });

// Auth Related
router.post("/login", userController.login);
router.post("/register", userController.register);
router.post(
	"/register-freelancer",
	upload.fields([
		{ name: "cv", maxCount: 1 },
		{ name: "portfolio", maxCount: 1 },
		{ name: "data", maxCount: 1 },
	]),
	clientController.registerAsFreelancer
);
router.get("/logout", userController.logout);

// Task Related
router.use("/task", taskRouter);

// Service Related
router.use("/service", serviceRouter);

// Account Related
router.use("/account", accountRouter);

// Review Related
router.use("/review", reviewRouter);

//transaction related
router.use("/transaction", transactionRouter);

module.exports = router;
