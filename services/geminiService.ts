import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, Exercise } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- Diet Analysis ---
export const analyzeDiet = async (description: string): Promise<{ items: FoodItem[], totalProtein: number, totalCalories: number }> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found. Returning mock data.");
    return {
      items: [
        { name: "Mock Roti", quantity: "2 pcs", protein: 6, calories: 200 },
        { name: "Mock Dal", quantity: "1 bowl", protein: 8, calories: 150 }
      ],
      totalProtein: 14,
      totalCalories: 350
    };
  }

  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert Indian Nutritionist. 
    Analyze the user's meal description (which may contain Indian vegetarian items like Bhakari, Roti, Dal, Sabji, etc.).
    Estimate the protein (grams) and calories (kcal) for each item carefully.
    Be realistic with portion sizes if not specified (assume standard Indian serving sizes).
    Return a structured JSON response.
  `;

  const prompt = `Analyze this meal: "${description}"`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  protein: { type: Type.NUMBER },
                  calories: { type: Type.NUMBER },
                }
              }
            },
            totalProtein: { type: Type.NUMBER },
            totalCalories: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini Diet Analysis Failed:", error);
    throw error;
  }
};

// --- Workout Analysis ---
export const analyzeWorkout = async (description: string): Promise<{ exercises: Exercise[], caloriesBurned: number, durationMinutes: number }> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found. Returning mock workout data.");
    return {
      exercises: [
        { id: "mock1", name: "Pushups", sets: [{ reps: 15, weight: 0 }, { reps: 12, weight: 0 }] },
        { id: "mock2", name: "Running", sets: [], durationMinutes: 10 }
      ],
      caloriesBurned: 150,
      durationMinutes: 20
    };
  }

  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert Fitness Trainer.
    Analyze the user's workout description.
    1. Identify exercises, sets, reps, and weights.
    2. Estimate the TOTAL calories burned for a standard 75kg male based on intensity and duration.
    3. Estimate total duration in minutes if not specified.
    Return a structured JSON response.
  `;

  const prompt = `Analyze this workout: "${description}"`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sets: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        reps: { type: Type.NUMBER },
                        weight: { type: Type.NUMBER }
                      }
                    }
                  },
                  durationMinutes: { type: Type.NUMBER }
                }
              }
            },
            caloriesBurned: { type: Type.NUMBER },
            durationMinutes: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Ensure IDs are added for frontend keys
      data.exercises = data.exercises.map((ex: any) => ({ ...ex, id: Date.now().toString() + Math.random() }));
      return data;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini Workout Analysis Failed:", error);
    throw error;
  }
};