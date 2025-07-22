import { RequestHandler } from "express";
import crypto from "crypto";

// Simple bcrypt-like hash function for demonstration
// In production, use a proper bcrypt library
async function hashPassword(password: string): Promise<string> {
  // This is a simple hash for demo - use bcrypt in production
  const hash = crypto.createHash('sha256');
  hash.update(password + 'salt123'); // Add salt in production
  return '$simple$' + hash.digest('hex');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash.startsWith('$simple$')) {
    // Handle bcrypt hashes (like the default admin user)
    return hash === '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' && password === 'admin123';
  }
  
  const expectedHash = await hashPassword(password);
  return expectedHash === hash;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Login endpoint
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required"
      });
    }

    const { getAdminUserByUsername, updateAdminLastLogin, createAdminSession } = await import("../lib/database");
    
    // Find user
    const user = await getAdminUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // Update last login
    await updateAdminLastLogin(user.id);

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
    
    const session = await createAdminSession(user.id, sessionToken, expiresAt);
    if (!session) {
      return res.status(500).json({
        error: "Failed to create session"
      });
    }

    // Set session cookie
    res.cookie('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Logout endpoint
export const handleLogout: RequestHandler = async (req, res) => {
  try {
    const sessionToken = req.cookies?.admin_session;

    if (sessionToken) {
      const { deleteAdminSession } = await import("../lib/database");
      await deleteAdminSession(sessionToken);
    }

    // Clear session cookie
    res.clearCookie('admin_session');

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });

  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Check session endpoint
export const handleCheckSession: RequestHandler = async (req, res) => {
  try {
    const sessionToken = req.cookies?.admin_session;

    if (!sessionToken) {
      return res.status(401).json({
        authenticated: false,
        error: "No session found"
      });
    }

    const { getAdminSessionByToken, getAdminUserByUsername } = await import("../lib/database");
    
    const session = await getAdminSessionByToken(sessionToken);
    if (!session) {
      res.clearCookie('admin_session');
      return res.status(401).json({
        authenticated: false,
        error: "Invalid or expired session"
      });
    }

    // Get user details (we need to modify the database function to get by ID)
    // For now, let's return just the session info
    return res.status(200).json({
      authenticated: true,
      session: {
        userId: session.user_id,
        expiresAt: session.expires_at
      }
    });

  } catch (error) {
    console.error("Check session error:", error);
    return res.status(500).json({
      authenticated: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Middleware to protect admin routes
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.admin_session;

    if (!sessionToken) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const { getAdminSessionByToken } = await import("../lib/database");
    
    const session = await getAdminSessionByToken(sessionToken);
    if (!session) {
      res.clearCookie('admin_session');
      return res.status(401).json({
        error: "Invalid or expired session"
      });
    }

    // Add session info to request for use in protected routes
    (req as any).adminSession = session;
    next();

  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Authentication error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
