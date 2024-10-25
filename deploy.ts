import hre, { ethers } from "hardhat";

async function main() {
    const [signer] = await ethers.getSigners();

    const GuideDAOToken = await ethers.getContractFactory("GuideDAOToken");
    const gtk = await GuideDAOToken.deploy(signer.address);
    await gtk.waitForDeployment(); 

    const TokenExchange = await ethers.getContractFactory("TokenExchange");

    const exch = await TokenExchange.deploy(gtk.target);
    await exch.waitForDeployment();

    console.log(`Signer: ${signer.address}`);

    console.log(`Token: ${gtk.target}`);
    console.log(`Exchange: ${exch.target}`);
}

main()
    .then(() => process.exit(0)) 
    .catch((error) => {
        console.error(error); 
        process.exit(1); 
    });