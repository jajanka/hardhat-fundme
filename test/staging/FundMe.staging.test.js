const { expect } = require("chai")
const { network, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging Tests", () => {
          let deployer
          let fundMe
          const sendValue = ethers.parseEther("0.1")

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async () => {
              const fundTxResponse = await fundMe.fund({ value: sendValue })
              const withdrawTxResponse = await fundMe.withdraw()

              const endingFundMeBalance = await ethers.provider.getBalance(
                  fundMe.getAddress()
              )
              console.log(
                  endingFundMeBalance.toString() +
                      " should equal 0, running assert equal..."
              )
              expect(endingFundMeBalance).to.equal(0)
          })
      })
