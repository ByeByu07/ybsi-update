import { db } from '@/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from '@/db/schema'
import { createAccessControl, organization } from "better-auth/plugins"
import { setDefaultOrg } from './set-default-org';

const statement = {
    transaction: ["create", "read"],
    request: ["create", "read", "approve"],
    inventory: ["create", "read", "update", "delete"],
    document: ["create", "read", "update", "delete"],
    room: ["create", "read", "update", "delete"],
    member: ["create", "read", "update", "delete"],
    booking: ["create", "read", "update", "delete"],
    invitation: ["create", "cancel"],
    log: ["read"],
} as const;

const ac = createAccessControl(statement);

// Define roles with permissions
const owner = ac.newRole({
    transaction: ["create", "read"],
    request: ["create", "read", "approve"],
    inventory: ["create", "read", "update", "delete"],
    document: ["create", "read", "update", "delete"],
    room: ["create", "read", "update", "delete"],
    member: ["create", "read", "update", "delete"],
    booking: ["create", "read", "update", "delete"],
    invitation: ["create", "cancel"],
    log: ["read"],
});

const KETUA = ac.newRole({
    // Final approver (Level 2)
    transaction: ["create", "read"],
    request: ["create", "read", "approve"],
    inventory: ["create", "read", "update", "delete"],
    document: ["create", "read", "update", "delete"],
    room: ["create", "read", "update", "delete"],
    member: ["create", "read", "update", "delete"],
    booking: ["create", "read", "update", "delete"],
    invitation: ["create", "cancel"],
    log: ["read"],
});

const BENDAHARA = ac.newRole({
    // First approver (Level 1) + financial management
    transaction: ["create", "read"],
    request: ["create", "read", "approve"],
    inventory: ["read"],
    document: ["read"],
    room: ["read"],
    member: ["read"],
    booking: ["read"],
    log: ["read"],
});

const SEKRETARIS = ac.newRole({
    // Document management, no approval authority
    transaction: ["read"],
    request: ["create", "read"],
    inventory: ["read"],
    document: ["create", "read", "update", "delete"],
    room: ["read"],
    member: ["read"],
    booking: ["read"],
    log: ["read"],
});

const OPERASIONAL = ac.newRole({
    // Operations, can request
    transaction: ["read"],
    booking: ["read"],
    room: ["read"],
    request: ["create", "read"],
    inventory: ["read"],
    document: ["read"],
    member: ["read"],
    log: ["read"],
});

const PENGADAAN = ac.newRole({
    // Procurement, can request inventory
    transaction: ["read"],
    request: ["create", "read"],
    inventory: ["create", "read", "update"],
    document: ["read"],
    room: ["read"],
    member: ["read"],
    booking: ["read"],
    log: ["read"],
});

const NURSE = ac.newRole({
    // Patient care, bookings, shift management
    booking: ["create", "read", "update"],
    room: ["read"],
    request: ["create", "read"],
    inventory: ["read"],
    log: ["read"],
});

export const auth = betterAuth({
  plugins: [ organization({
            ac,
            roles: {
                owner,
                KETUA,
                BENDAHARA,
                SEKRETARIS,
                OPERASIONAL,
                PENGADAAN,
                NURSE,
            },
            // Only founders can create the organization
            // allowUserToCreateOrganization: false,
            // One organization only
            organizationLimit: 1,
            // Limit members to reasonable number
            membershipLimit: 50,
        }) ],
  database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema
    }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
          session: {
              create: {
                  before: async (session) => {
                      const organization = await setDefaultOrg(session.userId);
                      
                      return {
                          data: {
                              ...session,
                              activeOrganizationId: organization?.id,
                          },
                      };
                  },
              },
          },
      },
})
