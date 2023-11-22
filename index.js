const baseUrl = 'http://localhost:3000'
const reqHeaderOptions = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

let loggedInUser = null;
let currentRoomId = null;

// GET users - immediately invoke this function on page load
(async () => {
    console.log('GET users');
    try {
        const response = await fetch(`${baseUrl}/users`, {
            method: 'GET',
            headers: reqHeaderOptions,
        });

        const users = await response.json();
        createUserSelectDropdown(users);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
})();

// create user select dropdown
const createUserSelectDropdown = (users) => {
    console.log('Create user select dropdown for all users');
    const userSelectElement = document.getElementById('userList');
    const selectElement = document.createElement('select');
    userSelectElement.appendChild(selectElement);

    // set initial option in select dropdown
    const firstOptionElement = document.createElement('option');
    firstOptionElement.textContent = 'Select a User';
    firstOptionElement.value = '';
    selectElement.appendChild(firstOptionElement);

    // add user options to the dropdown
    users.forEach(user => {
        const optionElement = document.createElement('option');
        optionElement.textContent = user.fullName;
        optionElement.value = user.id;

        selectElement.appendChild(optionElement);
    });

    // listen for user selections
    selectElement.addEventListener('change', (event) => {
        // if a user is already logged in, log them out first
        if (loggedInUser) {
            logOutUser();
        }

        // if user selects the first default option, just return
        if (event.target.value === '') {
            return;
        }

        const selectedUserId = event.target.value;
        const selectedUser = users.find(user => user.id === selectedUserId);
        setLoggedInUser(selectedUser);
    });
};

// set 'logged in' user and add log out button
const setLoggedInUser = (user) => {
    console.log(`Logging ${user.fullName} IN`);
    loggedInUser = user;

    // show current logged in user
    const loggedInUserElement = document.getElementById('loggedInUser');
    const spanElement = document.createElement('span');
    spanElement.textContent = user.fullName;
    loggedInUserElement.appendChild(spanElement);

    // add log out button
    const logOutUserElement = document.getElementById('logOutUser');
    const buttonElement = document.createElement('button');
    buttonElement.textContent = 'Log Out';
    buttonElement.addEventListener('click', () => {
        logOutUser(loggedInUser);
    });

    logOutUserElement.appendChild(buttonElement);

    // get user specific rooms
    getUserRooms(user.id);
}

// log user out and remove previous user specific elements
const logOutUser = () => {
    console.log(`Logging ${loggedInUser.fullName} OUT`);
    loggedInUser = null;

    // remove users name
    const loggedInUserElement = document.getElementById('loggedInUser');
    loggedInUserElement.innerHTML = '';

    // remove log out button
    const logOutUserElement = document.getElementById('logOutUser');
    logOutUserElement.innerHTML = '';

    // remove user specific rooms list
    const userRoomsElement = document.getElementById('userRoomsList');
    userRoomsElement.innerHTML = '';

    // remove room specific messages
    const roomMessagesElement = document.getElementById('roomMessages');
    roomMessagesElement.innerHTML = '';

    // hide new message form
    const newMessageForm = document.getElementById("newMessage");
    newMessageForm.style.display = "none"; 
}

// GET user specific rooms
const getUserRooms = async (userId) => {
    console.log(`GET user specific rooms for ${userId}`);
    try {
        const response = await fetch(`${baseUrl}/users/${userId}/rooms`, {
            method: 'GET',
            headers: reqHeaderOptions,
        });

        const userRooms = await response.json();
        createUserRoomsList(userRooms);
    } catch (error) {
        console.error('Error fetching user rooms:', error);
    }
};

// create user specific rooms list
const createUserRoomsList = (userRooms) => {
    console.log('Create user specific rooms list');
    const userRoomsElement = document.getElementById('userRoomsList');
    const ulElement = document.createElement('ul');

    userRooms.forEach(room => {
        const liElement = document.createElement('li');
        liElement.textContent = room.id;

        liElement.addEventListener('click', () => {
            // remove room specific messages 
            const roomMessagesElement = document.getElementById('roomMessages');
            roomMessagesElement.innerHTML = '';

            getRoomMessages(room.id);
        });

        ulElement.appendChild(liElement);
    });

    userRoomsElement.appendChild(ulElement);
}

// GET room specific messages
const getRoomMessages = async (roomId) => {
    console.log(`GET messages for ${roomId} room`);
    try {
        const response = await fetch(`${baseUrl}/rooms/${roomId}/messages`, {
            method: 'GET',
            headers: reqHeaderOptions,
        });

        const roomMessages = await response.json();

        // set currentRoomId
        currentRoomId = roomId;
        createRoomMessagesList(roomMessages);
    } catch (error) {
        console.error('Error fetching room messages:', error);
    }
};

// create room messages list
const createRoomMessagesList = (roomMessages) => {
    console.log('Create room specific messages');
    const roomMessagesElement = document.getElementById('roomMessages');

    // build and appened each message
    roomMessages.forEach(message => {
        const messageElement = buildMessage(message);

        roomMessagesElement.appendChild(messageElement);
    });

    // reveal send message form
    const newMessageForm = document.getElementById("newMessage");
    newMessageForm.style.display = "block";
}

// append a new message to the existing message list
const appendNewMessage = (newMessage) => {
    console.log('Append new message');
    const roomMessagesElement = document.getElementById('roomMessages');
    const newMessageElement = buildMessage(newMessage);

    roomMessagesElement.appendChild(newMessageElement);
}

// build a message element
const buildMessage = (message) => {
    console.log('Build message element');
    const messageWrapperElement = document.createElement('div');

    const timeSpanElement = document.createElement('span');
    // const newDate = new Date(sentAt).toLocaleString();
    timeSpanElement.textContent = new Date(message.sentAt).toLocaleString();

    const senderSpanElement = document.createElement('span');
    senderSpanElement.textContent = message.sender;

    const textSpanElement = document.createElement('span');
    textSpanElement.textContent = message.text;

    messageWrapperElement.appendChild(timeSpanElement);
    messageWrapperElement.appendChild(senderSpanElement);
    messageWrapperElement.appendChild(textSpanElement);

    return messageWrapperElement;
}

// POST create message
const createMessage = async (roomId, userId, messageText) => {
    console.log(`CREATE messages for ${userId} in ${roomId} room. Message text: ${messageText}`);
    try {
        const response = await fetch(`${baseUrl}/rooms/${roomId}/messages`, {
            method: 'POST',
            headers: reqHeaderOptions,
            body: JSON.stringify({
                sender: userId,
                text: messageText,
            }),
        });

        const newMessage = await response.json();
        appendNewMessage(newMessage);
    } catch (error) {
        console.error('Error fetching room messages:', error);
    }
};

const sendMessage = (form) => {
    const newMessage = form.inputbox.value;
    if (newMessage.length) {
        createMessage(currentRoomId, loggedInUser.id, newMessage)
    }
}
