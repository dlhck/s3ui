import { auth } from "../src/lib/auth";

async function seed() {
  console.log("Seeding database...");

  try {
    // Create demo admin account
    const result = await auth.api.signUpEmail({
      body: {
        email: "admin@demo.com",
        password: "admin123",
        name: "Demo Admin",
      },
    });

    if (result) {
      console.log("Demo admin account created successfully!");
      console.log("Email: admin@demo.com");
      console.log("Password: admin123");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      console.log("Demo admin account already exists.");
      console.log("Email: admin@demo.com");
      console.log("Password: admin123");
    } else {
      console.error("Error creating demo account:", error);
    }
  }
}

seed();
