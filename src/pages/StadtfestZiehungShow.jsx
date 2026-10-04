import Seo from '../components/Seo.jsx'
import { ZiehungsBuehne } from '../components/stadtfest/LiveZiehung.jsx'

export default function StadtfestZiehungShow() {
  return (
    <>
      <Seo
        title="Live-Bühne Stadtfest-Ziehung | VIDEKO Küchen"
        description="16:9 Live-Bühne der VIDEKO Hauptpreis-Ziehung."
        canonicalPath="/stadtfest/ziehung/show"
        noindex
        nofollow
      />
      <main className="stz-show">
        <ZiehungsBuehne />
      </main>
    </>
  )
}
