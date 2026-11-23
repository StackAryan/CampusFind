import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'

export default function PhotoUpload({ file, onChange, disabled = false }) {
  const [preview, setPreview] = useState('')
  const [brokenFile, setBrokenFile] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!file) return undefined
    let active = true
    const reader = new FileReader()
    reader.onload = () => {
      if (active && typeof reader.result === 'string') setPreview(reader.result)
    }
    reader.onerror = () => {
      if (active) setPreview('')
    }
    reader.readAsDataURL(file)
    return () => {
      active = false
    }
  }, [file])

  const handleSelect = (event) => {
    const next = event.target.files?.[0] ?? null
    onChange(next)
    event.target.value = ''
  }

  const clear = () => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const showPreview = Boolean(file && preview && brokenFile !== file)

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleSelect}
        disabled={disabled}
      />
      {showPreview ? (
        <div className="relative overflow-hidden rounded-2xl border border-line">
          <img
            src={preview}
            alt="Selected item preview"
            className="h-52 w-full object-cover"
            onError={() => setBrokenFile(file)}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink/70 to-transparent px-3 py-2.5">
            <span className="truncate text-xs font-medium text-white/90">{file.name}</span>
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold text-ink"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white/60 px-6 py-8 text-center transition hover:border-moss/40 hover:bg-moss-soft/30 disabled:opacity-60"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-moss-soft text-moss">
            {file ? <Camera className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
          </span>
          <span className="text-sm font-semibold text-ink">
            {file ? 'Choose a different photo' : 'Add a photo'}{' '}
            <span className="font-normal text-ink/45">(optional)</span>
          </span>
          <span className="text-xs text-ink/45">JPG, PNG or WebP · up to 10 MB</span>
          {file && <span className="truncate text-xs font-medium text-moss">{file.name}</span>}
        </button>
      )}
    </div>
  )
}
