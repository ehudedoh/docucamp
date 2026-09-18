import { Link } from 'react-router-dom'
import { BookOpen, Package, Share2, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-3">
          DocuCamp
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-2">
          Apprendre. Partager. S'équiper.
        </p>
        <p className="text-slate-500 max-w-xl mx-auto mb-8">
          La plateforme d'entraide étudiante qui centralise les ressources académiques
          et facilite l'accès au matériel de seconde main.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/documents" className="btn-primary">
            <BookOpen size={18} /> Explorer les documents
          </Link>
          <Link to="/materials" className="btn-secondary">
            <Package size={18} /> Explorer le matériel
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-3">
            <BookOpen size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Banque académique</h2>
          <p className="text-sm text-slate-600 mb-4">
            Cours, examens, corrections, fiches de révision et TPs classés par
            établissement, filière, niveau et matière.
          </p>
          <Link to="/documents" className="text-brand-600 font-medium text-sm hover:underline">
            Parcourir les documents →
          </Link>
        </div>

        <div className="card p-6">
          <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-3">
            <Package size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Bourse au matériel</h2>
          <p className="text-sm text-slate-600 mb-4">
            Calculatrices, livres, kits de TP et accessoires — à vendre, louer ou
            donner entre étudiants.
          </p>
          <Link to="/materials" className="text-brand-600 font-medium text-sm hover:underline">
            Voir les annonces →
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-slate-100 items-center justify-center mb-3">
            <Share2 size={20} className="text-slate-600" />
          </div>
          <h3 className="font-medium text-slate-900 mb-1">Partagez</h3>
          <p className="text-sm text-slate-500">Contribuez à la communauté en publiant vos documents.</p>
        </div>
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-slate-100 items-center justify-center mb-3">
            <Users size={20} className="text-slate-600" />
          </div>
          <h3 className="font-medium text-slate-900 mb-1">Entraidez-vous</h3>
          <p className="text-sm text-slate-500">Trouvez du matériel à prix réduit ou donnez ce que vous n'utilisez plus.</p>
        </div>
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-slate-100 items-center justify-center mb-3">
            <BookOpen size={20} className="text-slate-600" />
          </div>
          <h3 className="font-medium text-slate-900 mb-1">Apprenez</h3>
          <p className="text-sm text-slate-500">Accédez à des ressources classées et modérées.</p>
        </div>
      </section>
    </div>
  )
}