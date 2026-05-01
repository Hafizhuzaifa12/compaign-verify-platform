import { redirect } from "next/navigation";

/** Old/bookmarked URLs use `/login`; real page lives under `/auth/login`. */
export default function LoginRedirectPage() {
  redirect("/auth/login");
}
