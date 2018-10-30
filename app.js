//Importing levelSandbox class
const BlockchainClass = require('./simpleChain.js');

// Creating the levelSandbox class object
const myBlockChain = new BlockchainClass.Blockchain();

(function theLoop (i) {
    setTimeout(function () {
        let blockTest = new BlockchainClass.Block("Test Block - " + (i + 1));
        let temp = myBlockChain.addBlock(blockTest).then((result) => {
            console.log(result);
            i++;
            if (i < 10) theLoop(i);
        });
    }, 10000);
})(0);
