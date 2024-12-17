const fs = require('fs');
const path = require('path');

function detectDuplicates() {
	const duplicationMap = new Map();
	const MISFITS_KEY = 'MISFITS';
	const result = [];

	const filePaths = enumerateFileTree('images');

	for (const filePath of filePaths) {
		const file = fs.readFileSync(filePath);
		const fileHash = calculateHash(file);

		if (!duplicationMap.has(fileHash)) {
			duplicationMap.set(fileHash, [filePath]);
			continue;
		}

		const existingDuplicates = duplicationMap.get(fileHash);

		const isDuplicate =
			fs.readFileSync(existingDuplicates[0], 'utf-8') ===
			fs.readFileSync(filePath, 'utf-8');

		if (isDuplicate) {
			existingDuplicates.push(filePath);
			continue;
		}

		if (!duplicationMap.has(MISFITS_KEY)) {
			duplicationMap.set(MISFITS_KEY, [filePath]);
			continue;
		}

		duplicationMap.get(MISFITS_KEY).push(filePath);
	}

	function processMisfits() {
		const misfits = duplicationMap.get(MISFITS_KEY);
		if (!misfits) return;

		duplicationMap.delete(MISFITS_KEY);
		const localMap = new Map();

		misfits.forEach((filePath) => {
			const file = fs.readFileSync(filePath);
			const fileHash = calculateHash(file);

			if (!localMap.has(fileHash)) {
				localMap.set(fileHash, [filePath]);
				return;
			}

			const existingDuplicates = localMap.get(fileHash);
			const isDuplicate =
				fs.readFileSync(existingDuplicates[0], 'utf-8') ===
				fs.readFileSync(filePath, 'utf-8');

			if (isDuplicate) {
				existingDuplicates.push(filePath);
				return;
			}

			if (!localMap.has(MISFITS_KEY)) {
				localMap.set(MISFITS_KEY, [filePath]);
				return;
			}

			localMap.get(MISFITS_KEY).push(filePath);
		});

		localMap.forEach((group) => {
			if (group.length > 1) {
				result.push(group);
				return;
			}

			if (!duplicationMap.has(MISFITS_KEY)) {
				duplicationMap.set(MISFITS_KEY, group);
			} else {
				duplicationMap.get(MISFITS_KEY).push(...group);
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
			result.push(group);
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
