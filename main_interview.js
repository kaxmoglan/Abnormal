const fs = require('fs');
const path = require('path');

function detectDuplicates() {
	const map = new Map();

	// go through each file
	// hash the file
	// check if map[hash] exists
	// if exists
	// compare binary
	// if binary matches, add file name to map[hash]

	// if binary doesn't match, come back to this later

	// else
	// create map[hash] and add file name to map[hash]
	// add hash to map as the key
	// add binary to map[key]

	enumerateFileTree('images').forEach((image) => {
		const file = fs.readFileSync(image);
		const imgHash = calculateHash(file);

		const data = fs.readFileSync(image, { encoding: 'utf8' });
		const mappedFile = map[imgHash]; // array

		if (!!mappedFile) {
			const isMatch = data === mappedFile[0]?.binary;

			if (isMatch) {
				const mapObjectToStore = { binary: data, fileName: image };
				map[imgHash].push(mapObjectToStore);
			}
		} else {
			map.set(imgHash, [{ binary: data, fileName: image }]);
		}
	});

	const response = [];

	for (const [_, value] of map.entries()) {
		const fileNames = value.flatMap((data) => data.fileName);
		const duplicates = fileNames;
		response.push(duplicates);
	}

	console.log(response);
	return response;

	/*
    Determine which files located beneath the provided directory are duplicates
    of each other.
    
    Example:
    
    ```
      enumerateFileTree('images').forEach(file => {
        console.log(file);
      });
    ```
    
    :returns: An Array of duplicate groups. A duplicate group is a file with two or
        more copies represented by the paths to all the copies of the file.
        The order of the groups is unspecified.
        
        Example:
          [['path1', 'path2'], ['path3', 'path4']]
  */

	return [];
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

	const actualResults = detectDuplicates();

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
