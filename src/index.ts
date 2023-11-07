import { query, update, Canister, text, Record, StableBTreeMap, Ok, None, Some, Err, Vec, Result, nat64, ic, Opt, Variant } from 'azle';

import { v4 as uuidv4 } from 'uuid';


const MessagePayload = Record({
    title: text,
    body: text,
    attachmentURL: text
});



const Message = Record({
    id: text,
    title: text,
    body: text,
    attachmentURL: text,
    createdAt: nat64,
    updatedAt: Opt(nat64)
});


const Error = Variant({
    NotFound: text,
    InvalidPayload: text,
});


const messagesStorage = StableBTreeMap(text, Message, 0);

export default Canister({

    //Below we add the Message to mesageStorage
    addMessage: update([MessagePayload], Result(Message, Error), (payload) => {
        //generate uuid, create and update time and our payload
        const message = { id: uuidv4(), createdAt: ic.time(), updatedAt: None, ...payload };
        //Insert the message
        messagesStorage.insert(message.id, message);
        //return an OK with the message you saved
        return Ok(message);
    }),

    //Below we get all messages from the storage
    getMessages: query([], Result(Vec(Message), Error), () => {
        return Ok(messagesStorage.values());
    }),

    //we get specific message from the message storage, we provide the uuid
    getMessage: query([text], Result(Message, Error), (id) => {
        const messageOpt = messagesStorage.get(id);
        if ("None" in messageOpt) {
            return Err({ NotFound: `the message with id=${id} not found` });
        }
        return Ok(messageOpt.Some);
    }),

    //Update a message already in the messageStorage, we provide a uuid
    updateMessage: update([text, MessagePayload], Result(Message, Error), (id, payload) => {
        const messageOpt = messagesStorage.get(id);
        if ("None" in messageOpt) {
            return Err({ NotFound: `couldn't update a message with id=${id}. message not found` });
        }
        const message = messageOpt.Some;
        const updatedMessage = { ...message, ...payload, updatedAt: Some(ic.time()) };
        messagesStorage.insert(message.id, updatedMessage);
        return Ok(updatedMessage);
    }),

    //delete a message from the messageStorage, we provide a uuid to remove
    deleteMessage: update([text], Result(Message, Error), (id) => {
        const deletedMessage = messagesStorage.remove(id);
        if ("None" in deletedMessage) {
            return Err({ NotFound: `couldn't delete a message with id=${id}. message not found` });
        }
        return Ok(deletedMessage.Some);
    })
});


globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};

