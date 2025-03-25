// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "./library.sol";

contract SavesStaking is Ownable, ReentrancyGuard 
{
    using SafeERC20 for IERC20;

    struct StakePosition 
    {
        uint256 amount;
        uint256 startTime;
        uint256 lockUntil;
        uint256 lastRewardAt;
        bool isActive;
    }

    struct Pool 
    {
        uint256 poolID;
        IERC20 depositToken;
        IERC20 rewardToken;
        uint256 depositedAmount;
        uint256 apy;
        uint256 lockDays;
    }

    struct Notification 
    {
        uint256 poolId;
        uint256 amount;
        address user;
        string typeOf;
        uint256 timestamp;
    }

    uint public poolCount;
    Pool[] public pools;

    mapping(uint256 => mapping(address => StakePosition[])) public stakePositions;
    mapping(address => mapping(uint256 => uint256)) public depositedTokens;
    Notification[] public notifications;

    function addPool(IERC20 _depositToken, IERC20 _rewardToken, uint256 _apy, uint256 _lockDays) public onlyOwner 
    {
        pools.push
        (Pool
        ({
            poolID: poolCount,
            depositToken: _depositToken,
            rewardToken: _rewardToken,
            depositedAmount: 0,
            apy: _apy,
            lockDays: _lockDays
        }));
        poolCount++;
    }

    function deposit(uint256 _pid, uint256 _amount) public nonReentrant 
    {
        require(_amount > 0, "Amount should be greater than 0!");
        require(_pid < poolCount, "Invalid pool ID!");

        Pool storage pool = pools[_pid];
        pool.depositToken.safeTransferFrom(msg.sender, address(this), _amount);
        pool.depositedAmount += _amount;
        
        StakePosition memory newPosition = StakePosition
        ({
            amount: _amount,
            startTime: block.timestamp,
            lockUntil: block.timestamp + (pool.lockDays * 60),
            lastRewardAt: block.timestamp,
            isActive: true
        });

        stakePositions[_pid][msg.sender].push(newPosition);
        depositedTokens[msg.sender][_pid] += _amount;

        _createNotification(_pid, _amount, msg.sender, "Deposit");
    }

    function withdraw(uint256 _pid, uint256 _positionIndex) public nonReentrant 
    {
        require(_pid < poolCount, "Invalid pool ID!");
        require(_positionIndex < stakePositions[_pid][msg.sender].length, "Invalid position index!");

        Pool storage pool = pools[_pid];
        StakePosition storage position = stakePositions[_pid][msg.sender][_positionIndex];
        
        require(position.amount > 0, "No token to withdraw");
        require(position.isActive, "Position already withdrawn!");

        if (block.timestamp >= position.lockUntil)
        {
            uint256 pending = _calcPendingReward(position, _pid);
            pool.rewardToken.safeTransfer(msg.sender, pending);
            _createNotification(_pid, pending, msg.sender, "Reward");
        }

        uint256 amountToWithdraw = position.amount;
        position.isActive = false;
        pool.depositedAmount -= amountToWithdraw;
        depositedTokens[msg.sender][_pid] -= amountToWithdraw;

        pool.depositToken.safeTransfer(msg.sender, amountToWithdraw);
        _createNotification(_pid, amountToWithdraw, msg.sender, "Withdraw");
    }

    function _calcPendingReward(StakePosition storage position, uint256 _pid) internal view returns (uint256) 
    {
        uint256 daysPassed;
        Pool storage pool = pools[_pid];

        if (block.timestamp >= position.lockUntil)
        {
            daysPassed = (position.lockUntil - position.startTime) / 60;
        }

        else 
        {
            daysPassed = (block.timestamp - position.startTime) / 60;
        }

        return position.amount * daysPassed * pool.apy / 365 / 100;
    }

    function pendingReward(uint256 _pid, address _account, uint256 _positionIndex) public view returns (uint256) 
    {
        require(_pid < poolCount, "Invalid pool ID!");
        require(_positionIndex < stakePositions[_pid][_account].length, "Invalid position index!");

        StakePosition storage position = stakePositions[_pid][_account][_positionIndex];
        return _calcPendingReward(position, _pid);
    }

    function sweep(address token, uint256 amount) external onlyOwner 
    {
        uint256 token_balance = IERC20(token).balanceOf(address(this));
        require(amount <= token_balance, "Amount exceeds balance");

        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function modifyPool(uint256 _pid, uint256 _apy) public onlyOwner 
    {
        require(_pid < poolCount, "Invalid pool ID!");
        pools[_pid].apy = _apy;
    }

    function _createNotification(uint256 _id, uint256 _amount, address _user, string memory _typeOf) internal 
    {
        notifications.push
        (Notification
        ({
            poolId: _id,
            amount: _amount,
            user: _user,
            typeOf: _typeOf,
            timestamp: block.timestamp
        }));
    }

    function getNotifications() public view returns (Notification[] memory) 
    {
        return notifications;
    }

    function poolInfo(uint256 _pid) external view returns (IERC20 depositToken, IERC20 rewardToken, uint256 depositedAmount, uint256 apy, uint256 lockDays) 
    {
        require(_pid < poolCount, "Invalid pool ID!");
        Pool storage pool = pools[_pid];
        return (pool.depositToken, pool.rewardToken, pool.depositedAmount, pool.apy, pool.lockDays);
    }

    function getUserPositions(uint256 _pid) external view returns (StakePosition[] memory) 
    {
        require(_pid < poolCount, "Invalid pool ID!");
        return stakePositions[_pid][msg.sender];
    }

    function getStakePositionLength(uint256 _pid, address _account) external view returns (uint256) 
    {
        require(_pid < poolCount, "Invalid pool ID!");
        return stakePositions[_pid][_account].length;
    }
}
