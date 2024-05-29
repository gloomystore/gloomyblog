import type { Metadata } from "next";
import { Inter } from "next/font/google";
import '@/styles/globals.scss'
import RecoidContextProvider from '@/store/CommonAtom'
import NavBar from "./components/NavBar";
import { Footer } from "./components/Footer";
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <RecoidContextProvider>
          <NavBar />
            {children}
          <Footer />
        </RecoidContextProvider>
      </body>
    </html>
  );
}
