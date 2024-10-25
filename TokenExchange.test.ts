import { GuideDAOToken } from "../typechain-types";
import { loadFixture, ethers, expect } from "./setup";

describe("TokenExchange", function () {
    async function deploy() {
        const [owner, buyer] = await ethers.getSigners();

        const GuideDAOToken = await ethers.getContractFactory("GuideDAOToken");
        const gtk = await GuideDAOToken.deploy(owner.address);
        await gtk.waitForDeployment();

        const TokenExchange = await ethers.getContractFactory("TokenExchange");
        const exch = await TokenExchange.deploy(gtk.target);
        await exch.waitForDeployment();

        return { gtk, exch, owner, buyer };
    }

    it("allows to buy", async function () {
        const { gtk, exch, owner, buyer } = await loadFixture(deploy);

        const tokensInStock = 3n;
        const tokensWithDecimals = await withDecimals(gtk, tokensInStock);

        const transferTx = await gtk.transfer(exch.target, tokensWithDecimals);
        await transferTx.wait();

        expect(await transferTx).to.changeTokenBalances(
            gtk, [owner, exch], [-tokensWithDecimals, tokensWithDecimals]
        );

        const tokensToBuy = 1n;
        const value = ethers.parseEther(tokensToBuy.toString());

        const buyTx = await exch.connect(buyer).buy({value: value});
        await buyTx.wait();

        await expect(buyTx).to.changeEtherBalances(
            [buyer, exch], [-value, value]
        );

        await expect(buyTx).to.changeTokenBalances(
            gtk, [exch, buyer], [-value, value]
        );
    });

    it("should allow to sell", async function() {
        const { gtk, exch, buyer } = await loadFixture(deploy);

        const ownedTokens = 2n;

        const transferTx = await gtk.transfer(buyer.address,  await withDecimals(gtk, ownedTokens));
        await transferTx.wait();

        const topUpTx = await exch.topUp({value: ethers.parseEther("5")});
        await topUpTx.wait();

        const tokensToSell = 1n;
        const value = ethers.parseEther(tokensToSell.toString());

        const approveTx = await gtk.connect(buyer).approve(exch.target, value);
        await approveTx.wait();

        const sellTx = await exch.connect(buyer).sell(value);
        await sellTx.wait();

        await expect(sellTx).to.changeEtherBalances([buyer, exch], [value, -value]);

        await expect(sellTx).to.changeTokenBalances(
            gtk, [exch, buyer], [value, -value]
        );
    });

    async function withDecimals(gtk: GuideDAOToken, value: bigint): Promise<bigint> {
        return value * 10n ** await gtk.decimals();
    }
});