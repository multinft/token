const { BN, constants, expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const MNFT = artifacts.require('MNFT');
const MNFTSpecialSaleFacet = artifacts.require('MNFTSpecialSaleFacet');

contract('MNFT : Special Sale', async function(accounts) {
    const [contractOwner, anyone] = accounts;

    before(async function () {
        this.token = await MNFT.deployed();
        this.SpecialSaleFacet = await MNFTSpecialSaleFacet.at(this.token.address);
    });
    
    context('Presale', function () {
        describe('Anyone', function () {
            it('makes a transaction with a too low msg.value, reverts', async function () {
                await expectRevert(
                    this.SpecialSaleFacet.presale({from: anyone, value: 0}),
                    'msg.value too low for presale'
                );            
            });

            it("make a transaction with enough msg.value, emits SpecialSale event", async function () {
                const price = new BN(web3.utils.toWei("10851", 'gwei'));
                expectEvent(
                    await this.SpecialSaleFacet.presale({ from: anyone, value: price.muln(3) }),
                    'SpecialSale',
                    { from: anyone, quantity: "3", saleId: "1" }
                );
            });
        });

    });
});
