import type { Metadata } from "next";
import Pagina from "@/components/Pagina";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <Pagina inicial={null} />;
}
