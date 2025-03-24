const generateRandomString = (length = 15) => {
  const chars = `0123456789abcdefghijklmnopqrstuvwxyz'"!@#$%^&*()-=_+ABCDEFGHIJKLMNOPQRSTUVWXYZ`;
  return Array(length)
    .fill("")
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
};

module.exports = {
  generateRandomString,
};
