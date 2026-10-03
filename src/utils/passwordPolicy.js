export const checkPasswordStrength = (password) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isLongEnough = password.length >= 8;
  return { hasUpperCase, hasNumber, hasSpecialChar, isLongEnough, isValid: hasUpperCase && hasNumber && hasSpecialChar && isLongEnough };
};
