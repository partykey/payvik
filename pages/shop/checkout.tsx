import { useRouter } from 'next/router'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Keypair, Transaction, PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import PageHeading from '../../components/PageHeading'
import QrCode from '../../components/QrCode'
import {
  MakeTransactionInputData,
  MakeTransactionOutputData,
} from '../api/makeTransaction'
import { encrypt, decrypt } from '../../lib/openssl_crypto'
import { usdcAddress } from '../../lib/addresses'

export interface Transfer {
  recipient: string
  amount: number
  isValidate?: boolean
  signature?: string
}

export default function Checkout() {
  const router = useRouter()
  const { connection } = useConnection()
  const { publicKey, sendTransaction, disconnect } = useWallet()
  
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [createdQrCode, setCreatedQrCode] = useState(false)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const { token } = router.query
  const params = useMemo(() => {
    if (token) {
      const tokenString = String(token).trim().replaceAll(' ', '+')
      return JSON.parse(decrypt(tokenString as string))
    } else {
      return router.query
    }
  }, [router.query])

  const amount = useMemo(() => {
    return new BigNumber(params.amount)
  }, [params])

  useEffect(() => {
    let trans: Transfer[] = []

    if (params.recipient) trans.push({ recipient: params.recipient, amount: params.amount * (params.percent || 1) })
    if (params.recipient1) trans.push({ recipient: params.recipient1, amount: params.amount * (params.percent1 || 0) })
    if (params.recipient2) trans.push({ recipient: params.recipient2, amount: params.amount * (params.percent2 || 0) })
    if (params.recipient3) trans.push({ recipient: params.recipient3, amount: params.amount * (params.percent3 || 0) })

    setTransfers(trans)
  }, [params])

  const handleValidateTransfer = useCallback((indexToValidate: number, signature: string) => {
    setTransfers((prevTrans) =>
      prevTrans.map((trans, idx) => {
        if (idx === indexToValidate) {
          return { ...trans, isValidate: true, signature }
        }
        return trans
      })
    )
  }, [])

  const fireWebhook = async (signature: string) => {
    try {
      const webhookUrl = 'https://webhook.site/a7e2b967-e825-4ca6-9438-eb7467bfa3b1' // NOTE: Update this URL to your specific live webhook link if it changed!
      
      const formData = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach(v => formData.append(key, String(v)))
        else if (value !== undefined && value !== null) formData.append(key, String(value))
      })
      formData.append('signature', signature)

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })
    } catch (e) {
      console.error("Webhook trigger failed", e)
    }
  }

  // QR Code Redirect & Webhook Logic
  useEffect(() => {
    const handleQrCompletion = async () => {
      if (transfers.length !== 0 && transfers.every((trans) => trans.isValidate)) {
        const finalSignature = transfers[0].signature
        if (finalSignature) {
          await fireWebhook(finalSignature)
          const secret = params.secret
          location.replace("https://payvik.com/ty/" + secret + "/" + finalSignature)
        }
      }
    }
    handleQrCompletion()
  }, [transfers, params])

  useEffect(() => {
    async function getTransaction() {
      if (!publicKey || !params || !params.recipient) return
      
      const reference = Keypair.generate().publicKey
      const body: MakeTransactionInputData = { account: publicKey.toString() }

      try {
        let response

        if (token) {
          const tokenString = encrypt(JSON.stringify({ ...params, reference }))
          response = await fetch(`/api/makeTransaction?token=${tokenString}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        } else {
          const searchParams = new URLSearchParams()
          for (const [key, value] of Object.entries(params)) {
            if (value) {
              if (Array.isArray(value)) value.forEach(v => searchParams.append(key, v))
              else searchParams.append(key, value as string)
            }
          }
          searchParams.append('reference', reference.toString())

          response = await fetch(`/api/makeTransaction?${searchParams.toString()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        }

        const json = (await response.json()) as MakeTransactionOutputData

        if (response.status !== 200) {
          console.error(json)
          return
        }

        const tx = Transaction.from(Buffer.from(json.transaction, 'base64'))
        setTransaction(tx)
      } catch (e) {
        console.error('Error fetching transaction:', e)
      }
    }

    getTransaction()
  }, [publicKey, params, token])

  // Desktop Flow Redirect & Webhook Logic
  const handleSignatureStatus = async (signature: string) => {
    try {
      const result = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      })
      
      if (result.value?.confirmationStatus === 'confirmed' || result.value?.confirmationStatus === 'finalized') {
        
        await fireWebhook(signature)
        
        const secret = params.secret
        location.replace("https://payvik.com/ty/" + secret + "/" + signature)
        return
      }
      
      setTimeout(() => handleSignatureStatus(signature), 2000)
    } catch (error) {
      console.error(error)
      disconnect()
      setIsProcessing(false)
      setIsConfirming(false)
    }
  }

  const handlePaymentClick = async () => {
    if (!transaction) return

    setIsProcessing(true)
    setIsConfirming(false) 
    setMessage('Please approve the transaction in your wallet.')

    try {
      const signature = await sendTransaction(transaction, connection)
      
      setIsConfirming(true) 
      setMessage('Confirming transaction on the blockchain...')
      
      handleSignatureStatus(signature)
    } catch (e) {
      console.error(e)
      setMessage('Transaction cancelled or failed.')
      setIsProcessing(false)
      setIsConfirming(false)
    }
  }

  const handleClickCreateQR = () => {
    setCreatedQrCode(true)
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <PageHeading>
        <div>{params.merchant}</div>
        <div style={{fontSize: '1.5rem', marginTop: '10px'}}>{params.label}</div>
        <div style={{fontSize: '1.5rem', marginTop: '0px'}}>USDC {amount?.toString()}</div>
      </PageHeading>

      {/* Button constraints physically locked to prevent browser focus rings/click expansion */}
      <div className="flex flex-col w-full max-w-xs gap-4 items-center">
        {!publicKey ? (
            <div className="w-full rounded-md shadow hover:opacity-90 overflow-hidden">
              <WalletMultiButton 
                className="!bg-green-500 !w-full flex justify-center items-center !outline-none !focus:outline-none !m-0 !p-0 !border-none" 
                style={{ height: '48px', fontSize: '16px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}
              >
                Connect Wallet
              </WalletMultiButton>
            </div>
        ) : (
            <div className="w-full rounded-md shadow overflow-hidden">
              <button 
                onClick={handlePaymentClick}
                disabled={!transaction || isProcessing}
                className="w-full bg-green-500 text-white disabled:opacity-50 transition-colors flex items-center justify-center outline-none focus:outline-none focus:ring-0 active:bg-green-600 border-none m-0 p-0"
                style={{ 
                  height: '48px', 
                  minHeight: '48px', 
                  maxHeight: '48px', 
                  fontSize: '16px', 
                  fontFamily: 'Arial, sans-serif', 
                  fontWeight: 'bold',
                  boxSizing: 'border-box',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {!transaction ? 'Loading...' : isProcessing && !isConfirming ? 'Processing...' : `Pay USDC ${amount?.toString()}`}
              </button>
            </div>
        )}

        {params.qrcode !== 'no' && (
          <>
            {!createdQrCode && (
              <div className="w-full rounded-md shadow overflow-hidden">
                <button 
                  className="w-full bg-green-500 text-white flex items-center justify-center outline-none focus:outline-none focus:ring-0 active:bg-green-600 border-none m-0 p-0" 
                  onClick={handleClickCreateQR}
                  style={{ 
                    height: '48px', 
                    minHeight: '48px', 
                    maxHeight: '48px', 
                    fontSize: '16px', 
                    fontFamily: 'Arial, sans-serif', 
                    fontWeight: 'bold',
                    boxSizing: 'border-box',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  Create QR Code
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {params.qrcode !== 'no' && createdQrCode && (
        <div className="bento-grid-container mt-4">
          {transfers.map((trans, index) => (
            <div key={`${trans.recipient}-${index}`} className="bento-card">
              
              <div className={`qr-wrapper ${trans.isValidate ? 'validated-blur' : ''}`}>
                <QrCode
                  index={index}
                  onValidateTransfer={handleValidateTransfer}
                  recipient={new PublicKey(trans.recipient)}
                  splToken={usdcAddress}
                  amount={trans.amount} 
                  label={params.label}
                  message={params.message}
                  isValidated={trans.isValidate}
                />
                <p className="qr-label">Scan to pay USDC {trans.amount.toString()}</p>
              </div>

              {trans.isValidate && (
                <div className="glass-success-overlay">
                  <div className="success-icon">✓</div>
                  <p className="success-text">Payment Confirmed</p>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    {/* Dynamic Status Messages & Loading Image */}
      {message && (
        <div className="flex flex-col items-center mt-4">
          {isConfirming && (
            <div className="flex justify-center mb-4">
              <img 
                src="https://www.payvik.com/loadingblue.png" 
                width="40" 
                alt="Loading" 
                className="animate-spin" 
              />
            </div>
          )}
          <p className="text-center font-medium">{message}</p>
        </div>
      )}
    </div>
  )
}