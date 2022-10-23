const { BN, constants, expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const MNFT = artifacts.require('MNFT');
const MNFTStakingFacet = artifacts.require('MNFTStakingFacet');
const MNFTERC777Facet = artifacts.require('MNFTERC777Facet');

contract('MNFT : Staking', async function(accounts) {
    const [contractOwner, newStakingAccount, anyone] = accounts;

    before(async function () {
        this.diamond = await MNFT.deployed();
        this.token = await MNFTStakingFacet.at(this.diamond.address);
        this.ERC777 = await MNFTERC777Facet.at(this.diamond.address);
        await this.ERC777.send(anyone, new BN("100000000000"), '0x', {from: contractOwner})
    });
    
    context('Anyone', function () {
        it('stakes tokens', async function () {
            const amountToStake = new BN('100000');
            const stakingAccountBalance = await this.ERC777.balanceOf(contractOwner);
            const anyoneBalance = await this.ERC777.balanceOf(anyone);
            expectEvent(
                await this.token.stake(amountToStake, { from: anyone }),
                'Stake',
                { from: anyone, amount: amountToStake }
            );
            expect(await this.ERC777.balanceOf(anyone)).to.be.bignumber.equal(anyoneBalance.sub(amountToStake));
            expect(await this.ERC777.balanceOf(contractOwner)).to.be.bignumber.equal(stakingAccountBalance.add(amountToStake));
        });
        it('claims staked tokens', async function () {
            const amountToClaim = new BN('20000');
            expectEvent(
                await this.token.claim(amountToClaim, { from: anyone }),
                'Claim',
                { from: anyone, amount: amountToClaim },
            );
        });
        it('claims all staked tokens', async function () {
            expectEvent(
                await this.token.claimAll({ from: anyone }),
                'ClaimAll',
                { from: anyone },
            );
        });

        it('expects reverts on token release', async function () {
            const amountToRelease = new BN('20000');
            await expectRevert(
                this.token.releaseClaimedTokens(anyone, amountToRelease, {from: anyone}),
                'Must be contract owner'
            );
        });

        it('expects reverts on staking account update', async function () {
            await expectRevert(
                this.token.updateStakingAccount(anyone, {from: anyone}),
                'Must be contract owner'
            );
        });
    });   

    context('Contract owner', function () {
        it('releases tokens', async function () {
            const amountToRelease = new BN('20000');
            const stakingAccountBalance = await this.ERC777.balanceOf(contractOwner);
            const anyoneBalance = await this.ERC777.balanceOf(anyone);
            expectEvent(
                await this.token.releaseClaimedTokens(anyone, amountToRelease, { from: contractOwner }),
                'Release',
                { to: anyone, amount: amountToRelease },
            );
            expect(await this.ERC777.balanceOf(anyone)).to.be.bignumber.equal(anyoneBalance.add(amountToRelease));
            expect(await this.ERC777.balanceOf(contractOwner)).to.be.bignumber.equal(stakingAccountBalance.sub(amountToRelease));
        });

        it('updates staking account', async function () {
            const stakedAmount = (new BN('100000')).sub(new BN("20000"));
            const stakingAccountBalance = await this.ERC777.balanceOf(contractOwner);
            const newStakingAccountBalance = await this.ERC777.balanceOf(newStakingAccount);
            
            await this.token.updateStakingAccount(newStakingAccount, { from: contractOwner });

            expect(await this.ERC777.balanceOf(newStakingAccount)).to.be.bignumber.equal(newStakingAccountBalance.add(stakedAmount));
            expect(await this.ERC777.balanceOf(contractOwner)).to.be.bignumber.equal(stakingAccountBalance.sub(stakedAmount));
        });
    });
});
