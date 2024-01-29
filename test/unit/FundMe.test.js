const hre = require("hardhat")
const { expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(hre.network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe,
              deployer,
              mockV3Aggregator,
              sendValue = hre.ethers.parseEther("1")

          beforeEach(async () => {
              deployer = (await hre.getNamedAccounts()).deployer
              await hre.deployments.fixture(["all"])
              fundMe = await hre.ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await hre.ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("Constructor", async () => {
              it("sets the aggregator address correcty", async () => {
                  const response = await fundMe.getPriceFeed()
                  expect(response).to.equal(await mockV3Aggregator.getAddress())
              })
          })

          describe("Fund", async () => {
              it("Fails fund if not enough ETH sent", async () => {
                  await expect(fundMe.fund()).to.be.rejectedWith(
                      "You need to spend more ETH!"
                  )
              })

              it("Updated the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  expect(response).to.equal(sendValue)
              })

              it("Adds funder to array of getFunders", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunders(0)
                  expect(response).to.equal(deployer)
              })
          })

          describe("Withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it("Withdraw ETH from single funder", async () => {
                  const startingFundMeBalance =
                      await hre.ethers.provider.getBalance(fundMe.getAddress())

                  const startingDeployerBalance =
                      await hre.ethers.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasPrice * gasUsed

                  const endingFundMeBalance =
                      await hre.ethers.provider.getBalance(fundMe.getAddress())

                  const endingDeployerBalance =
                      await hre.ethers.provider.getBalance(deployer)

                  expect(endingFundMeBalance).to.equal(0)
                  expect(
                      startingFundMeBalance + startingDeployerBalance
                  ).to.equal(endingDeployerBalance + gasCost)
              })

              it("Allows withdrawing with multiple funder", async () => {
                  const accounts = await hre.ethers.getSigners()

                  for (let i = 0; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[0]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await hre.ethers.provider.getBalance(fundMe.getAddress())

                  const startingDeployerBalance =
                      await hre.ethers.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasPrice * gasUsed

                  const endingFundMeBalance =
                      await hre.ethers.provider.getBalance(fundMe.getAddress())

                  const endingDeployerBalance =
                      await hre.ethers.provider.getBalance(deployer)

                  expect(endingFundMeBalance).to.equal(0)
                  expect(
                      startingFundMeBalance + startingDeployerBalance
                  ).to.equal(endingDeployerBalance + gasCost)

                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 0; i < 6; i++) {
                      expect(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].getAddress()
                          )
                      ).to.equal(0)
                  }
              })

              it("Only allow owner to withdraw", async () => {
                  const accounts = await hre.ethers.getSigners()
                  const attackerConnectedContract = await fundMe.connect(
                      accounts[2]
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("Cheaper withdrawing with multiple funder ;)", async () => {
                  const accounts = await hre.ethers.getSigners()

                  for (let i = 0; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[0]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await hre.ethers.provider.getBalance(fundMe.getAddress())

                  const startingDeployerBalance =
                      await hre.ethers.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasPrice * gasUsed

                  const endingFundMeBalance =
                      await hre.ethers.provider.getBalance(fundMe.getAddress())

                  const endingDeployerBalance =
                      await hre.ethers.provider.getBalance(deployer)

                  expect(endingFundMeBalance).to.equal(0)
                  expect(
                      startingFundMeBalance + startingDeployerBalance
                  ).to.equal(endingDeployerBalance + gasCost)

                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 0; i < 6; i++) {
                      expect(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].getAddress()
                          )
                      ).to.equal(0)
                  }
              })
          })
      })
