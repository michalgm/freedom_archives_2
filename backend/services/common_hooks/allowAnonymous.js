export default () => {
  return async (context, next) => {
    const { params } = context;
    if (params.provider && !params.authentication) {
      context.params = {
        ...params,
        authentication: {
          strategy: "anonymous",
        },
      };
    }
    if (next) {
      await next();
    }
    return context;
  };
};
