import { db } from '@/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from '@/db/schema'
import { organization } from "better-auth/plugins"

export const auth = betterAuth({
  plugins: [ organization() ],
  database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema
    }),
  emailAndPassword: {
    enabled: true,
  },
})
