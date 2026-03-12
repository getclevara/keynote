import "./globals.css";

export const metadata = {
  title: "If AI Can Replace You, Who Were You? | Hawaii Island AI Summit 2026",
  description: "Live AI Demo — Binil Chacko",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&family=Instrument+Serif&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
