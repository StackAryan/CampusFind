import { Link } from 'react-router-dom'
import { ArrowLeft, PackageSearch } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="relative">
        <p className="font-display text-[7rem] font-extrabold leading-none tracking-tighter text-moss/15">
          404
        </p>
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-moss text-cream shadow-lg">
            <PackageSearch className="h-7 w-7" />
          </span>
        </span>
      </div>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
        This page is missing
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/55">
        Unlike the items on our board, this page cannot be recovered. Head back to the campus
        board and keep searching.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/" className="btn-primary">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <Link to="/browse" className="btn-outline">
          Browse listings
        </Link>
      </div>
    </div>
  )
}
