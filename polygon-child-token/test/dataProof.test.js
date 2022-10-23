const { BN, constants, expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const MNFT = artifacts.require('MNFT');
const MNFTDataProofFacet = artifacts.require('MNFTDataProofFacet');

contract('MNFT : DataProof', async function(accounts) {
    const [contractOwner, newStakingAccount, anyone] = accounts;
    const newDataHash = web3.utils.sha3('Test', {encoding: 'hex'});

    before(async function () {
        this.diamond = await MNFT.deployed();
        this.token = await MNFTDataProofFacet.at(this.diamond.address);
    });
    
    context('Contract owner', function () {
        it('adds a new data proof', async function () {
            let history = await this.token.getHistory();
            expectEvent(
                await this.token.addNewHistory(newDataHash, { from: contractOwner }),
                'NewDataProof',
                { dataProof: newDataHash },
            );
            expect(await this.token.getHistory()).to.eql(history.concat([newDataHash]));
        });
    });   

    context('Anyone', function () {
        it('expects reverts when adding new data proof', async function () {
            await expectRevert(
                this.token.addNewHistory(newDataHash, {from: anyone}),
                'Must be contract owner'
            );
        });
    });
});
