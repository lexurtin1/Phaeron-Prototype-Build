export interface StubUser {
  name: string
  email: string
}

export const STUB_USER: StubUser = {
  name: process.env.NEXT_PUBLIC_STUB_USER_NAME ?? 'Alex Curtin',
  email: process.env.NEXT_PUBLIC_STUB_USER_EMAIL ?? 'alex.curtin@calastone.com',
}
