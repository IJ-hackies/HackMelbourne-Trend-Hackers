export const metadata = { title: 'Git Gud', description: 'Competitive Git coaching' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
