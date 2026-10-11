import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAdmin, canAccessResource } from "@/lib/permissions";

export type Ctx = { user: { id: string; role: string } | null };

const fail = (msg: string) => new GraphQLError(msg);
const isDuplicate = (e: unknown) => e instanceof Error && "code" in e && e.code === "P2002";

function requireUser(ctx: Ctx) {
  if (!ctx.user) throw fail("You must be signed in.");
  return ctx.user;
}
function requireAdmin(ctx: Ctx) {
  const user = requireUser(ctx);
  if (!isAdmin(user)) throw fail("Requires ADMIN role.");
  return user;
}

const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    employeeId: String!
    name: String!
    email: String!
    role: String!
    gender: String
    address: String
    contact: String
  }
  type OwnerInfo {
    name: String!
    email: String!
  }
  type Asset {
    id: ID!
    assetName: String!
    serialNumber: String!
    status: String!
    ownerId: ID
    owner: OwnerInfo
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    role: String
    gender: String
    address: String
    contact: String
  }
  input UpdateUserInput {
    name: String
    email: String
    role: String
  }
  input UpdateAssetInput {
    assetName: String
    serialNumber: String
    ownerId: ID
    status: String
  }

  type Query {
    me: User
    assets: [Asset!]!
    users: [User!]!
  }

  type Mutation {
    createAsset(assetName: String!, serialNumber: String!): Asset!
    updateAsset(id: ID!, input: UpdateAssetInput!): Asset!
    deleteAsset(id: ID!): Boolean!
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
  }
`;

type AssetInput = {
  assetName?: string | null;
  serialNumber?: string | null;
  ownerId?: string | null;
  status?: string | null;
};

export const schema = createSchema<Ctx>({
  typeDefs,
  resolvers: {
    Query: {
      me: (_, __, ctx) =>
        ctx.user ? prisma.user.findUnique({ where: { id: ctx.user.id } }) : null,

      assets: (_, __, ctx) => {
        const user = requireUser(ctx);
        return prisma.asset.findMany({
          where: isAdmin(user) ? undefined : { ownerId: user.id },
          include: { owner: { select: { name: true, email: true } } },
        });
      },

      users: (_, __, ctx) => {
        requireAdmin(ctx);
        return prisma.user.findMany();
      },
    },

    Mutation: {
      createAsset: async (_, args: { assetName: string; serialNumber: string }, ctx) => {
        requireAdmin(ctx);
        if (!args.assetName || !args.serialNumber) {
          throw fail("assetName and serialNumber are required.");
        }
        try {
          return await prisma.asset.create({
            data: { assetName: args.assetName, serialNumber: args.serialNumber, status: "IN_STORAGE" },
          });
        } catch (e) {
          throw fail(
            isDuplicate(e)
              ? "An asset with this serial number already exists."
              : "Failed to create asset."
          );
        }
      },

      updateAsset: async (_, { id, input }: { id: string; input: AssetInput }, ctx) => {
        const user = requireUser(ctx);
        const asset = await prisma.asset.findUnique({ where: { id } });
        if (!asset) throw fail("Asset not found.");

        const adminOnlyEdit =
          input.assetName != null || input.serialNumber != null || input.ownerId !== undefined;
        if (adminOnlyEdit && !isAdmin(user)) throw fail("Only admins can edit assets.");

        if (input.status != null) {
          const allowed =
            isAdmin(user) || (asset.ownerId && canAccessResource(user, asset.ownerId));
          if (!allowed) throw fail("Forbidden.");
        }

        const data: { status?: string; ownerId?: string | null; assetName?: string; serialNumber?: string } = {};
        if (input.assetName != null) data.assetName = input.assetName;
        if (input.serialNumber != null) data.serialNumber = input.serialNumber;

        if (input.ownerId !== undefined) {
          data.ownerId = input.ownerId || null;
          data.status = input.ownerId ? "ASSIGNED" : "IN_STORAGE";
        }

        if (input.status != null) {
          const effectiveOwnerId = input.ownerId !== undefined ? input.ownerId : asset.ownerId;
          if (input.status === "ASSIGNED" && !effectiveOwnerId) {
            throw fail("Cannot mark an asset ASSIGNED without an owner. Assign it to someone first.");
          }
          data.status = input.status;
          if (input.status === "IN_STORAGE" || input.status === "RETIRED") {
            data.ownerId = null;
          }
        }

        try {
          return await prisma.asset.update({ where: { id }, data });
        } catch (e) {
          throw fail(
            isDuplicate(e)
              ? "An asset with this serial number already exists."
              : "Failed to update asset."
          );
        }
      },

      deleteAsset: async (_, { id }: { id: string }, ctx) => {
        requireAdmin(ctx);
        const asset = await prisma.asset.findUnique({ where: { id } });
        if (!asset) throw fail("Asset not found.");
        await prisma.asset.delete({ where: { id } });
        return true;
      },

      createUser: async (
        _,
        { input }: {
          input: {
            name: string; email: string; password: string; role?: string | null;
            gender?: string | null; address?: string | null; contact?: string | null;
          };
        },
        ctx
      ) => {
        requireAdmin(ctx);
        if (!input.name || !input.email || !input.password) {
          throw fail("name, email, and password are required.");
        }
        if (input.password.length < 6) throw fail("Password must be at least 6 characters.");
        if (!/^[A-Za-z\s]+$/.test(input.name)) throw fail("Name must contain letters only, no numbers.");
        if (input.contact && !/^\d{10}$/.test(input.contact)) {
          throw fail("Contact number must be exactly 10 digits.");
        }

        try {
          const hashedPassword = await bcrypt.hash(input.password, 10);
          const userCount = await prisma.user.count();
          const employeeId = `EMP-${String(userCount + 1).padStart(4, "0")}`;

          return await prisma.user.create({
            data: {
              employeeId,
              name: input.name,
              email: input.email,
              password: hashedPassword,
              role: input.role === "ADMIN" ? "ADMIN" : "USER",
              gender: input.gender || null,
              address: input.address || null,
              contact: input.contact || null,
            },
          });
        } catch (e) {
          throw fail(
            isDuplicate(e) ? "A user with this email already exists." : "Failed to create user."
          );
        }
      },

      updateUser: async (
        _,
        { id, input }: { id: string; input: { name?: string | null; email?: string | null; role?: string | null } },
        ctx
      ) => {
        const admin = requireAdmin(ctx);

        const data: { name?: string; email?: string; role?: string } = {};
        if (input.name != null) data.name = input.name;
        if (input.email != null) data.email = input.email;
        if (input.role != null) data.role = input.role === "ADMIN" ? "ADMIN" : "USER";

        if (data.role === "USER") {
          const target = await prisma.user.findUnique({ where: { id } });
          if (target?.role === "ADMIN") {
            if (id === admin.id) throw fail("You cannot demote your own account.");
            const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
            if (adminCount <= 1) throw fail("Cannot demote the last remaining admin account.");
          }
        }

        try {
          return await prisma.user.update({ where: { id }, data });
        } catch (e) {
          throw fail(
            isDuplicate(e) ? "A user with this email already exists." : "Failed to update user."
          );
        }
      },

      deleteUser: async (_, { id }: { id: string }, ctx) => {
        const admin = requireAdmin(ctx);

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw fail("User not found.");
        if (id === admin.id) throw fail("You cannot delete your own account.");

        if (user.role === "ADMIN") {
          const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
          if (adminCount <= 1) throw fail("Cannot delete the last remaining admin account.");
        }

        await prisma.asset.updateMany({
          where: { ownerId: id },
          data: { ownerId: null, status: "IN_STORAGE" },
        });
        await prisma.user.delete({ where: { id } });
        return true;
      },

      changePassword: async (
        _,
        { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
        ctx
      ) => {
        const current = requireUser(ctx);
        if (newPassword.length < 6) throw fail("New password must be at least 6 characters.");

        const user = await prisma.user.findUnique({ where: { id: current.id } });
        if (!user) throw fail("User not found.");

        const matches = await bcrypt.compare(currentPassword, user.password);
        if (!matches) throw fail("Current password is incorrect.");

        await prisma.user.update({
          where: { id: user.id },
          data: { password: await bcrypt.hash(newPassword, 10) },
        });
        return true;
      },
    },
  },
});
