import "./globals.css";

export const metadata = {
  title: "PulseDrive",
  description: "Motion-powered interactive fitness experience",
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
