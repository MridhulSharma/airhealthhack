import "./globals.css";

export const metadata = {
  title: "VOLTA",
  description: "Virtual Output & Live Training Arena",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
