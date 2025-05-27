import NextAuth from "next-auth"
import Github from "next-auth/providers/github"
import { AUTHOR_BY_GITHUB_ID_QUERY } from "./lib/query"
import { client } from "./sanity/lib/client"
import { writeClient } from "./sanity/lib/write-client"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Github],
  callbacks: {
    async signIn({
      user: { name, email, image },
      profile: { id, login, bio },
    }) {
      const existingUser = await client
        .withConfig({ useCdn: false })
        .fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
          id: id,
        })

      if (!existingUser) {
        await writeClient.create({
          _type: "author",
          id: id,
          name: name,
          username: login,
          enail: email,
          image: image,
          bio: bio,
        })
      }

      return true
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const user = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
            id: profile?.id,
          })

        token.id = user?._id
      }

      return token
    },
    async session({ session, token }) {
      Object.assign(session, { id: token.id })
      return session
    },
  },
})
