export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Unauthorized (role missing)' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }

    next();
  };
};

export const requireAdmin = checkRole('admin');
export const requireManager = checkRole('admin', 'manager');
export const requireEmployee = checkRole('admin', 'manager', 'employee');
