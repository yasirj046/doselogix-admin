// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

// Constants Imports
import { API_BASE_URL, API_URLS } from '@/contsants/api'

export const authOptions = {
  // ** Note: When using credentials provider, do not use database adapter
  // adapter: PrismaAdapter(prisma), // Removed - conflicts with credentials

  // ** Configure one or more authentication providers
  // ** Please refer to https://next-auth.js.org/configuration/options#providers for more `providers` options
  providers: [
    CredentialProvider({
      // ** The name to display on the sign in form (e.g. 'Sign in with...')
      // ** For more details on Credentials Provider, visit https://next-auth.js.org/providers/credentials
      name: 'Credentials',
      type: 'credentials',

      /*
       * As we are using our own Sign-in page, we do not need to change
       * username or password attributes manually in following credentials object.
       */
      credentials: {},
      async authorize(credentials) {
        /*
         * You need to provide your own logic here that takes the credentials submitted and returns either
         * an object representing a user or value that is false/null if the credentials are invalid.
         * For e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
         * You can also use the `req` object to obtain additional parameters (i.e., the request IP address)
         */
        const { email, password } = credentials

        try {
          // ** Login API Call to external API
          const res = await fetch(`${API_BASE_URL}${API_URLS.LOGIN}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          })

          // Check if the response is actually JSON (not an HTML error page)
          const contentType = res.headers.get('content-type')

          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(
              JSON.stringify({
                message: 'Authentication service is currently unavailable. Please try again later.'
              })
            )
          }

          const response = await res.json()

          console.log(response)

          if (res.status === 200 && response.success && response.result) {
            /*
             * Return user data with token for session storage
             * The API returns: { success: true, result: { token, vendor }, message }
             */
            return {
              id: response.result.vendor.id,
              name: response.result.vendor.vendorName,
              email: response.result.vendor.vendorEmail,
              role: response.result.vendor.vendorRole,
              phone: response.result.vendor.vendorPhone,
              businessName: response.result.vendor.businessName,
              isActive: response.result.vendor.isActive,
              createdAt: response.result.vendor.createdAt,
              updatedAt: response.result.vendor.updatedAt,
              accessToken: response.result.token // Store the JWT token
            }
          } else {
            // Handle error response
            if (response.message) {
              throw new Error(JSON.stringify({ message: response.message }))
            }

            throw new Error(JSON.stringify({ message: 'Invalid email or password' }))
          }
        } catch (e) {
          // Handle network errors or API being down
          if (e.message.includes('fetch')) {
            throw new Error(
              JSON.stringify({
                message: 'Unable to connect to authentication service. Please check your connection and try again.'
              })
            )
          }

          throw new Error(e.message)
        }
      }
    })

    // Note: Commented out GoogleProvider since it requires database adapter
    // If you need Google auth, you'll need a different setup
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET
    // })

    // ** ...add more providers here
  ],

  // ** Please refer to https://next-auth.js.org/configuration/options#session for more `session` options
  session: {
    /*
     * Choose how you want to save the user session.
     * The default is `jwt`, an encrypted JWT (JWE) stored in the session cookie.
     * If you use an `adapter` however, NextAuth default it to `database` instead.
     * You can still force a JWT session by explicitly defining `jwt`.
     * When using `database`, the session cookie will only contain a `sessionToken` value,
     * which is used to look up the session in the database.
     * If you use a custom credentials provider, user accounts will not be persisted in a database by NextAuth.js (even if one is configured).
     * The option to use JSON Web Tokens for session tokens must be enabled to use a custom credentials provider.
     */
    strategy: 'jwt',

    // ** Seconds - How long until an idle session expires and is no longer valid
    maxAge: 7 * 24 * 60 * 60 // ** 7 days
  },

  // ** Please refer to https://next-auth.js.org/configuration/options#pages for more `pages` options
  pages: {
    signIn: '/login'
  },

  // ** Please refer to https://next-auth.js.org/configuration/options#callbacks for more `callbacks` options
  callbacks: {
    /*
     * While using `jwt` as a strategy, `jwt()` callback will be called before
     * the `session()` callback. So we have to add custom parameters in `token`
     * via `jwt()` callback to make them accessible in the `session()` callback
     */
    async jwt({ token, user }) {
      if (user) {
        /*
         * For adding custom parameters to user in session, we first need to add those parameters
         * in token which then will be available in the `session()` callback
         */
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = user.role
        token.phone = user.phone
        token.businessName = user.businessName
        token.isActive = user.isActive
        token.createdAt = user.createdAt
        token.updatedAt = user.updatedAt
        token.accessToken = user.accessToken // Store the JWT token from your API
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // ** Add custom params to user in session which are added in `jwt()` callback via `token` parameter
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.role = token.role
        session.user.phone = token.phone
        session.user.businessName = token.businessName
        session.user.isActive = token.isActive
        session.user.createdAt = token.createdAt
        session.user.updatedAt = token.updatedAt
        session.accessToken = token.accessToken // Make the JWT token accessible in session
      }

      return session
    }
  }
}
