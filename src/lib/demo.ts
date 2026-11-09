/**
 * Demo accounts. These are intentionally public: the assignment asks for
 * obvious demo credentials so reviewers can test sharing between users.
 */
export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS = [
  { name: "Alice Owner", email: "alice@demo.test" },
  { name: "Bob Collaborator", email: "bob@demo.test" },
  { name: "Carol Outsider", email: "carol@demo.test" },
] as const;
