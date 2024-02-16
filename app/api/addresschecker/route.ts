import { verifyModeAddress } from '@/components/mode';
import {
    OpenAIStream,
    StreamingTextResponse,
    experimental_StreamData,
} from 'ai';
import OpenAI from 'openai';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request) {
    const { messages } = await req.json();

    const prompt = `The following message will contain a smart contract address somewhere, I want you to extract it and only return that value, no other text. No 'Sure', 'Okay', 'I will do that', etc. Just the address. 
    If you can't find an address, return exactly and nothing else: 'I couldn't find the address'
    If you find there are multiple addresses, return exactly and nothing else: 'I found multiple addresses, please provide only one'
    `

    //add prompt to the last message
    messages[messages.length - 1].content = prompt + messages[messages.length - 1].content;

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0613',
        messages: messages,
    });

    const address = response.choices[0].message.content

    if (!address || address.length !== 42) return new Response("I couldn't find the address")
    const verify = await verifyModeAddress(address)

    if (verify.isError) return new Response("I couldn't find the address")

    console.log(verify.result.output)

    const verifyAIResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0613',
        stream: true,
        messages: [
            {
                role: 'user',
                content: `Can you verify from the following json if the address is valid?  Your response should be exactly this:
                Address: ${address}
                Verified: ${verify.result.output[0].value} (with uppercase first letter)
                `,
            },
        ]
    });

    const data = new experimental_StreamData();

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(verifyAIResponse, {
        onFinal() {
            data.close();
        },
        experimental_streamData: true,
    });

    // Respond with the stream
    return new StreamingTextResponse(stream, {}, data);
}

