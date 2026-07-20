export default {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL ?? 'https://clerk.jengasuppliers.com',
      applicationID: 'convex',
    },
  ],
}
