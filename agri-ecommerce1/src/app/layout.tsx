import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
// XÓA import Header, Footer ở đây

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agri Connect - Nông sản Việt",
  description: "Sàn thương mại điện tử nông sản",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
            {/* Chỉ render children, không Header/Footer ở đây */}
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}