// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "./library.sol";

contract TCToken is ERC20, Ownable 
{
    constructor(uint256 initialSupply) ERC20("TC Token", "TCT")
    {
        _mint(msg.sender, initialSupply * (10 ** decimals()));
    }
    
    function mint(address to, uint256 amount) external onlyOwner 
    {
        _mint(to, amount * (10 ** decimals()));
    }
    
    function burn(uint256 amount) external 
    {
        _burn(msg.sender, amount);
    }
}
