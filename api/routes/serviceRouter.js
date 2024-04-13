const express = require("express");
const router = express.Router();
const db = require("../../db");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const fs = require("fs");
const serviceController = require("../controllers/serviceController");
const subcategoryController = require("../controllers/subcategoryController");
const categoryController = require("../controllers/categoryController");
const multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../utils/googleUtil.js");;
const storage = multer.diskStorage({
	destination: '/tmp',
  });
const upload = multer({ storage: storage });

router.get("/new/:categoryId", serviceController.getNewService);
router.get("/new", serviceController.getNewService);
router.post("/list", serviceController.getServiceList);
router.get("/detail/:serviceId", serviceController.getServiceDetail);
router.get("/owned", serviceController.getOwnedService);
router.get("/owned/:serviceId", serviceController.getOwnedServiceDetail);
router.get("/owned/:serviceId/orders", serviceController.getOwnedServiceOrders);
router.put("/:serviceId/deactivate", serviceController.deactivateService);
router.put("/:serviceId/delete", serviceController.deleteService);
router.get("/history", serviceController.getServiceHistory);
router.post(
	"/create",
	upload.fields([
		{ name: "image_1", maxCount: 1 },
		{ name: "image_2", maxCount: 1 },
		{ name: "image_3", maxCount: 1 },
		{ name: "image_4", maxCount: 1 },
		{ name: "image_5", maxCount: 1 },
	]),
	serviceController.createNewService
);
router.get(
	"/category/:categoryId/detail",
	subcategoryController.getSubcategoryByCategory
);
router.get(
	"/:subcategoryId/additional-info",
	subcategoryController.getadditionalInfoBySubcategoryId
);
router.get("/category", categoryController.getAllCategorySubcategory);
router.put("/:serviceId/activate", serviceController.activateService);
router.post("/:serviceId/request-token", serviceController.getRequestToken);

module.exports = router;
