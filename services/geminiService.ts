
import { GoogleGenAI } from "@google/genai";
// Fixed: Resource and Project types are exported from "../types.ts", not "../App.tsx"
import { Resource, Project } from "../types.ts";

export const getResourceAssistantResponse = async (
  query: string,
  projects: Project[],
  resources: Resource[]
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = `
      You are an Infrastructure & Big Data Ops Assistant. 
      Current Environments (Projects): ${JSON.stringify(projects)}
      Shared Resources (Files like .ovpn, core-site.xml): ${JSON.stringify(resources)}
      
      The system organizes files by folders within projects. "Claiming" means "Downloading" a config.
      Help users find environment files, summarize stock (available downloads), or explain folder organization.
      Be concise, professional, and technical.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${context}\n\nUser query: ${query}`,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I couldn't process that infrastructure query right now.";
  }
};
