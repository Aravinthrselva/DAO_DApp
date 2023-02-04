//SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;


/**
 * Minimal interface for CryptoDevsNFT containing only two functions
 * that we are interested in
 */

interface ICryptoDevsNFT {
    
    function balanceOf(address owner) external view returns (uint256 balance);

    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
        
}