module.exports = function (req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId)
    return res.status(401).json({ error: "Unauthorized: No user ID" });

  req.user_id = userId;
  next();
};
