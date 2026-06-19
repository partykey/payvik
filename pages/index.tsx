import Products from '../components/Products'
import SiteHeading from '../components/SiteHeading'
import { useWallet } from '@solana/wallet-adapter-react'

export default function HomePage() {
  return (
// gsl - styles white box around heading
//  <div className="m-auto flex max-w-4xl flex-col items-stretch gap-8 pt-24" style={{alignItems: 'center', backgroundColor: 'white'}}>
    <div className="m-auto flex max-w-4xl flex-col items-stretch gap-8 pt-24" style={{alignItems: 'center'}}>
    <span style={{color: 'green', alignItems: 'center', fontSize: '2rem'}}>P &Lambda; Y V I K</span>
    <span style={{color: 'green', fontSize: '1.5rem'}}>Digital E-Commerce Platform</span>
    </div>
  )
}

