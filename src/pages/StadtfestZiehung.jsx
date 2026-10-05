import Seo from '../components/Seo.jsx'
import { GewinnerListe, ZiehungsBuehne } from '../components/stadtfest/LiveZiehung.jsx'

export default function StadtfestZiehung() {
  return (
    <>
      <Seo
        title="Live-Ziehung Stadtfest 2026 | VIDEKO Küchen"
        description="Live-Stand der VIDEKO Hauptpreis-Ziehung zum Würzburger Stadtfest 2026."
        canonicalPath="/stadtfest/ziehung"
        noindex
        nofollow
      />

      <main className="stz-page">
        <div className="stz-page__buehne">
          <ZiehungsBuehne kompakt />
        </div>
        <GewinnerListe />
      </main>
    </>
  )
}
