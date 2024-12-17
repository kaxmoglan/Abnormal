const fs = require('fs');
const path = require('path');

const filePaths = [
	'./images/favourites/galleon',
	'./images/vehicles/airplanes/jet-with-missiles',
];

function main() {
	const galleon = fs.readFileSync(filePaths[0]);
	const jetWithMissiles = fs.readFileSync(filePaths[1]);

	const galleonString = galleon.toString();
	const jetWithMissilesString = jetWithMissiles.toString();

	console.log(galleonString === jetWithMissilesString);
}

main();
