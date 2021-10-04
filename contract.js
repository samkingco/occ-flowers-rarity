const { ethers } = require("ethers");
const abi = require("./abi.json");

const address = "0x5A876ffc6E75066f5ca870e20FCa4754C1EfE91F";
const rpc = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const contract = new ethers.Contract(address, abi, rpc);
const totalFlowers = 4096;
const tokenIds = Array.from({ length: totalFlowers }, (_, i) => i + 1);

module.exports = {
  address,
  rpc,
  abi,
  contract,
  tokenIds,
  totalFlowers,
};
