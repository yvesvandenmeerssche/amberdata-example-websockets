// IIFE - Immediately Invoked Function Expression
(function (code) {

    // The global jQuery object is passed as a parameter
    code(window.jQuery, window, document);

}(function ($, window, document) {

    // The $ is now locally scoped

    // Listen for the jQuery ready event on the document
    $(async function () {

        initWebSockets()
        let counter = 10;
        const myFunction = function() {
            counter = getRandomInt(5,50);
            let entry = eventQueue.pop()
            if (entry) {
                launchFrom({x: getRandomInt(window.innerWidth  / 3, window.innerWidth  / 2), colorText: entry.color, explosionSize: 20})
            }
            setTimeout(myFunction, counter);
        }
        setTimeout(myFunction, counter);
    });



    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
    /*                     API data Retrieval                      */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

    /* Demo key - Get your API Key at amberdata.io/pricing
    * and place yours here! */
    let initWebSockets = () => {
        // Create WebSocket connection.
        const socket = new WebSocket('wss://ws.web3api.io?x-api-key=UAK000000000000000000000000demo0001');

        // Connection opened
        socket.addEventListener('open', function (event) {
            console.log('Connection opened - ', event);
            socket.send(`{"jsonrpc":"2.0","id":${BLOCK},"method":"subscribe","params":["block"]}`);
            socket.send(`{"jsonrpc":"2.0","id":${UNCLE},"method":"subscribe","params":["uncle"]}`);
            socket.send(`{"jsonrpc":"2.0","id":${TXN},"method":"subscribe","params":["transaction"]}`);
            socket.send(`{"jsonrpc":"2.0","id":${INTERNAL_MSG},"method":"subscribe","params":["function"]}`);
        });

        // Listen for messages
        socket.addEventListener('message', responseHandler);

        // Listen for messages
        socket.addEventListener('close', function (event) {
            console.log('Connection closed - ', event);
        });
    }

    const BLOCK = 0, UNCLE = 1, TXN = 2, INTERNAL_MSG = 3
    const TYPE_COLOR = ['green', 'orange', 'firebrick', 'blue']
    const TYPE_LABELS = ['Block', 'Uncle', 'Transaction', 'Internal Message']
    const getEntryBg = () => $('#stream #list').children().length % 2 ? '#F9F9F9' : 'white'
    const renderEntry = (entry) => `
            <div style="background: ${getEntryBg()}" class="entry">
                <div style="background: ${entry.color}" class="color"></div>
                <div class="detail">
                    <div class="type">
                        ${entry.detail.type}
                    </div>
                    <div class="value">
                        ${entry.detail.value}
                    </div>
                </div>
                <a href="${entry.link}" target="_blank" class="view">View ></a>
            </div>`

    const addStreamEntry = (entry) => {
        const entryString = renderEntry(entry)
        const entryHTML = $.parseHTML(entryString)
        $('#stream #list').prepend(entryHTML)
    }

    const eventQueue = []

    const subscriptions = {}
    const blocks = {}

     let count = 0
    /**
     * Manages Websocket subscriptions.
     */
    const responseHandler = async (wsEvent) => {

        const response = JSON.parse(wsEvent.data)
        
        switch (response.id) {
            case BLOCK: subscriptions[response.result] = {dataHandler: new DataHandler(BLOCK)}; break;
            case UNCLE: subscriptions[response.result] = {dataHandler: new DataHandler(UNCLE)}; break;
            case TXN: subscriptions[response.result] = {dataHandler: new DataHandler(TXN)}; break;
            case INTERNAL_MSG: subscriptions[response.result] = {dataHandler: new DataHandler(INTERNAL_MSG)}; break;
        }
        if (response.params) {
            setLoading(false)
            const subscription = subscriptions[response.params.subscription]
            const data = response.params.result

            let dataObject = subscription.dataHandler.createDataObject(data)

            if([BLOCK, UNCLE].indexOf(subscription.dataHandler.type) < 0) {

                addStreamEntry(dataObject)

                if(count % 20 === 0) {
                    eventQueue.push(dataObject)
                    // launchFrom({x: getRandomInt(0, window.innerWidth), colorText: dataObject.color})
                }
            } else {
                // eventQueue.push(dataObject)
                // launchFrom({x: getRandomInt(60, window.innerWidth - 60), colorText: dataObject.color})
                // await setTimeout(function(){}, 3000);
                launchFrom({x: getRandomInt(window.innerWidth  / 3, window.innerWidth  / 2), colorText: dataObject.color, explosionSize: 90})
                addStreamEntry(dataObject)
            }

            // console.log(dataObject)

            count++
        }
    }

    class DataHandler {
        constructor(type) {
            this.type = type
        }

        createDataObject(data) {
            return {
                type: this.type,
                color: TYPE_COLOR[this.type],
                detail: {
                    type: TYPE_LABELS[this.type],
                    value: this.getValue(data)
                },
                link: this.getLink(data)
            }
        }
        getValue(data) {
            switch (this.type) {
                case BLOCK:
                case UNCLE: return parseInt(data.number).toLocaleString('en')
                case TXN: return data.hash
                case INTERNAL_MSG: return data.transactionHash
                // case..., etc.
            }
        }

        getLink(data) {
            switch (this.type) {
                case BLOCK: return 'https://amberdata.io/blocks/' + data.number
                case UNCLE: return 'https://amberdata.io/uncles/' + data.number
                case INTERNAL_MSG: return'https://amberdata.io/transactions/' + data.transactionHash
                case TXN: return'https://amberdata.io/transactions/' + data.hash
            }
        }

        getBlockNumber(data) {
            switch (this.type) {
                case BLOCK:
                case UNCLE: return data.number
                case INTERNAL_MSG:
                case TXN: return data.blockNumber
            }

        }
    }

    const getRandomInt = (min, max, _min = Math.ceil(min), _max = Math.floor(max) ) => Math.floor(Math.random() * (_max - _min)) + _min;

    const setLoading = (bool) => {
        const loader = $('.spinner')
        loader.css('opacity', bool ? '1' : '0')
        loader.css('visibility', bool ? 'visible' : 'hidden')
        loader.css('display', bool ? 'block' : 'none')
    }
}));