/** 
* @file base.js
* @description the present class that all AI providers must inherit from 
**/
class BaseProvider{
    constructor(){
        if(this.constructor === BaseProvider){
            throw new Error("Cannot instantiate BaseProvider directly. You must extend it");
        }
    }
    /**
     * Sends a prompt to ai models and gets a text response.
     * @param {string} prompt - The text to send to the AI
     * @param {Buffer} [imageBuffer] - The image file in memory
     * @param {string} [mimeType] - The type of image (e.g., 'image/png')
     * @returns {Promise<string>} - The AI's response text
     */
    async generateResponse(prompt,inageBuffer, mimeType){
        throw new Error("Method 'generateResponse()' must be implemented.");
    }
}
module.exports = BaseProvider;