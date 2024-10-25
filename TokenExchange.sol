// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "./IERC20.sol";

contract TokenExchange {
    IERC20 token;
    address owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not an owner");
        _;
    }

    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
    }

    function buy() public payable {
        uint amount = msg.value;

        require(amount >= 1);

        uint currentBalace = token.balanceOf(address(this));

        require(currentBalace >= amount);

        token.transfer(msg.sender, amount);
    }

    function sell(uint _amount) external {
        require(address(this).balance >= _amount);
        require(token.allowance(msg.sender, address(this)) >= _amount);

        token.transferFrom(msg.sender, address(this), _amount);

        (bool ok, ) = msg.sender.call{value: _amount}("");
        require(ok, "cant send funds");
    } 

    function topUp() external payable onlyOwner { }

    receive() external payable {
        buy();
    }
}