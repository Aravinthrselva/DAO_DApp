import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import {useState, useRef, useEffect} from 'react';
import {Contract, providers, utils} from 'ethers';

import Web3Modal from 'web3modal';

import { CRYPTODEVS_DAO_CONTRACT_ADDRESS,
         CRYPTODEVS_DAO_ABI,
         CRYPTODEVS_NFT_CONTRACT_ADDRESS,
         CRYPTODEVS_NFT_ABI
       } from '../constants'; 


export default function Home() {

const web3ModalRef = useRef();
const [walletConnected, setWalletConnected] = useState(false);
const [isOwner, setIsOwner] = useState(false);
const [loading, setLoading] = useState(false);

const [selectedTab, setSelectedTab] = useState("");

const [numProposals, setNumProposals] = useState("0");
const [proposals, setProposals] = useState([]);
const [treasuryBalance, setTreasuryBalance] = useState("0");
const [nftBalance, setNftBalance] = useState(0);
const [fakeNftTokenId, setFakeNftTokenId] = useState("");


  // Helper function to return a DAO Contract instance given a Provider/Signer

  const getDaoContractInstance =  (providerOrSigner) => {
    return new Contract(CRYPTODEVS_DAO_CONTRACT_ADDRESS, CRYPTODEVS_DAO_ABI, providerOrSigner);
  };

  // Helper function to return a cryptoDevNFTContract instance given a Provider/Signer
  const getCryptoDevsNFTContractInstance =  (providerOrSigner) => {
    return new Contract(CRYPTODEVS_NFT_CONTRACT_ADDRESS, CRYPTODEVS_NFT_ABI, providerOrSigner);
  };


const getDAOOwner = async() => {
  try {
 
    const signer = await getProviderOrSigner(true);
    const daoContract = getDaoContractInstance (signer);
     
    // call the owner function from the contract
    const ownerAddress = await daoContract.owner();
    // Get the address associated to signer which is connected to Metamask
    const signerAddress = await signer.getAddress();
    if(signerAddress.toLowerCase() === ownerAddress.toLowerCase()) {
      setIsOwner(true);
    }

  } catch (err) {
    console.error(err.message);
  }
};


const withdrawDAOEther = async() => {
 try {
  const signer = await getProviderOrSigner(true);
  const daoContract = getDaoContractInstance(signer);

  const tx = await daoContract.withdrawEther();
  setLoading(true);
  await tx.wait();
  setLoading(false);
  getDAOTreasuryBalance();

 } catch(err) {
  console.error(err);
 }
}

const getDAOTreasuryBalance = async() => {
  try {
    const provider = await getProviderOrSigner();
    //getBalance is a function of ethers js
    const balance = await provider.getBalance(CRYPTODEVS_DAO_CONTRACT_ADDRESS);

    setTreasuryBalance(balance.toString());

  } catch(err) {
  console.error(err);
  }
};

const getNumProposalsInDAO = async() => {
  try {
    const provider = await getProviderOrSigner();

    const daoContract = getDaoContractInstance(provider);

    const numProposalsInDao = await daoContract.numProposals();

    setNumProposals(numProposalsInDao.toString());
  } catch(err) {
    console.error(err);
  }
}


const getUserNftBalance = async() => {
  try {
    const signer = await getProviderOrSigner(true);
    const nftContract = getCryptoDevsNFTContractInstance(signer);
    const nftBalance = await nftContract.balanceOf(signer.getAddress());
    setNftBalance(parseInt(nftBalance.toString()));
  } catch (err) {
    console.error(err);
  }
};

const createProposal = async() => {
  try {
    const signer = await getProviderOrSigner(true);
    const daoContract = getDaoContractInstance(signer);
    const tx = await daoContract.createProposal(fakeNftTokenId);
    setLoading(true);
    await tx.wait();
    await getNumProposalsInDAO();
    setLoading(false);
    console.log("fake Token IDD :", fakeNftTokenId);
  } catch (err) {
    console.error(err);
    window.alert(err.reason);
  }
};


const fetchProposalById = async(id) => {
  try {
    const provider = await getProviderOrSigner();
    const daoContract = getDaoContractInstance(provider);

    const proposal = await daoContract.proposals(id);
    
    const parsedProposal = { 
      proposalId: id, 
      nftTokenId: proposal.nftTokenId.toString(),
      deadline: new Date(parseInt(proposal.deadline.toString())*1000),
      yayVotes: proposal.yayVotes.toString(),
      nayVotes: proposal.nayVotes.toString(),
      executed: proposal.executed, 
    };

    return parsedProposal;

  } catch (err) {
    console.error(err);
  }
};


  // Runs a loop `numProposals` times to fetch all proposals in the DAO
  // and sets the `proposals` state variable

const fetchAllProposals = async() => {
  try {
    const proposals = [];
    for(let i=0; i<numProposals; i++) {
      const proposal = fetchProposalById(i);
      proposals.push(proposal);
    }
    setProposals(proposals);
    return proposals;
  } catch (err) {
    console.error(err);
  }
};

const voteOnProposals = async(proposalId, _vote) => {
  try {
    const signer = await getProviderOrSigner(true);
    const daoContract = getDaoContractInstance(signer);

    let vote = _vote === "YAY" ? 0 : 1 ;
    const tx = await daoContract.voteOnProposals(proposalId, vote);
    setLoading(true);
    await tx.wait();
    setLoading(false);

    await fetchAllProposals();

  } catch (err) {
    console.error(err);
    window.alert(err.reason);

  }
};

const executeProposal = async(proposalId) => {
  try{
    const signer = await getProviderOrSigner(true);
    const daoContract = getDaoContractInstance(signer);

    const tx = await daoContract.executeProposal(proposalId);
    setLoading(true);
    await tx.wait;
    setLoading(false);
    await fetchAllProposals();
    getDAOTreasuryBalance();
  } catch(err){
    console.error(err);
  }
}


const getProviderOrSigner = async(needSigner = false) => {

  const provider = await web3ModalRef.current.connect();
  const web3Provider = new providers.Web3Provider(provider);

  const {chainId} = await web3Provider.getNetwork();

  if(chainId !== 5) {
    window.alert("Connect to Goerli Network");
    throw new Error("Wallet not connected to goerli");
  }

  if(needSigner) {
    const signer = web3Provider.getSigner();
    return signer;
  }

  return web3Provider;
};


const connectWallet = async() => {
  try{
    await getProviderOrSigner();
    setWalletConnected(true);
  }
  catch(err) {
    console.error(err);
  }
}




useEffect(() => {
  if(!walletConnected) {
    web3ModalRef.current = new Web3Modal({
      network: "goerli",
      providerOptions: {},
      disableInjectedProvider: false,
    });

    connectWallet().then(() => {
      getDAOTreasuryBalance();
      getUserNftBalance();
      getNumProposalsInDAO();
      getDAOOwner();
    });
  }
  
}, [walletConnected]);

  // Piece of code that runs everytime the value of `selectedTab` changes
  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'View Proposals' tab

  useEffect(() => {
    if(selectedTab == "View Proposal") {
      fetchAllProposals();
   }
  }, [selectedTab]);



function renderTabs() {
  
if(selectedTab === "Create Proposal") {
return renderCreateProposalTab();
} else if (selectedTab === "View Proposal") {
  return renderViewProposalsTab();
}
return null;
}


function renderCreateProposalTab() {
  if(loading) {
    return (
      <div className={styles.description}>
        Loading.. <br />
        (Waiting for transaction)
      </div>
    );
  } else if (nftBalance === 0) {
    return (
      <div className={styles.description}>
        You do not own an eligible NFT <br />
        (you cannot create or vote on proposals)
      </div>
    );
  } else {
    return ( 
      <div className={styles.container}>
        <label> TokenID to purchase: </label>
        <input 
        placeholder="1"
        type="number"
        onChange={(e) => setFakeNftTokenId(e.target.value)}
        />
        <button className={styles.button2} onClick={createProposal}>
          Create Proposal +
        </button> 
      </div>
    );
  }
}

function renderViewProposalsTab() {
  if(loading) {
    return(
      <div className={styles.description}>
        Loading.. <br/>
        (Waiting for transaction)
      </div>
    );
  } else if (proposals.length === 0 ) {
    return(
      <div className={styles.description}>
        No proposals have been created 
      </div>
    );
  } else {
    return (
      <div>
        {proposals.map((p,index) => (
          <div key={index} className={styles.proposalCard}>
            <p>proposal ID : {p.proposalId}</p>
            <p>NFT to purchase : {p.nftTokenId}</p>
            <p>Deadline: {p.deadline.toLocaleString()}</p>
            <p>Yay Votes: {p.yayVotes}</p>
            <p>Nay Votes: {p.nayVotes}</p>
            <p>Executed?: {p.executed.toString()}</p>
    
            {p.deadline.getTime() > Date.now() && !p.executed ? (
              <div className={styles.flex}>
    
                <button className={styles.button2} onClick={() => voteOnProposals(p.proposalId, "YAY")}>
                  Vote YAY
                </button>
    
                <button className={styles.button2} onClick={() => voteOnProposals(p.proposalId, "NAY")}>
                  Vote NAY
                </button>
    
              </div>
            ) : p.deadline.getTime() < Date.now() && !p.executed ? (
              <div className={styles.flex}>
                <button 
                className={styles.button2}
                onClick={() => executeProposal(p.proposalId)}
                >
                  Execute Proposal{" "}
                  {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                </button>
              </div>
            ) : (
              <div className={styles.description}> Proposal Executed </div>
            )}
          </div>
        ))}
      </div>
    );
  }
}

return ( 
  <div>
     <Head>
        <title>Buidlers DAO</title>
        <meta name="description" content="Buidlers DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
 
  <div className={styles.main}>
  <div>
          <h1 className={styles.title}>Buidlers DAO by AvantGard!</h1>
          <div className={styles.description}>Welcome🔮 </div>
          <div className={styles.description}> 
          Your NFT Balance : {nftBalance} 
          <br/>
          Treasury Balance : {utils.formatEther(treasuryBalance)} ETH 
          <br/>
          Total number of proposals: {numProposals}
  </div>

  <div className={styles.flex}>
    <button className={styles.button2} onClick={() => setSelectedTab("Create Proposal")}>
      Create Proposal
    </button>

    <button className={styles.button2} onClick={() => setSelectedTab("View Proposal")}>
      View Proposal
    </button>
  </div>
    {renderTabs()}

    {isOwner? (
      <div className={styles.flex}>
      {loading? (
        <button className={styles.button2}> 
        Loading.. 
        </button>
      ) : (
      <button className={styles.button2} onClick={withdrawDAOEther}>
      Withdraw ETH
      </button>
      )}
      </div>
      ) : ("")
      }

  </div>

  <div>
    <img className={styles.image} src="/cryptodevs/0.svg"/>
  </div>
  </div>
  <footer className={styles.footer}>
    Built with 💜 by AvantGard
  </footer>
  </div>
)
}