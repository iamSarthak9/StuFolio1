import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "stufolio-secret-key-dev";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        if (!roles.includes(req.user.role)) {
            console.warn(`🛡️ [Auth] Role mismatch: User ${req.user.userId} has role '${req.user.role}', but needs one of: ${roles.join(", ")}`);
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
}

export { JWT_SECRET };
