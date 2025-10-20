export default function ReportingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-[70vw] mx-auto px-4">
      {children}
    </div>
  )
}
