const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

exports.uploadMiddleware = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 50 MB."
          : `Upload error: ${err.message}`;
      return res.status(400).json({ message: msg });
    }
    next();
  });
};


exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    if (!title || !description || !dueDate) {
      return res.status(400).json({ message: "Title, description and due date are required" });
    }

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      createdBy: req.user.id,
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.user.id }).sort({
      createdAt: -1,
    });


    const ids = assignments.map((a) => a._id);
    const counts = await Submission.aggregate([
      { $match: { assignmentId: { $in: ids } } },
      { $group: { _id: "$assignmentId", total: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => (countMap[c._id.toString()] = c.total));

    const result = assignments.map((a) => ({
      ...a.toObject(),
      submissionCount: countMap[a._id.toString()] || 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Not found" });
    if (assignment.status !== "Draft") {
      return res.status(400).json({ message: "Only draft assignments can be published" });
    }
    assignment.status = "Published";
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.completeAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Not found" });
    if (assignment.status !== "Published") {
      return res.status(400).json({ message: "Only published assignments can be completed" });
    }
    assignment.status = "Completed";
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.editAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Not found" });
    if (assignment.status === "Completed") {
      return res.status(400).json({ message: "Completed assignments cannot be edited" });
    }

    const { title, description, dueDate } = req.body;
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (dueDate) assignment.dueDate = dueDate;
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Not found" });
    if (assignment.status !== "Draft") {
      return res.status(400).json({ message: "Only draft assignments can be deleted" });
    }
    await Assignment.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ assignmentId: req.params.id });
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getPublishedAssignments = async (_req, res) => {
  try {
    const assignments = await Assignment.find({ status: "Published" }).sort({
      createdAt: -1,
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, answer } = req.body;
    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment ID is required" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    if (assignment.status !== "Published") {
      return res.status(400).json({ message: "This assignment is not accepting submissions" });
    }


    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({ message: "The due date has passed. Submissions are closed." });
    }


    const existing = await Submission.findOne({
      assignmentId,
      studentId: req.user.id,
    });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted this assignment" });
    }

    const data = {
      assignmentId,
      studentId: req.user.id,
      answer: answer || "",
    };

    if (req.file) {
      data.fileUrl = `/uploads/${req.file.filename}`;
      data.fileName = req.file.originalname;
    }

    if (!data.answer && !data.fileUrl) {
      return res.status(400).json({ message: "Please provide an answer or upload a file" });
    }

    const submission = await Submission.create(data);
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.user.id });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      assignmentId: req.params.id,
    }).populate("studentId", "name email");
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.reviewSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.subId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    submission.reviewed = true;
    await submission.save();
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};