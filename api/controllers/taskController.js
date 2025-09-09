import Task from "../models/Task.js";
import Circle from "../models/Circle.js";

// @desc Assign a task
export const createTask = async (req, res) => {
  try {
    const { assignedTo, description } = req.body;
    const userId = req.user.id;

    // find user circle
    const circle = await Circle.findOne({ members: userId });
    if (!circle) {
      return res.status(400).json({ message: "You are not in a circle" });
    }

    // check if assignedTo user is in same circle
    if (!circle.members.includes(assignedTo)) {
      return res.status(400).json({ message: "User not in your circle" });
    }

    const task = await Task.create({
      circleId: circle._id,
      assignedBy: userId,
      assignedTo,
      description,
    });

    res.status(201).json({ message: "Task assigned", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update task status (accept, deny, complete)
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only assigned user can accept/deny/complete
    if (task.assignedTo.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized for this task" });
    }

    task.status = status;
    await task.save();

    res.json({ message: `Task ${status}`, task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all tasks of my circle
export const getCircleTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const circle = await Circle.findOne({ members: userId });
    if (!circle) {
      return res.status(400).json({ message: "You are not in a circle" });
    }

    const tasks = await Task.find({ circleId: circle._id })
      .populate("assignedBy", "name email")
      .populate("assignedTo", "name email");

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
