const express = require("express");
const router = express.Router();
const db = require("../../db");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const fs = require("fs");
const taskController = require("../controllers/taskController");
const subcategoryController = require("../controllers/subcategoryController");
const categoryController = require("../controllers/categoryController");
const multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../models/googleModel");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/new", taskController.getNewTask);
router.get("/new/:categoryId", taskController.getNewTaskByCategory);
router.get(
	"/category/:categoryId/detail",
	subcategoryController.getSubcategoryByCategory
);
router.get("/category", categoryController.getAllCategorySubcategoryTask);
router.post("/list", taskController.getTaskList);
router.get("/detail/:taskId", taskController.getTaskDetails);
router.post("/create", taskController.createTask);
router.get("/owned", taskController.getOwnedTask);
router.get("/owned/:taskId", taskController.getOwnedTaskDetails);
router.get("/:taskId/freelancer-list", taskController.getRegisteredFreelancer);
router.put("/:taskId/delete", taskController.deleteTask);
router.get("/history", taskController.getTaskHistory);
router.get("/history/:taskId", taskController.getTaskHistoryDetails);
router.post("/:taskId/choose-freelancer", taskController.chooseFreelancer);

module.exports = router;
