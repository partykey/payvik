import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js'
import { NextApiRequest, NextApiResponse } from 'next'
import { decrypt } from '../../lib/openssl_crypto'
import { usdcAddress } from '../../lib/addresses'

type MakeTransactionGetResponse = {
  label: string
  icon: string
}

export type MakeTransactionInputData = {
  account: string
}

export type MakeTransactionOutputData = {
  transaction: string
  message: string
}

type ErrorOutput = {
  error: string
}

function get(res: NextApiResponse<MakeTransactionGetResponse>) {
  res.status(200).json({
    label: 'Cookies Inc',
    icon: 'https://freesvg.org/img/1370962427.png',
  })
}

export async function post(
  req: NextApiRequest,
  res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>
) {
  try {
    const token = req.query.token as string
    let params
    if (token) {
      const tokenString = token.trim().replaceAll(' ', '+')
      params = JSON.parse(decrypt(tokenString as string))
    } else {
      params = req.query
    }

    const {
      reference,
      recipient,
      recipient1,
      recipient2,
      recipient3,
      percent,
      percent1,
      percent2,
      percent3,
      amount,
    } = params

    if (!recipient) {
      res.status(400).json({ error: 'No recipient provided' })
      return
    }

    if (!reference) {
      res.status(400).json({ error: 'No reference provided' })
      return
    }

    const { account } = req.body as MakeTransactionInputData
    if (!account) {
      res.status(400).json({ error: 'No account provided' })
      return
    }
    
    const buyerPublicKey = new PublicKey(account)
    const endpoint = 'https://mainnet.helius-rpc.com/?api-key=a1ac6d33-1522-44d3-acfa-54c8c4579f13'
    const connection = new Connection(endpoint)
    
    const usdcMint = await getMint(connection, usdcAddress)
    
    const buyerUsdcAddress = await getAssociatedTokenAddress(
      usdcAddress,
      buyerPublicKey,
      true
    )

    const { blockhash } = await connection.getLatestBlockhash('finalized')

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: buyerPublicKey,
    })

    // CRITICAL FIX: Keep track of which accounts we are creating in this specific transaction to prevent duplicates
    const accountsBeingCreated = new Set<string>()

    // --- RECIPIENT 1 ---
    if (recipient) {
      const shopPublicKeyOne = new PublicKey(recipient)
      const shopUsdcAddressOne = await getAssociatedTokenAddress(
        usdcAddress,
        shopPublicKeyOne,
        true
      )

      const accountInfo = await connection.getAccountInfo(shopUsdcAddressOne)
      const ataString = shopUsdcAddressOne.toBase58()
      
      // Check if it doesn't exist on-chain AND we haven't already queued it for creation
      if (!accountInfo && !accountsBeingCreated.has(ataString)) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            buyerPublicKey,    
            shopUsdcAddressOne, 
            shopPublicKeyOne,  
            usdcAddress        
          )
        )
        accountsBeingCreated.add(ataString) // Mark as queued
      }

      const transferInstructionOne = createTransferCheckedInstruction(
        buyerUsdcAddress,
        usdcAddress,
        shopUsdcAddressOne,
        buyerPublicKey,
        Math.floor(amount * 10 ** usdcMint.decimals * (percent || 1)),
        usdcMint.decimals
      )
      
      transferInstructionOne.keys.push({
        pubkey: new PublicKey(reference),
        isSigner: false,
        isWritable: false,
      })
      transaction.add(transferInstructionOne)
    }

    // --- RECIPIENT 2 ---
    if (recipient1) {
      const shopPublicKeyTwo = new PublicKey(recipient1)
      const shopUsdcAddressTwo = await getAssociatedTokenAddress(
        usdcAddress,
        shopPublicKeyTwo,
        true
      )

      const accountInfo = await connection.getAccountInfo(shopUsdcAddressTwo)
      const ataString = shopUsdcAddressTwo.toBase58()

      if (!accountInfo && !accountsBeingCreated.has(ataString)) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            buyerPublicKey,
            shopUsdcAddressTwo,
            shopPublicKeyTwo,
            usdcAddress
          )
        )
        accountsBeingCreated.add(ataString)
      }

      const transferInstructionTwo = createTransferCheckedInstruction(
        buyerUsdcAddress,
        usdcAddress,
        shopUsdcAddressTwo,
        buyerPublicKey,
        Math.floor(amount * 10 ** usdcMint.decimals * (percent1 || 0)),
        usdcMint.decimals
      )

      transferInstructionTwo.keys.push({
        pubkey: new PublicKey(reference),
        isSigner: false,
        isWritable: false,
      })
      transaction.add(transferInstructionTwo)
    }

    // --- RECIPIENT 3 ---
    if (recipient2) {
      const shopPublicKeyThree = new PublicKey(recipient2)
      const shopUsdcAddressThree = await getAssociatedTokenAddress(
        usdcAddress,
        shopPublicKeyThree,
        true
      )

      const accountInfo = await connection.getAccountInfo(shopUsdcAddressThree)
      const ataString = shopUsdcAddressThree.toBase58()

      if (!accountInfo && !accountsBeingCreated.has(ataString)) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            buyerPublicKey,
            shopUsdcAddressThree,
            shopPublicKeyThree,
            usdcAddress
          )
        )
        accountsBeingCreated.add(ataString)
      }

      const transferInstructionThree = createTransferCheckedInstruction(
        buyerUsdcAddress,
        usdcAddress,
        shopUsdcAddressThree,
        buyerPublicKey,
        Math.floor(amount * 10 ** usdcMint.decimals * (percent2 || 0)),
        usdcMint.decimals
      )

      transferInstructionThree.keys.push({
        pubkey: new PublicKey(reference),
        isSigner: false,
        isWritable: false,
      })
      transaction.add(transferInstructionThree)
    }

    // --- RECIPIENT 4 ---
    if (recipient3) {
      const shopPublicKeyFour = new PublicKey(recipient3)
      const shopUsdcAddressFour = await getAssociatedTokenAddress(
        usdcAddress,
        shopPublicKeyFour,
        true
      )

      const accountInfo = await connection.getAccountInfo(shopUsdcAddressFour)
      const ataString = shopUsdcAddressFour.toBase58()

      if (!accountInfo && !accountsBeingCreated.has(ataString)) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            buyerPublicKey,
            shopUsdcAddressFour,
            shopPublicKeyFour,
            usdcAddress
          )
        )
        accountsBeingCreated.add(ataString)
      }

      const transferInstructionFour = createTransferCheckedInstruction(
        buyerUsdcAddress,
        usdcAddress,
        shopUsdcAddressFour,
        buyerPublicKey,
        Math.floor(amount * 10 ** usdcMint.decimals * (percent3 || 0)),
        usdcMint.decimals
      )

      transferInstructionFour.keys.push({
        pubkey: new PublicKey(reference),
        isSigner: false,
        isWritable: false,
      })
      transaction.add(transferInstructionFour)
    }

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
    })
    const base64 = serializedTransaction.toString('base64')

    res.status(200).json({
      transaction: base64,
      message: 'Thanks for your payment.',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'error creating transaction' })
    return
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    MakeTransactionGetResponse | MakeTransactionOutputData | ErrorOutput
  >
) {
  if (req.method === 'GET') {
    return get(res)
  } else if (req.method === 'POST') {
    return await post(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}