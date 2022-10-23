const { BN, singletons } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const MNFT = artifacts.require('MNFT');
const MNFTERC777Facet = artifacts.require('MNFTERC777Facet');

contract('MNFT', function (accounts) {
  const [owner, registryFunder, defaultOperatorA, defaultOperatorB, anyone] = accounts;

  const initialSupply = new BN('4200000000000000000000000000');
  const name = 'MultiNFT Token';
  const symbol = 'MNFT';

  const defaultOperators = [defaultOperatorA, defaultOperatorB];

  before(async function () {
    await singletons.ERC1820Registry(registryFunder);
  });

  beforeEach(async function () {
    this.diamond = await MNFT.deployed();
    this.token = await MNFTERC777Facet.at(this.diamond.address)
  });

  it('returns the name', async function () {
    expect(await this.token.name()).to.equal(name);
  });

  it('returns the symbol', async function () {
    expect(await this.token.symbol()).to.equal(symbol);
  });

  it('returns the default operators', async function () {
    expect(await this.token.defaultOperators()).to.deep.equal(defaultOperators);
  });

  it('default operators are operators for all accounts', async function () {
    for (const operator of defaultOperators) {
      expect(await this.token.isOperatorFor(operator, anyone)).to.equal(true);
    }
  });

  it('returns the total supply equal to initial supply', async function () {
    expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
  });

  it('returns the balance of owner equal to initial supply', async function () {
    expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(initialSupply);
  });
});
