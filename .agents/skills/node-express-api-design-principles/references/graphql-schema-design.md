# GraphQL Schema Design Patterns (TypeScript)

Generate resolver types with `@graphql-codegen/cli`. See [typescript-patterns.md](typescript-patterns.md).

## Schema Organization

### Modular Schema Structure

```graphql
# user.graphql
type User {
  id: ID!
  email: String!
  name: String!
  posts: [Post!]!
}

extend type Query {
  user(id: ID!): User
  users(first: Int, after: String): UserConnection!
}

extend type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
}

# post.graphql
type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
}

extend type Query {
  post(id: ID!): Post
}
```

Merge type definitions in Apollo Server:

```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mergeTypeDefs } from '@graphql-tools/merge';

const typeDefs = mergeTypeDefs([
  readFileSync(join(__dirname, 'schemas/user.graphql'), 'utf-8'),
  readFileSync(join(__dirname, 'schemas/post.graphql'), 'utf-8'),
]);
```

## Type Design Patterns

### 1. Non-Null Types

```graphql
type User {
  id: ID! # Always required
  email: String! # Required
  phone: String # Optional (nullable)
  posts: [Post!]! # Non-null array of non-null posts
  tags: [String!] # Nullable array of non-null strings
}
```

### 2. Interfaces for Polymorphism

```graphql
interface Node {
  id: ID!
  createdAt: DateTime!
}

type User implements Node {
  id: ID!
  createdAt: DateTime!
  email: String!
}

type Post implements Node {
  id: ID!
  createdAt: DateTime!
  title: String!
}

type Query {
  node(id: ID!): Node
}
```

### 3. Unions for Heterogeneous Results

```graphql
union SearchResult = User | Post | Comment

type Query {
  search(query: String!): [SearchResult!]!
}

# Query example
{
  search(query: "graphql") {
    ... on User {
      name
      email
    }
    ... on Post {
      title
      content
    }
    ... on Comment {
      text
      author {
        name
      }
    }
  }
}
```

### 4. Input Types

```graphql
input CreateUserInput {
  email: String!
  name: String!
  password: String!
  profileInput: ProfileInput
}

input ProfileInput {
  bio: String
  avatar: String
  website: String
}

input UpdateUserInput {
  id: ID!
  email: String
  name: String
  profileInput: ProfileInput
}
```

## Pagination Patterns

### Relay Cursor Pagination (Recommended)

```graphql
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  users(first: Int, after: String, last: Int, before: String): UserConnection!
}

# Usage
{
  users(first: 10, after: "cursor123") {
    edges {
      cursor
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Offset Pagination (Simpler)

```graphql
type UserList {
  items: [User!]!
  total: Int!
  page: Int!
  pageSize: Int!
}

type Query {
  users(page: Int = 1, pageSize: Int = 20): UserList!
}
```

## Mutation Design Patterns

### 1. Input/Payload Pattern

```graphql
input CreatePostInput {
  title: String!
  content: String!
  tags: [String!]
}

type CreatePostPayload {
  post: Post
  errors: [Error!]
  success: Boolean!
}

type Error {
  field: String
  message: String!
  code: String!
}

type Mutation {
  createPost(input: CreatePostInput!): CreatePostPayload!
}
```

### 2. Optimistic Response Support

```graphql
type UpdateUserPayload {
  user: User
  clientMutationId: String
  errors: [Error!]
}

input UpdateUserInput {
  id: ID!
  name: String
  clientMutationId: String
}

type Mutation {
  updateUser(input: UpdateUserInput!): UpdateUserPayload!
}
```

### 3. Batch Mutations

```graphql
input BatchCreateUserInput {
  users: [CreateUserInput!]!
}

type BatchCreateUserPayload {
  results: [CreateUserResult!]!
  successCount: Int!
  errorCount: Int!
}

type CreateUserResult {
  user: User
  errors: [Error!]
  index: Int!
}

type Mutation {
  batchCreateUsers(input: BatchCreateUserInput!): BatchCreateUserPayload!
}
```

## Field Design

### Arguments and Filtering

```graphql
type Query {
  posts(
    # Pagination
    first: Int = 20
    after: String

    # Filtering
    status: PostStatus
    authorId: ID
    tag: String

    # Sorting
    orderBy: PostOrderBy = CREATED_AT
    orderDirection: OrderDirection = DESC

    # Searching
    search: String
  ): PostConnection!
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PostOrderBy {
  CREATED_AT
  UPDATED_AT
  TITLE
}

enum OrderDirection {
  ASC
  DESC
}
```

### Computed Fields

```graphql
type User {
  firstName: String!
  lastName: String!
  fullName: String! # Computed in resolver
  posts: [Post!]!
  postCount: Int! # Computed, doesn't load all posts
}

type Post {
  likeCount: Int!
  commentCount: Int!
  isLikedByViewer: Boolean! # Context-dependent
}
```

## Subscriptions

```graphql
type Subscription {
  postAdded: Post!

  postUpdated(postId: ID!): Post!

  userStatusChanged(userId: ID!): UserStatus!
}

type UserStatus {
  userId: ID!
  online: Boolean!
  lastSeen: DateTime!
}

# Client usage
subscription {
  postAdded {
    id
    title
    author {
      name
    }
  }
}
```

Apollo Server subscriptions with `graphql-ws`:

```typescript
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';

const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
useServer({ schema }, wsServer);
```

## Custom Scalars

```graphql
scalar DateTime
scalar Email
scalar URL
scalar JSON
scalar Money

type User {
  email: Email!
  website: URL
  createdAt: DateTime!
  metadata: JSON
}

type Product {
  price: Money!
}
```

```typescript
import { GraphQLScalarType, Kind } from 'graphql';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value: Date) => value.toISOString(),
  parseValue: (value: string) => new Date(value),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});
```

## Directives

### Built-in Directives

```graphql
type User {
  name: String!
  email: String! @deprecated(reason: "Use emails field instead")
  emails: [String!]!

  # Conditional inclusion
  privateData: PrivateData @include(if: $isOwner)
}

# Query
query GetUser($isOwner: Boolean!) {
  user(id: "123") {
    name
    privateData @include(if: $isOwner) {
      ssn
    }
  }
}
```

### Custom Directives

```graphql
directive @auth(requires: Role = USER) on FIELD_DEFINITION

enum Role {
  USER
  ADMIN
  MODERATOR
}

type Mutation {
  deleteUser(id: ID!): Boolean! @auth(requires: ADMIN)
  updateProfile(input: ProfileInput!): User! @auth
}
```

Implement with `@graphql-tools/schema` directive transformers or resolver-level auth checks.

## Error Handling

### Union Error Pattern

```graphql
type User {
  id: ID!
  email: String!
}

type ValidationError {
  field: String!
  message: String!
}

type NotFoundError {
  message: String!
  resourceType: String!
  resourceId: ID!
}

type AuthorizationError {
  message: String!
}

union UserResult = User | ValidationError | NotFoundError | AuthorizationError

type Query {
  user(id: ID!): UserResult!
}
```

### Errors in Payload

```graphql
type CreateUserPayload {
  user: User
  errors: [Error!]
  success: Boolean!
}

type Error {
  field: String
  message: String!
  code: ErrorCode!
}

enum ErrorCode {
  VALIDATION_ERROR
  UNAUTHORIZED
  NOT_FOUND
  INTERNAL_ERROR
}
```

## N+1 Query Problem Solutions

### DataLoader Pattern

```typescript
import DataLoader from 'dataloader';

function createPostLoader() {
  return new DataLoader<string, Post | null>(async (postIds) => {
    const posts = await db.post.findMany({ where: { id: { in: [...postIds] } } });
    const postMap = new Map(posts.map((p) => [p.id, p]));
    return postIds.map((id) => postMap.get(id) ?? null);
  });
}

// Resolver
const resolvers = {
  User: {
    posts: (user: User, _: unknown, ctx: Context) =>
      ctx.loaders.post.loadMany(user.postIds),
  },
};
```

### Query Depth Limiting

```typescript
import depthLimit from 'graphql-depth-limit';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(7)],
});
```

### Query Complexity Analysis

```typescript
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    createComplexityLimitRule(1000, {
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,
    }),
  ],
});
```

## Schema Versioning

### Field Deprecation

```graphql
type User {
  name: String! @deprecated(reason: "Use firstName and lastName")
  firstName: String!
  lastName: String!
}
```

### Schema Evolution

```graphql
# v1 - Initial
type User {
  name: String!
}

# v2 - Add optional field (backward compatible)
type User {
  name: String!
  email: String
}

# v3 - Deprecate and add new field
type User {
  name: String! @deprecated(reason: "Use firstName/lastName")
  firstName: String!
  lastName: String!
  email: String
}
```

## Best Practices Summary

1. **Nullable vs Non-Null**: Start nullable, make non-null when guaranteed
2. **Input Types**: Always use input types for mutations
3. **Payload Pattern**: Return errors in mutation payloads
4. **Pagination**: Use cursor-based for infinite scroll, offset for simple cases
5. **Naming**: Use camelCase for fields, PascalCase for types
6. **Deprecation**: Use `@deprecated` instead of removing fields
7. **DataLoaders**: Always use for relationships to prevent N+1
8. **Complexity Limits**: Protect against expensive queries
9. **Custom Scalars**: Use for domain-specific types (Email, DateTime)
10. **Documentation**: Document all fields with descriptions
