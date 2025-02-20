"use client"
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { ethers } from 'ethers'
import TokenABI from '../contracts/abi/token.json'
// import TokenStakingABI from '../contracts/abi/tokenStaking.json'
// const stakingContractAddress = "0xA14941948A27591A987f48fdC17f149a73B4496b"
import StakingABI from '../contracts/abi/tokenStaking.json'

export interface StakePosition
{
    id: number
    amount: string
    reward: string
    startTime: string
    lockUntil: string
    lastRewardAt: string
    rewardProgress: number
    isActive: string
}

export interface StakingContractDetail
{
    poolID: number
    depositToken: string
    rewardToken: string
    depositedAmount: string
    apy: string
    lockDays: string
    stakePosition: StakePosition[]
}

export interface NotificationDetail
{
    poolID: number
    amount: number
    user: string
    typeOf: string
    timestamp: string
}

interface MetamaskContextType 
{
    provider: React.RefObject<ethers.BrowserProvider | null>
    account: string | null
    formatBalance: string
    formatAccount: string
    isConnected: boolean
    connectLabel: string
    installVisible: boolean
    tokenName: string
    tokenSymbol: string
    totalSupply: string
    tokenBalance: string
    tokenContractAddress: string
    stakingContractAddress: string
    stakingContractDetail: StakingContractDetail[]
    totalStake: string
    contractBalance: string
    notificationDetail: NotificationDetail[]
    setAccount: React.Dispatch<React.SetStateAction<string | null>>
    setFormatBalance: React.Dispatch<React.SetStateAction<string>>
    setFormatAccount: React.Dispatch<React.SetStateAction<string>>
    setIsConnected: React.Dispatch<React.SetStateAction<boolean>>
    setConnectLabel: React.Dispatch<React.SetStateAction<string>>
    setInstallVisible: React.Dispatch<React.SetStateAction<boolean>>
    setTokenName: React.Dispatch<React.SetStateAction<string>>
    setTokenSymbol: React.Dispatch<React.SetStateAction<string>>
    setTotalSupply: React.Dispatch<React.SetStateAction<string>>
    setTokenBalance: React.Dispatch<React.SetStateAction<string>>
    setTokenContractAddress: React.Dispatch<React.SetStateAction<string>>
    setStakingContractAddress: React.Dispatch<React.SetStateAction<string>>
    setStakingContractDetail: React.Dispatch<React.SetStateAction<StakingContractDetail[]>>
    setTotalStake: React.Dispatch<React.SetStateAction<string>>
    setContractBalance: React.Dispatch<React.SetStateAction<string>>
    setNotificationDetail: React.Dispatch<React.SetStateAction<NotificationDetail[]>>
    CheckMetamaskInstalled: () => Promise<void>
    ConnectToMetamask: () => Promise<void>
    ReadTokenDetails: () => Promise<void>
    ReadStakingContractDetails: () => Promise<void>
    ReadNotificationDetails: () => Promise<void>
}

// Create the context with default values
const MetamaskContext = createContext<MetamaskContextType | undefined>(undefined)

// Create a provider component
// Create a provider component
export const MetamaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => 
{
    // const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
    const [account, setAccount] = useState<string | null>(null)
    const [formatBalance, setFormatBalance] = useState<string>('0.0000')
    const [formatAccount, setFormatAccount] = useState<string>('')
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [connectLabel, setConnectLabel] = useState<string>('Connect')
    const [installVisible, setInstallVisible] = useState(false)
    const [tokenName, setTokenName] = useState<string>('')
    const [tokenSymbol, setTokenSymbol] = useState<string>('')
    const [totalSupply, setTotalSupply] = useState<string>('0')
    const [tokenBalance, setTokenBalance] = useState<string>('0')
    const [tokenContractAddress, setTokenContractAddress] = useState<string>('')
    const [stakingContractAddress, setStakingContractAddress] = useState<string>('')
    const [stakingContractDetail, setStakingContractDetail] = useState<StakingContractDetail[]>([])
    const [totalStake, setTotalStake] = useState<string>('')
    const [contractBalance, setContractBalance] = useState<string>('0')
    const [notificationDetail, setNotificationDetail] = useState<NotificationDetail[]>([])

    const provider = useRef<ethers.BrowserProvider | null>(null)

    useEffect(() => 
    {
        provider.current = new ethers.BrowserProvider(window.ethereum)
        SetContractAddresses()

        // const fetchUserInfo = async () => 
        // {
        //     await GetUserInfo() // Call your async function here
        // }

        // fetchUserInfo()
    }, [])

    const CalculateRewardProgress = (startTime: number, lockUntil: number): number => 
    {
        const currentTime = Date.now() / 1000
        
        if (currentTime <= startTime) 
        {
            return 0
        }
        
        if (currentTime >= lockUntil) 
        {
            return 100
        }
        
        const totalDuration = lockUntil - startTime
        const elapsedTime = currentTime - startTime
        
        return (Math.round((elapsedTime / totalDuration) * 100))
    }

    const SetContractAddresses = () =>
    {
        const tokenContractAddress = "0x924c1055469FD6F0C2Ca69A5089Cd1B0B1634d0b"
        const stakingContractAddress = "0x36a393A27e761d4bf11B3A34b38d708bbf202499"
        setTokenContractAddress(tokenContractAddress)
        setStakingContractAddress(stakingContractAddress)
    }

    const CheckMetamaskInstalled = async () => 
    {
        if (!window.ethereum) 
        {
            setInstallVisible(true)
        }
    }

    const ConnectToMetamask = async () => 
    {
        if (window.ethereum) 
        {
            if(provider.current != null)
            {
                try 
                {
                    const accounts = await provider.current.send("eth_requestAccounts", [])
                    const account = accounts[0]
    
                    setAccount(account)
    
                    const balance = await window.ethereum.request
                    ({
                        method: "eth_getBalance",
                        params: [account, "latest"],
                    })
    
                    const formatBalance = (parseInt(balance, 16) / 1e18).toFixed(4)
                    setFormatBalance(formatBalance)
                    setFormatAccount(account.slice(0, 6) + "..." + account.slice(-4))

                    setIsConnected(true)
                    setConnectLabel("Connected")

                } 
                catch (error) 
                {
                    console.error(error)
                }
            }

        }
    }

    const ReadTokenDetails = async () => 
    {
        if(window.ethereum)
        {
            if(provider.current != null)
            {
                const accounts = await provider.current.send("eth_requestAccounts", [])
                const account = accounts[0]

                const tokenContract = new ethers.Contract(tokenContractAddress, TokenABI, provider.current)
    
                try 
                {
                    const [tokenName, tokenSymbol, totalSupply, tokenBalance, contractBalance] = await Promise.all
                    ([
                        tokenContract.name(),
                        tokenContract.symbol(),
                        tokenContract.totalSupply(),
                        tokenContract.balanceOf(account),
                        tokenContract.balanceOf(stakingContractAddress)
                    ])
                    
                    setTokenName(tokenName)
                    setTokenSymbol(tokenSymbol)
                    setTotalSupply(Number(ethers.formatUnits(totalSupply, 18)).toFixed(2))
                    setTokenBalance(Number(ethers.formatUnits(tokenBalance, 18)).toFixed(2))
                    setContractBalance(Number(ethers.formatUnits(contractBalance, 18)).toFixed(2))
                } 

                catch (error) 
                {
                    console.error("Error fetching token data:", error)
                }
            }
        }
    }

    const ReadStakingContractDetails = async () => 
    {
        if (window.ethereum) 
        {
            if (provider.current != null) 
            {
                const accounts = await provider.current.send("eth_requestAccounts", [])
                const account = accounts[0]
    
                const signer = await provider.current.getSigner()
                const stakingContract = new ethers.Contract(stakingContractAddress, StakingABI, signer)
                let computedStake = 0
    
                try 
                {
                    // Fetch the total number of pools
                    let poolCount = await stakingContract.poolCount()
                    poolCount = parseInt(poolCount.toString())
    
                    let details: StakingContractDetail[] = []
    
                    // Iterate through each pool
                    for (let poolID = 0; poolID < poolCount; poolID++) 
                    {
                        // Get pool information
                        let poolInfo = await stakingContract.poolInfo(poolID)
                        let { depositToken, rewardToken, depositedAmount, apy, lockDays } = poolInfo
    
                        // Convert pool information to string where needed
                        let depositTokenAddress = depositToken.toString()
                        let rewardTokenAddress = rewardToken.toString()
    
                        let poolDepositedAmount = ethers.formatUnits(depositedAmount, 18)
                        let poolAPY = apy.toString()
                        let poolLockDays = lockDays.toString()

                        computedStake += Number(ethers.formatUnits(depositedAmount, 18))

                        // Fetch stake positions for the user in the current pool
                        let stakePositions: StakePosition[] = []
                        let positionCount = await stakingContract.getStakePositionLength(poolID, account)
    
                        for (let positionIndex = 0; positionIndex < positionCount; positionIndex++) 
                        {
                            let position = await stakingContract.stakePositions(poolID, account, positionIndex)
                            let reward = await stakingContract.pendingReward(poolID, account, positionIndex)
                            let { amount, startTime, lockUntil, lastRewardAt, isActive } = position
                            let id = positionIndex
    
                            // Format the stake position details
                            stakePositions.push
                            ({
                                id: Number(id),
                                amount: Number(ethers.formatUnits(amount, 18)).toFixed(2),
                                reward: Number(ethers.formatUnits(reward, 18)).toFixed(2),
                                startTime: startTime.toString(),
                                lockUntil: lockUntil.toString(),
                                lastRewardAt: lastRewardAt.toString(),
                                rewardProgress: CalculateRewardProgress(Number(startTime), Number(lockUntil)),
                                isActive: isActive.toString()
                            })
                        }
    
                        // Construct pool details with stake positions
                        details.push
                        ({
                            poolID,
                            depositToken: depositTokenAddress,
                            rewardToken: rewardTokenAddress,
                            depositedAmount: poolDepositedAmount,
                            apy: poolAPY,
                            lockDays: poolLockDays,
                            stakePosition: stakePositions // Include the array of stake positions here
                        })
                    }

                    // console.log(details)
                    setTotalStake(computedStake.toString())
                    setStakingContractDetail(details)
                } 
                catch (error) 
                {
                    console.error("Error fetching staking contract details:", error)
                }
            }
        }
    }
    
    const ReadNotificationDetails = async () => 
        {
            if(window.ethereum)
            {
                
                if(provider.current != null)
                {
                    const accounts = await provider.current.send("eth_requestAccounts", [])
                    const account = accounts[0]
    
                    const signer = await provider.current.getSigner()
                        
                    const stakingContract = new ethers.Contract(stakingContractAddress, StakingABI, signer)
                    const data = []

                    try 
                    {
                        const notifications = await stakingContract.getNotifications()  
                        for (let i = 0; i < notifications.length; i++) 
                        {
                            const notification = notifications[i]
                            let {poolID, amount, user, typeOf, timestamp} = notification

                            poolID = Number(poolID)
                            amount = Number(ethers.formatUnits(amount, 18)).toFixed(4)
                            timestamp = (new Date(Number(timestamp) * 1000).toLocaleString())

                            data.push
                            ({
                                poolID,
                                amount,
                                user,
                                typeOf, 
                                timestamp
                            })

                        }

                        setNotificationDetail(data)
                    } 
                    catch (error) 
                    {
                        console.error("Error fetching notification data:", error)
                    }
                }
            }
        }


    return (
        <MetamaskContext.Provider
            value={{
                provider,
                account,
                formatBalance,
                formatAccount,
                isConnected,
                connectLabel,
                installVisible,
                tokenName,
                tokenSymbol,
                totalSupply,
                tokenBalance,
                tokenContractAddress,
                stakingContractAddress,
                stakingContractDetail,
                totalStake,
                contractBalance,
                notificationDetail,
                setAccount,
                setFormatBalance,
                setFormatAccount,
                setIsConnected,
                setConnectLabel,
                setInstallVisible,
                setTokenName,
                setTokenSymbol,
                setTotalSupply,
                setTokenBalance,
                setTokenContractAddress,
                setStakingContractAddress,
                setContractBalance,
                setStakingContractDetail,
                setTotalStake,
                setNotificationDetail,
                CheckMetamaskInstalled,
                ConnectToMetamask,
                ReadTokenDetails,
                ReadStakingContractDetails,
                ReadNotificationDetails
            }}
        >
            {children}
        </MetamaskContext.Provider>
    )
}

// Create a custom hook to use the context easily in any component
export const UseMetamask = () => 
{
    const context = useContext(MetamaskContext)
    if (!context) 
    {
        throw new Error('useMetamask must be used within a MetamaskProvider')
    }
    return context
}

