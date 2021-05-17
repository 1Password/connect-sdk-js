import { OnePasswordConnect, ItemBuilder } from "@1password/connect";
import * as readline from "readline-sync"
import steps from steps

const steps = {
    "intro": "\nHello from 1Password! In order to demonstrate creating, editing, retrieving and, eventually, deleting an item, the following steps are taken: \n",
    "step1": '1. The SDK has contacted the Connect Server, and a client has been created, based on the provided OP_CONNECT_TOKEN.',
    "step2": '2. An item containing the secret string has been successfully created.',
    "step3": '3. The item containing the secret string has been successfully added in the default vault.',
    "step4": '4. The item containing the secret string has been successfully retrieved from the default vault.\n',
    "confirmation": 'Would you like to delete the newly created item from your vault? (y/n)',
    "confirmation2": "Your answer should be either 'y' or 'n'. Would you like to delete the newly created item from your vault? (y/n)",
    "step5": '\n5. The item containing the secret string has been successfully deleted from the default vault.\n',
    "outro": 'All done!'
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

console.log(steps["intro"])

// CREATE CLIENT
const op = OnePasswordConnect({
	serverURL: process.env.OP_CONNECT_HOST,
	token: process.env.OP_CONNECT_TOKEN,
	keepAlive: true,
});
console.log(steps["step1"])

// CREATE ITEM
const newItem = new ItemBuilder()
	.addField({
		value: process.env.SECRET_STRING,
		type: "STRING",
	}).setCategory("LOGIN")
	.build();
console.log(steps["step2"])

// ADD ITEM TO VAULT
const createdItem = await op.createItem(process.env.OP_VAULT, newItem);
console.log(steps["step3"])

await sleep(10000)

// RETRIEVE ITEM FROM VAULT
const retrievedItem = await op.getItem(process.env.OP_VAULT, createdItem.id);
console.log(steps["step4"])

var answer = readline.question(steps["confirmation"]);

while (answer!='y' && answer!='n') {
    answer = readline.question(steps["confirmation2"]);
}

if (answer == 'y') {
    // DELETE ITEM FROM VAULT
    await op.deleteItem(process.env.OP_VAULT, retrievedItem.id);
    console.log(steps["step5"])
}

console.log(steps["outro"])
