
"use client";
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css';
import { Menubar } from 'primereact/menubar';
import { MenuItem } from 'primereact/menuitem';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ethers, getDefaultProvider } from 'ethers';
import { UseMetamask } from '../../../context/MetamaskContext';

export default function Header() {

    const {provider, isConnected, account, formatAccount, formatBalance, connectLabel, installVisible, setInstallVisible, setConnectLabel, CheckMetamaskInstalled, ConnectToMetamask} = UseMetamask()

    useEffect(() => 
    {
        
    }, [])

    const items: MenuItem[] = [
        {
            label: 'Home',
            icon: 'pi pi-home',
            className: 'nav-items'
        },
        {
            label: 'Staking',
            icon: 'pi pi-database',
            className: 'nav-items'
        },
        {
            label: 'Crypto',
            icon: 'pi pi-bitcoin',
            className: 'nav-items'
        },
        {
            label: 'Partners',
            icon: 'pi pi-users',
            className: 'nav-items'
        }
    ]

    return (
        <div className="main-menu py-2">
            <Menubar className='bg-blue-700' model={items}
             start={<h1 className='mr-5 ml-5 font-bold text-xl text-white'>SAVES</h1>}
            end=
            {
                !isConnected ? 
                (
                    <Button style={{color: 'white'}} onClick={ConnectToMetamask} className="!bg-white !text-black p-button-raised border border-black px-4 py-2 rounded-md" label={connectLabel} icon="pi pi-sign-in" />
                ) : 
                (
                    <div className="!bg-white flex items-center align-middle px-4 rounded-md">
                        <i className="pi pi-ethereum text-sm mr-3"></i>
                        <span className="text-sm font-bold text-black"> {formatBalance} Eth</span>
                        <div className="!bg-slate-200 flex items-center ml-3 rounded-lg">
                            <p className="text-black text-sm font-bold"> {formatAccount} </p>
                        </div>
                    </div> 
                )
            }/>

            <Dialog
                header="Metamask Not Installed"
                visible={installVisible}
                style={{ width: '50vw' }}
                onHide={() => setInstallVisible(false)} 
            >
                <p className="m-0">
                    Please install Metamask!
                </p>
            </Dialog>
        </div>

        

    )
}

        