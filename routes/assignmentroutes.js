const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRole } = require("../middleware/authmiddleware");

const {
  createAssignment,
  getAssignments,
  publishAssignment,
  completeAssignment,
  editAssignment,
  deleteAssignment,
  getPublishedAssignments,
  submitAssignment,
  getSubmissions,
  getMySubmissions,
  reviewSubmission,
  uploadMiddleware,
} = require("../controllers/assignmentcontroller");

// student routes (static paths first)
router.get("/published", authMiddleware, authorizeRole("student"), getPublishedAssignments);
router.get("/my-submissions", authMiddleware, authorizeRole("student"), getMySubmissions);
router.post("/submit", authMiddleware, authorizeRole("student"), uploadMiddleware, submitAssignment);

// teacher routes
router.post("/", authMiddleware, authorizeRole("teacher"), createAssignment);
router.get("/", authMiddleware, authorizeRole("teacher"), getAssignments);
router.put("/:id", authMiddleware, authorizeRole("teacher"), editAssignment);
router.put("/:id/publish", authMiddleware, authorizeRole("teacher"), publishAssignment);
router.put("/:id/complete", authMiddleware, authorizeRole("teacher"), completeAssignment);
router.delete("/:id", authMiddleware, authorizeRole("teacher"), deleteAssignment);
router.get("/:id/submissions", authMiddleware, authorizeRole("teacher"), getSubmissions);
router.put("/:id/submissions/:subId/review", authMiddleware, authorizeRole("teacher"), reviewSubmission);

module.exports = router;