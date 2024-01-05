import * as fs from "fs";

type CharDictionary = Map<string, Map<string, number>>;

const inputFileName = "english-20000.txt";
const probabilityAccuracy = 3;
const accuracy = Math.pow(10, probabilityAccuracy);
const marginOfError = 10 / accuracy;

async function Run() {
  console.log("--- Run --- \n\n");

  const input = fs.readFileSync(__dirname + `/../input/${inputFileName}`, "utf8");
  const words = input.split("\n");

  const dictionary: CharDictionary = new Map<string, Map<string, number>>();

  for (const word of words) {
    GetCharacterCounts(word, dictionary);
  }
  await SaveOutput(dictionary, "-counts");

  ConvertCountsToProbabilities(dictionary);
  VerifyProbabilities(dictionary);

  await SaveOutput(dictionary, "-probabilities");

  console.log("\n\n--- End ---");
}

function GetCharacterCounts(word: string, dictionary: CharDictionary) {
  const cleanWord = word.toLowerCase().trim();
  if (!cleanWord.match(/^[a-z]+$/)) return;

  const characters = cleanWord.split("");
  for (let i = 0; i < characters.length; i++) {
    if (i === characters.length - 1) break;

    const char = characters[i];
    const nextChar = characters[i + 1];

    if (!dictionary.has(char)) {
      dictionary.set(char, new Map<string, number>());
    }

    dictionary.get(char)?.set(nextChar, (dictionary.get(char)?.get(nextChar) || 0) + 1);
  }

  dictionary.forEach((dict, char) => {
    const sorted = new Map([...dict.entries()].sort((a, b) => b[1] - a[1]));
    dictionary.set(char, sorted);
  });
  const sorted = new Map([...dictionary.entries()].sort());
  dictionary.clear();
  sorted.forEach((dict, char) => {
    dictionary.set(char, dict);
  });
}

function ConvertCountsToProbabilities(dictionary: CharDictionary) {
  dictionary.forEach((dict, char) => {
    const total = [...dict.values()].reduce((acc, next) => acc + next, 0);
    dict.forEach((count, secChar) => {
      const probability = Math.round((accuracy * count) / total) / accuracy;
      dict.set(secChar, probability);
    });
  });
}

function VerifyProbabilities(dictionary: CharDictionary) {
  dictionary.forEach((dict, char) => {
    const total = Math.round(accuracy * [...dict.values()].reduce((acc, next) => acc + next, 0)) / accuracy;
    if (total < 1 - marginOfError || total > 1 + marginOfError) {
      console.log(`[error:${char}] Total probability is beyond margin of error: ${total}`);
    }
  });
}

async function SaveOutput(dictionary: CharDictionary, suffix = "") {
  if (!fs.existsSync(__dirname + "/../output")) {
    fs.mkdirSync(__dirname + "/../output");
  }

  let output: any = {};
  dictionary.forEach((dict, char) => {
    output[char] = {};
    dict.forEach((number, secChar) => {
      output[char][secChar] = number;
    });
  });

  try {
    const outputFileName = inputFileName.split(".")[0];
    await fs.writeFileSync(__dirname + `/../output/${outputFileName}${suffix}.json`, JSON.stringify(output, null, 2), "utf8");
    console.log(`Output saved to: output/${outputFileName}${suffix}.json`);
  } catch (err) {
    console.log(err);
  }
}

Run();
