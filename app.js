//Importing levelSandbox class
const BlockchainClass = require('./simpleChain.js');

const BlockClass = require('./simpleBlock');

// Creating the levelSandbox class object
const myBlockChain = new BlockchainClass.Blockchain();

(function theLoop (i) {
    setTimeout(function () {
        myBlockChain.validateChain();
        let blockTest = new BlockClass.Block("Test Block - " + (i + 1));
        let temp = myBlockChain.addBlock(blockTest).then((result) => {
            console.log(result);
            i++;
            myBlockChain.validateChain();
            if (i < 10) theLoop(i);
        });
    }, 10000);
})(0);
