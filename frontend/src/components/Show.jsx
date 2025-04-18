const Show = ({ when = true, unless = false, children }) => {
  if (!when || unless) return null;
  return children;
};

export default Show;
