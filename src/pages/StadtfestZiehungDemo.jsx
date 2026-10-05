import Seo from '../components/Seo.jsx'
import { DemoRegie } from '../components/stadtfest/DemoZiehung.jsx'

export default function StadtfestZiehungDemo() {
  return (
    <>
      <Seo
        title="Simulation Stadtfest-Ziehung | VIDEKO Küchen"
        description="Interne Simulation der Stadtfest-Ziehung."
        canonicalPath="/stadtfest/ziehung/simulation"
        noindex
        nofollow
      />
      <main className="stz-page stz-page--demo">
        <div className="stz-page__buehne">
          <DemoRegie />
        </div>
      </main>
    </>
  )
}
