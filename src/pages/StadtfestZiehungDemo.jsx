import Seo from '../components/Seo.jsx'
import { DemoRegie } from '../components/stadtfest/DemoZiehung.jsx'

export default function StadtfestZiehungDemo() {
  return (
    <>
      <Seo
        title="Demo-Ziehung Stadtfest | VIDEKO Küchen"
        description="Interner Demo-Test der Stadtfest-Ziehung. Keine echte Ziehung."
        canonicalPath="/stadtfest/ziehung/demo"
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
