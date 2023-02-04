//SPDX-License-Identifier: MIT 
pragma solidity ^0.8.17;

contract FakeNFTMarketplace {
    // fakeID to owner addresses
    mapping(uint256 => address) public tokens;

    uint256 nftPrice = 0.1 ether;


     /// purchase() accepts ETH and marks the the caller address as the owner of the given tokenId 
    /// _tokenId - the fake NFT token Id to purchase
    function purchase(uint256 _tokenId) external payable {
        require(msg.value >= nftPrice, "NFT price is 0.1 ETH");
        tokens[_tokenId] = msg.sender;
    }

    //  getPrice() returns the price of one NFT
    function getPrice() external view returns (uint256) {
        return nftPrice;
    }

    /// available() checks whether the given tokenId has already been sold or not
    /// tokenId - the tokenId to check for

    function available(uint256 _tokenId) external view returns(bool) {
        if(tokens[_tokenId] == address(0)) {
            return true;
        } 
        return false;
    } 
    }