//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IFakeNFTMarketplace.sol";
import "./ICryptoDevsNFT.sol";




contract CryptoDevsDAO is Ownable {

struct Proposal {
    uint256 nftTokenId;
    uint256 deadline;
    uint256 yayVotes;
    uint256 nayVotes;
    // executed - whether or not this proposal has been executed yet -- Cannot be executed before the deadline has been exceeded.
    bool executed;
    // token ID voted or not?
    mapping(uint256 => bool) voters;
}


// Number of proposals that have been created
uint256 public numProposals;

// Create a mapping of ID to Proposal
mapping(uint256 => Proposal) public proposals;


// since we will be calling functions on the FakeNFTMarketplace and CryptoDevsNFT contract, let's initialize variables for those contracts.
IFakeNFTMarketplace nftMarketplace;
ICryptoDevsNFT cryptoDevsNFT;


// Create a payable constructor which initializes the contract
// instances for FakeNFTMarketplace and CryptoDevsNFT
// The payable allows this constructor to accept an ETH deposit when it is being deployed

constructor (address _nftMarketplace, address _cryptoDevsNFT) payable {
    nftMarketplace = IFakeNFTMarketplace(_nftMarketplace);
    cryptoDevsNFT = ICryptoDevsNFT(_cryptoDevsNFT);
} 

modifier nftHolderOnly() {
    require(cryptoDevsNFT.balanceOf(msg.sender) > 0, "Not an NFT Holder");
    _;
}


/// createProposal allows a CryptoDevsNFT holder to create a new proposal in the DAO
/// _nftTokenId - the tokenID of the NFT to be purchased from FakeNFTMarketplace if this proposal passes
/// Returns the proposal index for the newly created proposal

function createProposal(uint256 _nftTokenId) external nftHolderOnly returns (uint256) {
    require(nftMarketplace.available(_nftTokenId), "NFT not for sale");

    Proposal storage proposal = proposals[numProposals];
    proposal.nftTokenId = _nftTokenId;
    // Set the proposal's voting deadline to be (current time + 5 minutes)
    proposal.deadline = block.timestamp + 5 minutes;

    numProposals++;

    return numProposals - 1;

}

modifier activeProposalOnly(uint256 proposalIndex) {
    require(proposals[proposalIndex].deadline > block.timestamp, "Sorry, Voting Deadline has passed" );
    _;
} 

// Additionally, since a vote can only be one of two values (YAY or NAY) - we can create an enum representing possible options.

enum Vote {
    YAY, //yay=0
    NAY  //nay=1
}
///  voteOnProposal allows a CryptoDevsNFT holder to cast their vote on an active proposal
///  proposalIndex - the index of the proposal to vote on in the proposals array
///  vote - the type of vote they want to cast

function voteOnProposals(uint256 proposalIndex, Vote vote) external nftHolderOnly activeProposalOnly(proposalIndex) {

    Proposal storage proposal = proposals[proposalIndex];

    uint256 voterNFTBalance = cryptoDevsNFT.balanceOf(msg.sender);
    uint256 numVotes = 0;

    // Calculate how many NFTs are owned by the voter that haven't already been used for voting on this proposal

    for(uint256 i = 0 ; i < voterNFTBalance; i++) {
        uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, i);
        if(proposal.voters[tokenId] == false) {
            numVotes++;
            proposal.voters[tokenId] = true;  
        } 

    }

    require(numVotes > 0, "You already voted");
    if(vote == Vote.YAY) {
        proposal.yayVotes += numVotes;
    } else {
        proposal.nayVotes += numVotes;
    }
}
// Create a modifier which only allows a function to be
// called if the given proposals' deadline HAS been exceeded
// and if the proposal has not yet been executed

modifier inactiveProposalOnly(uint256 proposalIndex) {
    require(proposals[proposalIndex].deadline < block.timestamp, "Deadline is not over yet");
    require(proposals[proposalIndex].executed == false, "Proposal has already been executed");
    _;
}
//  executeProposal allows any CryptoDevsNFT holder to execute a proposal after it's deadline has been exceeded

function executeProposal(uint256 proposalIndex) external nftHolderOnly inactiveProposalOnly(proposalIndex) {
    Proposal storage proposal = proposals[proposalIndex];

    if(proposal.yayVotes > proposal.nayVotes) {
        uint256 _nftPrice = nftMarketplace.getPrice();
        require(address(this).balance >= _nftPrice, "Not enough funds");
        nftMarketplace.purchase{value: _nftPrice} (proposal.nftTokenId);
    }
    proposal.executed = true;
}

/// withdrawEther allows the contract owner (deployer) to withdraw all ETH from the contract

function withdrawEther() external onlyOwner {
    uint256 amount = address(this).balance;
    require(amount > 0, "No funds to transfer");
    payable(owner()).transfer(amount);
}

fallback() external payable {}
receive() external payable {}

}




