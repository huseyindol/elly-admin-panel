import { GoogleGenerativeAI } from '@google/generative-ai'

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }
  return new GoogleGenerativeAI(apiKey)
}

export function getGeminiModel(modelName = 'gemini-2.0-flash') {
  const client = getGeminiClient()
  return client.getGenerativeModel({ model: modelName })
}
