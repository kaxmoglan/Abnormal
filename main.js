const fs = require('fs');
const path = require('path');

const MISFITS_KEY = 'HASH_CLASHES';

function detectDuplicates() {
	const duplicationMap = new Map();
	const result = [];

	enumerateFileTree('images').forEach((filePath) => {
		const file = fs.readFileSync(filePath);
		const fileString = file.toString();
		const fileHash = calculateHash(file);

		const newMapItemData = {
			fileString,
			filePath,
		};

		if (!duplicationMap.has(fileHash)) {
			duplicationMap.set(fileHash, [newMapItemData]);
			return;
		}

		const existingEntry = duplicationMap.get(fileHash);

		if (existingEntry[0].fileString === fileString) {
			duplicationMap.set(fileHash, [...existingEntry, newMapItemData]);
			return;
		}

		const hasMisfits = duplicationMap.has(MISFITS_KEY);

		if (hasMisfits) {
			const misfits = duplicationMap.get(MISFITS_KEY);
			duplicationMap.set(MISFITS_KEY, [
				...misfits,
				{ ...newMapItemData, hash: fileHash },
			]);
		} else {
			duplicationMap.set(MISFITS_KEY, [{ ...newMapItemData, hash: fileHash }]);
		}
	});

	function processMisfits() {
		const misfits = duplicationMap.get(MISFITS_KEY);
		duplicationMap.delete(MISFITS_KEY);
		const localMap = new Map();

		misfits.forEach((misfit) => {
			if (!localMap.has(misfit.hash)) {
				localMap.set(misfit.hash, [misfit]);
				return;
			}

			const existingEntry = localMap.get(misfit.hash);

			if (existingEntry[0].fileString === misfit.fileString) {
				localMap.set(misfit.hash, [...existingEntry, misfit]);
			} else {
				if (!duplicationMap.has(MISFITS_KEY)) {
					duplicationMap.set(MISFITS_KEY, [misfit]);
				} else {
					const existingMisfits = duplicationMap.get(MISFITS_KEY);
					duplicationMap.set(MISFITS_KEY, [...existingMisfits, misfit]);
				}
			}
		});

		localMap.forEach((group) => {
			if (group.length > 1) {
				result.push(group.flatMap((image) => image.filePath));
			}
		});

		if (duplicationMap.has(MISFITS_KEY)) {
			processMisfits();
		}
	}

	duplicationMap.forEach((group, key) => {
		if (key === MISFITS_KEY) {
			processMisfits();
		} else if (group.length > 1) {
			result.push(group.flatMap((image) => image.filePath));
		}
	});

	return result;
}

function calculateHash(file) {
	/*
    Calculate the hash of the file referenced by file byte length.

    Example:
    ```
    const file = fs.readFileSync(filepath);
    const img_hash = calculateHash(file)
    ```

    :param file: The file-like object to generate the hash for.
    :returns: A hexadecimal-encoded hash of the file referenced by file byte length.
    */
	return file.reduce((acc, data) => acc + data, 0) % 100;
}

///////////////////////////////////////////////////////////////////////////////
//
//   HERE BE DRAGONS!!!
//
//   You should not need to look at the code below. It serves as a scaffolding
//   to set up and call your code when `Run` is pushed and verify the results.
//
///////////////////////////////////////////////////////////////////////////////
//
//                                    ^    /^
//                                   / \  // \
//                     |\___/|      /   \//  .\
//                     /V  V  \__  /    //  | \ \           *----*
//                    /     /  \/_/    //   |  \  \          \   |
//                    @___@`    \/_   //    |   \   \         \/\ \
//                   0/0/|       \/_ //     |    \    \         \  \
//               0/0/0/0/|        \///      |     \     \       |  |
//            0/0/0/0/0/_|_ /   (  //       |      \     _\     |  /
//         0/0/0/0/0/0/`/,_ _ _/  ) ; -.    |    _ _\.-~       /   /
//                     ,-}        _      *-.|.-~-.           .~    ~
//   *     \__/         `/\      /                 ~-. _ .-~      /
//    \____(Oo)            *.   }            {                   /
//    (    (..)           .----~-.\        \-`                 .~
//    //___\\  \ Mooooo!  ///.----..<        \             _ -~
//   //     \\                ///-._ _ _ _ _ _ _{^ - - - - ~
//
///////////////////////////////////////////////////////////////////////////////

function enumerateFileTree(directory) {
	const children = fs.readdirSync(directory);
	const files = [];
	for (const child of children) {
		const childPath = path.join(directory, child);
		const stat = fs.statSync(childPath);
		if (stat.isDirectory()) {
			files.push(...enumerateFileTree(childPath));
		} else {
			files.push(childPath);
		}
	}
	return files;
}

function main() {
	const f = fs.readFileSync('_results');

	const expectedResults = f
		.toString()
		.split('\n')
		.map((line) => {
			const results = new Set();
			line
				.trim()
				.split(':')
				.forEach((r) => {
					if (r) {
						results.add('images/' + r);
					}
				});
			return Array.from(results);
		});

	console.log({ expectedResults });

	const actualResults = detectDuplicates();

	console.log({ actualResults });

	if (
		JSON.stringify(normalizeResults(actualResults)) ==
		JSON.stringify(normalizeResults(expectedResults))
	) {
		console.log('OK');
	} else {
		console.log('RESULTS DO NOT MATCH');
	}
}

function normalizeResults(duplicateGroups) {
	let result = [];
	duplicateGroups.forEach((group) => {
		permutations(group.map(normalizeFile), 2).forEach(([f1, f2]) => {
			result.push([f1, f2].sort());
		});
	});
	return result.sort();
}

function normalizeFile(filepath) {
	return stripPrefix(stripPrefix(filepath, './'), 'images/');
}

function stripPrefix(filepath, prefix) {
	return filepath.startsWith(prefix) ? filepath.slice(prefix.length) : filepath;
}

function permutations(array, size) {
	function p(t, i) {
		if (t.length === size) {
			result.push(t);
			return;
		}
		if (i + 1 > array.length) {
			return;
		}
		p(t.concat(array[i]), i + 1);
		p(t, i + 1);
	}
	let result = [];
	p([], 0);
	return result;
}

main();
