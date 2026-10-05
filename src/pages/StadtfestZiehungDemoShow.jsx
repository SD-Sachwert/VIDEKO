import Seo from '../components/Seo.jsx'
import { DemoZiehungsBuehne } from '../components/stadtfest/DemoZiehung.jsx'

export default function StadtfestZiehungDemoShow() {
  return (
    <>
      <Seo
        title="Simulation Stadtfest-Ziehung | VIDEKO Küchen"
        description="Automatische Simulation der Stadtfest-Ziehung."
        canonicalPath="/stadtfest/ziehung/simulation/show"
        noindex
        nofollow
      />
      <main className="stz-show">
        <DemoZiehungsBuehne auto />
      </main>
    </>
  )
}
