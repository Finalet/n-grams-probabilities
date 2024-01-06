import * as fs from "fs";

type CharDictionary = Map<string, Map<string, number>>;
type ProbabilityPair = {
  character: string;
  probability: number;
};

const inputFileName = "russian-50000.txt";
const decimalPointAccuracy = 3;
const accuracy = Math.pow(10, decimalPointAccuracy);
const marginOfError = 8 / accuracy;

async function Run() {
  console.log("--- Run --- \n\n");

  const input = fs.readFileSync(__dirname + `/../input/${inputFileName}`, "utf8");
  const words = input.split("\n");
  const cleanWords = words
    .map((word) => {
      return word.toLowerCase().trim().replace(/ё/g, "е").replace(/ъ/g, "ь");
    })
    .filter((word) => {
      return word.match(/^[a-z]+$/) || word.match(/^[абвгдеёжзийклмнопрстуфхцчшщъыьэюя]+$/);
    });

  for (let n = 1; n <= 5; n++) {
    const counts = getCharacterCounts(cleanWords, n);
    const probabilities = getProbabilitiesFromCounts(counts);

    await SaveOutputAsDictionaries(counts, `-n${n}-counts`);
    await SaveOutputAsDictionaries(probabilities, `-n${n}-probabilities`);
  }

  console.log("\n\n--- End ---");
}

function getCharacterCounts(words: string[], n: number = 2): CharDictionary {
  const dictionary: CharDictionary = new Map<string, Map<string, number>>();

  for (const word of words) {
    SetCharacterCountsForWord(word, n, dictionary);
  }

  dictionary.forEach((dict, str) => {
    const sorted = new Map([...dict.entries()].sort((a, b) => b[1] - a[1]));
    dictionary.set(str, sorted);
  });
  const sorted = new Map([...dictionary.entries()].sort());
  return sorted;
}

function SetCharacterCountsForWord(word: string, n: number, dictionary: CharDictionary) {
  if (n >= word.length) return;

  const steps = word.length - n;
  for (let i = 0; i < steps; i++) {
    const subStr = word.substring(i, i + n);
    const nextChar = word[i + n];

    if (!dictionary.has(subStr)) {
      dictionary.set(subStr, new Map<string, number>());
    }

    const currentCount = dictionary.get(subStr)?.get(nextChar) || 0;
    dictionary.get(subStr)?.set(nextChar, currentCount + 1);
  }
}

function getProbabilitiesFromCounts(dictionary: CharDictionary): CharDictionary {
  const probabilities: CharDictionary = new Map<string, Map<string, number>>();

  dictionary.forEach((dict, str) => {
    probabilities.set(str, new Map<string, number>());
    dict.forEach((count, char) => {
      probabilities.get(str)?.set(char, count);
    });
  });

  probabilities.forEach((dict, str) => {
    const total = [...dict.values()].reduce((acc, next) => acc + next, 0);
    dict.forEach((count, char) => {
      const probability = Math.round((accuracy * count) / total) / accuracy;
      dict.set(char, probability);
    });
  });

  probabilities.forEach((dict, str) => {
    const total = Math.round(accuracy * [...dict.values()].reduce((acc, next) => acc + next, 0)) / accuracy;
    if (total < 1 - marginOfError || total > 1 + marginOfError) {
      console.log(`[error:${str}] Total probability is beyond margin of error: ${total}`);
    }
  });

  return probabilities;
}

async function SaveOutputAsDictionaries(dictionary: CharDictionary, suffix = "") {
  let output: any = {};
  dictionary.forEach((dict, char) => {
    output[char] = {};
    dict.forEach((number, secChar) => {
      output[char][secChar] = number;
    });
  });

  await SaveOutput(output, suffix);
}

async function SaveOutputAsArrays(dictionary: CharDictionary, suffix = "") {
  let output: any = {};
  dictionary.forEach((dict, char) => {
    output[char] = [];
    dict.forEach((number, secChar) => {
      const pair: ProbabilityPair = { character: secChar, probability: number };
      output[char].push(pair);
    });
  });

  await SaveOutput(output, suffix);
}

async function SaveOutput(output: object, suffix = "") {
  if (!fs.existsSync(__dirname + "/../output")) {
    fs.mkdirSync(__dirname + "/../output");
  }

  try {
    const outputFileName = inputFileName.split(".")[0];
    await fs.writeFileSync(__dirname + `/../output/${outputFileName}${suffix}.json`, JSON.stringify(output, null, 2), "utf8");
    console.log(`Output saved to: output/${outputFileName}${suffix}.json`);
  } catch (err) {
    console.log(err);
  }
}

Run();
