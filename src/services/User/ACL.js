import { ethers } from "ethers";

// Ropsten
// Want 3: 0xD8FE3C5fC05a9805FD69FFbbCd32369D7B96067E
// Want 2: 0x2E14AEC27060a5ddb5E876997C2CF4213Ec1903B
// Want 1: 0x95eb04408d99622f92b82F6084c8b4624F60c75c

// Subscribe to Transfer, Burn, Mint

//

const abi = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_from",
        type: "address",
      },
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
      {
        name: "_spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    payable: true,
    stateMutability: "payable",
    type: "fallback",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
];

const want3Address = "0xD8FE3C5fC05a9805FD69FFbbCd32369D7B96067E";
const want2Address = "0x2E14AEC27060a5ddb5E876997C2CF4213Ec1903B";
const want1Address = "0x95eb04408d99622f92b82F6084c8b4624F60c75c";

const RoleChecker = async (userAddress) => {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://eth-ropsten.alchemyapi.io/v2/vfhvTxxlrhwKNnsWfOgxYBKLQyNVuAFj"
  );

  const wantOne = new ethers.Contract(want1Address, abi, provider);
  const wantTwo = new ethers.Contract(want2Address, abi, provider);
  const wantThree = new ethers.Contract(want3Address, abi, provider);

  const wantThreeBalance = Number(
    String(await wantThree.balanceOf(userAddress))
  );
  const wantTwoBalance = Number(String(await wantTwo.balanceOf(userAddress)));
  const wantOneBalance = Number(String(await wantOne.balanceOf(userAddress)));

  if (wantThreeBalance > 0) return "MODERATOR";
  if (wantTwoBalance > 0) return "SPEAKER";
  if (wantOneBalance > 0) return "VOTER";
  return "LISTENER";
};

export default RoleChecker;
