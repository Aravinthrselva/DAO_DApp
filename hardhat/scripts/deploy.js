const {ethers} = require("hardhat");
const {CRYPTODEVS_NFT_CONTRACT_ADDRESS} = require("../constants");

async function main() {
  // Deploying the FakeNFTMarketplace contract first

  const FakeNFTMarketplace = await ethers.getContractFactory("FakeNFTMarketplace");
  const fakeNFTMarketplace = await FakeNFTMarketplace.deploy();
  await fakeNFTMarketplace.deployed();

  console.log("NFT MARKETPLACE CONTRACT ADDRESS: ", fakeNFTMarketplace.address);

  // deploying the cryptoDevsDAO contract
  const CryptoDevsDAO = await ethers.getContractFactory("CryptoDevsDAO");
  const cryptoDevsDAO = await CryptoDevsDAO.deploy(fakeNFTMarketplace.address, CRYPTODEVS_NFT_CONTRACT_ADDRESS, 
    {
      // This assumes the owner account has at least 0.20 ETH 
      // the CryptoDevsDAO constructor is payable 
      value: ethers.utils.parseEther("0.20"),
    } );
  await cryptoDevsDAO.deployed();

  console.log("CryptoDevsDAO contract address: ", cryptoDevsDAO.address);


}

main()
.then(()=> process.exit(0))
.catch((err) => {
  console.error(err);
  process.exit(1);
});