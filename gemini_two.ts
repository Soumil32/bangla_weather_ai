import { GoogleGenAI, Type } from '@google/genai';
import { fetchWeatherApi } from "openmeteo";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({});

// Define the function declaration for the model
const weatherFunctionDeclaration = {
  name: 'get_river_discharge',
  description: 'Gets the river discharge for a given location. Used to assess flood risk.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: 'The city name, e.g. San Francisco',
      },
    },
    required: [],
  },
};

const contents = [{
    role: 'user',
    parts: [{ text: 'How likely is it to flood in Dhaka?' }]
  }];

// Send request with function declarations
console.log("Asking AI your question...");
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: contents,
  config: {
    tools: [{
      functionDeclarations: [weatherFunctionDeclaration]
    }],
  },
});

contents.push(response.candidates[0].content);

async function getRiverDischarge() {
	const params = {
		latitude: 24,
		longitude: 90,
		daily: "river_discharge",
	};
	const url = "https://flood-api.open-meteo.com/v1/flood";
	console.log("Fetching river discharge data...");
	const responses = await fetchWeatherApi(url, params);
	console.log("Fetched river discharge data.");
	const response = responses[0];
	//console.log("River Discharge Data:", response.daily()?.variables(0)!.valuesArray());
	return response.daily()?.variables(0)!.valuesArray();
}

console.log(JSON.stringify(response, null, 2));

if (response.functionCalls && response.functionCalls.length > 0) {
	const functionCall = response.functionCalls[0]; // Assuming one function call
	console.log(`Function to call: ${functionCall.name}`);
	console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);
	// In a real app, you would call your actual function here:
	// const result = await getCurrentTemperature(functionCall.args);
	const result = await getRiverDischarge();
	const function_response_part = {
		name: functionCall.name,
		response: { result: "The river discharge values are " + result }
	}
	console.log("Tool ")
	contents.push({ role: 'user', parts: [{ functionResponse: function_response_part }] });

	const final_response = await ai.models.generateContent({
		model: 'gemini-3-flash-preview',
		contents: contents,
	});
	console.log("Final Response:");
	console.log(final_response.candidates[0].content.text);
} else {
  console.log("No function call found in the response.");
  console.log(response.text);
}