const express=require("express")
const router=express.Router()

const {auth, isUser}=require("../middlewares/auth")
const { getUserDocuments } = require("../controllers/Upload")
const { deleteDocument } = require("../controllers/Upload")
const { uploadFiles } = require("../controllers/Upload")
const { getReportSummary } = require("../controllers/ReportAnalysis")

router.post("/upload/:userId",auth,isUser,uploadFiles)
router.get("/get-documents/:userId",auth,getUserDocuments)
router.delete("/delete-documents/:userId/:documentId",auth,isUser,deleteDocument)

// Route for getting AI-generated report summary
router.get("/get-report-summary/:userId",auth,getReportSummary)

// Export the router for use in the main application
module.exports=router