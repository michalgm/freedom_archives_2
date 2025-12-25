const generateRandomString = (length = 15) => {
  const chars = `0123456789abcdefghijklmnopqrstuvwxyz'"!@#$%^&*()-=_+ABCDEFGHIJKLMNOPQRSTUVWXYZ`;
  return Array(length)
    .fill("")
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
};
export { generateRandomString };


export const sanitizeParams = async (context) => {
  return {
    ...context.params,
    query: await context.service.sanitizeQuery(context.params),
  };
};

export default {
  generateRandomString,
};
