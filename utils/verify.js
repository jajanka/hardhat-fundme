const hre = require("hardhat")

async function verify(contractAddress, args) {
    console.log("Verify contract....")

    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Already verified....")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
