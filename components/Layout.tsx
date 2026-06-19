import { PropsWithChildren } from "react";
import Footer from "./Footer";
import SiteHeading from '../components/SiteHeading'

export default function Layout({ children }: PropsWithChildren<{}>) {
  return (
 
   <div className='min-h-screen flex flex-col gap-16' style={{alignItems: 'center'}}>
      <main className='mb-auto pt-0'>
{/* gsl - original line
<SiteHeading>P &Lambda; Y V I K top</SiteHeading>
<span style={{color: 'green', alignItems: 'center', backgroundColor: 'white', fontSize: '2rem'}}>P &Lambda; Y V I K</span>
*/}
        {children}
      </main>
      <Footer />
    </div>
  )
}

