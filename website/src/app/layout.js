import "./globals.css";

export const metadata = {
  title: "Contractor ERP",
  description: "Enterprise Resource Planning for A-Class Contractors",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}