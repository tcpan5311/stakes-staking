"use client"
import React, { useState, useEffect, useRef } from 'react'
import 'primereact/resources/primereact.min.css'
import 'primereact/resources/themes/saga-blue/theme.css'
import { ProgressBar } from 'primereact/progressbar'
import {Card} from 'primereact/card'
import { TabView, TabPanel } from 'primereact/tabview'
import { InputNumber } from 'primereact/inputnumber'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Carousel } from 'primereact/carousel'
import { InputText } from 'primereact/inputtext'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { ProgressSpinner } from 'primereact/progressspinner'
import { BlockUI } from 'primereact/blockui'
import { DataView } from 'primereact/dataview'
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup'
import { ethers, getDefaultProvider } from 'ethers'
import { MetamaskProvider, UseMetamask, StakePosition, StakingContractDetail} from '../../../context/MetamaskContext'

import TokenABI from '../../../contracts/abi/tcToken.json'
import StakingABI from '../../../contracts/abi/savesStaking.json'

export default function Body() 
{
    const {provider, formatBalance, isConnected, tokenName, tokenSymbol, totalSupply, tokenBalance, 
           tokenContractAddress, stakingContractAddress, ReadTokenDetails, stakingContractDetail, totalStake, notificationDetail, ReadStakingContractDetails, ReadNotificationDetails} = UseMetamask()
    
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [investDialog, setInvestDialog] = useState(false)

    const [investAmount, setInvestAmount] = useState('')
    const [selectedPoolData, setSelectedPoolData] = useState<StakingContractDetail | null>(null)
    const [loading, setLoading] = useState(false)

    const toast = useRef<Toast>(null)

    interface ValidationErrors 
    {
        investAmount?: string
    }

    const ValidateInvestAmount = (value: string): string => 
    {
        const investAmount = parseFloat(value)
        if (!value) return 'Amount is required'
        if (isNaN(investAmount) || investAmount <= 0) 
        {
            return 'Amount format invalid'
        }

        if (investAmount >= parseFloat(tokenBalance))
        {
            return 'Amount cannot exceed your balance'
        }

        return ''
    }

    const ValidateInvest = (): boolean => 
    {
            const newErrors: ValidationErrors = 
            {
                investAmount: ValidateInvestAmount(investAmount)
            }
    
            setErrors(newErrors)
            return Object.values(newErrors).every((error) => !error)
    }

    const confirmEarlyRedeem = (event: any, poolID: number, stakePositionId: number) => 
    {
        confirmPopup
        ({
            target: event.currentTarget,
            message: 'All rewards will be forfeited, proceed?',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept: () => acceptEarlyClaim(poolID, stakePositionId)
        })
    }

    const acceptEarlyClaim = (poolID: number, stakePositionId: number) => 
    {
        Withdraw(poolID, stakePositionId)
    }
    
    const ConfirmDeposit = () => 
    {
        toast.current?.show({severity:'success', summary: 'Success', detail:'Deposited successfully', life: 3000})
    }

    const ConfirmWithdraw = () => 
    {
        toast.current?.show({severity:'success', summary: 'Success', detail:'Deposit withdrawn successfully', life: 3000})
    }

    useEffect(() => 
    {
        setErrors
        ({
            investAmount: ValidateInvestAmount(investAmount)
        })

        if(isConnected)
        {
            ReadTokenDetails()
            ReadStakingContractDetails()
            ReadNotificationDetails()
        }

        const interval = setInterval(() => 
        {
            if(isConnected)
            {
                ReadStakingContractDetails()
            }
        }, 10000)

        return () => clearInterval(interval)

    }, [provider, formatBalance, isConnected, investAmount, selectedPoolData])

    const CopyAddress = (address: string) =>
    {
        navigator.clipboard.writeText(address)
    }

    const StrToBoolean = (str :string) : boolean =>
    {
        if (str.toLowerCase() === "true") 
        {
            return true
        } 
        else if (str.toLowerCase() === "false") 
        {
            return false
        }

        else
        {
            throw new Error("Invalid input: only 'true' or 'false' strings are allowed")
        }
    }

    const Deposit = async () => 
    {
        if(ValidateInvest())
        {
            if(window.ethereum)
            {
                if(provider.current != null)
                {
                    setInvestDialog(false)
                    setLoading(true)
                    const accounts = await provider.current.send("eth_requestAccounts", [])
                    const account = accounts[0]

                    const signer = await provider.current.getSigner()

                    const tokenContract = new ethers.Contract(tokenContractAddress, TokenABI, signer)
                    const stakingContract = new ethers.Contract(stakingContractAddress, StakingABI, signer)

                    try
                    {
                        let formatInvestAmount = ethers.parseUnits(investAmount, 18)
                        const approveTx = await tokenContract.approve(stakingContractAddress, formatInvestAmount)
                        await approveTx.wait()
                        const depositTx = await stakingContract.deposit(selectedPoolData?.poolID, formatInvestAmount)
                        const txReceipt = await depositTx.wait()

                        if (txReceipt.status === 1) 
                        {
                            ReadTokenDetails()
                            ReadStakingContractDetails()
                            ReadNotificationDetails()
                            setInvestAmount('')
                            setLoading(false)
                            ConfirmDeposit()
                        } 
                    }
                    catch(error)
                    {
                        setLoading(false)
                    }
                }
            }
        }
    }

    const Withdraw = async (poolID: number, claimPositionIndex: number) => 
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
                        const withdrawTx = await stakingContract.withdraw(poolID, claimPositionIndex)
                        const txReceipt = await withdrawTx.wait()

                        if (txReceipt.status === 1) 
                        {
                            ReadTokenDetails()
                            ReadStakingContractDetails()
                            ReadNotificationDetails()
                            setLoading(false)
                            ConfirmWithdraw()
                        }
                }
                catch(error)
                {
                    setLoading(false)
                }

            }
        }
    }

    const DataViewTemplate = (stakePositions: StakePosition[], poolID: number) =>
    {
        return (
            <>
            {stakePositions.map((stakePosition, index) => (
                <div key={index} className="data-view-template flex-col justify-items-center border mt-3 p-3 text-black text-base bg-sky-100">
                    <p className="text-base mt-3">Position {stakePosition.id + 1}</p>
                    <p className="text-base mt-3">Amount: {stakePosition.amount} TCT</p>
                    <p className="text-base mt-3">Reward: {stakePosition.reward} TCT</p>
                    <p className="text-base mt-3">Start Date: {(new Date(Number(stakePosition.startTime) * 1000).toLocaleString())}</p>
                    <p className="text-base mt-3">End Date: {(new Date(Number(stakePosition.lockUntil) * 1000).toLocaleString())}</p>
                    {/* <p className="text-base mt-3">Last Reward At: {(new Date(Number(stakePosition.lastRewardAt) * 1000).toLocaleString())}</p> */}
                    {/* <p className="text-base mt-3">Active Status: {stakePosition.isActive}</p> */}
                    
                    <div className='w-1/2'>
                        <p className="text-base mt-3">Progress:</p>
                        <ProgressBar value={stakePosition.rewardProgress}></ProgressBar>
                    </div>

                    {stakePosition.rewardProgress == 100 ? 
                    (
                        <Button label="CLAIM" className="p-button p-button-raised bg-blue-700 border border-black text-white px-4 py-2 mt-10" raised
                        onClick={() => 
                        {
                            Withdraw(poolID, stakePosition.id)
                        }}
                        ></Button>
                    ): 
                    (
                        <Button label="CLAIM" className="p-button p-button-raised bg-blue-700 border border-black text-white px-4 py-2 mt-10" raised
                        onClick={(event) => confirmEarlyRedeem(event, poolID, stakePosition.id)}></Button>
                    )}
                    

                    
                </div>
                
            ))}
            </>
        )
    }

    const MainTabTemplate = (stakingContractDetail: StakingContractDetail) => 
    (
        <div className="border-1 surface-border border-round m-2 text-center py-5 px-3">
            <Card className="p-shadow-3 bg-sky-100 m-5 text-black rounded-md">
                <p className="flex justify-center text-3xl font-bold">{stakingContractDetail.depositedAmount} TCT</p>
                <p className="flex justify-center text-base mt-3">Current APY: {stakingContractDetail.apy} %</p>
            </Card>
            
        </div>
    )

    const InvestTabTemplate = (stakingContractDetail: StakingContractDetail) => 
    (
        <div className="border-1 surface-border border-round m-2 text-center py-5 px-3">
            <Card
            className="p-shadow-3 bg-sky-100 text-black flex flex-col items-center rounded-lg"
            title={<p className="text-center">Pool {stakingContractDetail.poolID+1}</p>}
            >
                <TabView className='w-full main-invest-tab-view'>
                    <TabPanel header={<span className="text-center">{stakingContractDetail.lockDays} days</span>}>
                        <div className="w-full">
                            <p className="text-black text-lg font-bold text-center">Current APY: {stakingContractDetail.apy} %</p>
                        </div>
                    </TabPanel>

                    <TabPanel header="Details">
                        <div className="w-full">
                                <p className='text-black text-base'>Deposit: {tokenSymbol}</p>
                                <p className='text-black text-base'>Reward: {tokenSymbol}</p>
                        </div>
                    </TabPanel>

                </TabView>

                <div className="w-full text-left text-base">
                    <p className='text-black text-base w-40'>Total Deposited Amount: </p>
                    <InputText readOnly className="text-sm bg-sky-100" value={stakingContractDetail.depositedAmount}></InputText>
                </div>

                <div className='mt-10 text-center'>
                    <button className="p-button p-button-raised bg-blue-700 border border-black text-white px-4 py-2" onClick={() => 
                        {
                            setSelectedPoolData(stakingContractDetail)
                            setInvestDialog(true)
                        }}>
                        STAKE
                    </button>
                </div>
            </Card>
        </div>
    )

    const ClaimTabTemplate = (stakingContractDetail: StakingContractDetail) =>
    {
        const activeStakePositions = stakingContractDetail.stakePosition?.filter((stakePosition: StakePosition) => StrToBoolean(stakePosition.isActive) == true) || []
        const filteredStakingContractDetail = 
        {
            ...stakingContractDetail,
            stakePosition: activeStakePositions, // Apply the filter only on the stakePosition array
        }

        return (
                <div className="border-1 surface-border border-round m-2 text-center py-5 px-3">
                <Card className="p-shadow-3 bg-sky-100 text-black rounded-md" title={<p className='text-center'>Pool {filteredStakingContractDetail.poolID+1}</p>}>
                    <p className="text-black text-lg font-bold text-center">APY: {filteredStakingContractDetail.apy} %</p>
                    {activeStakePositions.length > 0 ? (
                        <div>
                            <DataView 
                            className="text-black" 
                            value={filteredStakingContractDetail.stakePosition} 
                            listTemplate={(data) => DataViewTemplate(data, filteredStakingContractDetail.poolID)}
                            paginator 
                            rows={1} 
                            paginatorClassName="bg-sky-100"
                            emptyMessage="No deposit" 
                            />

                        </div>

                        
                    ) : <p className="text-black text-lg text-center mt-10">No deposit</p> }

                </Card>
            </div>
        )
    }
            
    return (

    <div className='parent'>      

        {/* Main title section */}
        <div className="grid grid-cols-12 gap-4 p-3">

        <div className="col-span-12 lg:col-span-7 ml-0 lg:ml-20 mt-20">
            <h1 className="text-4xl mb-2 text-black">
                <span className="font-bold text-blue-700">SAVES </span>TO EARN
            </h1>
            <div className="flex gap-4 mt-10">
                <button className="p-button p-button-raised bg-blue-700 border border-black text-white px-4 py-2">
                    BUY TCT TOKEN
                </button>
                <button className="p-button p-button-outlined text-blue-700 border border-black text-black px-4 py-2">
                    ADD TOKEN TCT
                </button>
            </div>
        </div>

        <div className="col-span-12 lg:col-span-3 mt-10">
            <Card className="p-shadow-3 bg-sky-100 text-black rounded-md">
                <div className="flex justify-center">
                    <p className="font-bold text-2xl text-black">
                        <span className="text-blue-700">TCT </span>
                        Token ICO
                    </p>
                </div>
                <p className="text-black flex justify-center font-bold">{tokenBalance} TCT</p>
                <p className="flex justify-center text-black font-bold">ICO Left: 120 TCT</p>
                <div className='flex justify-center mt-10'>
                    <i className="pi pi-check" style={{color: 'green'}}> 5% of total deposit amount</i>
                </div>
                <div className='flex justify-center mt-2'>
                    <i className="pi pi-check" style={{ color: 'green' }}> 2 million TCT total supply</i>
                </div>
                <div className='justify-center mt-10'>
                    <p className="flex font-bold text-black">ICO Sale: 10 TCT</p>
                    <ProgressBar className='mt-2' value={10}></ProgressBar>
                </div>

            </Card>
        </div>
        </div>


        {/* Pool main yield details */}
        <div className="m-10">

            <Carousel
            value={stakingContractDetail}
            itemTemplate={MainTabTemplate}
            numVisible={3}
            numScroll={3}
            responsiveOptions=
            {[
                { breakpoint: '1024px', numVisible: 3, numScroll: 3 },
                { breakpoint: '768px', numVisible: 2, numScroll: 2 },
                { breakpoint: '560px', numVisible: 1, numScroll: 1 },
            ]}
            circular
            />

            <div className='flex justify-center'>
                <Card className="w-5/6 p-shadow-3 bg-sky-100 m-5 text-black rounded-md">
                    <p className="flex justify-center text-3xl font-bold">{totalStake} TCT</p>
                    <p className="flex justify-center text-base mt-3">Total Stake</p>
                </Card>
            </div>

        </div>

        <div className="grid grid-rows-2 justify-items-center mt-10">
            <p className="font-bold text-4xl text-black">Staking pools</p>
            <p className="text-lg text-black mt-5">
                Welcome to <span className="font-bold text-blue-700">SAVES</span> - Where Your Crypto Works for You!
            </p>
        </div>
        
        {/* Pool invest section */}
        <div className="card">
            <Carousel
            value={stakingContractDetail}
            itemTemplate={InvestTabTemplate}
            numVisible={3}
            numScroll={3}
            responsiveOptions=
            {[
                { breakpoint: '1024px', numVisible: 3, numScroll: 1 },
                { breakpoint: '768px', numVisible: 2, numScroll: 1 },
                { breakpoint: '560px', numVisible: 1, numScroll: 1 },
            ]}
            circular
            />
        </div>

        {/* 2rd title section */}
        <div className="grid grid-rows-2 justify-items-center mt-20">
            <p className="flex justify-center font-bold text-4xl text-black">Token</p>
            <p className="flex justify-center text-lg text-black mt-5">More yields for your tokens</p>
        </div>

        {/* 2rd title section */}
        <div className="grid grid-rows-2 justify-items-center mt-20">
            <p className="flex justify-center font-bold text-4xl text-black">Staking rewards</p>
            <p className="flex justify-center text-lg text-black mt-5">Earn rewards by staking your crypto. Lock your tokens to support the network and receive regular payouts.</p>
        </div>

        {/* Pool withdraw section */}
        <div className="card">
            <Carousel
            value={stakingContractDetail}
            itemTemplate={ClaimTabTemplate}
            numVisible={3}
            numScroll={1}
            circular
            responsiveOptions=
            {[
                { breakpoint: '1024px', numVisible: 3, numScroll: 1 },
                { breakpoint: '768px', numVisible: 2, numScroll: 1 },
                { breakpoint: '560px', numVisible: 1, numScroll: 1 },
            ]}
            />
        </div>

               {/* 3rd title section */}
        <div className="grid grid-rows-2 justify-items-center mt-20">
            <p className="flex justify-center font-bold text-4xl text-black">Active Live</p>
            <div>
                <p className="flex justify-center text-lg text-black mt-5">Experience the thrill of real-time staking with our active live session!</p>
                <p className="flex justify-center text-lg text-black mt-3"> Watch as users dynamically stake their cryptocurrency, track live rewards as they accumulate, and witness the pulse of the blockchain in action.</p>
            </div>
        </div>

        <div className="grid place-items-center px-4 mt-10">
            <div className="w-full max-w-6xl">
                <DataTable className='table-wrapper'
                value={notificationDetail}
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25, 50]}
                tableStyle={{ minWidth: '50rem' }}
                paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                currentPageReportTemplate="{first} to {last} of {totalRecords}"
                >
                    <Column className='text-black font-bold' field="typeOf" header="ACTIVITY" style={{ width: '5%' }}></Column>
                    <Column className='text-blue-700 font-bold' header="TOKEN" style={{ width: '5%' }} body={() => (
                    <span>{tokenSymbol}</span>)}>
                    </Column>
                    <Column className='text-emerald-700 font-bold' field="user" header="USER" style={{ width: '10%' }}  body={(rowData, { rowIndex }) => (
                    <div><span>{rowData.user.slice(0, 6) + "..." + rowData.user.slice(-4)}</span> <i className="pi pi-copy cursor-pointer text-blue-700" onClick={() => CopyAddress(rowData.user)}
                    ></i></div>)}>
                    </Column>

                    <Column field="poolId" header="POOL ID" style={{ width: '5%' }}></Column>

                    <Column header="AMOUNT" style={{ width: '5%' }} body={(rowData, { rowIndex }) => (
                    <span>{rowData.amount} TCT</span>)}></Column>

                    <Column field="timestamp" header="DATE" style={{ width: '5%' }}></Column>
                </DataTable>
            </div>
        </div>

            <Dialog 
                header="Invest" 
                className='invest-dialog'
                draggable = {false}
                visible={investDialog}
                onHide={() => setInvestDialog(false)}>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-0 mt-3">

                    <div className="text-left sm:grid-cols-3">
                        <p className="text-sm font-bold">Token amount:</p>
                    </div>

                    <div className='text-right sm:grid-cols-3'>
                        <InputText className="text-sm lg:ml-5"  
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        placeholder=""/>
                        {errors.investAmount && <p className="text-red-500 text-sm font-bold">{errors.investAmount}</p>}
                    </div>
                </div>

                <p className="text-sm mt-3">Pool details: </p>
                {/* <p className="text-xs mt-1">You deposited: {selectedPoolData?.amount} TCT</p> */}
                <p className="text-xs mt-1">Total deposited amount: {selectedPoolData?.depositedAmount} TCT</p>
                <p className="text-xs mt-1">You have: {tokenBalance} TCT</p>
                
                <div className='text-center'>
                    <Button label="INVEST" className="mt-10 invest-button" raised onClick={Deposit}>
                    </Button>
                </div>

            </Dialog>

            
            <BlockUI blocked={loading}  template={<ProgressSpinner style={{width: '100px', height: '100px'}} strokeWidth="4" animationDuration=".75s" />} fullScreen>
            </BlockUI>

            <Toast ref={toast} />
            <ConfirmPopup />

    </div>  


        )
}
        