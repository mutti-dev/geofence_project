import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
	let token;
	// non-sensitive debug info to help troubleshoot auth issues
	console.log("protect middleware invoked - auth header present:", !!req.headers.authorization, "cookies present:", !!req.cookies, "query.token present:", !!(req.query && req.query.token));

	// support token from Authorization header (case-insensitive), cookies, or query string
	if (req.headers.authorization && typeof req.headers.authorization === "string" && req.headers.authorization.toLowerCase().startsWith("bearer ")) {
		token = req.headers.authorization.split(" ")[1]?.trim();
	} else if (req.cookies && req.cookies.token) {
		token = req.cookies.token;
	} else if (req.query && req.query.token) {
		token = req.query.token;
	}

	if (!token) {
		return res.status(401).json({ message: "Not authorized, no token" });
	}

	try {
		if (!process.env.JWT_SECRET) {
			console.error("JWT_SECRET is not set in environment");
			return res.status(500).json({ message: "Server configuration error" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = await User.findById(decoded.id).select("-password");
		if (!req.user) return res.status(401).json({ message: "User not found" });
		next();
	} catch (error) {
		console.error("Token verification failed:", error.message);
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({ message: "Token expired" });
		}
		return res.status(401).json({ message: "Not authorized, token failed" });
	}
};

export default protect;
