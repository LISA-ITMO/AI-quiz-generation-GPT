// import the required dependencies
require("dotenv").config();
const OpenAI = require("openai");
const fsPromises = require("fs").promises;
const fs = require("fs");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const gpt4 = true;
// readline.question("Which model to use? Using of GPT-4 may result in a rate-quota exceeded. \n1. GPT-4\n2. GPT-3\n", (answer) => {
//   gpt4 = answer === "1";
//   
// });

// Create a OpenAI connection
const secretKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: secretKey,
});


// Function to extract and parse JSON from a response string
function extractAndParseJson(response) {
  const startIndex = response.indexOf('{');
  if (startIndex === -1) {
    console.log("No JSON object found in the response");
    return null;
  }

  let jsonString = response.substring(startIndex);

  // Replace backticks (`) with double quotes (")
  jsonString = jsonString.replace(/`/g, '"');

  // Replace single quotes (') with double quotes (") if needed
  jsonString = jsonString.replace(/'/g, '"');

  // Escape backslashes, except for valid escape characters (like \n, \t)
  jsonString = jsonString.replace(/\\(?!["\\/bfnrt])/g, '\\\\');

  // Additional processing can be added here if there are other known issues
  

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.log("Error parsing JSON: ", error.message);
    return null;
  }
}


const structure = gpt4 ? `
{
  "questions": [
    {
      "question": "Какие два основных класса ценностей выделяет М. Рокич?",
      "options": [
        {
          "option": "Терминальные и инструментальные ценностей",
          "correct": true,
          "tip": "М. Рокич различает два класса ценностей: терминальные и инструментальные."
        },
        ...
      ]
    },
    ...
  ]
}
` : 
`
{
  "question": "Чему равна площадь прямоугольника, если его длина равна 8 см, а ширина 5 см?",
  "options": [
    {
      "option": "Площадь равна 40 квадратным сантиметрам.",
      "correct": true,
      "tip": "Площадь прямоугольника рассчитывается как произведение его длины на ширину, то есть 8 см * 5 см = 40 квадратных сантиметров."
    },
    ...
  ]
}
`;



const prompt = "Составь тест: 3 вопроса с 4 вариантами ответа на каждый по материалу урока из загруженных файлов. Из 4 вариантов должен быть только один верный. К каждому варианту ответа должен быть предоставлено пояснение (tip) - цитатата из текста, если вариант верный, и пояснение или опровергающая цитата, если вариант неверный. Пришли тест мне в строго формате без лишних символов и объяснений сохраняя структуру json. Не вставляй в текст ссылки, графические знаки или что-либо еще, пришли только символьный текст в нужном формате. Все специальные символы запрещены. Пример ожидаемого ответа: " + structure;

async function askQuestion(question) {
  return new Promise((resolve, reject) => {
    readline.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    let assistantId;
    const assistantFilePath = gpt4 ? "./assistant.json" : "./assistant_turbo.json";
    const filesFolderPath = process.env.FILES_FOLDER_PATH; // Get the files folder path from .env

    // Check if the assistant.json file exists
    try {
      const assistantData = await fsPromises.readFile(
        assistantFilePath,
        "utf8"
      );
      assistantDetails = JSON.parse(assistantData);
      assistantId = assistantDetails.assistantId;
      console.log("\nExisting assistant detected.\n");
    } catch (error) {
      // If file does not exist or there is an error in reading it, create a new assistant
      console.log("No existing assistant detected, creating new.\n");
      const assistantConfig = {
        name: "Quiz Quest",
        instructions:
          "You are a professor of the course, study materials for which provided in the files.",
        tools: [{ type: "retrieval" }], // configure the retrieval tool to retrieve files in the future
        model: gpt4 ? "gpt-4-1106-preview" : "gpt-3.5-turbo-1106",
      };

      const assistant = await openai.beta.assistants.create(assistantConfig);
      assistantDetails = { assistantId: assistant.id, ...assistantConfig };

      // Save the assistant details to assistant.json
      await fsPromises.writeFile(
        assistantFilePath,
        JSON.stringify(assistantDetails, null, 2)
      );
      assistantId = assistantDetails.assistantId;
    }

    // Log the first greeting
    console.log(
      `Hello there, I'm your personal assistant. You gave me these instructions:\n${assistantDetails.instructions}\n`
    );

    // Create a thread using the assistantId
    const thread = await openai.beta.threads.create();
    // Use keepAsking as state for keep asking questions
    let keepAsking = true;
    while (keepAsking) {
      const action = await askQuestion(
        "What do you want to do?\n1. Chat with assistant\n2. Upload files to assistant\nEnter your choice (1 or 2): "
      );

      if (action === "2") {
        // Retrieve existing file IDs and assistant ID from assistant.json
        let existingFileIds = assistantDetails.file_ids || [];
        const assistantId = assistantDetails.assistantId;
      
        // Update the assistant's configuration to remove file references
        try {
          await openai.beta.assistants.update(assistantId, {
            file_ids: [], // Remove all file references
          });
          console.log("All file references removed from the assistant.");
        } catch (error) {
          console.error("Error updating assistant configuration:", error);
        }
      
        // Clear existing file IDs in assistantDetails
        assistantDetails.file_ids = [];
      
        // Get the list of files in the files folder
        const fileNames = await fsPromises.readdir(filesFolderPath);
      
        // Upload each file to the assistant
        for (const fileName of fileNames) {
          const filePath = `${filesFolderPath}/${fileName}`;
      
          // Upload the file
          const file = await openai.files.create({
            file: fs.createReadStream(filePath),
            purpose: "assistants",
          });

        // Retrieve existing file IDs from assistant.json
        let existingFileIds = assistantDetails.file_ids || [];

        // Update the assistant with the new file ID
        await openai.beta.assistants.update(assistantId, {
          file_ids: [...existingFileIds, file.id],
        });
      
        // Update local assistantDetails and save to assistant.json
        assistantDetails.file_ids = [...existingFileIds, file.id];
        await fsPromises.writeFile(
          assistantFilePath,
          JSON.stringify(assistantDetails, null, 2)
        );

          console.log(`File '${fileName}' uploaded and successfully added to assistant`);
        }
      
        // Save the updated assistant details to assistant.json
        await fsPromises.writeFile(
          assistantFilePath,
          JSON.stringify(assistantDetails, null, 2)
        );
      
        console.log("\nAll files uploaded and added to assistant\n");
      }

      if (action === "1") {
        let continueAskingQuestion = true;
        console.log(`Assistant JSON file name: ${assistantFilePath}`);

        while (continueAskingQuestion) {
          // Pass in the prompt into the existing thread
          await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: prompt,
          });

          // Create a run
          const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: assistantId,
          });

          // Imediately fetch run-status, which will be "in_progress"
          let runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );

          // Polling mechanism to see if runStatus is completed
          while (runStatus.status !== "completed") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(
              thread.id,
              run.id
            );

            // Check for failed, cancelled, or expired status
            if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
              console.log(
                `Run status is '${runStatus.status}'. Unable to complete the request.`
              );
              console.log(runStatus.last_error.code, ":", runStatus.last_error.message);
              break; // Exit the loop if the status indicates a failure or cancellation
            }
          }

          // Get the last assistant message from the messages array
          const messages = await openai.beta.threads.messages.list(thread.id);

          // Find the last message for the current run
          const lastMessageForRun = messages.data
            .filter(
              (message) =>
                message.run_id === run.id && message.role === "assistant"
            )
            .pop();

          // If an assistant message is found, console.log() it
          if (lastMessageForRun) {
            const response = lastMessageForRun.content[0].text.value;
            const parsedResponse = extractAndParseJson(response);
            if (parsedResponse) {
              console.log(parsedResponse);
            } else {
              console.log(response);
            }
          } else if (
            !["failed", "cancelled", "expired"].includes(runStatus.status)
          ) {
            console.log("No response received from the assistant.");
          }

          // Ask if the user wants to ask another question
          const continueAsking = await askQuestion(
            "Do you want to ask another question? (yes/no) "
          );
          continueAskingQuestion =
            continueAsking.toLowerCase() === "yes" ||
            continueAsking.toLowerCase() === "y";
        }
      }

      // Outside of action "1", ask if the user wants to continue with any action
      const continueOverall = await askQuestion(
        "Do you want to perform another action? (yes/no) "
      );
      keepAsking =
        continueOverall.toLowerCase() === "yes" ||
        continueOverall.toLowerCase() === "y";

      // If the keepAsking state is falsy show an ending message
      if (!keepAsking) {
        console.log("Alrighty then, see you next time!\n");
      }
    }
    // close the readline
    readline.close();
  } catch (error) {
    console.error(error);
  }
}

// Call the main function
main();