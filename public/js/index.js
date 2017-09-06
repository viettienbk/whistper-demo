/*globals $, SimpleStorage, document*/

var addToLog = function(id, txt) {
  $(id + " .logs").append("<br>" + txt);
};

// ===========================
// Communication (Whisper) example
// ===========================
$(document).ready(function() {

  web3 = new Web3(new Web3.providers.HttpProvider("http://192.168.0.216:8545"));

  console.log(web3);
  
  var balance = web3.eth.getBalance('0x9Aceb5235f53C8f4431CfB5d7F655C3002f361e2').toNumber();
  console.log(balance);

  var identity = web3.shh.newIdentity();
  console.log(identity);

  web3.version.getWhisper(function(err, res) {
    console.log(err);
    console.log(web3.version.whisper);
    if (err) {
        console.log("whisper not available");
    } else if (web3.version.whisper >= 5) {
        console.log("this version of whisper is not supported yet; try a version of geth bellow 1.6.1");
    } else {
        var identity = web3.shh.newIdentity();
        console.log(identity);
    }
  });

  $("#communication button.listenToChannel").click(function() {
      var channel = $("#communication .listen input.channel").val();
      $("#communication #subscribeList").append("<br> subscribed to " + channel + " now try sending a message");
      EmbarkJS.Messages.listenTo({topic: [channel]}).then(function(message, data) {
        $("#communication #messagesList").append("<br> channel: " + channel + " message: " + message);
        console.log(data);
      });
      addToLog("#communication", "EmbarkJS.Messages.listenTo({topic: ['" + channel + "']}).then(function(message) {})");
  });

  $("#communication button.sendMessage").click(function() {
    var channel = $("#communication .send input.channel").val();
    var message = $("#communication .send input.message").val();
    EmbarkJS.Messages.sendMessage({topic: channel, data: message});
    addToLog("#communication", "EmbarkJS.Messages.sendMessage({topic: '" + channel + "', data: '" + message + "'})");
  });

  function listenTo(){

  }

  function sendMessage(ttl, powTarget, powTime, payload, pubKey){
    return shh.post({ttl: ttl, powTarget: powTarget, powTime: powTime, payload: payload, pubKey: pubKey});
  }

  //  generate keypair
  //  return id
  function generateKeyPair(){
    return shh.newKeyPair();
  }

  //  retrieve public key
  function getPublicKey(keypairId){
    return shh.getPublicKey(keypairId);
  }

  // Subcribe to messages, encrypted with certain public key.
  function filerMessage(publicKey){
    shh.NewMessageFilter({pubKey: publicKey});
  }

  // Poll for the messages
  function getMessage(filter){
    return shh.getFilterMessages(filter);
  }

});
