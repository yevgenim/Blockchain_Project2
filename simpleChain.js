/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const level = require('level');

const SHA256 = require('crypto-js/sha256');

const BlockClass = require('./simpleBlock');

const chainDB = './chaindata';


/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
		this.db = level(chainDB);
  }

  // Add new blocks
  addBlock(newBlock){
    // Block height
		let self = this;
		return new Promise(function(resolve,reject) {
			self.getBlockHeight().then((height) => {
			let blockIndex = height + 1;
			if (height === -1){
				blockIndex += 1;
				let genBlock = new BlockClass.Block("First block in the chain - Genesis block");
				genBlock.time = new Date().getTime().toString().slice(0,-3);
				genBlock.hash = SHA256(JSON.stringify(genBlock)).toString();
				self.db.put(genBlock.height, JSON.stringify(genBlock).toString(), function(err) {
						if (err) {
								console.log('Genesis block ' + newBlock.height + ' submission failed', err);
								reject(err);
						}
				});
				console.log('Block ' + newBlock.height + ' submission performed');
				console.log(genBlock);
			}
			newBlock.height = blockIndex;
			// UTC timestamp
			newBlock.time = new Date().getTime().toString().slice(0,-3);
			// previous block hash
			self.getBlock(blockIndex-1).then((block) => {
				newBlock.previousBlockHash = block.hash;
				// Block hash with SHA256 using newBlock and converting to a string
				newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
				// Adding block object to chain
				self.db.put(newBlock.height, JSON.stringify(newBlock).toString(), function(err) {
						if (err) {
								console.log('Block ' + newBlock.height + ' submission failed', err);
								reject(err);
						}
				});
				console.log('Block ' + newBlock.height + ' submission performed');
				resolve(newBlock);
			});
    },(reason) => {
			console.log('Could not get height ',reason);
			reject(reason);

			});
		});
	}

	// Get block height
	getBlockHeight(){
		let self = this;
		return new Promise(function(resolve, reject){
			let i = -1;
			self.db.createReadStream()
			.on('data', function (data) {
			      // Count each object inserted
						i++;
			 })
			.on('error', function (err) {
			    // reject with error
					console.log('Unable to measure blockchain height!', err)
					reject(err);
			 })
			 .on('close', function () {
			    //resolve with the count value
					resolve(i);
				});
			});
	}

  // Get block
  getBlock(key){
		let self = this; // because we are returning a promise we will need this to be able to reference 'this' inside the Promise constructor
		return new Promise(function(resolve, reject) {
					 self.db.get(key, (err, value) => {
					 		if (err) return console.log('Not found!', err);

							let jblock = Object.assign(new BlockClass.Block, JSON.parse(value));
							resolve(jblock);
					 });
		});
	}

  // Validate block
  validateBlock(blockHeight){
		let self = this;
		return new Promise(function(resolve, reject){
			// Get block object
		  self.getBlock(blockHeight).then((block) => {
				// get block hash
		    let blockHash = block.hash;
		    // Remove block hash to test block integrity
		    block.hash = '';
		    // generate block hash
		    let validBlockHash = SHA256(JSON.stringify(block)).toString();
		    // Compare
		    if (blockHash===validBlockHash) {
		        resolve(true);
		      } else {
		        console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
		        resolve(false);
		      }
				},(reason) => {
					console.log('Could not read block ',reason);
			});
		});
  }

  // Validate blockchain
	validateChain(){
		let self = this;
		let errorLog = [];
		this.getBlockHeight().then((blockHeight) => {
			let height = blockHeight + 1;
			let promises = [];
	    for (var i = 0; i < height; i++) {
	      let promiseFunction = function(index) {
  				return new Promise (function(resolve,reject){
							let validationPromises = []
							validationPromises[0] = self.validateBlock(index);
							if (index < blockHeight) {
								validationPromises[1] = self.getBlock(index);
								validationPromises[2] = self.getBlock(index+1);
							}
							Promise.all(validationPromises).then(function(values){
								// validate block
								if (!values[0]) errorLog.push(index);
								if (index < blockHeight){
									// compare blocks hash link
									let	blockHash = values[1].hash;
 					 				let previousHash = values[2].previousBlockHash;
									if (blockHash!==previousHash) {
 		         				errorLog.push(index);
	 		    	 			}
								}
								resolve(true);
							});

					});
				};
				promises[i-1] = promiseFunction(i);
				}
				Promise.all(promises).then(function(values) {
					if (errorLog.length>0) {
      		console.log('Block errors = ' + errorLog.length);
      		console.log('Blocks: '+errorLog);
    			} else {
      		console.log('No errors detected');
    		}
				});
		},(reason) => {
			console.log('Could not get height ',reason);
		});
	}

	//For tests - a clean manner to modeify block's hash
	modifyHackHash(blockHeight,newHash){
		this.db.get(blockHeight, (err, value) => {
			 if (err) return console.log('Not found!', err);
			 let jblock = Object.assign(new Block, JSON.parse(value));
			 jblock.hash = newHash;
			 this.db.put(blockHeight, JSON.stringify(jblock).toString(), function(err) {
	 				if (err) {
	 						console.log('Block ' + blockHeight + ' re-submission hack failed', err);
	 						reject(err);
	 				}
	 		});
		});
	}

	//For tests - a clean manner to modeify block's predecessor hash
	modifyHackPrevHash(blockHeight,newHash){
		this.db.get(blockHeight, (err, value) => {
			 if (err) return console.log('Not found!', err);
			 let jblock = Object.assign(new Block, JSON.parse(value));
			 jblock.previousBlockHash = newHash;
			 this.db.put(blockHeight, JSON.stringify(jblock).toString(), function(err) {
	 				if (err) {
	 						console.log('Block ' + blockHeight + ' re-submission hack failed', err);
	 						reject(err);
	 				}
	 		});
		});
	}
}

// Export the class
module.exports.Blockchain = Blockchain;
