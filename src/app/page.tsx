/**
 * Página puente de la ruta raíz: solo monta la vista de login.
 * La app/ de Next.js queda como capa delgada sin lógica de negocio.
 */
import { LoginPageView } from "@/client/features/auth/LoginPage.view";

export default function HomePage() {
  return <LoginPageView />;
}
