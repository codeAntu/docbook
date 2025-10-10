export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  // Implement email sending logic here
  console.log(`Sending verification code ${code} to email ${email}`);
}
