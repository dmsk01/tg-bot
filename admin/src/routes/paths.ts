export const paths = {
  root: '/',
  login: '/login',
  users: {
    root: '/users',
    detail: (id: string) => `/users/${id}`,
  },
  promocodes: {
    root: '/promocodes',
    create: '/promocodes/create',
    edit: (id: string) => `/promocodes/${id}`,
  },
};
