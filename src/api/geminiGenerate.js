import aiGenerate from "./aiGenerate";
// Compatibility facade for clients that still import the old module.
const legacyAI = {
  getSummarizeDocument: aiGenerate.getSummarizeDocument,
  postGeminiChat: (request) => aiGenerate.postChat(request.message),
};
export default legacyAI;
