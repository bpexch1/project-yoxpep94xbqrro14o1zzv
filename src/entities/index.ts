import { superdevClient } from "@/lib/superdev/client";

export const User = superdevClient.auth;
export const Client = superdevClient.entity("Client");
export const Transaction = superdevClient.entity("Transaction");
export const Category = superdevClient.entity("Category");
export const Post = superdevClient.entity("Post");
