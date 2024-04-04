const express = require("express");
const router = express.Router();
const db = require("../../db");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const fs = require("fs");
const userController = require("../controllers/userController");
const clientController = require("../controllers/clientController");
const freelancerController = require("../controllers/freelancerController");
const multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../models/googleModel");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/profile/:userId", userController.getOtherProfile);
router.get("/my/profile", userController.getMyProfile);
router.get("/bank-detail", userController.getMyBankDetails);
router.post("/edit/bank-detail", userController.editBankDetails);
router.get(
	"/project/history",
	freelancerController.getFreelancerProjectHistory
);
router.get(
	"/project/history/:userId",
	freelancerController.getFreelancerProjectHistory
);
router.get(
	"/description/:userId",
	freelancerController.getFreelancerDescription
);
router.get(
	"/educations/:userId",
	freelancerController.getFreelancerEducationHistory
);
router.get("/skills/:userId", freelancerController.getFreelancerSkill);
router.get("/cv/:userId", freelancerController.getFreelancerCV);
router.get("/portfolio/:userId", freelancerController.getPortfolio);
router.get("/services/:userId", freelancerController.getOwnedService);
router.get("/tasks/:userId", clientController.getClientTask);
router.get("/reviews/:userId", clientController.getClientReview);
router.post(
	"/edit/profile",
	upload.fields([
		{ name: "profile_image", maxCount: 1 },
		{ name: "data", maxCount: 1 },
	]),
	userController.editMyProfile
);
router.post(
	"/edit/description",
	freelancerController.editFreelancerDescription
);
router.post("/edit/skills", freelancerController.editFreelancerSkills);
router.post("/edit/educations", freelancerController.editFreelancerEducation);
router.post(
	"/edit/cv",
	upload.fields([{ name: "cv", maxCount: 1 }]),
	freelancerController.editFreelancerCV
);
router.post(
	"/edit/portfolio",
	upload.fields([{ name: "portfolio", maxCount: 1 }]),
	freelancerController.editFreelancerPortfolio
);

module.exports = router;
