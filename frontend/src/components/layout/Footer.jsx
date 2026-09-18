export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
        <p>© {new Date().getFullYear()} DocuCamp — Apprendre. Partager. S'équiper.</p>
        <p>Fait pour les étudiants.</p>
      </div>
    </footer>
  )
}