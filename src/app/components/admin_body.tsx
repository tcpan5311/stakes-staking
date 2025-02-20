import React from 'react'; 
import CustomTabMenu from './custom_tab_menu';
import { MetamaskProvider } from '../../../context/MetamaskContext';

export default function Body() 
{
    const items = 
    [
        { label: 'Dashboard'},
        { label: 'Investing'},
        { label: 'Staking'},
        { label: 'Transfer'},
        { label: 'Pool'},
    ];

    return (
        <div className="parent">
            <div className="col-span-10 md:col-start-4 md:col-span-6 items-center mt-10 ml-10">
                <h1 className="font-bold text-2xl mb-2 text-blue-700">
                    Admin <span className="text-black">Panel </span>
                </h1>
            </div>

            <div className="grid grid-cols-12">
                <div className="col-span-12 lg:col-span-7 mt-5">
                    <CustomTabMenu/>
                </div>
            </div>
        </div>
    )
}