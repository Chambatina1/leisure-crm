import { redirect } from "next/navigation";

// /agencias → redirige al login de agencias
export default function AgenciasPage() {
  redirect("/login");
}
