export * from "./auth";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  OPERATOR = "OPERATOR",
  ACCOUNTS = "ACCOUNTS",
  VIEW_ONLY = "VIEW_ONLY",
}
