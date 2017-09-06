var EmbarkJS = {};
//=========================================================
// Embark Messaging
//=========================================================

EmbarkJS.Messages = {};

EmbarkJS.Messages.setProvider = function(provider, options) {
    var self = this;
    var ipfs;
    if (provider === 'whisper') {
        this.currentMessages = EmbarkJS.Messages.Whisper;
        if (typeof variable === 'undefined' && typeof(web3) === 'undefined') {
            if (options === undefined) {
                web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
            } else {
                web3 = new Web3(new Web3.providers.HttpProvider("http://" + options.server + ':' + options.port));
            }
        }
        web3.version.getWhisper(function(err, res) {
            if (err) {
                console.log("whisper not available");
            } else if (web3.version.whisper >= 5) {
                console.log("this version of whisper is not supported yet; try a version of geth bellow 1.6.1");
            } else {
                self.currentMessages.identity = web3.shh.newIdentity();
            }
        });
    } else if (provider === 'orbit') {
        this.currentMessages = EmbarkJS.Messages.Orbit;
        if (options === undefined) {
            ipfs = HaadIpfsApi('localhost', '5001');
        } else {
            ipfs = HaadIpfsApi(options.host, options.port);
        }
        this.currentMessages.orbit = new Orbit(ipfs);
        if (typeof(web3) === "undefined") {
          this.currentMessages.orbit.connect(Math.random().toString(36).substring(2));
        } else {
          this.currentMessages.orbit.connect(web3.eth.accounts[0]);
        }
    } else {
        throw Error('Unknown message provider');
    }
};

EmbarkJS.Messages.sendMessage = function(options) {
    return this.currentMessages.sendMessage(options);
};

EmbarkJS.Messages.listenTo = function(options) {
    return this.currentMessages.listenTo(options);
};

EmbarkJS.Messages.Whisper = {};

EmbarkJS.Messages.Whisper.sendMessage = function(options) {
    var topics = options.topic || options.topics;
    var data = options.data || options.payload;
    var identity = options.identity || this.identity || web3.shh.newIdentity();
    var ttl = options.ttl || 100;
    var priority = options.priority || 1000;
    var _topics;

    if (topics === undefined) {
        throw new Error("missing option: topic");
    }

    if (data === undefined) {
        throw new Error("missing option: data");
    }

    // do fromAscii to each topics unless it's already a string
    if (typeof topics === 'string') {
        _topics = [web3.fromAscii(topics)];
    } else {
        // TODO: replace with es6 + babel;
        for (var i = 0; i < topics.length; i++) {
            _topics.push(web3.fromAscii(topics[i]));
        }
    }
    topics = _topics;

    var payload = JSON.stringify(data);

    var message = {
        from: identity,
        topics: topics,
        payload: web3.fromAscii(payload),
        ttl: ttl,
        priority: priority
    };

    return web3.shh.post(message, function() {});
};

EmbarkJS.Messages.Whisper.listenTo = function(options) {
    var topics = options.topic || options.topics;
    var _topics = [];

    if (typeof topics === 'string') {
        _topics = [topics];
    } else {
        // TODO: replace with es6 + babel;
        for (var i = 0; i < topics.length; i++) {
            _topics.push(topics[i]);
        }
    }
    topics = _topics;

    var filterOptions = {
        topics: topics
    };

    var messageEvents = function() {
        this.cb = function() {};
    };

    messageEvents.prototype.then = function(cb) {
        this.cb = cb;
    };

    messageEvents.prototype.error = function(err) {
        return err;
    };

    messageEvents.prototype.stop = function() {
        this.filter.stopWatching();
    };

    var promise = new messageEvents();

    var filter = web3.shh.filter(filterOptions, function(err, result) {
        var payload = JSON.parse(web3.toAscii(result.payload));
        var data;
        if (err) {
            promise.error(err);
        } else {
            data = {
                topic: topics,
                data: payload,
                from: result.from,
                time: (new Date(result.sent * 1000))
            };
            promise.cb(payload, data, result);
        }
    });

    promise.filter = filter;

    return promise;
};

module.exports = EmbarkJS;
