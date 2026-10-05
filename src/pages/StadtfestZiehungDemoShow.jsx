import Seo from '../components/Seo.jsx'
import { DemoZiehungsBuehne } from '../components/stadtfest/DemoZiehung.jsx'

export default function StadtfestZiehungDemoShow() {
  return (
    <>
      <Seo
        title="Demo-Bühne Stadtfest-Ziehung | VIDEKO Küchen"
        description="Automatischer Demo-Test der Stadtfest-Ziehung. Keine echte Ziehung."
        canonicalPath="/stadtfest/ziehung/demo/show"
        noindex
        nofollow
      />
      <main className="stz-show">
        <DemoZiehungsBuehne auto />
      </main>
    </>
  )
}
