import { FC, useEffect, useMemo, useRef } from 'react'
import {
  createQR,
  encodeURL,
  findReference,
  FindReferenceError,
} from '@solana/pay'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

interface Props {
  index: number
  recipient: PublicKey
  splToken: PublicKey
  amount: number
  label: string
  message: string
  isValidated?: boolean
  onValidateTransfer: (index: number, signature: string) => void
}

const QrCode: FC<Props> = (props) => {
  const { index, recipient, amount, label, message, isValidated, onValidateTransfer } = props
  
  const endpoint = 'https://mainnet.helius-rpc.com/?api-key=a1ac6d33-1522-44d3-acfa-54c8c4579f13'
  const connection = new Connection(endpoint)
  
  const qrRef = useRef<HTMLDivElement>(null)
  const reference = useMemo(() => Keypair.generate().publicKey, [])
  const amountBigNumber = useMemo(() => new BigNumber(amount), [amount])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const apiBase = window.location.origin
    const searchParams = new URLSearchParams()
    searchParams.append('recipient', recipient.toString())
    searchParams.append('amount', amountBigNumber.toString())
    searchParams.append('label', label)
    searchParams.append('reference', reference.toString())
    if (message) searchParams.append('message', message)

    const apiUrl = `${apiBase}/api/makeTransaction?${searchParams.toString()}`

    const url = encodeURL({
      link: new URL(apiUrl),
      label: label,
      message: message,
    })

    const qr = createQR(url, 340, 'transparent')
    if (qrRef.current && amountBigNumber.isGreaterThan(0)) {
      qrRef.current.innerHTML = ''
      qr.append(qrRef.current)
    }
  }, [recipient, amountBigNumber, label, message, reference])

  useEffect(() => {
    if (isValidated) return

    let active = true

    const pollForTransaction = async () => {
      if (!active) return

      try {
        const signatureInfo = await findReference(
          connection,
          reference as PublicKey,
          { finality: 'confirmed' } 
        )
        
        if (active) {
          active = false
          onValidateTransfer(index, signatureInfo.signature)
        }
      } catch (e) {
        if (e instanceof FindReferenceError) {
          if (active) setTimeout(pollForTransaction, 1000)
          return
        }
        console.error('Unknown error during QR poll', e)
        if (active) setTimeout(pollForTransaction, 1000)
      }
    }

    pollForTransaction()
    
    return () => {
      active = false
    }
  }, [connection, reference, index, onValidateTransfer, isValidated])

  return <div ref={qrRef} />
}

export default QrCode