export const paths = {
  root: '/',
  login: '/login',
  users: '/users',
  promocodes: {
    root: '/promocodes',
    create: '/promocodes/create',
    edit: (id: string) => `/promocodes/${id}`,
  },
};
