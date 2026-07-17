export const metadata = {
  title: "Kodu Sandbox — Next.js Preview",
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
