//SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

interface IFakeNFTMarketplace {

 function purchase(uint256 _tokenId) external payable; 

 function getPrice() external view returns (uint256);

 function available(uint256 _tokenId) external view returns (bool);
}