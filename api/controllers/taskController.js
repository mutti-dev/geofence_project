import Task from "../models/Task.js";
import Circle from "../models/Circle.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendPush } from "../utils/sendPush.js";
import { createNotification } from "./notificationController.js";

// utility to expire tasks past deadline
const expireTasksIfNeeded = async () => {
  await Task.updateMany(
    { status: "pending", deadline: { $lt: new Date() } },
    { status: "expired" }
  );
};

// @desc Assign a task
export const createTask = async (req, res, next) => {
  try {
    const { assignedTo, description, deadline } = req.body;
    const userId = req.user.id;

    // Find user's circle
    const circle = await Circle.findOne({ members: userId });
    if (!circle) {
      return res.status(400).json({ message: "You are not in a circle" });
    }

    // Check if assignedTo user is in the same circle
    if (!circle.members.map((m) => m.toString()).includes(assignedTo)) {
      return res.status(400).json({ message: "User not in your circle" });
    }

    // Only admin can create tasks
    const adminCircle = await Circle.findOne({ admin: userId });
    if (!adminCircle) {
      return res.status(403).json({ message: "Only admins can create tasks" });
    }

    // Create task
    const task = await Task.create({
      circleId: circle._id,
      assignedBy: userId,
      assignedTo,
      description,
      deadline,
      status: "pending",
    });

    // Notify assignee in real-time
    const assigneeUser = await User.findById(assignedTo);
    if (assigneeUser) {
      const io = req.app.get("io"); // get socket.io instance
      await createNotification(
        assignedTo,
        "taskAssigned",
        `${description}`,
        io
      );
    }

    res.status(201).json({ message: "Task assigned", task });
  } catch (error) {
    next(error);
  }
};

// @desc Update task (admin update assignedTo/description/deadline)
export const updateTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    console.log("Updating task", taskId, req.body);
    const userId = req.user.id;
    const { assignedTo, description, deadline } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Only circle admin or the creator of the task can edit
    const circle = await Circle.findOne({ admin: userId, _id: task.circleId });
    if (String(task.assignedBy) !== String(userId) && !circle) {
      return res.status(403).json({ message: "Not authorized to edit task" });
    }

    if (assignedTo) {
      // Validate assignedTo in same circle
      const taskCircle = await Circle.findById(task.circleId);
      if (!taskCircle.members.map((m) => m.toString()).includes(assignedTo)) {
        return res.status(400).json({ message: "User not in the circle" });
      }
      task.assignedTo = assignedTo;
    }

    if (description) task.description = description;
    if (deadline) task.deadline = deadline;

    await task.save();

    // notify assignee about update (optional)
    const assignee = await User.findById(task.assignedTo);
    if (assignee) {
      const notification = await Notification.create({
        user: assignee._id,
        title: "Task Updated",
        message: `${task.description} was updated`,
        type: "taskUpdated",
      });
      if (assignee.pushToken) {
        try {
          await sendPush(assignee.pushToken, notification.title, notification.message);
        } catch (err) {
          console.error("Push notification failed", err);
        }
      }
    }

    res.json({ message: "Task updated", task });
  } catch (err) {
    next(err);
  }
};

// @desc Update task status (accept/deny/complete)
// Body: { status: "completed" } etc
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const taskId = req.params.taskId || req.params.id;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // If member is updating to completed: allow assigned user
    if (status === "completed") {
      if (String(task.assignedTo) !== String(userId) && String(task.assignedBy) !== String(userId)) {
        // allow assigned user or creator (creator/admin)
        // Also allow circle admin to mark completed via admin privileges
        const circle = await Circle.findOne({ admin: userId, _id: task.circleId });
        if (!circle) return res.status(403).json({ message: "Not authorized to mark completed" });
      }
      task.status = "completed";
      await task.save();

      // notify creator/admin about completion
      const creator = await User.findById(task.assignedBy);
      if (creator) {
        const notification = await Notification.create({
          user: creator._id,
          title: "Task Completed",
          message: `${task.description} - completed`,
        });
        if (creator.pushToken)
          await sendPush(creator.pushToken, notification.title, notification.message);
      }

      return res.json({ message: "Task completed", task });
    }

    // For other statuses: enforce permission (e.g., only assigned user can change to denied)
    if (status === "denied") {
      if (String(task.assignedTo) !== String(userId)) {
        return res.status(403).json({ message: "Not authorized for this task" });
      }
      task.status = "denied";
      task.accepted = false;
      task.acceptedAt = null;
      await task.save();
      // notify creator
      const creator = await User.findById(task.assignedBy);
      if (creator) {
        const notification = await Notification.create({
          user: creator._id,
          title: "Task Denied",
          message: `${task.description} - denied`,
        });
        if (creator.pushToken)
          await sendPush(creator.pushToken, notification.title, notification.message);
      }
      return res.json({ message: "Task denied", task });
    }

    // For admin-level status changes (e.g., admin forcing pending/expired etc)
    // Allow if user is circle admin or task creator
    const circleAdmin = await Circle.findOne({ admin: userId, _id: task.circleId });
    if (!circleAdmin && String(task.assignedBy) !== String(userId)) {
      return res.status(403).json({ message: "Not authorized to change status" });
    }

    if (status) {
      task.status = status;
      await task.save();
      return res.json({ message: `Task ${status}`, task });
    }

    res.status(400).json({ message: "No status provided" });
  } catch (error) {
    next(error);
  }
};

export const getCircleTasks = async (req, res, next) => {
  try {
    await expireTasksIfNeeded();
    const userId = req.user.id;

    // check if user is admin of a circle
    const adminCircle = await Circle.findOne({ admin: userId });
    if (adminCircle) {
      // admin: return all non-deleted tasks for this circle
      const tasks = await Task.find({
        circleId: adminCircle._id,
        isDeleted: false,
      })
        .populate("assignedBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ status: 1, deadline: 1 });
      return res.json(tasks);
    }

    // member: return only their non-deleted tasks
    const tasks = await Task.find({ assignedTo: userId, isDeleted: false })
      .populate("assignedBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ deadline: 1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userId = req.user.id;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // allow deletion if user created the task
    if (String(task.assignedBy) === String(userId)) {
      task.isDeleted = true;
      await task.save();
      return res.json({ message: "Deleted" });
    }

    // or if user is admin of the circle the task belongs to
    const circle = await Circle.findOne({ admin: userId, _id: task.circleId });
    if (circle) {
      await task.remove();
      return res.json({ message: "Deleted" });
    }

    return res.status(403).json({ message: "Not authorized" });
  } catch (err) {
    next(err);
  }
};

// Backwards-compatible alias for routes expecting getTasksForUser
export { getCircleTasks as getTasksForUser };

export const acceptTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.isDeleted)
      return res.status(400).json({ message: "Task has been deleted" });

    if (String(task.assignedTo) !== String(userId))
      return res.status(403).json({ message: "Not authorized" });

    if (task.status === "expired")
      return res.status(400).json({ message: "Task is expired" });

    // Now: mark as accepted but keep status as "pending" so member still sees it as pending
    task.accepted = true;
    task.acceptedAt = new Date();
    // keep task.status as-is (pending)
    await task.save();

    // Notify creator/admin
    const creator = await User.findById(task.assignedBy);
    if (creator) {
      const notification = await Notification.create({
        user: creator._id,
        title: "Task Accepted",
        message: `${task.description} - accepted`,
        type: "taskAccepted",
      });

      if (creator.pushToken) {
        try {
          await sendPush(
            creator.pushToken,
            notification.title,
            notification.message
          );
        } catch (err) {
          console.error("Push notification failed", err);
        }
      }
    }

    return res.json({ message: "Task accepted", task });
  } catch (err) {
    next(err);
  }
};

export const declineTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (String(task.assignedTo) !== String(userId))
      return res.status(403).json({ message: "Not authorized" });
    if (task.status === "expired")
      return res.status(400).json({ message: "Task is expired" });

    task.status = "denied";
    task.accepted = false;
    task.acceptedAt = null;
    await task.save();

    const creator = await User.findById(task.assignedBy);
    if (creator) {
      const notification = await Notification.create({
        user: creator._id,
        title: "Task Declined",
        message: `${task.description} - declined`,
        type: "taskDenied",
      });
      if (creator.pushToken)
        await sendPush(
          creator.pushToken,
          notification.title,
          notification.message
        );
    }
    return res.json({ message: "Task declined", task });
  } catch (err) {
    next(err);
  }
};
