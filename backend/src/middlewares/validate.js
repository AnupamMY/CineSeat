export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) {
    const fieldErrors = {};
    const formErrors = [];
    for (const issue of result.error.issues) {
      const path = issue.path[0] === "body" ? issue.path.slice(1) : issue.path;
      const field = path[0];
      if (!field) formErrors.push(issue.message);
      else (fieldErrors[field] ||= []).push(issue.message);
    }
    return res.status(400).json({ success: false, message: "Validation failed", errors: { formErrors, fieldErrors } });
  }
  req.body = result.data.body;
  Object.assign(req.params, result.data.params);
  next();
};
