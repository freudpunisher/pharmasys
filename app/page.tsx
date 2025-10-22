import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
  return null; // Explicitly return null to satisfy React component requirement
}