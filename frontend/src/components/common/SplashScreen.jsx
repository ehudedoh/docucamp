import { useEffect, useState } from 'react'

export default function SplashScreen({ onComplete }) {
  const [exit, setExit] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExit(true)
    }, 950)

    const completeTimer = setTimeout(() => {
      onComplete()
    }, 1350)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div
      className={`splash-screen ${exit ? 'splash-screen--exit' : ''}`}
      aria-label="Chargement de DocuCamp"
      role="status"
    >
      <div className="splash-content">
        <img
          src="/icons/logo.png"
          alt="DocuCamp"
          className="splash-logo"
        />

        <div className="splash-name">
          DocuCamp
        </div>
      </div>
    </div>
  )
}