// const { BN, constants, expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');
// const { ZERO_ADDRESS } = constants;

const { makeInterfaceId } = require("@openzeppelin/test-helpers");

// const { expect } = require('chai');

// const MNFT = artifacts.require('MNFT');
// const MNFTERC777Facet = artifacts.require('MNFTERC777Facet');

// contract('MNFT : Cashback', async function(accounts) {
//     const [contractOwner, partner, spender, anyone] = accounts;

//     before(async function () {
//         this.diamond = await MNFT.deployed();
//         this.token = await MNFTERC777Facet.at(this.diamond.address);
//         await this.token.send(spender, 10000, '0x', {from: contractOwner})
//     });
    
//     context('Contract owner', function () {
//         describe('adds partner with specific rate', function () {
//             let cashbackRate = new BN("250");
//             let defaultRate = new BN("10000");
//             let price = new BN("1000");
//             let logs = null;
//             let balanceOfSpender = null;

//             before(async function() {
//                 logs = (await this.token.addPartner(partner, cashbackRate, {from: contractOwner})).logs;
//                 balanceOfSpender = await this.token.balanceOf(spender);
//             });

//             it('PartnerAdded event emitted', async function () {
//                 expectEvent.inLogs(logs, 'PartnerAdded', { partner: partner, cashbackRate: cashbackRate });
//             });

//             it('check spender balance after transfer', async function () {
//                 let discountedRate = defaultRate.sub(cashbackRate);
//                 let discountedPrice = price.mul(new BN("1000")).mul(discountedRate).div(new BN("10000")).div(new BN("1000"));

//                 await this.token.send(partner, price, '0x', {from: spender});
//                 expect(await this.token.balanceOf(spender)).to.be.bignumber.equal(balanceOfSpender.sub(discountedPrice));
//             });
//         });
//         describe('updates partner with new rate', function () {
//             let cashbackRate = new BN("500");
//             let defaultRate = new BN("10000");
//             let price = new BN("1000");
//             let logs = null;

//             before(async function() {
//                 logs = (await this.token.updatePartner(partner, cashbackRate, {from: contractOwner})).logs;
//             });

//             it('PartnerUpdated event emitted', async function () {
//                 expectEvent.inLogs(logs, 'PartnerUpdated', { partner: partner, cashbackRate: cashbackRate });
//             });

//             it('check spender balance after transfer', async function () {
//                 const balanceOfSpender = await this.token.balanceOf(spender);
//                 let discountedRate = defaultRate.sub(cashbackRate);
//                 let discountedPrice = price.mul(new BN("1000")).mul(discountedRate).div(new BN("10000")).div(new BN("1000"));

//                 await this.token.send(partner, price, '0x', {from: spender});
//                 expect(await this.token.balanceOf(spender)).to.be.bignumber.equal(balanceOfSpender.sub(discountedPrice));
//             });
//         });
//         describe('removes partner', function () {
//             let price = new BN("1000");
//             let logs = null;

//             before(async function() {
//                 logs = (await this.token.removePartner(partner, {from: contractOwner})).logs;
//             });

//             it('PartnerRemoved event emitted', async function () {
//                 expectEvent.inLogs(logs, 'PartnerRemoved', { partner: partner });
//             });

//             it('check spender balance after transfer', async function () {
//                 const balanceOfSpender = await this.token.balanceOf(spender);

//                 await this.token.send(partner, price, "0x", {from: spender});
//                 expect(await this.token.balanceOf(spender)).to.be.bignumber.equal(balanceOfSpender.sub(price));
//             });
//         });
//     });
     
//     context('Anyone', function () {
//         describe('adds partner with specific rate', function () {
//             let cashbackRate = new BN("250");

//             it('expect reverts', async function () {
//                 await expectRevert(
//                     this.token.addPartner(partner, cashbackRate, {from: anyone}),
//                     'Must be contract owner'
//                 );
//             });
//         });
//         describe('updates partner with new rate', function () {
//             let cashbackRate = new BN("500");
            
//             it('expect reverts', async function () {
//                 await expectRevert(
//                     this.token.updatePartner(partner, cashbackRate, {from: anyone}),
//                     'Must be contract owner'
//                 );
//             });
//         });
//         describe('removes partner', function () {
//             it('expect reverts', async function () {
//                 await expectRevert(
//                     this.token.removePartner(partner, {from: anyone}),
//                     'Must be contract owner'
//                 );
//             });
//         });
//     });   
// });
