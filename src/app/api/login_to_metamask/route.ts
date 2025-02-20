import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

// Define the expected body structure
interface LoginRequestBody 
{
  signature: string;
  address: string;
}

export async function POST(request: NextRequest) 
{
  try 
  {
    const body: LoginRequestBody = await request.json();

    const { signature, address } = body;

    if (!signature || !address) 
    {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Message that was signed
    const message = 'Please sign this message to log in';

    // Verify the signature
    const signerAddress = ethers.verifyMessage(message, signature);

    if (signerAddress.toLowerCase() !== address.toLowerCase()) 
    {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    // Connect to the Ethereum blockchain to fetch the balance
    const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/60bb810c403b4087bd1dc1315d6f50ec"); // Replace with your RPC URL
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);

    return NextResponse.json({
      address,
      balance: balanceInEth,
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
