"use server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Placeholder for authentication logic
  console.log("Login attempt:", { email });
}