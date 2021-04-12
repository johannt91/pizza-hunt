// variable to store connected DB object when connection is complete
let db;

// request variable acts as an event listener for the database
const request = indexedDB.open('pizza_hunt, 1'); // paramaters are name of the indexedDB database and the version of the database

request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;

    // creates object store to hold pizza data and auto increment the index for each new set of data
    db.createObjectStore('new_pizza', { autoIncrement: true });
}

request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadPizza() function to send all local db data to api
    if (navigator.onLine) {
        uploadPizza();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

// This function will be executed if we attempt to submit a new pizza without an internet connection
function saveRecord(record) {
// open a new transaction, a temp connection, with the database with read and write permissions
const transaction = db.transaction(['new_pizza'], 'readwrite');

// access the object store for `new_pizza`
const pizzaObjectStore = transaction.objectStore('new_pizza');

// add record to your store with add method
pizzaObjectStore.add(record);
}

function uploadPizza() {
    //open a transaction on your db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    //access the object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    //get all records from store and set a variable
    const getAll = pizzaObjectStore.getAll();

    //upon a successful .getALl() execution
    getAll.onsuccess = function() {
        // if there was data in indexedDB's store, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/pizzas', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['new_pizza'], 'readwrite');
                //access the new_pizza object store
                const pizzaObjectStore = transaction.objectStore('new_pizza');
                //clear all items in the store
                pizzaObjectStore.clear();

                alert('All saved pizza has been submitted!');
            })
            .catch(err => {
                console.log(err);
            })
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadPizza);