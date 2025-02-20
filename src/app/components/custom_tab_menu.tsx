"use client"
import React, { useState, useEffect, useRef } from 'react'
import { TabMenu } from 'primereact/tabmenu'
import {Card} from 'primereact/card'
import { Divider } from 'primereact/divider'
import { TabView } from 'primereact/tabview'
import { TabPanel } from 'primereact/tabview'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { ProgressSpinner } from 'primereact/progressspinner'
import { BlockUI } from 'primereact/blockui'
import { DataScroller } from 'primereact/datascroller'
import { ethers, getDefaultProvider } from 'ethers'
import { MetamaskProvider, UseMetamask, StakingContractDetail, NotificationDetail } from '../../../context/MetamaskContext'
import TokenABI from '../../../contracts/abi/token.json'
import StakingABI from '../../../contracts/abi/tokenStaking.json'

const CustomTabMenu = () => {
    // State to track the active tab
    const [activeIndex, setActiveIndex] = useState(0)
    const {provider, isConnected, tokenName, tokenSymbol, totalSupply, tokenBalance, 
           tokenContractAddress, stakingContractAddress, ReadTokenDetails, stakingContractDetail, totalStake, contractBalance, notificationDetail, ReadStakingContractDetails, ReadNotificationDetails} = UseMetamask()
    
    const [sweepTokenAddress, setSweepTokenAddress] = useState('')
    const [sweepAmount, setSweepAmount] = useState('')

    const [quantity, setQuantity] = useState('')
    const [transferAddress, setTransferAddress] = useState('')

    const [stateToken, setStateToken] = useState('')
    const [rewardToken, setRewardToken] = useState('')
    const [apy, setApy] = useState('')
    const [duration, setDuration] = useState('')

    const [errors, setErrors] = useState<ValidationErrors>({})
    const [apyDialog, setApyDialog] = useState(false)
    const [updateApy, setUpdateApy] = useState('')
    const [updateRowIndex,  setUpdateRowIndex] = useState<number>(0)
    const [loading, setLoading] = useState(false)
    const ds = useRef<DataScroller | null>(null)
    
    interface ValidationErrors 
    {
        sweepTokenAddress?: string
        sweepAmount?: string
        quantity?: string
        transferAddress?: string
        stateToken?: string
        rewardToken?: string
        apy?: string
        duration?: string
        updateApy?: string
    }
    
    const IsValidEthereumAddress = (address: string): boolean => 
    {
        return /^0x[a-fA-F0-9]{40}$/.test(address)
    }

    const ValidateSweepTokenAddress = (value: string): string => 
    {
        if (!value) return 'Sweep Token Address is required'
        if (!IsValidEthereumAddress(value)) return 'Invalid Ethereum address'
        return ''
    }

    const ValidateSweepAmount = (value: string): string => 
    {
        const sweepAmount = parseFloat(value)
        if (!value) return 'Amount is required'
        if (isNaN(sweepAmount) || sweepAmount <= 0) 
        {
            return 'Amount format invalid'
        }

        if (sweepAmount >= (parseFloat(contractBalance) - parseFloat(totalStake)))
        {
            return 'Amount cannot exceed contract balance'
        }

        return ''
    }

    const ValidateTransferAmount = (value: string): string => 
    {
        const quantity = parseFloat(value)
        if (!value) return 'Quantity is required'
        if (isNaN(quantity) || quantity <= 0) 
        {
            return 'Quantity format invalid'
        }

        if (quantity >= parseFloat(tokenBalance))
        {
            return 'Quantity cannot exceed available supply'
        }

        return ''
    }
    
    const ValidateTransferAddress = (value: string): string => 
    {
        if (!value) return 'Contract / Wallet Address is required'
        if (!IsValidEthereumAddress(value)) return 'Invalid address'
        return ''
    }

    const ValidateStateToken = (value: string): string => 
    {
        if (!value) return 'State Token Address is required'
        if (!IsValidEthereumAddress(value)) return 'Invalid Ethereum address'
        return ''
    }

    const ValidateRewardToken = (value: string): string => 
    {
        if (!value) return 'Reward Token Address is required'
        if (!IsValidEthereumAddress(value)) return 'Invalid Ethereum address'
        return ''
    }

    const ValidateApy = (value: string): string => 
    {
        const apyValue = parseFloat(value)
        if (!value) return 'APY is required'
        if (isNaN(apyValue) || !Number.isInteger(apyValue) || apyValue <= 0 || apyValue > 20) 
        {
            return 'APY must be a whole number between 1% and 20%'
        }
        return ''
    }

    const ValidateDuration = (value: string): string => 
    {
        const durationValue = parseInt(value, 10)
        if (!value) return 'Duration is required'
        if (isNaN(durationValue) || durationValue <= 0) return 'Duration must be a positive number'
        return ''
    }

    const ValidateTransferToken = (): boolean => 
    {
        const newErrors: ValidationErrors = 
        {
            quantity: ValidateTransferAmount(quantity),
            transferAddress: ValidateTransferAddress(transferAddress)
        }

        setErrors(newErrors)
        return Object.values(newErrors).every((error) => !error)
    }
    
    const ValidateAllFields = (): boolean => 
    {
        const newErrors: ValidationErrors = 
        {
            stateToken: ValidateStateToken(stateToken),
            rewardToken: ValidateRewardToken(rewardToken),
            apy: ValidateApy(apy),
            duration: ValidateDuration(duration),
        }
        setErrors(newErrors)

        return Object.values(newErrors).every((error) => !error)
    }

    const ValidateUpdateApyField = (): boolean => 
    {
        const newErrors: ValidationErrors = 
        {
            updateApy: ValidateApy(updateApy)
        }

        setErrors(newErrors)
        return Object.values(newErrors).every((error) => !error)
    }

    const ValidateSweepField = () : boolean =>
    {
        const newErrors: ValidationErrors = 
        {
            sweepTokenAddress: ValidateSweepTokenAddress(sweepTokenAddress),
            sweepAmount: ValidateSweepAmount(sweepAmount)
        }

        setErrors(newErrors)
        return Object.values(newErrors).every((error) => !error)
    }
    
    useEffect(() => 
    {
        setErrors
        ({
            sweepTokenAddress: ValidateSweepTokenAddress(sweepTokenAddress),
            sweepAmount: ValidateSweepAmount(sweepAmount),
            quantity: ValidateTransferAmount(quantity),
            transferAddress: ValidateTransferAddress(transferAddress),
            stateToken: ValidateStateToken(stateToken),
            rewardToken: ValidateRewardToken(rewardToken),
            apy: ValidateApy(apy),
            duration: ValidateDuration(duration),
            updateApy: ValidateApy(updateApy),
        })
        
        if(isConnected)
        {
            ReadTokenDetails()
            ReadStakingContractDetails()
            ReadNotificationDetails()
        }

    }, [provider, isConnected, sweepTokenAddress, sweepAmount, quantity, 
        transferAddress, stateToken, rewardToken, apy, duration, updateApy])

    const CopyAddress = (address: string) =>
    {
        navigator.clipboard.writeText(address)
    }

    const Sweep = async () => 
    {
        if(ValidateSweepField())
        {
            if(window.ethereum)
                {
                    if(provider.current != null)
                    {
                            setLoading(true)
                            const accounts = await provider.current.send("eth_requestAccounts", [])
                            const account = accounts[0]

                            const signer = await provider.current.getSigner()
                            const stakingContract = new ethers.Contract(stakingContractAddress, StakingABI, signer)

                            try 
                            {
                                let formatSweepAmount = ethers.parseUnits(sweepAmount.toString(), 18)
                                const sweepTx = await stakingContract.sweep(sweepTokenAddress, formatSweepAmount)
                                const txReceipt = await sweepTx.wait()

                                if (txReceipt.status === 1) 
                                {
                                    ReadTokenDetails()
                                    ReadStakingContractDetails()
                                    ReadNotificationDetails()
                                    setSweepTokenAddress('')
                                    setSweepAmount('')
                                    setLoading(false)
    
                                } 
                                else 
                                {
                                    setLoading(false)
                                }

                            }
                            catch (error)
                            {
                                setLoading(false)
                            }
                    }
                }
        }
    }

    const TransferToken = async () => 
    {
        if(ValidateTransferToken())
        {
            if(window.ethereum)
            {
                if(provider.current != null)
                {
                        setLoading(true)
                        const accounts = await provider.current.send("eth_requestAccounts", [])
                        const account = accounts[0]

                        const signer = await provider.current.getSigner()
                        const tokenContract = new ethers.Contract(tokenContractAddress, TokenABI, signer)

                        try 
                        {
                            let formatQuantity = ethers.parseUnits(quantity.toString(), 18)
                            const approveTx = await tokenContract.approve(transferAddress, formatQuantity)
                            await approveTx.wait()
                            const transferTx = await tokenContract.transfer(transferAddress, formatQuantity)
                            const txReceipt = await transferTx.wait()

                            if (txReceipt.status === 1) 
                            {
                                ReadTokenDetails()
                                ReadStakingContractDetails()
                                ReadNotificationDetails()
                                setQuantity('')
                                setTransferAddress('')
                                setLoading(false)

                            } 
                            else 
                            {
                                setLoading(false)
                            }

                        }
                        catch (error)
                        {
                            setLoading(false)
                        }
                }
            }
        }

    }

    const AddPool = async () => 
    {

        if (ValidateAllFields()) 
        {
            if(window.ethereum)
                {
                    
                    if(provider.current != null)
                    {
                        setLoading(true)
                        const accounts = await provider.current.send("eth_requestAccounts", [])
                        const account = accounts[0]
    
                        const signer = await provider.current.getSigner()
                            
                        const stakingContract = new ethers.Contract(stakingContractAddress, StakingABI, signer)
            
                        try 
                        {
                            const txResponse = await stakingContract.addPool(stateToken, rewardToken, parseInt(apy), parseInt(duration))
                            const txReceipt = await txResponse.wait()

                            if (txReceipt.status === 1) 
                            {
                                ReadTokenDetails()
                                ReadStakingContractDetails()
                                ReadNotificationDetails()
                                setStateToken('')
                                setRewardToken('')
                                setApy('')
                                setDuration('')
                                setLoading(false)

                            } 
                            else 
                            {
                                setLoading(false)
                            }
                        } 
                        catch (error) 
                        {
                            setLoading(false)
                        }
                    }
                }

        }

    }

    const ModifyPool = async (poolID: number) => 
    {
            if(ValidateUpdateApyField())
            {
                if(provider.current != null)
                    {
                        setApyDialog(false)
                        setLoading(true)
                        const accounts = await provider.current.send("eth_requestAccounts", [])
                        const account = accounts[0]
        
                        const signer = await provider.current.getSigner()
                            
                        const stakingContract = new ethers.Contract(stakingContractAddress, StakingABI, signer)
            
                        try 
                        {
                            const txResponse = await stakingContract.modifyPool(poolID, updateApy)
                            const txReceipt = await txResponse.wait()

                            if (txReceipt.status === 1) 
                            {
                                ReadTokenDetails()
                                ReadStakingContractDetails()
                                ReadNotificationDetails()
                                setUpdateApy('')
                                setLoading(false)

                            } 
                            else 
                            {
                                setLoading(false)
                            }
                        } 
                        catch (error) 
                        {
                            setLoading(false)
                        }
                    }
            }

    }

    // const PAGE_SIZE = 5
    // const [page, setPage] = useState(0)
    // const [notification, setNotification] = useState<NotificationData[]>([])
    // const [notificationLoading, setNotificationLoading] = useState(false)
    // const [notificationAllLoaded, setNotificationAllLoaded] = useState(false)


    // const LoadMore = () => 
    // {
    //     console.log(notificationData)
    //     if (loading || notificationAllLoaded) return

    //     setNotificationLoading(true)
    //     setTimeout(() => {
    //         const startIndex = page * PAGE_SIZE
    //         const endIndex = startIndex + PAGE_SIZE
    //         console.log(startIndex)
    //         console.log(endIndex)
    //         const newNotification = notificationData.slice(startIndex, endIndex)
    //         console.log(newNotification)

    //         if (newNotification.length < PAGE_SIZE) 
    //         {
    //             setNotificationAllLoaded(true) // Mark as fully loaded if no more items
    //         }

    //         setNotification((prevNotifications) => [...prevNotifications, ...newNotification])
    //         setPage((prevPage) => prevPage + 1)
    //         setNotificationLoading(false)
            
    //     }, 500) 
    // }

    // Tab items
    const items = [
        { label: 'Dashboard', icon: 'pi pi-home'},
        { label: 'Investing', icon: 'pi pi-chart-line'},
        { label: 'Staking', icon: 'pi pi-money-bill'},
        { label: 'Transfer',  icon: 'pi pi-send'},
        { label: 'Pool', icon: 'pi pi-database'}
    ]

    // Handler for tab change
    const handleTabChange = (e: any) => 
    {
        setActiveIndex(e.index) 
    }

    // const footer = <Button  icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-plus'}  label={notificationAllLoaded ? 'No More Items' : 'Load'} disabled={notificationLoading || notificationAllLoaded} onClick={() => ds.current?.load()} />
    const footer = <Button  label="Load more" icon={'pi pi-plus'}  onClick={() => ds.current?.load()} />

    const DataScrollerTemplate = (notificationDetail: NotificationDetail) => {
        return (
            <div className="flex flex-col p-4 gap-4">
                <div className="flex flex-col lg:flex-row justify-between items-center p-4 bg-white shadow rounded-lg">
                    <div className="flex flex-col items-center lg:items-start gap-3 w-full">
                        <div className="flex flex-col gap-1">
                            <div className="text-2xl font-bold text-gray-900">
                                Pool ID: {notificationDetail.poolID}
                            </div>
                            <div className="text-gray-700">Amount: {notificationDetail.amount} TCT</div>
                            <div className="text-gray-700">User: {notificationDetail.user}</div>
                            <div className="text-gray-700">Activity: {notificationDetail.typeOf}</div>
                            <div className="text-gray-700">Timestamp: {notificationDetail.timestamp}</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='admin-menu'>
            {/* Tab Menu */}
            <TabMenu model={items} className='ml-10 text-black' activeIndex={activeIndex} onTabChange={handleTabChange} />

            {/* Conditional Rendering of Content */}
            <div className='mt-5 ml-10'>
                {activeIndex === 0 && 
                    <div className="container mx-auto p-4">
                    {
                        !isConnected ? 
                        (
                            <h2 className='text-center'>Please connect to <span className="text-blue-700">Metamask </span> </h2>
                        ) : 
                        (
                            <div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">

                                {stakingContractDetail.map((data, index) => 
                                (
                                    <div key={data.poolID} className={`items-center mt-1 text-center ${index === 0 ? 'ml-2' : ''} ${index === stakingContractDetail.length - 1 ? 'mr-2' : ''}`}>
                                    <Card className="bg-sky-100 rounded-lg">
                                    <h1 className="flex justify-center text-lg text-black">
                                    Pool balance: {data.depositedAmount} TCT
                                    </h1>
                                    <p className="flex justify-center text-black mt-3">
                                    Pool APY: {data.apy} %
                                    </p>
                                    </Card>
                                    </div>
                                ))}

                                <div className="items-center mt-1 text-center ml-2">
                                <Card className='bg-sky-100 rounded-lg'>
                                    <h1 className='flex justify-center text-lg text-black'>{totalStake} TCT</h1>
                                    <p className='flex justify-center text-black mt-3'>Total stake</p>
                                </Card>
                                </div>

                                <div className="items-center mt-1 text-center">
                                <Card className='bg-sky-100 rounded-lg'>
                                    <p className='flex justify-center font-bold text-black'>{tokenBalance} TCT</p>
                                    <p className='flex justify-center text-black mt-3'>Available supply</p>
                                </Card>
                                </div>

                                <div className="items-center mt-1 text-center mr-2">
                                <Card className='bg-sky-100 rounded-lg'>
                                    <h1 className='flex justify-center text-lg text-black'>{totalSupply} TCT</h1>
                                    <p className='flex justify-center text-black mt-3'>Total supply</p>
                                </Card>
                                </div>

                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 mt-10">
                                    <Card className="bg-sky-100 p-4 rounded-lg">
                                    <h1 className="text-xl text-black font-bold">Block Explorer</h1>

                                    <p className="text-m text-black mt-5 break-words">
                                    Contract address: <span className="font-bold text-blue-700">{tokenContractAddress}</span>
                                    </p>

                                    <Divider type='solid'>
                                    </Divider>

                                    <div className="grid grid-cols-2 mt-5">
                                    <p className="text-black mt-3 text-left">Token</p>
                                    <p className="text-black mt-3 text-right">Value</p>
                                    </div>

                                    <p className="border-t border-black mt-3"></p>

                                    <div className="grid grid-cols-2 mt-3">
                                    <p className="text-black mt-3 text-left">Name</p>
                                    <p className="text-black mt-3 text-right">{tokenName}</p>
                                    </div>

                                    <div className="grid grid-cols-2 mt-3">
                                    <p className="text-black mt-3 text-left">Symbol</p>
                                    <p className="text-black mt-3 text-right">{tokenSymbol}</p>
                                    </div>

                                    <div className="grid grid-cols-2 mt-3">
                                    <p className="text-black mt-3 text-left">Total Supply</p>
                                    <p className="text-black mt-3 text-right">{totalSupply} TCT</p>
                                    </div>

                                    <div className="grid grid-cols-2 mt-3">
                                    <p className="text-black mt-3 text-left">Total Stake</p>
                                    <p className="text-black mt-3 text-right">{totalStake} TCT</p>
                                    </div>


                                    </Card>

                                </div>
                            </div>
                        )
                    }
                    </div>


                }
                {activeIndex === 1 && 
                    <div>
                    {
                        !isConnected ? 
                        (
                            <div className='mt-14'>
                                <h2 className='text-center'>Please connect to <span className="text-blue-700">Metamask </span> </h2>
                            </div>
                        ) : 
                        (
                                <DataScroller
                                className='invest-data-scroller'             
                                ref={ds}
                                value={notificationDetail}
                                itemTemplate={DataScrollerTemplate}
                                rows={5}
                                loader
                                footer={footer}
                                buffer={0.4}
                                inline 
                                scrollHeight="500px"
                                header="Click Load Button at Footer to Load More" />
                        )
                    }
                    </div>
                }
                {activeIndex === 2 && 
                    <div>
                    {
                        !isConnected ? 
                        (
                            <div className='mt-14'>
                                <h2 className='text-center'>Please connect to <span className="text-blue-700">Metamask </span> </h2>
                            </div>
                        ) : 
                        (
                            <div className="container mx-auto p-4">
                                <Card title="Sweep" className="bg-sky-100 text-black rounded-lg shadow-lg">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="sm:w-1/2 lg:w-2/3">
                                                <p className="text-sm font-bold">Token Address:</p>
                                                <InputText className="text-sm bg-sky-100 w-1/2"
                                                value={sweepTokenAddress}
                                                onChange={(e) => setSweepTokenAddress(e.target.value)}
                                                placeholder=""/>
                                                {errors.sweepTokenAddress && <p className="text-red-500 text-sm font-bold">{errors.sweepTokenAddress}</p>}
                                            </div>
                                            <div className="sm:w-1/2 lg:w-1/3">
                                                <p className="text-sm font-bold">Amount:</p>
                                                <InputText className="text-sm bg-sky-100 w-1/2"
                                                value={sweepAmount}
                                                onChange={(e) => setSweepAmount(e.target.value)}
                                                placeholder=""/>
                                                {errors.sweepAmount && <p className="text-red-500 text-sm font-bold">{errors.sweepAmount}</p>}
                                            </div>
                                    </div>

                                    <div className="grid mt-10">
                                        <Button label="WITHDRAW" className='text-left w-[7.5rem] bg-blue-700' raised onClick={Sweep}></Button>
                                    </div>
                                </Card>
                            </div>
                        )
                    }
                    </div>
                }
                {activeIndex === 3 && 
                    <div>
                    {
                        !isConnected ? 
                        (
                            <div className='mt-14'>
                                <h2 className='text-center'>Please connect to <span className="text-blue-700">Metamask </span> </h2>
                            </div>
                        ) : 
                        (
                            <div className="container mx-auto p-4">
                                <Card title="Transfer" className="bg-sky-100 text-black rounded-lg shadow-lg">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="sm:w-1/2">
                                            <p className="text-sm font-bold">Available Supply:</p>
                                            <InputText readOnly className="text-sm bg-sky-100 w-1/2"
                                            value={tokenBalance}
                                             />
                                        </div>
                                        <div className="sm:w-1/2 lg:mt-10">
                                            <p className="text-sm font-bold">Quantity:</p>
                                            <InputText className="text-sm bg-sky-100 w-1/2"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder=""/>
                                            {errors.quantity && <p className="text-red-500 text-sm font-bold">{errors.quantity}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold">Contract/Wallet Address:</p>
                                        <InputText className="text-sm bg-sky-100 w-2/3"
                                         value={transferAddress}
                                         onChange={(e) => setTransferAddress(e.target.value)}
                                         placeholder=""/>
                                         {errors.transferAddress && <p className="text-red-500 text-sm font-bold">{errors.transferAddress}</p>}
                                    </div>

                                    <div className="grid mt-10">
                                        <Button label="TRANSFER" className='text-left w-[7rem] bg-blue-700' raised onClick={TransferToken}></Button>
                                    </div>

                                </Card>
                            </div>
                        )
                    }
                    </div>
                }
                {activeIndex === 4 && 

                    <div>
                    {
                        !isConnected ? 
                        (
                            <div className='mt-14'>
                                <h2 className='text-center'>Please connect to <span className="text-blue-700">Metamask </span> </h2>
                            </div>
                        ) : 
                        (
                            <div>
                                    <TabView className='admin-tab-view'>
                                        <TabPanel header="Add Pool">

                                            <Card title="" className="bg-sky-200 text-black rounded-lg shadow-lg w-10/12">
                                                <div className="grid grid-cols-1">
                                                    <p className="text-sm font-bold">State Token Address:</p>
                                                    <InputText className="text-sm bg-sky-100"
                                                    value={stateToken}
                                                    onChange={(e) => setStateToken(e.target.value)}
                                                    placeholder="State Token"/>
                                                    {errors.stateToken && <p className="text-red-500 text-sm font-bold">{errors.stateToken}</p>}
                                                </div>

                                                <div className="grid grid-cols-1 mt-3">
                                                    <p className="text-sm font-bold">Reward Token Address:</p>
                                                    <InputText className="text-sm bg-sky-100"
                                                    value={rewardToken}
                                                    onChange={(e) => setRewardToken(e.target.value)}
                                                    placeholder="Reward Token"/>
                                                    {errors.rewardToken && <p className="text-red-500 text-sm font-bold">{errors.rewardToken}</p>}
                                                </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 mt-3 place-content-between">
                                                <div className="">
                                                    <p className="text-sm font-bold">APY(%):</p>
                                                    <InputText className="text-sm bg-sky-100"
                                                    value={apy}
                                                    onChange={(e) => setApy(e.target.value)}
                                                    placeholder="APY"/>
                                                    {errors.apy && <p className="text-red-500 text-sm font-bold">{errors.apy}</p>}
                                                </div>

                                                <div className="">
                                                    <p className="text-sm label font-bold">Duration (Days):</p>
                                                    <InputText className="text-sm input-field bg-sky-100"
                                                    value={duration}
                                                    onChange={(e) => setDuration(e.target.value)}
                                                    placeholder="Duration"/>
                                                    {errors.duration && <p className="text-red-500 text-sm font-bold">{errors.duration}</p>}
                                                </div>
                                            </div>

                                                <div className="grid mt-10">
                                                <Button label="ADD POOL" className='text-left w-[7rem] bg-blue-700' raised onClick={AddPool}></Button>
                                                </div>

                                            </Card>

                                    </TabPanel>


                                    <TabPanel header="Pool List">
                                        <div className="w-full max-w-6xl">
                                            <DataTable className='table-wrapper'
                                            value={stakingContractDetail}
                                            paginator
                                            rows={5}
                                            rowsPerPageOptions={[5, 10, 25, 50]}
                                            tableStyle={{ minWidth: '50rem' }}
                                            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                                            currentPageReportTemplate="{first} to {last} of {totalRecords}"
                                            >
                                            <Column field="depositToken" header="DEPOSIT TOKEN" style={{ width: '10%' }}  body={(rowData, { rowIndex }) => (
                                            <div><span>{rowData.depositToken.slice(0, 6) + "..." + rowData.depositToken.slice(-4)}</span> <i className="pi pi-copy cursor-pointer text-blue-700" 
                                            onClick={() => CopyAddress(rowData.depositToken)}></i></div>)}></Column>

                                            <Column field="rewardToken" header="REWARD TOKEN" style={{ width: '10%' }} body={(rowData, { rowIndex }) => (
                                            <div><span>{rowData.rewardToken.slice(0, 6) + "..." + rowData.rewardToken.slice(-4)}</span> <i className="pi pi-copy cursor-pointer text-blue-700" 
                                            onClick={() => CopyAddress(rowData.rewardToken)}></i></div>)}></Column>

                                            <Column field="depositedAmount" header="DEPOSITED AMOUNT" style={{ width: '10%' }}></Column>
                                            <Column field="apy" header="APY (%)" style={{ width: '10%' }}></Column>
                                            <Column field="lockDays" header="LOCK DAYS" style={{ width: '5%' }}></Column>
                                            <Column body={(rowData, { rowIndex }) => 
                                            (
                                            <Button label="UPDATE APY" className="update-apy-button" raised
                                            onClick={() => 
                                            {
                                                setApyDialog(true)
                                                setUpdateApy(rowData.apy)
                                                setUpdateRowIndex(rowIndex)
                                            }}></Button>
                                            )} style={{ width: '15%' }}></Column>
                                            </DataTable>
                                        </div>

                                    </TabPanel>

                                </TabView>
                            </div>
                        )
                    }

                    </div>
                }
            </div>

            <Dialog 
                header="Update APY" 
                className='set-apy-dialog'
                draggable = {false}
                visible={apyDialog}
                onHide={() => setApyDialog(false)}>

                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-0 mt-3">
                        <div className="text-left">
                        <p className="text-sm font-bold">APY:</p>
                        </div>

                        <div>
                        <InputText className="text-sm"
                        value={updateApy}
                        onChange={(e) => setUpdateApy(e.target.value)}
                        placeholder="APY"/>
                        
                        {errors.updateApy && <p className="text-red-500 text-sm font-bold">{errors.updateApy}</p>}
                        </div>
                    </div>

                    <div className='text-right'>
                        <Button label="UPDATE" className="mt-10 update-apy-button" raised
                            onClick={() => 
                            {
                                ModifyPool(updateRowIndex)
                            }}>
                        </Button>
                    </div>

            </Dialog>

            <BlockUI blocked={loading}  template={<ProgressSpinner style={{width: '100px', height: '100px'}} strokeWidth="4" animationDuration=".75s" />} fullScreen>
            </BlockUI>
        </div>
    )
}

export default CustomTabMenu
