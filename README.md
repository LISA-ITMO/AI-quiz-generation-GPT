# AI-quiz-generation

## Overview
The AI Quiz Generator is an innovative tool designed to create quizzes automatically based on study materials. Utilizing OpenAI's GPT-4 model, it can generate questions with multiple-choice answers, complete with tips and explanations. This project is particularly useful for educators and students, providing an efficient way to create study aids based on course content.

## Features
- **Quiz Generation**: Automatically generates quizzes from uploaded study material.
- **OpenAI Integration**: Uses GPT-4 for intelligent and context-aware question creation.
- **File Upload Support**: Allows users to upload study materials for quiz generation.
- **Customizable Settings**: Users can set the model to GPT-4 or GPT-3 based on preference.
- **Interactive Console Application**: Simple and user-friendly command-line interface.

## Prerequisites
- NodeJS
- OpenAI npm package
- Readline npm package
- fs npm package
- dotenv npm package
- An OpenAI API Key

## Installation
1. Clone the repository to your local machine.
2. Install the necessary npm packages:
```yarn add openai readline fs dotenv```

or 

```npm install openai readline fs dotenv```

3. Create a `.env` file in the root directory and add your OpenAI API key:
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
FILES_FOLDER_PATH='YOUR_STUDY_MATERIALS_FOLDER_PATH'

## Usage
1. Run the application using Node.js:
```node runAssistant.js```

2. Follow the on-screen instructions to either chat with the assistant or upload files for quiz generation.
3. When generating quizzes, the assistant will use the uploaded study materials to create relevant questions and answers.

## Configuration
- You can switch between GPT-4 and GPT-3 models by changing the `gpt4` variable in the script.
- Modify `assistantConfig` in `runAssistant.js` to customize the assistant's role and behavior.

## File Structure
- `runAssistant.js`: Main script for running the AI assistant and generating quizzes.
- `assistant.json`: Configuration file for the assistant's details and settings.
- `.env`: Contains your OpenAI API key.

## Contributing
Contributions to enhance the AI Quiz Generator are welcome. Please fork the repository and create a pull request with your improvements.

## License
This project is open-source and available under the MIT License.

## Disclaimer
This tool is not affiliated with OpenAI but uses its API for generating quizzes.

## Support
For support, questions, or suggestions, please open an issue in the GitHub repository.

## Author
Konstantin Baltsat