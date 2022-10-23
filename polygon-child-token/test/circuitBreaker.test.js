const { BN, constants, expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const hre = require('hardhat');


const { expect } = require('chai');

const MNFT = artifacts.require('MNFT');
const MNFTERC777Facet = artifacts.require('MNFTERC777Facet');

contract('MNFT : Circuit Breaker', async function(accounts) {
    const [contractOwner, anyone] = accounts;

    before(async function () {
        this.token = await MNFT.deployed();
        this.ERC777Facet = await MNFTERC777Facet.at(this.token.address);
    });
    
    context('Contract owner updates circuit breaker', function () {
        describe('to value "true" (enable it)', function () {
            before(async function () {
                await this.token.updateCircuitBreaker(new BN("1"), {from: contractOwner});
            });

            it('Contract owner can still make transaction', async function () {
                await this.ERC777Facet.totalSupply({from: contractOwner});
            });

            it("Anyone can't make transaction", async function () {
                await expectRevert(
                    this.ERC777Facet.totalSupply({from: anyone}),
                    'MNFT : Txs suspended'
                );            
            });
        });

        describe('to value "false" (disable it)', function () {
            before(async function () {
                await this.token.updateCircuitBreaker(new BN("0"), {from: contractOwner});
            });

            it('Contract owner can make transaction', async function () {
                await this.ERC777Facet.totalSupply({from: contractOwner});
            });

            it("Anyone can make transaction", async function () {
                await this.ERC777Facet.totalSupply({from: contractOwner});
            });
        });
    });

    context('Anyone updates circuit breaker', function () {
        describe('', function () {
            it('to value "true" (enable it)', async function () {
                await expectRevert(
                    this.token.updateCircuitBreaker(new BN("1"), {from: anyone}),
                    'Must be contract owner'
                );
            });
        });
    });
});
