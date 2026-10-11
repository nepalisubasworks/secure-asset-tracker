import { createYoga } from "graphql-yoga";
import { schema } from "@/lib/graphql/schema";
import { getCurrentUser } from "@/lib/auth-helpers";

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  graphiql: process.env.NODE_ENV !== "production",
  fetchAPI: { Response },
  context: async () => ({ user: await getCurrentUser() }),
});

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
