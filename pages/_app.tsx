import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import Head from 'next/head'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'

//default styles can be overridden by app
require('@solana/wallet-adapter-react-ui/styles.css')

//gsl - enable times new roman font
//import React from 'react';
//import ReactDOM from 'react-dom/client';
import './app.css';

function MyApp({ Component, pageProps }: AppProps) {
//    const network = WalletAdapterNetwork.Devnet
    const network = WalletAdapterNetwork.Mainnet

  //RPC to connect
// const endpoint = clusterApiUrl(network)
// const endpoint = 'https://rpc.ankr.com/solana_devnet/6aad76eb15b9f5fbe2ecae3f51f3b9214bec5b62d4ad0fc96ddfe50436cceacc';
// const endpoint = 'https://rpc.ankr.com/solana/6aad76eb15b9f5fbe2ecae3f51f3b9214bec5b62d4ad0fc96ddfe50436cceacc';
// const endpoint = 'https://young-frosty-cloud.solana-mainnet.discover.quiknode.pro/10fad585ad89ea968180e0de4d1c8a74a357da3a';

// const endpoint = 'https://dark-ultra-sailboat.solana-mainnet.quiknode.pro/5bb96406e19667853a3464369d3a867ffa6017d6';
    const endpoint = 'https://mainnet.helius-rpc.com/?api-key=a1ac6d33-1522-44d3-acfa-54c8c4579f13';
//   const endpoint = 'https://api.mainnet-beta.solana.com';

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
  ]

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Layout>
            <Head>
{/* gsl - original line
              <title>Cookies Inc</title>
*/}
              <title>P &Lambda; Y V I K | Digital E-Commerce Platform | Digital Dollar Merchant Account | Instant USDC Payments</title>
            </Head>
            <Component {...pageProps} />
        </Layout>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default MyApp
