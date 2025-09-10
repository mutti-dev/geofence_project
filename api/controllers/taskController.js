import Task from "../models/Task.js";
import Circle from "../models/Circle.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendPush } from "../utils/sendPush.js";

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

    // find user circle
    const circle = await Circle.findOne({ members: userId });
    if (!circle) {
      return res.status(400).json({ message: "You are not in a circle" });
    }

    // check if assignedTo user is in same circle
    if (!circle.members.map((m) => m.toString()).includes(assignedTo)) {
      return res.status(400).json({ message: "User not in your circle" });
    }

    // only admin can create (must be circle admin)
    const adminCircle = await Circle.findOne({ admin: userId });
    if (!adminCircle) {
      return res.status(403).json({ message: "Only admins can create tasks" });
    }

    const task = await Task.create({
      circleId: circle._id,
      assignedBy: userId,
      assignedTo,
      description,
      deadline,
      status: "pending",
    });

    // notify assignee
    const assigneeUser = await User.findById(assignedTo);
    if (assigneeUser) {
      const notification = await Notification.create({
        user: assigneeUser._id,
        title: "New Task Assigned",
        message: description,
        type: "taskAssigned",
      });
      if (assigneeUser.pushToken)
        await sendPush(
          assigneeUser.pushToken,
          notification.title,
          notification.message
        );
    }

    res.status(201).json({ message: "Task assigned", task });
  } catch (error) {
    next(error);
  }
};

// @desc Update task status (accept, deny, complete)
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const taskId = req.params.taskId || req.params.id;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only assigned user can accept/deny/complete
    if (task.assignedTo.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized for this task" });
    }

    // prevent updating expired tasks
    if (task.status === "expired")
      return res.status(400).json({ message: "Task is expired" });

    task.status = status;
    await task.save();

    // notify creator about status change
    const creator = await User.findById(task.assignedBy);
    if (creator) {
      const notification = await Notification.create({
        user: creator._id,
        title: "Task Status Updated",
        message: `${task.description} - ${status}`,
      });
      if (creator.pushToken)
        await sendPush(
          creator.pushToken,
          notification.title,
          notification.message
        );
    }

    res.json({ message: `Task ${status}`, task });
  } catch (error) {
    next(error);
  }
};

// @desc Get all tasks for current user (members see assigned tasks, admins see circle tasks)
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

// @desc Delete a task (only creator or circle admin can delete)
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // allow deletion if user created the task
    if (String(task.assignedBy) === String(userId)) {
      task.isDeleted == true;
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
    if (String(task.assignedTo) !== String(userId))
      return res.status(403).json({ message: "Not authorized" });
    if (task.status === "expired")
      return res.status(400).json({ message: "Task is expired" });
    task.status = "accepted";
    await task.save();
    const creator = await User.findById(task.assignedBy);
    if (creator) {
      const notification = await Notification.create({
        user: creator._id,
        title: "Task Accepted",
        message: `${task.description} - accepted`,
        type: "taskAccepted",
      });
      if (creator.pushToken)
        await sendPush(
          creator.pushToken,
          notification.title,
          notification.message
        );
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
