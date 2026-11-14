// التحقق من أن المستخدم مسجل دخوله في الجلسة (Session)
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً للوصول إلى هذا المورد' });
}

// التحقق من أن المستخدم يملك صلاحية مدير النظام (Admin) فقط
function isAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح لك: هذه العملية متاحة لمدير العيادة فقط' });
  }
  return next();
}

// التحقق من أن المستخدم طبيب أو مدير نظام (للوصول للسجلات الطبية)
function isDoctorOrAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
  if (req.session.user.role !== 'doctor' && req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح لك بالوصول إلى السجلات الطبية' });
  }
  return next();
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isDoctorOrAdmin
};